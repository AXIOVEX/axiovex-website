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

/* ================= Trends & outlook (spec 011) =================
   Renders into /signals/ between the Pulse band and the lanes.
   Ticker + trend board compute from the same data/signals.json
   snapshot (deterministic arithmetic on the ingested series,
   FR-002); the outlook board and education block render from the
   committed data/outlook.json (FR-003/FR-004), whose figures are
   transcribed from the verified sources recorded in
   specs/011-signals-trends-outlook/sources.md. A missing or
   unreadable outlook file — or a missing section in it — renders
   no board and never fails the build (FR-005e). */
function loadOutlook() {
  const p = path.join(ROOT, 'data', 'outlook.json');
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, 'utf8')); }
  catch { console.warn('signals: data/outlook.json unreadable — outlook boards omitted'); return null; }
}

/* MoM = last two non-null points; window = first vs last non-null
   point. Returns raw differences in the series' own units, or
   null when fewer than two non-null points exist (the board then
   renders "—", never a fabricated 0). */
function trendDeltas(trend) {
  const pts = (trend || []).filter(p => p.v !== null && p.v !== undefined);
  if (pts.length < 2) return null;
  return {
    mom: pts[pts.length - 1].v - pts[pts.length - 2].v,
    window: pts[pts.length - 1].v - pts[0].v,
  };
}

/* Signed delta in the tile's own display conventions: percent
   series in pts, thousand-unit series in k, and raw-count series
   (labor force, values in persons) converted to k. Direction is
   glyph + signed figure, neutral treatment — no red/green. */
function deltaHtml(tile, diff, upper) {
  const glyph = diff > 0 ? '&#9650;' : diff < 0 ? '&#9660;' : '&#9644;';
  const sign = diff > 0 ? '+' : diff < 0 ? '&minus;' : '';
  const pts = /%$/.test(tile.display || '');
  const mag = Math.abs(diff) >= 10000 ? Math.abs(diff) / 1000 : Math.abs(diff);
  const unit = pts ? ' pts' : 'k';
  return glyph + ' ' + sign + mag.toFixed(1) + (upper ? unit.toUpperCase() : unit);
}

/* Spec 011 Amendment 2 (A2-3): window percent change —
   (last − first) ÷ first across the non-null points, one
   decimal, glyph + signed figure in the tape's neutral
   treatment. For the rate series this is the RELATIVE change
   of the rate; its absolute movement stays in the pts delta
   columns. "—" when fewer than two non-null points exist. */
function windowPctHtml(trend) {
  const pts = (trend || []).filter(p => p.v !== null && p.v !== undefined);
  if (pts.length < 2 || !pts[0].v) return '&mdash;';
  const pct = ((pts[pts.length - 1].v - pts[0].v) / pts[0].v) * 100;
  const glyph = pct > 0 ? '&#9650;' : pct < 0 ? '&#9660;' : '&#9644;';
  const sign = pct > 0 ? '+' : pct < 0 ? '&minus;' : '';
  return glyph + ' ' + sign + Math.abs(pct).toFixed(1) + '%';
}

const TAPE_LABELS = {
  SMU26000003000000001: 'MI MFG EMPLOYMENT',
  LASST260000000000003: 'MI UNEMPLOYMENT',
  LASST260000000000006: 'MI LABOR FORCE',
  SMU26000000000000001: 'MI NONFARM',
};
/* FR-001: the tape duplicates trend-board content only (latest +
   MoM per series), is aria-hidden, and its motion is pure CSS
   (styles: .tape-track animation, paused on hover/focus-within,
   static under prefers-reduced-motion). The sequence is emitted
   twice for the loop. */
function tickerHtml(pulse) {
  if (!pulse || !pulse.tiles || !pulse.tiles.length) return '';
  const items = pulse.tiles.map(t => {
    const name = TAPE_LABELS[t.id] || esc(String(t.label || '').toUpperCase());
    const val = esc(String(t.display || '').toUpperCase());
    const d = trendDeltas(t.trend);
    if (!d) return '<span class="tape-item">' + name + ' <b>' + val + '</b></span>';
    const suffix = t.id === 'SMU26000003000000001' ? ' MO-MO' : '';
    return '<span class="tape-item">' + name + ' <b>' + val + '</b> ' +
      '<span class="tape-delta">' + deltaHtml(t, d.mom, true) + suffix + '</span></span>';
  });
  const seq = '<span class="tape-seq">' +
    items.join('<span class="tape-sep">&middot;</span>') +
    '<span class="tape-sep">&middot;</span></span>';
  return '        <div class="tape" aria-hidden="true">\n' +
    '          <div class="tape-track">' + seq + seq + '</div>\n        </div>';
}

function trendBoardHtml(pulse) {
  if (!pulse || !pulse.tiles || !pulse.tiles.length) return '';
  const rows = pulse.tiles.map(t => {
    const d = trendDeltas(t.trend);
    const mom = d ? deltaHtml(t, d.mom, false) : '&mdash;';
    const win = d ? deltaHtml(t, d.window, false) : '&mdash;';
    const pct = d ? windowPctHtml(t.trend) : '&mdash;';
    return '            <tr><td class="tb-series">' + esc(t.label) + '</td>' +
      '<td class="tb-latest">' + esc(t.display) + '</td>' +
      '<td class="tb-delta tb-mom">' + mom + '</td>' +
      '<td class="tb-delta tb-win">' + win + '</td>' +
      '<td class="tb-spark"><span class="tb-sparkwrap">' + sparkline(t.trend) +
      '<span class="tb-pct">' + pct + '</span></span></td></tr>';
  }).join('\n');
  return '        <div class="trend-board">\n' +
    '          <table class="trend-table">\n' +
    '            <caption class="visually-hidden">Michigan Pulse series: latest value, month-over-month change, and change across the 12-month window</caption>\n' +
    '            <thead><tr><th scope="col">Series</th><th scope="col">Latest &middot; ' +
    esc(shortMonth(pulse.referenceMonth)) + '</th><th scope="col">Mo-Mo</th>' +
    '<th scope="col">12-mo window</th><th scope="col">Trend</th></tr></thead>\n' +
    '            <tbody>\n' + rows + '\n            </tbody>\n          </table>\n' +
    '          <p class="board-note">Computed from BLS series — latest values verbatim from the snapshot; both deltas are arithmetic on each series&rsquo; own monthly history. A missing month breaks the trend line; it is never interpolated.</p>\n' +
    '        </div>';
}

function trendsHeadHtml() {
  return '        <div class="trends-head">\n' +
    '          <p class="eyebrow">Trends &amp; outlook</p>\n' +
    '          <h2>Where it&rsquo;s heading.</h2>\n' +
    '          <p class="trends-frame">The Pulse series as a trend board, published projections for what comes next, and Michigan education indicators. Every forward-looking figure belongs to the agency that published it — Axiovex publishes no forecasts of its own.</p>\n' +
    '        </div>';
}

/* One projections row. Figures come from data/outlook.json only;
   the horizon suffix follows the drawn form (jobs + horizon when
   the table publishes a numeric change, horizon alone when it
   does not). */
function projRow(r, horizon) {
  const pct = (r.pctChange > 0 ? '+' : r.pctChange < 0 ? '&minus;' : '') +
    Math.abs(r.pctChange).toFixed(1) + '%';
  const tail = typeof r.jobsChange === 'number'
    ? (r.jobsChange > 0 ? '+' : r.jobsChange < 0 ? '&minus;' : '') +
      Math.abs(r.jobsChange).toLocaleString('en-US') + ' jobs, ' + esc(horizon)
    : esc(horizon);
  return '          <li class="proj-row"><span class="proj-name">' + esc(r.name) + '</span> ' +
    '<span class="proj-meta">&middot; projected</span> <b class="proj-pct">' + pct + '</b> ' +
    '<span class="proj-jobs">&middot; ' + tail + '</span></li>';
}

function projGroupHtml(sec, kind, itemKind) {
  const rows = Array.isArray(sec[kind]) ? sec[kind] : [];
  if (!rows.length) return '';
  const head = (kind === 'rise'
    ? 'On the rise — fastest-growing ' + itemKind
    : 'Falling — fastest-declining ' + itemKind) +
    ' · ' + (sec.agencyShort || sec.agency || '') + ' ' + (sec.publication || '') +
    ' ' + (sec.vintage || '');
  return '          <p class="board-kicker">' + esc(head.toUpperCase()) + '</p>\n' +
    '          <ul class="proj-list">\n' +
    rows.map(r => projRow(r, sec.horizon || sec.vintage || '')).join('\n') +
    '\n          </ul>';
}

/* FR-003: attributed agency projections. National (BLS) and
   Michigan groups render as separate labeled groups from their
   own sections of the dataset — never blended into one ranking.
   A section that is absent renders nothing. */
function outlookHtml(outlook) {
  if (!outlook) return '';
  const groups = [];
  const notes = [];
  const bls = outlook.blsProjections;
  if (bls && ((bls.rise || []).length || (bls.fall || []).length)) {
    groups.push(projGroupHtml(bls, 'rise', 'occupations'));
    groups.push(projGroupHtml(bls, 'fall', 'occupations'));
    notes.push(esc(bls.agency || '') + ', ' + esc(bls.publication || '') +
      ' (' + esc(bls.vintage || '') + '), retrieved ' + esc(bls.retrievedOn || '') + '.');
  }
  const mi = outlook.michiganProjections;
  if (mi && ((mi.rise || []).length || (mi.fall || []).length)) {
    const head = 'Michigan industry outlook — ' + (mi.agencyShort || mi.agency || '') +
      ' ' + (mi.publication || '') + ' ' + (mi.vintage || '');
    const sub = (kind, label) => {
      const rows = Array.isArray(mi[kind]) ? mi[kind] : [];
      if (!rows.length) return '';
      return '          <p class="board-sub">' + label + '</p>\n' +
        '          <ul class="proj-list">\n' +
        rows.map(r => projRow(r, mi.horizon || mi.vintage || '')).join('\n') +
        '\n          </ul>';
    };
    groups.push('          <p class="board-kicker">' + esc(head.toUpperCase()) + '</p>\n' +
      sub('rise', 'On the rise') + sub('fall', 'Falling'));
    notes.push(esc(mi.agency || '') + ', ' + esc(mi.publication || '') +
      ' (' + esc(mi.vintage || '') + '), retrieved ' + esc(mi.retrievedOn || '') + '.');
  }
  const body = groups.filter(Boolean).join('\n');
  if (!body) return '';
  return '        <div class="outlook-board">\n' + body + '\n' +
    '          <p class="board-note">Projections are the publishing agency&rsquo;s modeled outlook, published with its horizon and vintage — they are not Axiovex forecasts, and they are not guarantees. Source: ' +
    notes.join(' ') + '</p>\n        </div>';
}

/* FR-004: education indicators from the committed dataset. A
   history indicator shows its latest value with the delta vs the
   prior period computed here (points for percent indicators,
   percent change otherwise); a completions indicator shows its
   field groups rising / falling. Absent section → no block. */
function educationHtml(outlook) {
  const edu = outlook && outlook.education;
  if (!edu || !Array.isArray(edu.indicators) || !edu.indicators.length) return '';
  // Percent indicators render at the precision the source
  // publishes (CEPI rates carry two decimals, e.g. 84.01%) —
  // never a rounded form of the stored value.
  const fmtVal = (ind, v) => ind.unit === 'percent'
    ? String(parseFloat(v.toFixed(2))) + '%'
    : (Number.isInteger(v) ? v.toLocaleString('en-US') : v.toFixed(1));
  const rows = edu.indicators.map(ind => {
    const src = ' <span class="edu-source">' + esc(String(ind.source || '').toUpperCase()) + '</span>';
    if (Array.isArray(ind.history) && ind.history.length) {
      const h = ind.history;
      const last = h[h.length - 1];
      let delta = '';
      if (h.length > 1) {
        const prev = h[h.length - 2].v;
        const diff = last.v - prev;
        const glyph = diff > 0 ? '&#9650;' : diff < 0 ? '&#9660;' : '&#9644;';
        const sign = diff > 0 ? '+' : diff < 0 ? '&minus;' : '';
        const text = ind.unit === 'percent'
          ? sign + Math.abs(diff).toFixed(1) + ' pts vs prior class'
          : sign + Math.abs(prev ? (diff / prev) * 100 : 0).toFixed(1) + '% vs prior period';
        delta = ' <span class="edu-delta">&middot; ' + glyph + ' ' + text + '</span>';
      }
      return '          <p class="edu-row">' + esc(ind.label) + ' <b>' + fmtVal(ind, last.v) + '</b>' +
        ' <span class="edu-vintage">&middot; ' + esc(ind.vintage || last.period) + '</span>' + delta + src + '</p>';
    }
    if ((ind.rise || []).length || (ind.fall || []).length) {
      const side = (list, glyph) => (list || []).map(f =>
        esc(f.name) + ' ' + glyph + ' ' + (f.pctChange > 0 ? '+' : f.pctChange < 0 ? '&minus;' : '') +
        Math.abs(f.pctChange).toFixed(1) + '%').join(' &middot; ');
      return '          <p class="edu-row">' + esc(ind.label) +
        ' <span class="edu-vintage">&middot; ' + esc(ind.vintage || '') + '</span>' +
        ' <span class="edu-delta">&middot; rising: ' + side(ind.rise, '&#9650;') +
        ' &middot; falling: ' + side(ind.fall, '&#9660;') + '</span>' + src + '</p>';
    }
    return '';
  }).filter(Boolean);
  if (!rows.length) return '';
  return '        <div class="education-block">\n' +
    '          <p class="board-kicker">EDUCATION ANALYTICS — MICHIGAN</p>\n' +
    rows.join('\n') + '\n        </div>';
}

/* ================= Highlights + Detail (spec 013) =================
   Two regions on /signals/, rendered from the same committed data
   as the boards: the Highlights region (generated insights summary
   + highlight cards) under the page head, and the expandable
   Detail region ("The full picture") between Trends & outlook and
   the lanes. FR-002: the summary is templated arithmetic on the
   committed statistics only — observational language, no causes,
   no advice, no forecast language beyond the agencies' attributed
   projections; a clause whose input is missing is omitted, never
   approximated. FR-007: a missing dataset section removes exactly
   its dependent cards, blocks, and sentences — never a build
   failure, never a fabricated value. */

/* Magnitude of a raw trend difference in the tile's display
   conventions — the same arithmetic deltaHtml renders, as text. */
function deltaMag(tile, diff) {
  const mag = Math.abs(diff) >= 10000 ? Math.abs(diff) / 1000 : Math.abs(diff);
  return mag.toFixed(1) + (/%$/.test(tile.display || '') ? ' pts' : 'k');
}
function signedPctText(v) {
  return (v > 0 ? '+' : v < 0 ? '&minus;' : '') + Math.abs(v).toFixed(1) + '%';
}
function signedJobsText(v) {
  return (v > 0 ? '+' : v < 0 ? '&minus;' : '') + Math.abs(v).toLocaleString('en-US');
}
/* Window percent as text (Amendment 2's computation, reused):
   (last − first) ÷ first across the non-null points. */
function windowPctText(trend) {
  const pts = (trend || []).filter(p => p.v !== null && p.v !== undefined);
  if (pts.length < 2 || !pts[0].v) return null;
  const pct = ((pts[pts.length - 1].v - pts[0].v) / pts[0].v) * 100;
  return (pct > 0 ? '+' : pct < 0 ? '&minus;' : '') + Math.abs(pct).toFixed(1) + '%';
}
const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six',
  'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
function numWord(n) { return NUM_WORDS[n] || String(n); }
function monthNameOf(ym) {
  const m = /^(\d{4})-(\d{2})/.exec(String(ym || ''));
  return m ? MONTHS[+m[2] - 1] : '';
}
function ymLabel(ym) {
  const m = /^(\d{4})-(\d{2})/.exec(String(ym || ''));
  return m ? MONTHS[+m[2] - 1].slice(0, 3) + ' ' + m[1] : String(ym || '');
}
/* The statewide Michigan occupation group (spec 013 dataset).
   The Detroit Metro group never feeds cards or the summary —
   it renders only as its own labeled group in the Detail
   region (FR-005iii: the groups are never blended). */
function miStatewideGroup(outlook) {
  const occ = outlook && outlook.michiganOccupations;
  if (!occ || !Array.isArray(occ.groups)) return null;
  return occ.groups.find(g => g && g.geography === 'Michigan' &&
    Array.isArray(g.rows) && g.rows.length) || null;
}
function momClause(subject, tile, mom) {
  if (mom > 0) return subject + ' rose ' + deltaMag(tile, mom) + ' to ' + esc(tile.display);
  if (mom < 0) return subject + ' fell ' + deltaMag(tile, mom) + ' to ' + esc(tile.display);
  return subject + ' held at ' + esc(tile.display);
}

/* FR-002 composer: fixed sentence templates in fixed order, each
   independently gated on its inputs existing in the committed
   data. Returns the sentence list; empty when the Pulse snapshot
   is missing (the region then renders absent, FR-007). */
function insightsSentences(pulse, outlook) {
  const out = [];
  if (!pulse || !pulse.tiles || !pulse.tiles.length) return out;
  const byId = id => pulse.tiles.find(t => t.id === id);
  const mfg = byId('SMU26000003000000001');
  const un = byId('LASST260000000000003');
  const lf = byId('LASST260000000000006');
  const nf = byId('SMU26000000000000001');

  /* 1 — Pulse month sentence: latest reference month; the lead
     series' level + computed MoM wording; an extremum clause
     only when it is a trend-array fact; then the labor-force
     and unemployment clauses, each gated on its own delta. */
  if (mfg) {
    const d = trendDeltas(mfg.trend);
    let s = 'In ' + esc(pulse.referenceMonth || '') + ', Michigan manufacturing employment';
    if (d && d.mom > 0) s += ' rose ' + deltaMag(mfg, d.mom) + ' to ' + esc(mfg.display);
    else if (d && d.mom < 0) s += ' fell ' + deltaMag(mfg, d.mom) + ' to ' + esc(mfg.display);
    else s += ' held at ' + esc(mfg.display);
    let extremum = false;
    const pts = (mfg.trend || []).filter(p => p.v !== null && p.v !== undefined);
    if (pts.length >= 3) {
      const latest = pts[pts.length - 1];
      let minP = pts[0], maxP = pts[0];
      for (const p of pts) { if (p.v < minP.v) minP = p; if (p.v > maxP.v) maxP = p; }
      const yr = p => (String(p.ym).slice(0, 4) !== String(latest.ym).slice(0, 4)
        ? ' ' + String(p.ym).slice(0, 4) : '');
      if (latest.v > minP.v) {
        s += ' &mdash; ' + deltaMag(mfg, latest.v - minP.v) + ' above its ' +
          monthNameOf(minP.ym) + yr(minP) + ' low &mdash;';
        extremum = true;
      } else if (latest.v < maxP.v) {
        s += ' &mdash; ' + deltaMag(mfg, maxP.v - latest.v) + ' below its ' +
          monthNameOf(maxP.ym) + yr(maxP) + ' high &mdash;';
        extremum = true;
      }
    }
    const clauses = [];
    if (lf) { const dl = trendDeltas(lf.trend); if (dl) clauses.push(momClause('the labor force', lf, dl.mom)); }
    if (un) { const du = trendDeltas(un.trend); if (du) clauses.push(momClause('the unemployment rate', un, du.mom)); }
    if (clauses.length) s += (extremum ? ' while ' : ', while ') + clauses.join(' and ');
    out.push(s + '.');
  }

  /* 2 — Window sentence: the labor force and total nonfarm
     window moves (delta + window %, the Amendment-2 figures),
     each clause gated on its own series' window existing. */
  {
    const winClause = (subject, tile) => {
      if (!tile) return null;
      const d = trendDeltas(tile.trend);
      if (!d) return null;
      if (d.window === 0) return subject + ' is unchanged';
      const wp = windowPctText(tile.trend);
      if (!wp) return null;
      return subject + (d.window > 0 ? ' is up ' : ' is down ') +
        deltaMag(tile, d.window) + ' (' + wp + ')';
    };
    const clauses = [winClause('the labor force', lf), winClause('total nonfarm employment', nf)]
      .filter(Boolean);
    if (clauses.length) {
      const n = Math.max(0, ...pulse.tiles.map(t => (t.trend || []).length));
      out.push('Across the ' + numWord(n) + ' months in the snapshot, ' +
        clauses.join(' while ') + '.');
    }
  }

  /* 3 — Outlook sentence: top riser per dataset present; the
     "on both boards" phrasing only when both datasets are
     present AND the composer has compared the names (FR-002);
     the shared-faller clause likewise only on a compared fact. */
  {
    const miState = miStatewideGroup(outlook);
    const miRows = miState
      ? [...miState.rows].sort((a, b) => b.pctChange - a.pctChange) : [];
    const bls = outlook && outlook.blsProjections;
    const blsRise = bls && Array.isArray(bls.rise) && bls.rise.length
      ? [...bls.rise].sort((a, b) => b.pctChange - a.pctChange) : [];
    const blsFall = bls && Array.isArray(bls.fall) && bls.fall.length
      ? [...bls.fall].sort((a, b) => a.pctChange - b.pctChange) : [];
    const verbFor = name => (/s$/i.test(String(name).trim()) ? 'are' : 'is');
    /* Sentence form: the datasets carry title case (MCDA) and
       sentence case (BLS); mid-sentence the name lowercases in
       full — occupation names here carry no proper nouns. */
    const lowerFirst = name => name.toLowerCase();
    if (miRows.length && blsRise.length) {
      const miR = miRows[0], blsR = blsRise[0];
      const miNeg = new Map(miRows.filter(r => r.pctChange < 0)
        .map(r => [r.occupation.toLowerCase(), r]));
      const shared = blsFall.find(r => miNeg.has(r.name.toLowerCase()));
      let s;
      if (miR.occupation.toLowerCase() === blsR.name.toLowerCase()) {
        s = 'In the published outlooks, ' + esc(lowerFirst(miR.occupation)) + ' ' +
          verbFor(miR.occupation) +
          ' the fastest-growing occupation on both boards &mdash; ' +
          signedPctText(miR.pctChange) + ' in Michigan&rsquo;s ' + esc(miState.horizon) +
          ' projections (MCDA) and ' + signedPctText(blsR.pctChange) +
          ' nationally for ' + esc(bls.horizon || bls.vintage || '') + ' (U.S. BLS)';
      } else {
        s = 'In the published outlooks, ' + esc(lowerFirst(miR.occupation)) + ' ' +
          verbFor(miR.occupation) +
          ' the fastest-growing occupation in Michigan&rsquo;s ' + esc(miState.horizon) +
          ' projections (MCDA) at ' + signedPctText(miR.pctChange) +
          ', and ' + esc(lowerFirst(blsR.name)) + ' ' + verbFor(blsR.name) +
          ' the fastest-growing nationally for ' + esc(bls.horizon || bls.vintage || '') +
          ' (U.S. BLS) at ' + signedPctText(blsR.pctChange);
      }
      if (shared) {
        const miF = miNeg.get(shared.name.toLowerCase());
        s += ' &mdash; and ' + esc(lowerFirst(shared.name)) + ' ' + verbFor(shared.name) +
          ' among the fastest-falling on both (' + signedPctText(miF.pctChange) +
          ' in Michigan, ' + signedPctText(shared.pctChange) + ' nationally)';
      }
      out.push(s + '.');
    } else if (blsRise.length) {
      let s = 'In the published U.S. outlook (U.S. BLS, ' +
        esc(bls.horizon || bls.vintage || '') + '), ' +
        esc(lowerFirst(blsRise[0].name)) + ' ' + verbFor(blsRise[0].name) +
        ' the fastest-growing occupation at ' + signedPctText(blsRise[0].pctChange);
      if (blsFall.length) {
        s += ', and ' + esc(lowerFirst(blsFall[0].name)) + ' ' + verbFor(blsFall[0].name) +
          ' the fastest-falling at ' + signedPctText(blsFall[0].pctChange);
      }
      out.push(s + '.');
    } else if (miRows.length) {
      const miF = miRows[miRows.length - 1];
      let s = 'In Michigan&rsquo;s published outlook (MCDA, ' + esc(miState.horizon) + '), ' +
        esc(lowerFirst(miRows[0].occupation)) + ' ' + verbFor(miRows[0].occupation) +
        ' the fastest-growing occupation at ' + signedPctText(miRows[0].pctChange);
      if (miF.pctChange < 0) {
        s += ', and ' + esc(lowerFirst(miF.occupation)) + ' ' + verbFor(miF.occupation) +
          ' the fastest-falling at ' + signedPctText(miF.pctChange);
      }
      out.push(s + '.');
    }
  }

  /* 4 — Education sentence: the headline figure in its source
     wording + its prior-class comparison, when present. */
  {
    const figs = outlook && outlook.education && Array.isArray(outlook.education.figures)
      ? outlook.education.figures : [];
    const head = figs.find(f => f && f.headline && f.valueText);
    if (head) {
      let s = 'Michigan&rsquo;s ' + esc(head.period) + ' graduated at ' + esc(head.valueText);
      if (head.compareText) s += ', ' + esc(head.compareText);
      out.push(s + '.');
    }
  }
  return out;
}

/* FR-002e provenance line: snapshot period + the vintages of
   the outlook datasets actually present. */
function insightsHtml(pulse, outlook) {
  const sentences = insightsSentences(pulse, outlook);
  if (!sentences.length) return '';
  const prov = ['Generated at build time from the data on this page'];
  if (pulse.referenceMonth) prov.push('Pulse snapshot: ' + esc(pulse.referenceMonth));
  const outs = [];
  const miState = miStatewideGroup(outlook);
  if (miState) outs.push('Michigan MCDA ' + esc(miState.horizon));
  const bls = outlook && outlook.blsProjections;
  if (bls && ((bls.rise || []).length || (bls.fall || []).length)) {
    outs.push('U.S. BLS ' + esc(bls.horizon || bls.vintage || ''));
  }
  if (outs.length) prov.push('Outlooks: ' + outs.join(' &middot; '));
  prov.push('No forecasts &mdash; forward-looking figures are the publishing agencies&rsquo; projections');
  return '          <p class="hl-summary">' + sentences.join(' ') + '</p>\n' +
    '          <p class="hl-prov">' + prov.join(' &middot; ') + '</p>';
}

/* FR-003 composition rule, as amended by spec 013 Amendment 1
   (owner direction 2026-10-06): per outlook dataset present a
   top riser and top faller card, then the education headline
   card — five cards with the current data. The four Pulse
   cards the original rule opened with are REMOVED: the Pulse
   band directly below the region carries the same values and
   deltas in fuller form, and the band is the Pulse stats'
   single home on the page. A card whose data is absent does
   not render — no placeholders. */
function highlightCardsHtml(pulse, outlook) {
  if (!pulse || !pulse.tiles || !pulse.tiles.length) return '';
  const cards = [];
  const card = (label, valueHtml, meta) =>
    '          <div class="pulse-tile hl-card">\n' +
    '            <p class="pulse-label">' + label + '</p>\n' + valueHtml + '\n' +
    '            <p class="pulse-delta">' + meta + '</p>\n          </div>';
  const miState = miStatewideGroup(outlook);
  if (miState) {
    const rows = [...miState.rows].sort((a, b) => b.pctChange - a.pctChange);
    if (rows.length && rows[0].pctChange > 0) {
      cards.push(card('Top riser &middot; Michigan outlook',
        '            <p class="hl-name">' + esc(rows[0].occupation) + '</p>',
        'projected <b>' + signedPctText(rows[0].pctChange) + '</b> &middot; MCDA ' +
        esc(miState.horizon)));
    }
    const faller = rows[rows.length - 1];
    if (rows.length && faller.pctChange < 0) {
      cards.push(card('Top faller &middot; Michigan outlook',
        '            <p class="hl-name">' + esc(faller.occupation) + '</p>',
        'projected <b>' + signedPctText(faller.pctChange) + '</b> &middot; MCDA ' +
        esc(miState.horizon)));
    }
  }
  const bls = outlook && outlook.blsProjections;
  if (bls && Array.isArray(bls.rise) && bls.rise.length) {
    const riser = [...bls.rise].sort((a, b) => b.pctChange - a.pctChange)[0];
    cards.push(card('Top riser &middot; U.S. outlook',
      '            <p class="hl-name">' + esc(riser.name) + '</p>',
      'projected <b>' + signedPctText(riser.pctChange) + '</b> &middot; ' +
      esc(bls.agencyShort || 'U.S. BLS') + ' ' + esc(bls.horizon || bls.vintage || '')));
  }
  if (bls && Array.isArray(bls.fall) && bls.fall.length) {
    const faller = [...bls.fall].sort((a, b) => a.pctChange - b.pctChange)[0];
    cards.push(card('Top faller &middot; U.S. outlook',
      '            <p class="hl-name">' + esc(faller.name) + '</p>',
      'projected <b>' + signedPctText(faller.pctChange) + '</b> &middot; ' +
      esc(bls.agencyShort || 'U.S. BLS') + ' ' + esc(bls.horizon || bls.vintage || '')));
  }
  const figs = outlook && outlook.education && Array.isArray(outlook.education.figures)
    ? outlook.education.figures : [];
  const head = figs.find(f => f && f.headline && f.valueText);
  if (head) {
    const glyph = head.deltaDirection === 'down' ? '&#9660;' : '&#9650;';
    const meta = esc(head.period) +
      (head.deltaText ? ' &middot; ' + glyph + ' ' + esc(head.deltaText) : '') +
      ' &middot; ' + esc(head.publisher || '');
    cards.push(card('Education headline &middot; Michigan',
      '            <p class="hl-name">' + esc(head.cardLabel || head.label) +
      ' &mdash; ' + esc(head.valueText) + '</p>', meta));
  }
  if (!cards.length) return '';
  return '          <div class="hl-grid">\n' + cards.join('\n') + '\n          </div>';
}

function highlightsHtml(pulse, outlook) {
  if (!pulse || !pulse.tiles || !pulse.tiles.length) return '';
  const ins = insightsHtml(pulse, outlook);
  const cards = highlightCardsHtml(pulse, outlook);
  if (!ins && !cards) return '';
  return '        <div class="highlights">\n' +
    '          <p class="hl-kicker">Highlights &mdash; the short version</p>\n' +
    (ins ? ins + '\n' : '') + (cards ? cards + '\n' : '') +
    '        </div>';
}

function detailBlock(kicker, inner) {
  return '          <div class="detail-block">\n' +
    '          <p class="board-kicker">' + kicker + '</p>\n' + inner + '\n          </div>';
}

/* FR-005(i): every monthly point of every Pulse series as one
   table, oldest → newest, latest row marked. A missing month is
   a gap cell ("—"), captioned as missing in the source — never
   interpolated (spec 004 FR-006 / spec 011 FR-005d). */
const DETAIL_TILE_HEADS = {
  SMU26000003000000001: 'Manufacturing (k)',
  LASST260000000000003: 'Unemployment',
  LASST260000000000006: 'Labor force',
  SMU26000000000000001: 'Nonfarm (k)',
};
function detailPulseTable(pulse) {
  if (!pulse || !pulse.tiles || !pulse.tiles.length) return '';
  const tiles = pulse.tiles;
  const months = [];
  const seen = new Set();
  for (const t of tiles) {
    for (const p of (t.trend || [])) {
      if (!seen.has(p.ym)) { seen.add(p.ym); months.push(p.ym); }
    }
  }
  months.sort();
  if (!months.length) return '';
  const cell = (tile, v) => {
    if (v === null || v === undefined) return '&mdash;';
    if (/%$/.test(tile.display || '')) return v.toFixed(1) + '%';
    if (tile.id === 'LASST260000000000006') return Math.round(v).toLocaleString('en-US');
    return v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };
  const head = tiles.map(t =>
    '<th scope="col" class="dt-num">' + esc(DETAIL_TILE_HEADS[t.id] || t.label) + '</th>').join('');
  const lastYm = months[months.length - 1];
  const rows = months.map(ym => {
    const tds = tiles.map(t => {
      const p = (t.trend || []).find(x => x.ym === ym);
      return '<td class="dt-num">' + cell(t, p ? p.v : null) + '</td>';
    }).join('');
    return '            <tr' + (ym === lastYm ? ' class="dt-latest"' : '') +
      '><td>' + ymLabel(ym) + '</td>' + tds + '</tr>';
  }).join('\n');
  const gapAt = ym => tiles.some(t => {
    const p = (t.trend || []).find(x => x.ym === ym);
    return !p || p.v === null || p.v === undefined;
  });
  const gapMonths = months.filter(gapAt);
  const shortName = t => String(t.label || '').toLowerCase()
    .replace(' rate', '').replace(' employment', '').replace('total ', '');
  const gapSeries = tiles
    .filter(t => (t.trend || []).some(p => p.v === null || p.v === undefined))
    .map(shortName);
  let caption = 'Every point in the snapshot&rsquo;s trend arrays, as a table &mdash; ' +
    'the same values the sparklines draw.';
  if (gapMonths.length) {
    caption += ' &ldquo;&mdash;&rdquo; is a month the published series does not contain (' +
      gapMonths.map(ymLabel).join(', ') +
      (gapSeries.length ? ', ' + gapSeries.join(' + ') : '') +
      '): shown as a gap and captioned as missing in the source, never interpolated.';
  }
  return detailBlock(
    'MICHIGAN PULSE &mdash; ' + months.length + ' MONTHS OF VALUES &middot; ' +
      esc(String(pulse.source || '').toUpperCase()),
    '          <div class="detail-scroll">\n' +
    '          <table class="detail-table">\n' +
    '            <caption class="visually-hidden">Michigan Pulse monthly values for all four series</caption>\n' +
    '            <thead><tr><th scope="col">Month</th>' + head + '</tr></thead>\n' +
    '            <tbody>\n' + rows + '\n            </tbody>\n          </table>\n          </div>\n' +
    '          <p class="board-note">' + caption + '</p>');
}

/* FR-005(ii): every committed BLS EP row, rise and fall, with
   the projected numeric change beside the percentage; the
   standing projections caption repeats here. */
function detailBls(outlook) {
  const bls = outlook && outlook.blsProjections;
  if (!bls || (!(bls.rise || []).length && !(bls.fall || []).length)) return '';
  const row = r => '            <p class="proj-row">' + esc(r.name) +
    ' <b class="proj-pct">' + signedPctText(r.pctChange) + '</b>' +
    ' <span class="proj-jobs">&middot; ' + signedJobsText(r.jobsChange) + ' jobs</span></p>';
  const col = (label, rows) => rows.length
    ? '          <div>\n            <p class="board-sub">' + label + '</p>\n' +
      rows.map(row).join('\n') + '\n          </div>'
    : '';
  const cols = [col('On the rise', bls.rise || []), col('Falling', bls.fall || [])]
    .filter(Boolean);
  if (!cols.length) return '';
  return detailBlock(
    'U.S. OUTLOOK &mdash; FULL TABLES &middot; U.S. BLS ' +
      esc(String(bls.publication || '').toUpperCase()) + ' ' +
      esc(bls.horizon || bls.vintage || ''),
    '          <div class="detail-cols">\n' + cols.join('\n') + '\n          </div>\n' +
    '          <p class="board-note">Projections are the publishing agency&rsquo;s modeled outlook, ' +
    'published with its horizon and vintage &mdash; they are not Axiovex forecasts, ' +
    'and they are not guarantees.</p>');
}

/* FR-005(iii): all 36 Michigan occupation rows in their two
   labeled groups — never blended into one ranking or horizon.
   Provenance is the via-study label + release tag + the
   direct-source caveat, stated in the block. */
function detailMichigan(outlook) {
  const occ = outlook && outlook.michiganOccupations;
  if (!occ || !Array.isArray(occ.groups) || !occ.groups.length) return '';
  const parts = [];
  for (const g of occ.groups) {
    const rows = [...(g.rows || [])].sort((a, b) => b.pctChange - a.pctChange);
    if (!rows.length) continue;
    const geoLabel = g.geography === 'Michigan' ? 'Michigan statewide' : g.geography;
    parts.push('          <p class="board-sub">' + esc(geoLabel) + ' &middot; ' +
      esc(g.horizon || '') + ' &mdash; ' + rows.length +
      ' occupations, sorted by projected change</p>');
    parts.push(rows.map(r => '            <p class="proj-row">' + esc(r.occupation) +
      ' <b class="proj-pct">' + signedPctText(r.pctChange) + '</b>' +
      ' <span class="proj-jobs">&middot; ' + r.baseEmployment.toLocaleString('en-US') +
      ' &rarr; ' + r.projectedEmployment.toLocaleString('en-US') +
      ' &middot; ' + r.annualOpenings.toLocaleString('en-US') +
      ' openings/yr</span></p>').join('\n'));
  }
  if (!parts.length) return '';
  const prov = 'Provenance: transcribed from the ' + esc(occ.edition || 'September edition') +
    '&rsquo;s verified projection capture in the ' + esc(occ.studyName || 'Axiovex workforce study') +
    ' (release tag ' + esc(occ.releaseTag || '') + '), whose underlying files are MCDA&rsquo;s ' +
    'published statewide and regional workbooks. The figures are labeled &ldquo;via the Axiovex ' +
    'workforce study, September edition&rdquo; until the pending direct read of MCDA&rsquo;s tables ' +
    'on michigan.gov supersedes this transcription. The two groups are never blended &mdash; ' +
    'different geographies, different vintages, separate labels. Annual openings include ' +
    'replacement demand, not only growth.';
  return detailBlock(
    'MICHIGAN OCCUPATIONS &mdash; LONG-TERM PROJECTIONS &middot; MICHIGAN MCDA, VIA THE ' +
      'AXIOVEX WORKFORCE STUDY (' + esc(String(occ.edition || '').toUpperCase()) + ')',
    parts.join('\n') + '\n          <p class="board-note">' + prov + '</p>');
}

/* FR-005(iv): the verified education set only, each figure in
   its source-published form (valueText) with publisher +
   vintage; the pupil-membership row keeps its source's
   "estimate" label. The unverified IPEDS row is absent,
   captioned as absent — never substituted. */
function detailEducation(outlook) {
  const figs = outlook && outlook.education && Array.isArray(outlook.education.figures)
    ? outlook.education.figures : [];
  if (!figs.length) return '';
  const rows = figs.map(f => {
    let mid = ' &middot; ' + esc(f.period);
    if (f.priorText) mid += ' &middot; ' + esc(f.priorText);
    if (f.noteText) {
      mid += ' &middot; ' + (f.estimate
        ? esc(f.noteText).replace('estimate', '<b>estimate</b>')
        : esc(f.noteText));
    }
    return '          <p class="edu-row">' + esc(f.label) + ' <b>' + esc(f.valueText) + '</b>' +
      ' <span class="edu-vintage">' + mid + ' &middot;</span>' +
      ' <span class="edu-source">' + esc(f.publisherTag || f.publisher || '') + '</span></p>';
  });
  return detailBlock('EDUCATION TO CAREER &mdash; MICHIGAN',
    rows.join('\n') +
    '\n          <p class="board-note">One row is deliberately absent: postsecondary completions ' +
    'by field &mdash; no Michigan by-field series has been verified from its source (IPEDS) yet, ' +
    'so the row does not appear. The block grows by verification, never by substitution.</p>');
}

/* FR-005(v): link block — the current monthly workforce article
   resolved from the build's own post list, and the study
   edition at its immutable release-tag URL from the dataset
   metadata. Never hand-maintained in the template. */
function detailGoDeeper(posts, outlook) {
  const parts = [];
  const post = (posts || []).find(p => p.slug && p.slug.startsWith('michigan-workforce-'));
  if (post) {
    parts.push('          <p class="detail-link"><a href="' + escAttr(post.url) + '">' +
      esc(post.title) + '</a> <span class="proj-meta">&middot; the current monthly ' +
      'workforce article on this site</span></p>');
  }
  const occ = outlook && outlook.michiganOccupations;
  if (occ && occ.editionUrl) {
    parts.push('          <p class="detail-link"><a href="' + escAttr(occ.editionUrl) +
      '" target="_blank" rel="noopener">The ' + esc(occ.edition || 'September edition') +
      ' &mdash; ' + esc(occ.studyName || 'Axiovex workforce study') + ' &rarr;</a>' +
      ' <span class="proj-meta">&middot; the verified research edition behind the Michigan ' +
      'tables (release tag ' + esc(occ.releaseTag || '') + ')</span></p>');
  }
  if (!parts.length) return '';
  return detailBlock('GO DEEPER', parts.join('\n'));
}

/* ============ Spec 014 — Talent geography ===================
   The geography subsection of the detail region: the last
   data block, after Education-to-career, before Go Deeper
   (spec 014 FR-001). Every figure renders from the committed
   datasets under data/geo/ — nothing is fetched, estimated,
   or interpolated at build or view time. A dataset that is
   missing or unreadable drops its own map only; the others
   still render (the FR-011 pattern), and the sources note
   names only the datasets actually present (geoNote below).
   County geometry is emitted ONCE as <defs>; every choropleth
   layer is <use> references plus its own table (WF-13). */
function loadGeoFile(name) {
  const p = path.join(ROOT, 'data', 'geo', name);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, 'utf8')); }
  catch { console.warn('signals: data/geo/' + name + ' unreadable — its map is omitted'); return null; }
}
function loadGeo() {
  const geo = {
    paths: loadGeoFile('mi-county-paths.json'),
    laus: loadGeoFile('laus-county.json'),
    qcew: loadGeoFile('qcew-county-industry.json'),
    ipeds: loadGeoFile('ipeds-institutions.json'),
    pseo: loadGeoFile('pseo-pipelines.json'),
  };
  return Object.values(geo).some(Boolean) ? geo : null;
}
const GEO_RAMP = ['#E8FAFD', '#A9E9F5', '#5CC6DC', '#2E9DB8', '#17617E'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
function monthLong(ym) {
  const m = /^(\d{4})-(\d{2})$/.exec(ym || '');
  return m ? MONTHS_LONG[Number(m[2]) - 1] + ' ' + m[1] : String(ym || '');
}
function geoDefsSvg(paths) {
  const defs = (paths.counties || []).map(c =>
    '      <path id="mi-' + c.fips + '" d="' + c.path + '"/>').join('\n');
  return '          <svg class="geo-defs" aria-hidden="true" focusable="false">' +
    '<defs>\n' + defs + '\n' +
    '      <pattern id="geo-hatch" width="6" height="6" patternUnits="userSpaceOnUse" ' +
    'patternTransform="rotate(45)"><rect width="6" height="6" fill="#EDF2F5"/>' +
    '<line x1="0" y1="0" x2="0" y2="6" stroke="#8A97A5" stroke-width="2"/></pattern>\n' +
    '    </defs></svg>';
}
function geoUse(fips, fill) {
  return '        <use href="#mi-' + fips + '" fill="' + fill + '"/>';
}
function geoLegend(items) {
  return '          <p class="geo-legend">' + items.map(([fill, label]) =>
    '<span class="geo-swatch" style="background:' + fill + '"></span> ' + label
  ).join(' &nbsp; ') + '</p>';
}
const HATCH_FILL = 'url(#geo-hatch)';

/* Map (b): LAUS county unemployment choropleth. The five legend
   bins are the wireframe's; a county the source has not
   published for the month takes the hatched not-published state
   — never a neighboring value, never an interpolation
   (FR-002). The table repeats every value as text. */
function geoLausBlock(geo) {
  const { paths, laus } = geo;
  if (!paths || !laus || !(laus.counties || []).length) return '';
  const binOf = r => r < 4 ? 0 : r < 5 ? 1 : r < 6 ? 2 : r < 7 ? 3 : 4;
  const fills = new Map(laus.counties.map(c => [c.fips,
    c.rate === null || c.rate === undefined ? HATCH_FILL : GEO_RAMP[binOf(c.rate)]]));
  const uses = paths.counties.map(c => geoUse(c.fips, fills.get(c.fips) || HATCH_FILL)).join('\n');
  const rows = [...laus.counties].sort((a, b) =>
    (b.rate ?? -1) - (a.rate ?? -1) || (a.name < b.name ? -1 : 1)).map(c =>
    '              <tr><td>' + esc(c.name) + '</td><td>' +
    (c.rate === null || c.rate === undefined ? 'Not published' : c.rate.toFixed(1) + '%') +
    '</td></tr>').join('\n');
  const holes = (laus.holeMonths || []).map(monthLong);
  const holeNote = holes.length
    ? ' ' + holes.join(' and ') + ' ' + (holes.length > 1 ? 'are' : 'is') +
      ' a genuine hole in this series &mdash; the source published no values for ' +
      (holes.length > 1 ? 'those months' : 'that month') +
      ' (federal lapse in appropriations) &mdash; shown as not published, never interpolated.'
    : '';
  return '          <div class="geo-block">\n' +
    '          <p class="board-sub">County unemployment &mdash; ' + esc(monthLong(laus.referenceMonth)) +
    (laus.preliminary ? ' (preliminary)' : '') + '</p>\n' +
    '          <div class="geo-mapwrap">\n' +
    '          <svg class="geo-map" viewBox="' + esc(paths.viewBox) + '" role="img" aria-label="Map of Michigan counties shaded by unemployment rate, ' + esc(monthLong(laus.referenceMonth)) + '">\n' +
    uses + '\n          </svg>\n' +
    geoLegend([...GEO_RAMP.map((fill, i) => [fill,
      ['Under 4.0%', '4.0&ndash;4.9%', '5.0&ndash;5.9%', '6.0&ndash;6.9%', '7.0% and over'][i]]),
      ['repeating-linear-gradient(45deg, #EDF2F5 0 3px, #8A97A5 3px 5px)', 'Not published']]) + '\n' +
    '          </div>\n' +
    '          <div class="geo-tablewrap"><table class="geo-table">\n' +
    '            <caption>Unemployment rate by county &middot; BLS Local Area Unemployment Statistics</caption>\n' +
    '            <thead><tr><th scope="col">County</th><th scope="col">Rate</th></tr></thead>\n' +
    '            <tbody>\n' + rows + '\n            </tbody>\n          </table></div>\n' +
    '          <p class="board-note">Shading follows the rate only; the table is the record. ' +
    'Rates are the source&rsquo;s published values for the month named.' + holeNote + '</p>\n' +
    '          </div>';
}

/* Map (a): QCEW employment by county x industry. Shading is the
   employment LEVEL on each layer's own five-step scale — never
   the location quotient, which appears only in the table
   (FR-003). Sector rows are QCEW's private-ownership rows, the
   grain at which QCEW publishes county x sector data, labeled
   as such; the All-industries layer is the published county
   total (all ownerships). Suppressed and absent cells take the
   hatched not-disclosed state — never zero, never a value
   shade (FR-010a). */
function geoQcewBlock(geo) {
  const { paths, qcew } = geo;
  if (!paths || !qcew || !(qcew.counties || []).length || !(qcew.sectors || []).length) return '';
  const rampIdx = (v, max) => {
    const f = max > 0 ? v / max : 0;
    return f >= 0.6 ? 4 : f >= 0.3 ? 3 : f >= 0.12 ? 2 : f >= 0.04 ? 1 : 0;
  };
  const cellOf = (c, code) => {
    const cell = (c.sectors || {})[code];
    return cell && typeof cell.emplvl === 'number' ? cell : null;
  };
  const layerDefs = [
    { key: 'total', label: 'All industries', caption: 'Total employment by county (all ownerships)' },
    ...qcew.sectors.map(s => ({
      key: s.code, label: s.label, caption: s.label + ' &mdash; private employment by county',
    })),
  ];
  const valueOf = (l, c) => l.key === 'total'
    ? { emplvl: c.totalAllOwnership.emplvl } : cellOf(c, l.key);
  const buttons = layerDefs.map(l =>
    '            <button type="button" class="geo-chip" data-geo-btn="qcew:' + l.key + '"' +
    (l.key === '31-33' ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' +
    esc(l.label) + '</button>').join('\n');
  const layerHtml = layerDefs.map(l => {
    const max = Math.max(0, ...qcew.counties.map(c => {
      const v = valueOf(l, c); return v ? v.emplvl : 0;
    }));
    const uses = qcew.counties.map(c => {
      const v = valueOf(l, c);
      return geoUse(c.fips, v === null ? HATCH_FILL : GEO_RAMP[rampIdx(v.emplvl, max)]);
    }).join('\n');
    const rows = [...qcew.counties].sort((a, b) => {
      const va = valueOf(l, a), vb = valueOf(l, b);
      return (vb ? vb.emplvl : -1) - (va ? va.emplvl : -1) || (a.name < b.name ? -1 : 1);
    }).map(c => {
      if (l.key === 'total') {
        return '              <tr><td>' + esc(c.name) + '</td><td>' +
          c.totalAllOwnership.emplvl.toLocaleString('en-US') + '</td><td>' +
          c.totalPrivate.emplvl.toLocaleString('en-US') + '</td></tr>';
      }
      const cell = cellOf(c, l.key);
      if (!cell) {
        return '              <tr><td>' + esc(c.name) + '</td><td>Not disclosed</td><td>&mdash;</td></tr>';
      }
      return '              <tr><td>' + esc(c.name) + '</td><td>' +
        cell.emplvl.toLocaleString('en-US') + '</td><td>' + cell.lq.toFixed(2) + '</td></tr>';
    }).join('\n');
    const head = l.key === 'total'
      ? '<tr><th scope="col">County</th><th scope="col">Total employment</th><th scope="col">of which private</th></tr>'
      : '<tr><th scope="col">County</th><th scope="col">Employment (private)</th><th scope="col">Location quotient</th></tr>';
    return '          <div class="geo-layer" data-geo-layer="qcew:' + l.key + '">\n' +
      '          <div class="geo-mapwrap">\n' +
      '          <svg class="geo-map" viewBox="' + esc(paths.viewBox) + '" role="img" aria-label="Map of Michigan counties shaded by ' + esc(l.label.toLowerCase()) + ' employment, 2024">\n' +
      uses + '\n          </svg>\n          </div>\n' +
      '          <div class="geo-tablewrap"><table class="geo-table">\n' +
      '            <caption>' + l.caption + ' &middot; BLS QCEW, 2024 annual averages</caption>\n' +
      '            <thead>' + head + '</thead>\n' +
      '            <tbody>\n' + rows + '\n            </tbody>\n          </table></div>\n' +
      '          </div>';
  }).join('\n');
  return '          <div class="geo-block">\n' +
    '          <p class="board-sub">Employment by county and industry &mdash; 2024 annual averages</p>\n' +
    '          <p class="geo-selector" role="group" aria-label="Industry">\n' + buttons + '\n          </p>\n' +
    geoLegend([[GEO_RAMP[0], 'Fewest jobs in this industry'], [GEO_RAMP[4], 'Most jobs in this industry'],
      ['repeating-linear-gradient(45deg, #EDF2F5 0 3px, #8A97A5 3px 5px)', 'Not disclosed']]) + '\n' +
    layerHtml + '\n' +
    '          <p class="board-note">Shading is the employment level on each industry&rsquo;s own ' +
    'scale &mdash; never the location quotient, which appears only in the table (the county&rsquo;s ' +
    'share of its jobs in the industry, against the national share; above 1.00 = more concentrated ' +
    'than the nation). Industry rows are QCEW&rsquo;s private-ownership rows &mdash; the grain at ' +
    'which QCEW publishes county-by-industry data; the All-industries layer is the published county ' +
    'total across all ownerships. &ldquo;Not disclosed&rdquo; means the source publishes no value for ' +
    'that county and industry (suppressed, or no establishments reported) &mdash; never zero.</p>\n' +
    '          </div>';
}

/* Map (c): IPEDS institutions. Dots sit at the coordinates the
   source publishes, projected with the county geometry's own
   fit (constants committed in mi-county-paths.json); size is
   completions in the selected layer. The list beside the map
   is the data of record; an institution without published
   coordinates would be listed, never placed by guess — the
   committed extract currently has none (FR-004). */
function geoIpedsBlock(geo) {
  const { paths, ipeds } = geo;
  if (!paths || !ipeds || !(ipeds.institutions || []).length) return '';
  const proj = paths.projection;
  if (!proj) return '';
  const cos = Math.cos(proj.cosLatDeg * Math.PI / 180);
  const xy = i => [proj.pad + (i.lon * cos - proj.minX) * proj.k,
    proj.pad + (-i.lat - proj.minY) * proj.k];
  const fams = Object.keys(ipeds.families || {})
    .map(code => ({
      code, label: ipeds.families[code],
      total: ipeds.institutions.reduce((n, i) => n + ((i.byFamily || {})[code] || 0), 0),
    })).filter(f => f.total > 0).sort((a, b) => b.total - a.total);
  const layerDef = [
    { key: 'ALL', label: 'All fields', valueOf: i => i.totalCompletions },
    ...fams.map(f => ({
      key: f.code, label: f.label, valueOf: i => (i.byFamily || {})[f.code] || 0,
    })),
  ];
  const outlines = paths.counties.map(c =>
    '        <use href="#mi-' + c.fips + '" class="geo-outline"/>').join('\n');
  const buttons = layerDef.map(l =>
    '            <button type="button" class="geo-chip" data-geo-btn="ipeds:' + l.key + '"' +
    (l.key === 'ALL' ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' +
    esc(l.label) + '</button>').join('\n');
  const layerHtml = layerDef.map(l => {
    const placed = ipeds.institutions.filter(i => i.lat !== null && i.lon !== null && l.valueOf(i) > 0);
    const max = Math.max(1, ...placed.map(l.valueOf));
    const dots = placed.map(i => {
      const [x, y] = xy(i);
      const r = (1.6 + 4.6 * Math.sqrt(l.valueOf(i) / max)).toFixed(1);
      return '        <circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r +
        '" class="geo-dot"><title>' + esc(i.name) + ' &middot; ' +
        l.valueOf(i).toLocaleString('en-US') + ' completions</title></circle>';
    }).join('\n');
    const sorted = [...placed].sort((a, b) => l.valueOf(b) - l.valueOf(a) || (a.name < b.name ? -1 : 1));
    const top = sorted.slice(0, 8).map(i =>
      '          <p class="proj-row">' + esc(i.name) + ' &middot; ' + esc(i.city) +
      ' <b class="proj-pct">' + l.valueOf(i).toLocaleString('en-US') + '</b></p>').join('\n');
    const rest = sorted.length - Math.min(8, sorted.length);
    const unlocated = ipeds.institutions.filter(i => (i.lat === null || i.lon === null) && l.valueOf(i) > 0);
    const unlocNote = unlocated.length
      ? '          <p class="board-note">Listed without a map position (the source publishes no ' +
        'coordinates; never placed by guess): ' +
        unlocated.map(i => esc(i.name) + ' (' + l.valueOf(i).toLocaleString('en-US') + ')').join('; ') + '.</p>\n'
      : '';
    const zeroNote = l.key === 'ALL'
      ? (() => {
          const zero = ipeds.institutions.filter(i => i.totalCompletions === 0);
          return zero.length
            ? '          <p class="board-note">Listed without a dot (the source publishes no ' +
              'completions for 2023&ndash;24): ' +
              zero.map(i => esc(i.name) + ' &middot; ' + esc(i.city)).join('; ') + '.</p>\n'
            : '';
        })()
      : '';
    return '          <div class="geo-layer" data-geo-layer="ipeds:' + l.key + '">\n' +
      '          <div class="geo-mapwrap">\n' +
      '          <svg class="geo-map" viewBox="' + esc(paths.viewBox) + '" role="img" aria-label="Map of Michigan postsecondary institutions, sized by ' + esc(l.label.toLowerCase()) + ' completions, 2023-24">\n' +
      outlines + '\n' + dots + '\n          </svg>\n          </div>\n' +
      '          <div class="geo-listwrap">\n' +
      '          <p class="board-sub">Largest by completions &mdash; ' + esc(l.label) + '</p>\n' +
      top + '\n' +
      (rest > 0 ? '          <p class="board-note">Plus ' + rest + ' more institutions on the map; ' +
        'the map carries every institution in the layer.</p>\n' : '') +
      unlocNote + zeroNote +
      '          </div>\n          </div>';
  }).join('\n');
  return '          <div class="geo-block">\n' +
    '          <p class="board-sub">Where the completions are &mdash; postsecondary institutions, 2023&ndash;24 awards</p>\n' +
    '          <p class="geo-selector" role="group" aria-label="Field of study">\n' + buttons + '\n          </p>\n' +
    layerHtml + '\n' +
    '          <p class="board-note">Dots sit at the coordinates IPEDS publishes for each ' +
    'institution; size is completions in the selected field (all award levels). Field is the ' +
    'IPEDS CIP family. The list is the record; the map is the picture of it.</p>\n' +
    '          </div>';
}

/* Map (d): PSEO pipelines — statewide field-to-industry flows
   as ranked bars, plus the University of Michigan spotlight.
   The coverage limitation is stated ON the panel: UMich is
   Michigan's only PSEO partner institution (~10% of statewide
   graduates, 2015 estimate, per the Census partner file), so
   institution-level outcomes exist for it alone — never
   presented as a school-by-school Michigan pipeline (FR-006). */
function geoPseoBlock(geo) {
  const pseo = geo.pseo;
  if (!pseo || !pseo.statewideFlows || !(pseo.statewideFlows.rows || []).length) return '';
  const rows = pseo.statewideFlows.rows;
  const max = Math.max(1, ...rows.map(r => r.y1GradsEmp));
  const bars = rows.map(r =>
    '          <div class="pseo-row">\n' +
    '            <p class="pseo-label">' + esc(r.field) + ' &rarr; ' + esc(r.industryLabel) +
    ' <b class="proj-pct">' + r.y1GradsEmp.toLocaleString('en-US') + '</b>' +
    ' <span class="proj-jobs">&middot; ' +
    (r.y1GradsEmpInstate === null || r.y1GradsEmpInstate === undefined
      ? 'in-state not published' : r.y1GradsEmpInstate.toLocaleString('en-US') + ' in Michigan') +
    (r.y1MedianEarningsField ? ' &middot; field median, year 1: $' +
      r.y1MedianEarningsField.toLocaleString('en-US') : '') +
    '</span></p>\n' +
    '            <p class="pseo-bar"><span style="width:' +
    Math.max(1.5, 100 * r.y1GradsEmp / max).toFixed(1) + '%"></span></p>\n' +
    '          </div>').join('\n');
  const um = pseo.umichSpotlight;
  let spot = '';
  if (um && um.earnings) {
    const earnRow = y => {
      const e = um.earnings['y' + y] || {};
      if (e.p50 === null || e.p50 === undefined) return '';
      return '              <tr><td>' + y + (y === 1 ? ' year' : ' years') + '</td><td>$' +
        e.p25.toLocaleString('en-US') + '</td><td>$' + e.p50.toLocaleString('en-US') +
        '</td><td>$' + e.p75.toLocaleString('en-US') + '</td></tr>';
    };
    const retLine = y => {
      const r = (um.employment || {})['y' + y];
      if (!r || r.emp === null || r.emp === undefined) return '';
      return '          <p class="edu-row">Employed ' + y + (y === 1 ? ' year' : ' years') +
        ' out <b>' + r.emp.toLocaleString('en-US') + '</b>' +
        (r.instate !== null && r.instate !== undefined
          ? ' <span class="edu-vintage">&middot; ' + r.instate.toLocaleString('en-US') +
            ' in Michigan (' + r.sharePct.toFixed(1) + '%)</span>' : '') + '</p>';
    };
    const umFlows = (um.topIndustryFlows || []).map(f =>
      '          <p class="proj-row">' + esc(f.industryLabel) +
      ' <b class="proj-pct">' + f.y1GradsEmp.toLocaleString('en-US') + '</b>' +
      (f.y1GradsEmpInstate !== null && f.y1GradsEmpInstate !== undefined
        ? ' <span class="proj-jobs">&middot; ' + f.y1GradsEmpInstate.toLocaleString('en-US') +
          ' in Michigan</span>' : '') + '</p>').join('\n');
    spot = '          <div class="pseo-spot">\n' +
      '          <p class="board-sub">Institution spotlight &mdash; University of Michigan ' +
      '(bachelor&rsquo;s, all fields)</p>\n' +
      '          <div class="geo-tablewrap"><table class="geo-table">\n' +
      '            <caption>Median earnings by years since graduation (25th / 50th / 75th percentile)</caption>\n' +
      '            <thead><tr><th scope="col">Horizon</th><th scope="col">25th</th><th scope="col">Median</th><th scope="col">75th</th></tr></thead>\n' +
      '            <tbody>\n' + [1, 5, 10].map(earnRow).filter(Boolean).join('\n') + '\n            </tbody>\n          </table></div>\n' +
      [1, 5, 10].map(retLine).filter(Boolean).join('\n') + '\n' +
      (umFlows ? '          <p class="board-sub">Top industries at year 1</p>\n' + umFlows + '\n' : '') +
      '          <p class="board-note"><b>Coverage:</b> the University of Michigan is the only ' +
      'Michigan institution in PSEO &mdash; its graduates are about 10% of statewide graduates ' +
      '(2015 estimate, per the Census partner file). Institution-level outcomes exist for it ' +
      'alone; this is not a school-by-school Michigan pipeline, and no other Michigan school ' +
      'is ranked or implied here.</p>\n' +
      '          </div>';
  }
  return '          <div class="geo-block">\n' +
    '          <p class="board-sub">Graduate pipelines &mdash; field of study to industry, one year out</p>\n' +
    '          <p class="geo-caption">' + esc(pseo.statewideFlows.label || '') + '</p>\n' +
    bars + '\n' + spot + '\n' +
    '          <p class="board-note">Counts are graduates the Census Bureau matched to employment ' +
    'one year after graduation, pooled across the 2001&ndash;2021 cohorts in this release; the ' +
    'field median is the field&rsquo;s year-1 median earnings across all industries. Rows the ' +
    'source suppresses are excluded, never estimated.</p>\n' +
    '          </div>';
}

/* The geography subsection as a whole: one detail block whose
   inner blocks drop out individually (missing dataset → its
   map absent, the rest unaffected). The layer-switch script is
   progressive enhancement in the detail region's pattern: the
   markup renders every layer; the script activates the
   defaults and hides the rest. */
function geoSectionHtml(geo) {
  if (!geo) return '';
  const blocks = [
    geoLausBlock(geo), geoQcewBlock(geo), geoIpedsBlock(geo), geoPseoBlock(geo),
  ].filter(Boolean);
  if (!blocks.length) return '';
  const inner = (geo.paths ? geoDefsSvg(geo.paths) + '\n' : '') +
    '          <p class="geo-intro">Four views of the same question &mdash; where Michigan&rsquo;s ' +
    'talent is, and where it goes. Shading and dot size are the picture; the table or list beside ' +
    'each map is the record.</p>\n' +
    blocks.join('\n') + '\n' +
    '          <script src="/signals-geo.v1.js"></script>';
  return '          <div class="detail-block geo" id="geo-section">\n' +
    '          <p class="board-kicker">TALENT GEOGRAPHY &mdash; MICHIGAN</p>\n' +
    inner + '\n          </div>';
}

/* Spec 014: the sources-note sentences for the geography
   datasets, composed from the committed metadata and naming
   only the datasets that rendered. Appended to the template's
   sources paragraph ({{GEO_NOTE}}); existing sentences are
   never edited. */
function geoNote(geo) {
  if (!geo) return '';
  const parts = [];
  if (geo.laus && geo.paths) {
    parts.push('county unemployment from the BLS Local Area Unemployment Statistics (' +
      monthLong(geo.laus.referenceMonth) + (geo.laus.preliminary ? ', preliminary' : '') + ')');
  }
  if (geo.qcew && geo.paths) {
    parts.push('county employment by industry from the BLS Quarterly Census of Employment and ' +
      'Wages (2024 annual averages; industry rows are private ownership &mdash; the grain at ' +
      'which QCEW publishes them &mdash; and suppressed cells are shown as not disclosed, never as zero)');
  }
  if (geo.ipeds) {
    parts.push('institutions and completions from the National Center for Education Statistics&rsquo; ' +
      'IPEDS (2024 survey cycle; completions are 2023&ndash;24 awards)');
  }
  if (geo.pseo) {
    parts.push('graduate outcomes from the U.S. Census Bureau&rsquo;s Post-Secondary Employment ' +
      'Outcomes (release R2026Q2, cohorts 2001&ndash;2021) &mdash; the University of Michigan is ' +
      'Michigan&rsquo;s only PSEO partner institution, so institution-level outcomes are shown ' +
      'for it alone, beside the Census state aggregates');
  }
  if (!parts.length) return '';
  return ' Geography: ' + parts.join('; ') + '.';
}

/* FR-004 disclosure: the markup renders EXPANDED (truthful
   aria state, content in the DOM, readable with scripts
   unavailable); the small script emitted with the region
   collapses it on load when JavaScript is present, then
   toggles. No persisted state, no requests — expanding and
   collapsing is the only client behavior. The subtitle is
   composed from the blocks actually present, so it never
   names an absent dataset. */
function detailHtml(pulse, outlook, posts, geo) {
  const bPulse = detailPulseTable(pulse);
  const bBls = detailBls(outlook);
  const bMi = detailMichigan(outlook);
  const bEdu = detailEducation(outlook);
  const bGeo = geoSectionHtml(geo);
  const bGo = detailGoDeeper(posts, outlook);
  const blocks = [bPulse, bBls, bMi, bEdu, bGeo, bGo].filter(Boolean);
  if (!blocks.length) return '';
  const subParts = [];
  if (bPulse) {
    const n = Math.max(0, ...(pulse.tiles || []).map(t => (t.trend || []).length));
    subParts.push(n + ' months of Pulse values');
  }
  if (bBls) subParts.push('the full projection tables');
  if (bMi) subParts.push('Michigan occupations');
  if (bEdu) subParts.push('education-to-career figures');
  if (bGeo) subParts.push('talent geography');
  const sub = subParts.length
    ? ' <span class="detail-sub" id="detail-sub" hidden>&middot; the complete tables ' +
      'behind the boards &mdash; ' + subParts.join(', ') + '</span>'
    : '';
  return '        <div class="detail">\n' +
    '          <div class="detail-head">\n' +
    '            <p class="detail-title-wrap"><span class="detail-title">The full picture</span>' +
    sub + '</p>\n' +
    '            <button type="button" class="detail-toggle" id="detail-toggle" ' +
    'aria-expanded="true" aria-controls="detail-region">Hide details &minus;</button>\n' +
    '          </div>\n' +
    '          <div class="detail-body" id="detail-region">\n' + blocks.join('\n') + '\n          </div>\n' +
    '        </div>\n' +
    '        <script src="/signals-detail.v1.js"></script>';
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

  // Spec 011: Trends & outlook section between the Pulse band and
  // the lanes. The section head attaches to the first in-section
  // element that renders; absent elements render nothing (FR-005e).
  // Amendment 2: the tape (part 0) renders at the top of the page,
  // outside the section — it never carries the section head.
  const outlook = loadOutlook();
  const geo = loadGeo();
  const trendsParts = [
    tickerHtml(snap.pulse),
    trendBoardHtml(snap.pulse),
    outlookHtml(outlook),
    educationHtml(outlook),
  ];
  for (let i = 1; i < trendsParts.length; i++) {
    if (trendsParts[i]) {
      trendsParts[i] = trendsHeadHtml() + '\n' + trendsParts[i];
      break;
    }
  }

  // /signals/ page
  const tpl = readFileSync(path.join(ROOT, 'scripts', 'templates', 'signals.html'), 'utf8');
  mkdirSync(path.join(ROOT, 'signals'), { recursive: true });
  writeFileSync(path.join(ROOT, 'signals', 'index.html'), fill(tpl, {
    '{{HIGHLIGHTS_HTML}}': highlightsHtml(snap.pulse, outlook),
    '{{PULSE_HTML}}': pulseTilesHtml(snap.pulse),
    '{{TICKER_HTML}}': trendsParts[0],
    '{{TREND_BOARD_HTML}}': trendsParts[1],
    '{{OUTLOOK_HTML}}': trendsParts[2],
    '{{EDUCATION_HTML}}': trendsParts[3],
    '{{DETAIL_HTML}}': detailHtml(snap.pulse, outlook, posts, geo),
    '{{LANES_HTML}}': lanesHtml,
    '{{GEO_NOTE}}': geoNote(geo),
    '{{UPDATED_LINE}}': updatedLine,
    '{{NEWSLETTER_HTML}}': newsletterBlock('signals'),
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

/* ================= Newsletter (spec 020) =================
   The Axiovex Signal: issue sources committed under
   newsletter/issues/<yyyy-mm-dd>.json render the archive index
   (WF-15) and each issue's web edition (WF-16) here; the email
   HTML + plain-text parts render from the same sources via
   scripts/newsletter/render.mjs (FR-006 — one source, three
   versions, claim C-020-3). The WF-G8 signup block is rendered
   by newsletterBlock() and placed on /signals/ (fill above),
   the archive, and every issue page. */
function newsletterBlock(variant) {
  const issue = variant === 'issue';
  const eyebrow = issue ? 'READING SOMEONE ELSE\u2019S COPY?' : 'THE AXIOVEX SIGNAL \u2014 WEEKLY';
  const heading = issue ? 'Get your own, Wednesdays.' : 'The week, in your inbox.';
  const lede = issue
    ? 'The same edition, in your own inbox \u2014 Wednesdays at 10:00 AM ET, with the numbers, their vintages, and why they matter.'
    : 'What changed in Michigan industry and the field \u2192 one email, Wednesdays at 10:00 AM ET, with the numbers, their vintages, and why they matter.';
  return '<div class="nl-block" id="newsletter">\n' +
    '          <p class="eyebrow">' + eyebrow + '</p>\n' +
    '          <h2 class="nl-heading">' + heading + '</h2>\n' +
    '          <p class="nl-lede">' + lede + '</p>\n' +
    '          <form class="nl-form" method="post" action="/api/newsletter/subscribe">\n' +
    '            <label class="visually-hidden" for="nl-email">Email address</label>\n' +
    '            <input id="nl-email" name="email" type="email" placeholder="you@example.com" autocomplete="email" required>\n' +
    '            <button class="btn btn-primary" type="submit">Subscribe \u2192</button>\n' +
    '            <div id="nl-turnstile" class="turnstile-box"></div>\n' +
    '            <p class="field-error" data-error-for="email" hidden></p>\n' +
    '            <p class="field-error" data-error-for="turnstile" hidden></p>\n' +
    '            <div class="honeypot" aria-hidden="true"><label>Website<input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>\n' +
    '            <input name="startedAt" type="hidden" value="0">\n' +
    '            <input name="source" type="hidden" value="' + escAttr(variant) + '">\n' +
    '          </form>\n' +
    '          <p class="nl-summary" role="status" hidden></p>\n' +
    '          <div class="nl-done" hidden>\n' +
    '            <h2 class="nl-heading">Check your inbox.</h2>\n' +
    '            <p class="nl-lede">We sent a confirmation email to the address you gave us. Click the link in it \u2014 good for 48 hours \u2014 and the first edition arrives Wednesday at 10:00 AM ET. No click, no emails: that\u2019s the deal.</p>\n' +
    '          </div>\n' +
    '          <p class="nl-fine">One email a week. We send a confirmation first \u2014 nothing arrives until you click it. Unsubscribe in one click, any time. <strong>No tracking pixels, no per-reader analytics.</strong> <a href="/privacy/">Privacy policy</a></p>\n' +
    '        </div>';
}

function issueBodyHtml(issue) {
  const parts = [];
  if (issue.whatChanged && issue.whatChanged.length) {
    parts.push('<h2 class="nl-sec">What changed</h2>');
    for (const group of issue.whatChanged) {
      parts.push('<h3 class="nl-lane">' + esc(group.lane) + '</h3>\n<ul class="nl-items">\n' +
        group.items.map(i =>
          '<li><a href="' + escAttr(i.url) + '" target="_blank" rel="noopener">' + esc(i.title) + '</a> ' +
          '<span class="nl-meta">\u00b7 ' + esc(i.source) + ' \u00b7 ' + esc(fmtDate(i.date)) + '</span></li>').join('\n') +
        '\n</ul>');
    }
  }
  if (issue.pulse && issue.pulse.length) {
    parts.push('<h2 class="nl-sec">Michigan Pulse</h2>\n<ul class="nl-pulse">\n' +
      issue.pulse.map(f =>
        '<li><span class="nl-pulse-label">' + esc(f.label) + '</span> <strong>' + esc(f.display) + '</strong>' +
        (f.delta ? ' <span class="nl-meta">' + esc(f.delta) + '</span>' : '') +
        ' <span class="nl-meta">\u00b7 ' + esc(f.vintage) + '</span></li>').join('\n') +
      '\n</ul>' +
      (issue.pulseSource ? '\n<p class="nl-meta">Source: ' + esc(issue.pulseSource) + '.</p>' : ''));
  }
  if (issue.insights && issue.insights.length) {
    parts.push('<h2 class="nl-sec">Why it matters</h2>\n' +
      issue.insights.map(t => '<p>' + esc(t.text) + '</p>').join('\n'));
  }
  if (issue.article) {
    parts.push('<h2 class="nl-sec">From the blog</h2>\n<p><a href="' + escAttr(issue.article.url) + '">' +
      esc(issue.article.title) + '</a> <span class="nl-meta">\u00b7 ' + esc(fmtDate(issue.article.date)) + '</span></p>');
  }
  if (issue.watchlist && issue.watchlist.length) {
    parts.push('<h2 class="nl-sec">Watchlist</h2>\n<ul class="nl-items">\n' +
      issue.watchlist.map(w => '<li>' + esc(w.label) + ' \u2014 <strong>' + esc(fmtDate(w.date)) + '</strong></li>').join('\n') +
      '\n</ul>');
  }
  parts.push('<p class="nl-colophon">Assembled from the committed Signals snapshot and the Michigan data pack, with vintages as labeled \u00b7 <a href="/newsletter/">All editions</a> \u00b7 <a href="/privacy/">Privacy policy</a></p>');
  // FR-018: the web edition carries the same postal line as the
  // email footer (issue.footerAddress; staging placeholder only
  // when the issue source has none designated).
  parts.push('<p class="nl-colophon">Axiovex Systems, LLC \u00b7 ' + esc(issue.footerAddress || '[Postal address pending \u2014 owner decision, spec 020 FR-018]') + '</p>');
  return parts.join('\n');
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function fmtDateLong(iso) {
  const d = new Date((iso || '') + 'T12:00:00Z');
  if (Number.isNaN(d.getTime())) return fmtDate(iso);
  return WEEKDAYS[d.getUTCDay()] + ', ' + fmtDate(iso);
}

function buildNewsletter() {
  const dir = path.join(ROOT, 'newsletter', 'issues');
  const issues = existsSync(dir)
    ? readdirSync(dir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
        .map(f => JSON.parse(readFileSync(path.join(dir, f), 'utf8')))
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    : [];
  const indexTpl = readFileSync(path.join(ROOT, 'scripts', 'templates', 'newsletter-index.html'), 'utf8');
  const issueTpl = readFileSync(path.join(ROOT, 'scripts', 'templates', 'newsletter-issue.html'), 'utf8');
  const rows = issues.length
    ? issues.map(issue =>
        '<article class="card nl-card">\n' +
        '              <p class="nl-card-date">' + esc(fmtDateLong(issue.date)).toUpperCase() + '</p>\n' +
        '              <h3><a href="/newsletter/' + issue.date + '/">' + esc(issue.lede) + '</a></h3>\n' +
        '              <p class="nl-card-sections">What changed \u00b7 Michigan Pulse \u00b7 Why it matters \u00b7 Watchlist</p>\n' +
        '              <a class="explore" href="/newsletter/' + issue.date + '/">READ THE WEB EDITION \u2192</a>\n' +
        '            </article>').join('\n            ')
    : '<p class="nl-empty">No editions yet. The first goes out Wednesday at 10:00 AM ET.</p>';
  mkdirSync(path.join(ROOT, 'newsletter'), { recursive: true });
  writeFileSync(path.join(ROOT, 'newsletter', 'index.html'), fill(indexTpl, {
    '{{ISSUE_ROWS}}': rows,
    '{{NEWSLETTER_HTML}}': newsletterBlock('archive'),
  }));
  for (const issue of issues) {
    const outDir = path.join(ROOT, 'newsletter', issue.date);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(path.join(outDir, 'index.html'), fill(issueTpl, {
      '{{TITLE}}': issue.lede,
      '{{TITLE_JSON}}': JSON.stringify(issue.lede),
      '{{DESCRIPTION}}': 'The Axiovex Signal, ' + fmtDate(issue.date) + ': ' + issue.lede,
      '{{DESCRIPTION_JSON}}': JSON.stringify('The Axiovex Signal, ' + fmtDate(issue.date) + ': ' + issue.lede),
      '{{CANONICAL}}': SITE + '/newsletter/' + issue.date + '/',
      '{{DATE_ISO}}': issue.date,
      '{{DATE_LONG}}': fmtDate(issue.date),
      '{{EYEBROW}}': 'THE AXIOVEX SIGNAL \u00b7 ' + fmtDateLong(issue.date).toUpperCase(),
      '{{BODY_HTML}}': issueBodyHtml(issue),
      '{{NEWSLETTER_HTML}}': newsletterBlock('issue'),
    }));
  }
  console.log('newsletter: archive + ' + issues.length + ' issue page(s)');
  return issues;
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
function writeSitemap(posts, docsInfo, signalsInfo, newsletterIssues) {
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
    e(SITE + '/disclaimer/', gitDate(ROOT, 'disclaimer/index.html'), 'yearly', '0.5'),
    e(SITE + '/newsletter/', newsletterIssues && newsletterIssues.length ? newsletterIssues[0].date : null, 'weekly', '0.7'),
    ...(newsletterIssues || []).map(i => e(SITE + '/newsletter/' + i.date + '/', i.date, 'monthly', '0.6')),
  ];
  writeFileSync(path.join(ROOT, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('\n') + '\n</urlset>\n');
  console.log('sitemap: ' + urls.length + ' urls');
}

/* ================= Breaking news banner (spec 012) =================
   The build's LAST pass. Reads data/breaking.json — a single
   curated `active` entry or null — and rewrites the BREAKING
   marker region placed immediately after <body id="top"> in the
   three shells and four templates, in every served page: the
   shells in place and the generated outputs (blog index, every
   article, documents, signals). The blog redirect shim
   (blog/post.html) is the one named exclusion (FR-004) — it
   carries no chrome to banner.

   This is the one wall-clock-dependent step in an otherwise
   deterministic build: an entry renders only while
   publishedUtc <= build time < expiresUtc (FR-006). With no
   active entry the region collapses to the empty marker pair —
   zero layout trace, no script (FR-004).

   Validation fails closed (FR-001): a malformed file, an invalid
   entry, or an expiry more than 72h after publication renders NO
   banner and logs a warning naming the defect. Missing markers
   in an output file warn too (the SIGNALS pattern) — a page
   that lost its markers in an edit is found by the build, not
   by a visitor. */
const BREAKING_MAX_MS = 72 * 60 * 60 * 1000;

function breakingEntry() {
  const p = path.join(ROOT, 'data', 'breaking.json');
  if (!existsSync(p)) {
    console.warn('breaking: data/breaking.json not found — banner inactive');
    return null;
  }
  let data;
  try { data = JSON.parse(readFileSync(p, 'utf8')); }
  catch (e) {
    console.warn('breaking: data/breaking.json is not valid JSON (' + e.message + ') — banner inactive');
    return null;
  }
  const entry = data ? data.active : null;
  if (!entry) return null;
  const bad = why => {
    console.warn('breaking: entry invalid — ' + why + ' — banner inactive');
    return null;
  };
  for (const f of ['id', 'headline', 'sourceName', 'url', 'publishedUtc', 'expiresUtc', 'addedBy', 'reason']) {
    if (typeof entry[f] !== 'string' || !entry[f].trim()) {
      return bad('missing or empty field "' + f + '"');
    }
  }
  if (!entry.url.startsWith('https://')) return bad('url is not https');
  const pub = Date.parse(entry.publishedUtc);
  const exp = Date.parse(entry.expiresUtc);
  if (Number.isNaN(pub)) return bad('publishedUtc is not a valid timestamp');
  if (Number.isNaN(exp)) return bad('expiresUtc is not a valid timestamp');
  if (exp <= pub) return bad('expiresUtc is not after publishedUtc');
  if (exp - pub > BREAKING_MAX_MS) return bad('expiresUtc is more than 72 hours after publishedUtc');
  const now = Date.now();
  if (now < pub) {
    console.log('breaking: entry "' + entry.id + '" is not yet published — banner inactive');
    return null;
  }
  if (now >= exp) {
    console.log('breaking: entry "' + entry.id + '" has expired — banner inactive');
    return null;
  }
  return entry;
}

function breakingHtml(entry) {
  return '<div class="breaking-banner" role="region" aria-label="Breaking news">\n' +
    '    <a class="breaking-link" href="' + escAttr(entry.url) + '" target="_blank" rel="noopener">' +
    '<span class="breaking-lead">BREAKING</span> ' +
    '<span class="breaking-headline">' + esc(entry.headline) + '</span> ' +
    '<span class="breaking-meta">&middot; ' + esc(entry.sourceName) + ' &middot; ' +
    esc(fmtUpdated(entry.publishedUtc)) + '</span></a>\n' +
    '    <button class="breaking-dismiss" type="button" aria-label="Dismiss breaking news banner" ' +
    'data-breaking-dismiss="' + escAttr(entry.id) + '">&#10005;</button>\n' +
    '  </div>\n' +
    '  <script src="/breaking.v1.js" defer></script>';
}

function buildBreaking() {
  const entry = breakingEntry();
  const inner = entry ? '\n  ' + breakingHtml(entry) + '\n  ' : '';
  const outputs = [
    'index.html',
    path.join('contact', 'index.html'),
    path.join('privacy', 'index.html'),
    path.join('blog', 'index.html'),
    path.join('documents', 'index.html'),
    path.join('signals', 'index.html'),
  ];
  const blogDir = path.join(ROOT, 'blog');
  for (const name of readdirSync(blogDir, { withFileTypes: true })) {
    if (!name.isDirectory()) continue;
    const rel = path.join('blog', name.name, 'index.html');
    if (existsSync(path.join(ROOT, rel))) outputs.push(rel);
  }
  const nlDir = path.join(ROOT, 'newsletter');
  if (existsSync(path.join(nlDir, 'index.html'))) outputs.push(path.join('newsletter', 'index.html'));
  if (existsSync(nlDir)) {
    for (const name of readdirSync(nlDir, { withFileTypes: true })) {
      if (!name.isDirectory() || !/^\d{4}-\d{2}-\d{2}$/.test(name.name)) continue;
      const rel = path.join('newsletter', name.name, 'index.html');
      if (existsSync(path.join(ROOT, rel))) outputs.push(rel);
    }
  }
  const re = /(<!-- BREAKING:START -->)[\s\S]*?(<!-- BREAKING:END -->)/;
  let rewritten = 0;
  for (const rel of outputs) {
    const file = path.join(ROOT, rel);
    if (!existsSync(file)) {
      console.warn('breaking: expected output ' + rel + ' missing — banner skipped for it');
      continue;
    }
    const html = readFileSync(file, 'utf8');
    if (!re.test(html)) {
      console.warn('breaking: BREAKING markers not found in ' + rel + ' — banner skipped for that page');
      continue;
    }
    // Replacer function, not a '$1...' string — the banner HTML can
    // contain literal '$' amounts from a headline (the SIGNALS gotcha).
    const out = html.replace(re, (m, g1, g2) => g1 + inner + g2);
    if (out !== html) writeFileSync(file, out);
    rewritten++;
  }
  console.log('breaking: ' + (entry ? 'active banner "' + entry.id + '"' : 'no active entry') +
    ' — marker region rewritten in ' + rewritten + ' page(s)');
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
const newsletterIssues = buildNewsletter();
writeSitemap(posts, docsInfo, signalsInfo, newsletterIssues);
buildBreaking();
