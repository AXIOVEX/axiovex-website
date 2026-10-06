#!/usr/bin/env node
/* Axiovex Systems site builder — deterministic, dependency-free.
 *
 * One generator owns every machine-maintained page:
 *   1. Documents sync: reads docs.json (+ any PDFs in docs/) from a checkout of
 *      AXIOVEX/shared-documents, mirrors the files into documents/files/, and
 *      renders documents/index.html from scripts/templates/documents.html.
 *   2. Blog build: parses front matter from blog/posts/*.md and renders
 *      blog/index.html + blog/<slug>/index.html from scripts/templates/.
 *   3. Sitemap: regenerated from the same data (single source of truth).
 *
 * Usage: node scripts/build-site.mjs [path-to-shared-documents-checkout]
 * Default shared checkout: /tmp/shared-documents (the GitHub Action clones it
 * there). If the checkout is absent, the documents page is left untouched.
 *
 * All dates come from content or git history — never from the wall clock —
 * so repeated runs on unchanged inputs produce byte-identical output.
 */
import {
  readFileSync, writeFileSync, readdirSync, copyFileSync, mkdirSync,
  existsSync, statSync, rmSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://axiovexsystems.com';

/* ================= Markdown renderer =================
   Ported verbatim from the former client-side blog engine (blog.v2.js) so
   server-rendered articles match what readers saw before. */
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escAttr(s) {
  return esc(s).replace(/"/g, '&quot;');
}

function inlineMd(s) {
  s = esc(s);
  var codes = [];
  s = s.replace(/`([^`]+)`/g, function (m, c) {
    codes.push(c);
    return '\u0000' + (codes.length - 1) + '\u0000';
  });
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, '<img src="$2" alt="$1" loading="lazy">');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>');
  s = s.replace(/\u0000(\d+)\u0000/g, function (m, i) {
    return '<code>' + codes[+i] + '</code>';
  });
  return s;
}

function renderMarkdown(md) {
  var lines = md.replace(/\r\n?/g, '\n').split('\n');
  var html = [];
  var i = 0, n = lines.length;

  function isListItem(line) {
    return /^\s*([-*+]|\d+\.)\s+/.test(line);
  }

  while (i < n) {
    var line = lines[i];

    var fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      var lang = fence[1] ? ' class="language-' + esc(fence[1]) + '"' : '';
      var buf = [];
      i++;
      while (i < n && !/^```\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      html.push('<pre><code' + lang + '>' + esc(buf.join('\n')) + '</code></pre>');
      continue;
    }

    var h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      var level = h[1].length;
      html.push('<h' + level + '>' + inlineMd(h[2].trim()) + '</h' + level + '>');
      i++;
      continue;
    }

    if (/^(\*\*\*|---|___)\s*$/.test(line)) {
      html.push('<hr>');
      i++;
      continue;
    }

    if (/^\s*>/.test(line)) {
      var q = [];
      while (i < n && /^\s*>/.test(lines[i])) {
        q.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      html.push('<blockquote>' + renderMarkdown(q.join('\n')) + '</blockquote>');
      continue;
    }

    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < n && /^\s*\|?[\s:|-]+\|?[\s:|-]+\s*$/.test(lines[i + 1]) && lines[i + 1].indexOf('|') !== -1) {
      var headers = line.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); });
      i += 2;
      var rows = [];
      while (i < n && /^\s*\|.*\|\s*$/.test(lines[i])) {
        rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }));
        i++;
      }
      var t = '<div class="table-wrap"><table><thead><tr>' +
        headers.map(function (c) { return '<th>' + inlineMd(c) + '</th>'; }).join('') +
        '</tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr>' + r.map(function (c) { return '<td>' + inlineMd(c) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
      html.push(t);
      continue;
    }

    if (isListItem(line)) {
      var items = [];
      while (i < n && (isListItem(lines[i]) || /^\s{2,}\S/.test(lines[i]))) {
        items.push(lines[i]);
        i++;
      }
      html.push(renderList(items));
      continue;
    }

    if (/^\s*$/.test(line)) { i++; continue; }

    var para = [];
    while (i < n && !/^\s*$/.test(lines[i]) && !/^(#{1,4}\s|```|>)/.test(lines[i]) &&
           !isListItem(lines[i]) && !/^(\*\*\*|---|___)\s*$/.test(lines[i]) &&
           !/^\s*\|.*\|\s*$/.test(lines[i])) {
      para.push(lines[i].trim());
      i++;
    }
    html.push('<p>' + inlineMd(para.join(' ')) + '</p>');
  }
  return html.join('\n');
}

function renderList(items) {
  var first = items[0];
  var ordered = /^\s*\d+\.\s+/.test(first);
  var tag = ordered ? 'ol' : 'ul';
  var out = ['<' + tag + '>'];
  var k = 0;
  while (k < items.length) {
    var m = items[k].match(/^(\s*)(?:[-*+]|\d+\.)\s+(.*)$/);
    var indent = m[1].length, text = m[2];
    var sub = [];
    var j = k + 1;
    while (j < items.length) {
      var sm = items[j].match(/^(\s*)(?:[-*+]|\d+\.)\s+(.*)$/);
      if (sm && sm[1].length > indent) { sub.push(items[j].slice(2)); j++; }
      else if (/^\s{2,}\S/.test(items[j]) && !isListLine(items[j])) { text += ' ' + items[j].trim(); j++; }
      else break;
    }
    out.push('<li>' + inlineMd(text) + (sub.length ? renderList(sub) : '') + '</li>');
    k = j;
  }
  out.push('</' + tag + '>');
  return out.join('\n');

  function isListLine(l) { return /^\s*([-*+]|\d+\.)\s+/.test(l); }
}

/* ================= Helpers ================= */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

function fmtDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return iso || '';
  return MONTHS[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1];
}

function gitDate(cwd, file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file],
      { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
  } catch { return null; }
}

function fill(tpl, values) {
  let out = tpl;
  for (const [k, v] of Object.entries(values)) out = out.split(k).join(v);
  return out;
}

function fmtSize(bytes) {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  return Math.max(1, Math.round(bytes / 1024)) + ' KB';
}

/* ================= Share rows (same markup as the old JS engine) ================= */
const ICONS = {
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
  email: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 4h20a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm10.5 8.1L3.5 6.2v11.3h17V6.2l-8.5 5.9a.6.6 0 0 1-.5 0z"/></svg>',
  sms: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8l-4 4V4a2 2 0 0 1 2-2zm2 5v2h12V7H6zm0 4v2h8v-2H6z"/></svg>',
  share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.6 13.4a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7l-1.5 1.5 1.4 1.4 1.5-1.5a2 2 0 1 1 2.9 2.9l-3 3a2 2 0 0 1-2.9 0l-1.4 1.4zM13.4 10.6a4 4 0 0 0-5.7 0l-3 3a4 4 0 1 0 5.7 5.7l1.5-1.5-1.4-1.4-1.5 1.5a2 2 0 1 1-2.9-2.9l3-3a2 2 0 0 1 2.9 0l1.4-1.4z"/></svg>',
};

function shareRow(title, url, withNative) {
  const t = encodeURIComponent(title), u = encodeURIComponent(url);
  const links = [
    { name: 'X', href: 'https://twitter.com/intent/tweet?text=' + t + '&url=' + u, icon: 'x' },
    { name: 'Facebook', href: 'https://www.facebook.com/sharer/sharer.php?u=' + u, icon: 'facebook' },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + u, icon: 'linkedin' },
    { name: 'Email', href: 'mailto:?subject=' + t + '&body=' + encodeURIComponent('Thought you might find this interesting:\n\n') + u, icon: 'email' },
  ].map(s => '<a class="share-btn" href="' + s.href + '" target="_blank" rel="noopener" aria-label="Share on ' +
    s.name + '" title="Share on ' + s.name + '">' + ICONS[s.icon] + '<span>' + s.name + '</span></a>').join('');
  const copyBtn = '<button class="share-btn share-copy" type="button" data-url="' + escAttr(url) +
    '" aria-label="Copy link" title="Copy link">' + ICONS.link + '<span>Copy link</span></button>';
  const nativeBtn = withNative
    ? '<button class="share-btn share-native" type="button" data-url="' + escAttr(url) + '" data-title="' +
      escAttr(title) + '" aria-label="More share options" title="More share options">' + ICONS.share + '<span>More&hellip;</span></button>'
    : '';
  const smsBtn = '<a class="share-btn sms-share" href="sms:?&body=' + encodeURIComponent(title + ' ' + url) +
    '" aria-label="Share by text message" title="Share by text message">' + ICONS.sms + '<span>Text</span></a>';
  return '<div class="share-row" role="group" aria-label="Share this article">' + links + smsBtn + copyBtn + nativeBtn + '</div>';
}

/* ================= Documents sync ================= */
function syncDocs(sharedDir) {
  const manifestPath = path.join(sharedDir, 'docs.json');
  let manifest = [];
  if (existsSync(manifestPath)) {
    try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); }
    catch (e) { console.warn('docs.json parse failed:', e.message); }
  }
  const listed = new Set(manifest.map(d => d.file));
  const entries = [...manifest];
  const docsDir = path.join(sharedDir, 'docs');
  if (existsSync(docsDir)) {
    for (const f of readdirSync(docsDir)) {
      const rel = 'docs/' + f;
      if (/\.pdf$/i.test(f) && !listed.has(rel)) {
        entries.push({
          file: rel,
          title: f.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').replace(/^\w/, c => c.toUpperCase()),
          description: '',
          category: 'Document',
          order: 99,
        });
      }
    }
  }
  entries.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || String(a.title).localeCompare(String(b.title)));

  const outDir = path.join(ROOT, 'documents', 'files');
  mkdirSync(outDir, { recursive: true });
  const kept = new Set();
  const cards = [];
  let maxDate = null;

  for (const entry of entries) {
    const src = path.join(sharedDir, entry.file);
    if (!existsSync(src)) { console.warn('manifest file missing, skipped:', entry.file); continue; }
    const base = path.basename(entry.file);
    copyFileSync(src, path.join(outDir, base));
    kept.add(base);
    const updated = gitDate(sharedDir, entry.file);
    if (updated && (!maxDate || updated > maxDate)) maxDate = updated;
    const ext = path.extname(base).slice(1).toUpperCase() || 'FILE';
    const meta = ext + ' &middot; ' + fmtSize(statSync(src).size) +
      (updated ? ' &middot; Updated ' + fmtDate(updated) : '');
    cards.push(
      '          <article class="card">\n' +
      '            <p class="card-kicker">' + esc(entry.category || 'Document') + '</p>\n' +
      '            <h3>' + esc(entry.title || base) + '</h3>\n' +
      (entry.description ? '            <p>' + esc(entry.description) + '</p>\n' : '') +
      '            <p style="color: var(--faint); font-size: 14px; margin-top: 12px;">' + meta + '</p>\n' +
      '            <a class="explore" href="/documents/files/' + encodeURIComponent(base) + '" target="_blank" rel="noopener">OPEN THE DOCUMENT &rarr;</a>\n' +
      '          </article>');
  }
  // remove mirrored files that are no longer published
  for (const f of readdirSync(outDir)) {
    if (!kept.has(f)) rmSync(path.join(outDir, f));
  }

  const tpl = readFileSync(path.join(ROOT, 'scripts', 'templates', 'documents.html'), 'utf8');
  writeFileSync(path.join(ROOT, 'documents', 'index.html'),
    fill(tpl, { '{{DOC_CARDS}}': cards.join('\n') }));
  console.log('documents: mirrored ' + kept.size + ' file(s), latest ' + (maxDate || 'n/a'));
  return { maxDate, count: kept.size };
}

/* ================= Blog build ================= */
function parsePost(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  if (!m) throw new Error('missing front matter: ' + filePath);
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = /^([A-Za-z]+):\s*(.*)$/.exec(line);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  const base = path.basename(filePath, '.md');
  const slug = fm.slug || base.replace(/^\d{4}-\d{2}-\d{2}-/, '');
  return {
    title: fm.title || slug,
    date: fm.date || '',
    description: fm.description || '',
    tags: (fm.tags || '').split(',').map(s => s.trim()).filter(Boolean),
    slug,
    bodyMd: raw.slice(m[0].length),
    url: SITE + '/blog/' + slug + '/',
  };
}

function buildBlog() {
  const postsDir = path.join(ROOT, 'blog', 'posts');
  const posts = readdirSync(postsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => parsePost(path.join(postsDir, f)))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const articleTpl = readFileSync(path.join(ROOT, 'scripts', 'templates', 'blog-article.html'), 'utf8');
  const indexTpl = readFileSync(path.join(ROOT, 'scripts', 'templates', 'blog-index.html'), 'utf8');

  for (const post of posts) {
    const tagsHtml = post.tags.length
      ? '<div class="post-tags">' + post.tags.map(t =>
          '<a class="tag-pill" href="/blog/?q=' + encodeURIComponent(t) + '">' + esc(t) + '</a>').join('') + '</div>'
      : '';
    const others = posts.filter(p => p.slug !== post.slug).slice(0, 2);
    const moreHtml = others.length
      ? '<div class="more-analysis"><p class="more-label">More analysis</p><div class="more-grid">' +
        others.map(p =>
          '<article class="more-card"><p class="post-date">' + fmtDate(p.date) + '</p>' +
          '<h3><a href="/blog/' + p.slug + '/">' + esc(p.title) + '</a></h3>' +
          '<a class="read-more" href="/blog/' + p.slug + '/">Read article &rarr;</a></article>').join('') +
        '</div></div>'
      : '';
    const html = fill(articleTpl, {
      '{{TITLE_JSON}}': JSON.stringify(post.title),
      '{{DESCRIPTION_JSON}}': JSON.stringify(post.description),
      '{{TITLE}}': escAttr(post.title),
      '{{DESCRIPTION}}': escAttr(post.description),
      '{{CANONICAL}}': post.url,
      '{{DATE_ISO}}': post.date,
      '{{DATE_LONG}}': fmtDate(post.date),
      '{{TAGS_HTML}}': tagsHtml,
      '{{TAGS_DATA}}': escAttr(post.tags.join(', ')),
      '{{SHARE_TOP}}': shareRow(post.title, post.url, true),
      '{{BODY_HTML}}': renderMarkdown(post.bodyMd),
      '{{MORE_HTML}}': moreHtml,
    });
    const dir = path.join(ROOT, 'blog', post.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'index.html'), html);
  }

  // remove generated article directories whose post is gone
  const slugSet = new Set(posts.map(p => p.slug));
  for (const name of readdirSync(path.join(ROOT, 'blog'), { withFileTypes: true })) {
    if (!name.isDirectory() || slugSet.has(name.name)) continue;
    const idx = path.join(ROOT, 'blog', name.name, 'index.html');
    if (existsSync(idx) && readFileSync(idx, 'utf8').includes('Source template for generated article pages')) {
      rmSync(path.join(ROOT, 'blog', name.name), { recursive: true, force: true });
      console.log('blog: removed stale article /blog/' + name.name + '/');
    }
  }

  const cards = posts.map(p => {
    const search = (p.title + ' ' + p.description + ' ' + p.tags.join(' ')).toLowerCase();
    const tags = p.tags.length
      ? '<div class="post-tags">' + p.tags.map(t =>
          '<button class="tag-pill" data-tag="' + escAttr(t) + '">' + esc(t) + '</button>').join('') + '</div>'
      : '';
    return '<article class="post-card" data-search="' + escAttr(search) + '">' +
      '<p class="post-date">' + fmtDate(p.date) + '</p>' +
      '<h2><a href="/blog/' + p.slug + '/">' + esc(p.title) + '</a></h2>' +
      '<p class="post-desc">' + esc(p.description) + '</p>' + tags +
      '<a class="read-more" href="/blog/' + p.slug + '/">Read article &rarr;</a></article>';
  }).join('\n        ');
  const countText = posts.length + (posts.length === 1 ? ' article' : ' articles');
  writeFileSync(path.join(ROOT, 'blog', 'index.html'),
    fill(indexTpl, { '{{POST_CARDS}}': cards, '{{POST_COUNT_TEXT}}': countText }));

  console.log('blog: built index + ' + posts.length + ' article(s)');
  return posts;
}


/* ================= Signals + Michigan Pulse (spec 004) =================
   Renders from data/signals.json, the snapshot written by
   scripts/fetch-signals.mjs. If the snapshot is absent the site still
   builds — the home block renders empty between its markers and no
   signals page is produced (the fetch step runs first in CI). */
function sparkline(trend) {
  const pts = (trend || []).filter(p => p.v !== null && p.v !== undefined);
  if (pts.length < 2) return '';
  const w = 120, h = 30, pad = 3;
  const vs = pts.map(p => p.v);
  const min = Math.min(...vs), max = Math.max(...vs), span = (max - min) || 1;
  let d = '', pen = false;
  (trend || []).forEach((p, i) => {
    if (p.v === null || p.v === undefined) { pen = false; return; }
    const x = (pad + (i / ((trend.length - 1) || 1)) * (w - 2 * pad)).toFixed(1);
    const y = (h - pad - ((p.v - min) / span) * (h - 2 * pad)).toFixed(1);
    d += (pen ? 'L' : 'M') + x + ' ' + y + ' ';
    pen = true;
  });
  return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="' + d.trim() + '"/></svg>';
}

function pulseTilesHtml(pulse) {
  if (!pulse || !pulse.tiles) return '';
  const tiles = pulse.tiles.map(t => {
    const arrow = t.delta
      ? (t.delta.direction === 'up' ? '&#9650;' : t.delta.direction === 'down' ? '&#9660;' : '&#9644;') + ' ' + esc(t.delta.text)
      : esc(pulse.referenceMonth || '');
    return '          <div class="pulse-tile">\n' +
      '            <p class="pulse-label">' + esc(t.label) + '</p>\n' +
      '            <p class="pulse-value">' + esc(t.display) + '</p>\n' +
      '            <p class="pulse-delta">' + arrow + '</p>\n' +
      '            ' + sparkline(t.trend) + '\n          </div>';
  }).join('\n');
  return '        <p class="pulse-kicker">Michigan Pulse &middot; ' + esc(pulse.source || 'U.S. Bureau of Labor Statistics') +
    ' &middot; ' + esc(pulse.referenceMonth || '') + '</p>\n' +
    '        <div class="pulse-grid">\n' + tiles + '\n        </div>';
}

/* Spec 008 (FR-002, FR-005, FR-007): the three headline Pulse stats,
   selected by BLS series id, shared by the home mini-strip and the
   floating widget. Labels are the wireframe-approved short forms
   (WF-01 / WF-12); display values are the snapshot's, verbatim. */
const PULSE_HEADLINE_TILES = [
  { id: 'SMU26000003000000001', stripLabel: 'MI manufacturing employment', widgetLabel: 'MI manufacturing' },
  { id: 'LASST260000000000003', stripLabel: 'MI unemployment', widgetLabel: 'MI unemployment' },
  { id: 'LASST260000000000006', stripLabel: 'MI labor force', widgetLabel: 'MI labor force' },
];
function pulseHeadlineStats(pulse) {
  if (!pulse || !pulse.tiles) return [];
  return PULSE_HEADLINE_TILES
    .map(spec => {
      const tile = pulse.tiles.find(t => t.id === spec.id);
      return tile ? { ...spec, display: tile.display } : null;
    })
    .filter(Boolean);
}
const MONTH_ABBR = { January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr', May: 'May', June: 'Jun', July: 'Jul', August: 'Aug', September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dec' };
function shortMonth(period) {
  const m = /^([A-Za-z]+)\s+(.*)$/.exec(String(period || ''));
  return m && MONTH_ABBR[m[1]] ? MONTH_ABBR[m[1]] + ' ' + m[2] : String(period || '');
}
function pulseStripHtml(pulse) {
  const stats = pulseHeadlineStats(pulse);
  if (!stats.length) return '';
  const parts = stats.map(s =>
    '<span class="ps-stat"><b>' + esc(s.display) + '</b> ' + esc(s.stripLabel) + '</span>');
  return '          <div class="pulse-strip">\n' +
    '            <span class="ps-label">Michigan Pulse &middot; ' + esc(shortMonth(pulse.referenceMonth)) + '</span>' +
    parts.map(p => '\n            <span class="ps-dot">&middot;</span>\n            ' + p).join('') + '\n' +
    '          </div>\n';
}

function fmtUpdated(iso) {
  try {
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Detroit', month: 'long', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }).formatToParts(d).reduce((o, p) => (o[p.type] = p.value, o), {});
    return parts.month + ' ' + parts.day + ', ' + parts.year + ' at ' + parts.hour + ':' + parts.minute + ' ' + parts.dayPeriod + ' ET';
  } catch { return iso || ''; }
}

function buildSignals(posts) {
  const snapPath = path.join(ROOT, 'data', 'signals.json');
  if (!existsSync(snapPath)) {
    console.warn('signals: no data/signals.json — home block left empty, page skipped');
    return null;
  }
  const snap = JSON.parse(readFileSync(snapPath, 'utf8'));
  const lanes = JSON.parse(JSON.stringify(snap.lanes || {}));

  // Michigan lane also carries Axiovex's own Michigan/workforce analysis.
  const own = (posts || [])
    .filter(p => p.tags.some(t => /michigan|workforce/i.test(t)))
    .map(p => ({ source: 'Axiovex', sourceId: 'axiovex', title: p.title, link: p.url, date: p.date }));
  if (own.length && lanes.michigan) {
    lanes.michigan.items = [...own, ...lanes.michigan.items]
      .sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
  }

  const updatedLine = 'Snapshot updated ' + fmtUpdated(snap.updatedUtc) + '.';
  const itemRow = i =>
    '          <li><a href="' + escAttr(i.link) + '" target="_blank" rel="noopener">' +
    '<span class="signal-source">' + esc(String(i.source).toUpperCase()) + '</span> ' +
    '<span class="signal-title">' + esc(i.title) + '</span></a> ' +
    '<span class="signal-date">&middot; ' + fmtDate(i.date) + '</span></li>';
  const lanesHtml = Object.values(lanes).filter(l => l.items && l.items.length).map(l =>
    '        <div class="signal-lane">\n' +
    '          <h3 class="lane-title">' + esc(l.title) + '</h3>\n' +
    '          <ul class="signal-list">\n' + l.items.map(itemRow).join('\n') + '\n          </ul>\n        </div>'
  ).join('\n');

  // /signals/ page
  const tpl = readFileSync(path.join(ROOT, 'scripts', 'templates', 'signals.html'), 'utf8');
  mkdirSync(path.join(ROOT, 'signals'), { recursive: true });
  writeFileSync(path.join(ROOT, 'signals', 'index.html'), fill(tpl, {
    '{{PULSE_HTML}}': pulseTilesHtml(snap.pulse),
    '{{LANES_HTML}}': lanesHtml,
    '{{UPDATED_LINE}}': updatedLine,
  }));

  // Home block between the SIGNALS markers
  const pick = id => (lanes[id] && lanes[id].items && lanes[id].items[0]) || null;
  const cards = ['manufacturing', 'ai-standards', 'ot-security'].map(pick).filter(Boolean).map(i =>
    '          <article class="card signal-card">\n' +
    '            <p class="signal-source">' + esc(String(i.source).toUpperCase()) + '</p>\n' +
    '            <h3><a href="' + escAttr(i.link) + '" target="_blank" rel="noopener">' + esc(i.title) + '</a></h3>\n' +
    '            <p class="signal-date">' + fmtDate(i.date) + '</p>\n          </article>').join('\n');
  const section =
    '    <section id="signals" class="section">\n' +
    '      <div class="container">\n' +
    '        <div class="section-head">\n' +
    '          <p class="eyebrow"><span class="live-dot" aria-hidden="true"></span>Axiovex Signals &mdash; Live</p>\n' +
    '          <h2>What we&rsquo;re watching.</h2>\n' +
    pulseStripHtml(snap.pulse) +
    '          <p class="section-lede">Michigan&rsquo;s numbers, and the field items that matter to the people who make things — from primary sources, refreshed automatically.</p>\n' +
    '        </div>\n' +
    '        <div class="signal-cards">\n' + cards + '\n        </div>\n' +
    '        <p class="signals-more"><a class="explore" href="/signals/">SEE ALL SIGNALS &rarr;</a></p>\n' +
    '        <p class="signals-updated">' + updatedLine + ' Headline, source, and date only — every card links to the publisher.</p>\n' +
    '      </div>\n' +
    '    </section>';
  const homePath = path.join(ROOT, 'index.html');
  const home = readFileSync(homePath, 'utf8');
  const re = /(<!-- SIGNALS:START -->)[\s\S]*?(<!-- SIGNALS:END -->)/;
  if (re.test(home)) {
    // Replacer function, not a '$1...' string: the section HTML can
    // contain literal '$' amounts (e.g. '$1.7 Million' headlines) that
    // String.replace would misread as group references.
    writeFileSync(homePath, home.replace(re, (m, g1, g2) => g1 + '\n' + section + '\n    ' + g2));
  } else {
    console.warn('signals: SIGNALS markers not found in index.html — home block skipped');
  }
  // Spec 008 (FR-005): floating-widget data — a first-party JSON sliced
  // from this same snapshot (headline Pulse stats by series id; the
  // freshest items across lanes). Values verbatim from the snapshot;
  // the widget renders nothing if this file is missing or empty.
  const allWidgetItems = Object.entries(lanes)
    .flatMap(([id, l]) => (l.items || []).map(i => ({
      lane: id, laneLabel: l.title, title: i.title, source: i.source, date: i.date, url: i.link,
    })))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  // Guarantee every lane's freshest item is present (FR-006 reordering
  // needs the tag-matched lane available even when it is not among the
  // very freshest), then fill with the freshest overall, cap 12.
  const picked = new Map();
  for (const [id] of Object.entries(lanes)) {
    const first = allWidgetItems.find(i => i.lane === id);
    if (first) picked.set(first.lane + '|' + first.url, first);
  }
  for (const i of allWidgetItems) {
    if (picked.size >= 12) break;
    picked.set(i.lane + '|' + i.url, i);
  }
  const widgetHeadlines = [...picked.values()]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 12);
  const widgetData = {
    updatedUtc: snap.updatedUtc || null,
    pulse: pulseHeadlineStats(snap.pulse).map(s => ({
      label: s.widgetLabel,
      value: s.display,
      period: snap.pulse ? (snap.pulse.referenceMonth || null) : null,
    })),
    pulsePeriod: snap.pulse ? (snap.pulse.referenceMonth || null) : null,
    pulseSource: snap.pulse ? (snap.pulse.source || null) : null,
    headlines: widgetHeadlines,
    signalsUrl: '/signals/',
  };
  writeFileSync(path.join(ROOT, 'signals-widget.json'), JSON.stringify(widgetData, null, 2) + '\n');

  const total = Object.values(lanes).reduce((n, l) => n + (l.items ? l.items.length : 0), 0);
  console.log('signals: rendered home block + /signals/ (' + total + ' items, pulse ' +
    (snap.pulse ? snap.pulse.referenceMonth : 'n/a') + ')');
  return { updatedDate: String(snap.updatedUtc || '').slice(0, 10) || null };
}

/* ================= Blog RSS feed (spec 004, T009) ================= */
function buildFeed(posts) {
  const rfc = iso => new Date(iso + 'T12:00:00Z').toUTCString();
  const items = (posts || []).map(p =>
    '  <item>\n    <title>' + esc(p.title) + '</title>\n' +
    '    <link>' + p.url + '</link>\n' +
    '    <guid isPermaLink="true">' + p.url + '</guid>\n' +
    '    <pubDate>' + rfc(p.date) + '</pubDate>\n' +
    '    <description>' + esc(p.description) + '</description>\n  </item>').join('\n');
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n' +
    '  <title>Axiovex Systems — Blog</title>\n' +
    '  <link>' + SITE + '/blog/</link>\n' +
    '  <description>Analysis from Axiovex Systems: AI, manufacturing, and Michigan workforce intelligence.</description>\n' +
    '  <language>en-US</language>\n' +
    '  <atom:link href="' + SITE + '/feed.xml" rel="self" type="application/rss+xml"/>\n' +
    (posts && posts.length ? '  <lastBuildDate>' + rfc(posts[0].date) + '</lastBuildDate>\n' : '') +
    items + '\n</channel>\n</rss>\n';
  writeFileSync(path.join(ROOT, 'feed.xml'), xml);
  console.log('feed: wrote /feed.xml with ' + (posts ? posts.length : 0) + ' item(s)');
}

/* ================= Sitemap ================= */
function writeSitemap(posts, docsInfo, signalsInfo) {
  const latestPost = posts.length ? posts[0].date : null;
  const e = (loc, lastmod, freq, pri) =>
    '  <url>\n    <loc>' + loc + '</loc>\n' +
    (lastmod ? '    <lastmod>' + lastmod + '</lastmod>\n' : '') +
    '    <changefreq>' + freq + '</changefreq>\n    <priority>' + pri + '</priority>\n  </url>';
  const urls = [
    e(SITE + '/', gitDate(ROOT, 'index.html') || latestPost, 'weekly', '1.0'),
    e(SITE + '/blog/', latestPost, 'weekly', '0.9'),
    ...posts.map(p => e(p.url, p.date, 'monthly', '0.8')),
    e(SITE + '/signals/', signalsInfo ? signalsInfo.updatedDate : null, 'daily', '0.8'),
    e(SITE + '/documents/', docsInfo.maxDate || gitDate(ROOT, 'scripts/templates/documents.html'), 'monthly', '0.7'),
    e(SITE + '/contact/', gitDate(ROOT, 'contact/index.html'), 'monthly', '0.7'),
    e(SITE + '/privacy/', gitDate(ROOT, 'privacy/index.html'), 'yearly', '0.5'),
  ];
  writeFileSync(path.join(ROOT, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('\n') + '\n</urlset>\n');
  console.log('sitemap: ' + urls.length + ' urls');
}

/* ================= Main ================= */
const sharedDir = process.argv[2] || '/tmp/shared-documents';
let docsInfo = { maxDate: null, count: 0 };
if (existsSync(sharedDir)) {
  docsInfo = syncDocs(sharedDir);
} else {
  console.warn('shared-documents checkout not found at ' + sharedDir + ' — documents page left unchanged');
}
const posts = buildBlog();
buildFeed(posts);
const signalsInfo = buildSignals(posts);
writeSitemap(posts, docsInfo, signalsInfo);
