/* Axiovex Systems blog engine — zero-dependency markdown rendering, search, share.
   Posts live as markdown files under blog/posts/; metadata lives in blog/posts.json. */
(function () {
  'use strict';

  /* ---------- HTML escaping ---------- */
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------- Inline markdown: code, bold, italic, images, links ---------- */
  function inlineMd(s) {
    s = esc(s);
    // inline code first (protect contents from further formatting)
    var codes = [];
    s = s.replace(/`([^`]+)`/g, function (m, c) {
      codes.push(c);
      return '\u0000' + (codes.length - 1) + '\u0000';
    });
    // images
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, '<img src="$2" alt="$1" loading="lazy">');
    // links
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // bold + italic
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>');
    // restore code spans
    s = s.replace(/\u0000(\d+)\u0000/g, function (m, i) {
      return '<code>' + codes[+i] + '</code>';
    });
    return s;
  }

  /* ---------- Block markdown ---------- */
  function renderMarkdown(md) {
    var lines = md.replace(/\r\n?/g, '\n').split('\n');
    var html = [];
    var i = 0, n = lines.length;

    function isListItem(line) {
      return /^\s*([-*+]|\d+\.)\s+/.test(line);
    }

    while (i < n) {
      var line = lines[i];

      // fenced code block
      var fence = line.match(/^```(\w*)\s*$/);
      if (fence) {
        var lang = fence[1] ? ' class="language-' + esc(fence[1]) + '"' : '';
        var buf = [];
        i++;
        while (i < n && !/^```\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++; // skip closing fence
        html.push('<pre><code' + lang + '>' + esc(buf.join('\n')) + '</code></pre>');
        continue;
      }

      // ATX heading
      var h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h) {
        var level = h[1].length;
        html.push('<h' + level + '>' + inlineMd(h[2].trim()) + '</h' + level + '>');
        i++;
        continue;
      }

      // horizontal rule
      if (/^(\*\*\*|---|___)\s*$/.test(line)) {
        html.push('<hr>');
        i++;
        continue;
      }

      // blockquote (consecutive > lines form one quote)
      if (/^\s*>/.test(line)) {
        var q = [];
        while (i < n && /^\s*>/.test(lines[i])) {
          q.push(lines[i].replace(/^\s*>\s?/, ''));
          i++;
        }
        html.push('<blockquote>' + renderMarkdown(q.join('\n')) + '</blockquote>');
        continue;
      }

      // pipe table
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

      // lists (one level of nesting via 2-space indent)
      if (isListItem(line)) {
        var items = [];
        while (i < n && (isListItem(lines[i]) || /^\s{2,}\S/.test(lines[i]))) {
          items.push(lines[i]);
          i++;
        }
        html.push(renderList(items));
        continue;
      }

      // blank line
      if (/^\s*$/.test(line)) { i++; continue; }

      // paragraph (join wrapped lines)
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
      // gather nested items (deeper indent)
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

  /* ---------- Manifest + search (blog index) ---------- */
  function loadPosts() {
    return fetch('posts.json', { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('posts.json HTTP ' + r.status);
      return r.json();
    });
  }

  function fmtDate(iso) {
    var d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function postCard(p) {
    var tags = (p.tags || []).map(function (t) {
      return '<button class="tag-pill" data-tag="' + esc(t) + '">' + esc(t) + '</button>';
    }).join('');
    return '<article class="post-card" data-search="' +
      esc((p.title + ' ' + p.description + ' ' + (p.tags || []).join(' ')).toLowerCase()) + '">' +
      '<p class="post-date">' + esc(fmtDate(p.date)) + '</p>' +
      '<h2><a href="post?p=' + encodeURIComponent(p.slug) + '">' + esc(p.title) + '</a></h2>' +
      '<p class="post-desc">' + esc(p.description) + '</p>' +
      (tags ? '<div class="post-tags">' + tags + '</div>' : '') +
      '<a class="read-more" href="post?p=' + encodeURIComponent(p.slug) + '">Read article &rarr;</a>' +
      '</article>';
  }

  function initIndex() {
    var list = document.getElementById('post-list');
    var search = document.getElementById('blog-search');
    var count = document.getElementById('post-count');
    var empty = document.getElementById('no-results');
    if (!list) return;
    loadPosts().then(function (posts) {
      list.innerHTML = posts.map(postCard).join('');
      count.textContent = posts.length + (posts.length === 1 ? ' article' : ' articles');

      function applyFilter() {
        var q = search.value.trim().toLowerCase();
        var visible = 0;
        Array.prototype.forEach.call(list.children, function (card) {
          var hit = !q || card.getAttribute('data-search').indexOf(q) !== -1;
          card.style.display = hit ? '' : 'none';
          if (hit) visible++;
        });
        empty.style.display = visible ? 'none' : '';
        count.textContent = visible + (visible === 1 ? ' article' : ' articles') + (q ? ' matching \u201c' + search.value.trim() + '\u201d' : '');
      }
      search.addEventListener('input', applyFilter);
      list.addEventListener('click', function (e) {
        var pill = e.target.closest('.tag-pill');
        if (pill) { search.value = pill.getAttribute('data-tag'); applyFilter(); search.focus(); }
      });
    }).catch(function () {
      list.innerHTML = '<p class="post-desc">Could not load articles. Please try again later.</p>';
    });
  }

  /* ---------- Single post rendering + share ---------- */
  function pageUrl() {
    return 'https://axiovexsystems.com/blog/post?p=' + encodeURIComponent(currentSlug());
  }

  function currentSlug() {
    var m = /[?&]p=([^&]+)/.exec(location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function shareLinks(title, url) {
    var t = encodeURIComponent(title), u = encodeURIComponent(url);
    return [
      { name: 'X', href: 'https://twitter.com/intent/tweet?text=' + t + '&url=' + u, icon: 'x' },
      { name: 'Facebook', href: 'https://www.facebook.com/sharer/sharer.php?u=' + u, icon: 'facebook' },
      { name: 'LinkedIn', href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + u, icon: 'linkedin' },
      { name: 'Email', href: 'mailto:?subject=' + t + '&body=' + encodeURIComponent('Thought you might find this interesting:\n\n') + u, icon: 'email' },
      { name: 'Text message', href: 'sms:?&body=' + t + '%20' + u, icon: 'sms' }
    ];
  }

  var ICONS = {
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    email: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 4h20a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm10.5 8.1L3.5 6.2v11.3h17V6.2l-8.5 5.9a.6.6 0 0 1-.5 0z"/></svg>',
    sms: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8l-4 4V4a2 2 0 0 1 2-2zm2 5v2h12V7H6zm0 4v2h8v-2H6z"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.6 13.4a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7l-1.5 1.5 1.4 1.4 1.5-1.5a2 2 0 1 1 2.9 2.9l-3 3a2 2 0 0 1-2.9 0l-1.4 1.4zM13.4 10.6a4 4 0 0 0-5.7 0l-3 3a4 4 0 1 0 5.7 5.7l1.5-1.5-1.4-1.4-1.5 1.5a2 2 0 1 1-2.9-2.9l3-3a2 2 0 0 1 2.9 0l1.4-1.4z"/></svg>'
  };

  function renderShareRow(title, url, compact) {
    var links = shareLinks(title, url).map(function (s) {
      return '<a class="share-btn" href="' + s.href + '" target="_blank" rel="noopener" aria-label="Share on ' + s.name + '" title="Share on ' + s.name + '">' +
        ICONS[s.icon] + '<span>' + s.name + '</span></a>';
    }).join('');
    var copyBtn = '<button class="share-btn share-copy" type="button" aria-label="Copy link" title="Copy link">' +
      ICONS.link + '<span>Copy link</span></button>';
    var nativeBtn = (navigator.share && !compact)
      ? '<button class="share-btn share-native" type="button" aria-label="More share options" title="More share options">' +
        ICONS.sms + '<span>More&hellip;</span></button>'
      : '';
    return '<div class="share-row" role="group" aria-label="Share this article">' + links + copyBtn + nativeBtn + '</div>';
  }

  function wireShare(root, title, url) {
    var copy = root.querySelector('.share-copy');
    if (copy) copy.addEventListener('click', function () {
      function done() { copy.classList.add('copied'); copy.querySelector('span').textContent = 'Copied!'; setTimeout(function () { copy.classList.remove('copied'); copy.querySelector('span').textContent = 'Copy link'; }, 2000); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { fallback(); });
      } else fallback();
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = url; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { /* noop */ }
        document.body.removeChild(ta);
      }
    });
    var native = root.querySelector('.share-native');
    if (native) native.addEventListener('click', function () {
      navigator.share({ title: title, text: title, url: url }).catch(function () { /* dismissed */ });
    });
  }

  function initPost() {
    var article = document.getElementById('post-article');
    if (!article) return;
    var slug = currentSlug();
    loadPosts().then(function (posts) {
      var post = null;
      for (var k = 0; k < posts.length; k++) if (posts[k].slug === slug) { post = posts[k]; break; }
      if (!post) {
        article.innerHTML = '<h1>Article not found</h1><p>We couldn\u2019t find that article. <a href="./">Back to all articles</a>.</p>';
        return;
      }
      return fetch(post.file, { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('post HTTP ' + r.status);
        return r.text();
      }).then(function (md) {
        var url = pageUrl();
        document.title = post.title + ' | Axiovex Systems Blog';
        setMeta('description', post.description);
        setMeta('og:title', post.title + ' | Axiovex Systems');
        setMeta('og:description', post.description);
        setMeta('og:url', url);
        setMeta('twitter:title', post.title + ' | Axiovex Systems');
        setMeta('twitter:description', post.description);
        var canon = document.querySelector('link[rel="canonical"]');
        if (!canon) {
          canon = document.createElement('link');
          canon.setAttribute('rel', 'canonical');
          document.head.appendChild(canon);
        }
        canon.setAttribute('href', url);
        injectBlogPosting(post, url);

        var tags = (post.tags || []).map(function (t) {
          return '<a class="tag-pill" href="./?q=' + encodeURIComponent(t) + '">' + esc(t) + '</a>';
        }).join('');

        article.innerHTML =
          '<p class="post-date">' + esc(fmtDate(post.date)) + '</p>' +
          '<h1>' + esc(post.title) + '</h1>' +
          (tags ? '<div class="post-tags">' + tags + '</div>' : '') +
          renderShareRow(post.title, url, false) +
          '<div class="post-body">' + renderMarkdown(md) + '</div>' +
          '<div class="post-footer"><p>Share this article</p>' + renderShareRow(post.title, url, true) + '</div>' +
          '<p class="back-link"><a href="./">&larr; All articles</a></p>';

        Array.prototype.forEach.call(article.querySelectorAll('.share-row'), function (row) {
          wireShare(row, post.title, url);
        });
      });
    }).catch(function () {
      article.innerHTML = '<h1>Could not load article</h1><p>Please try again later. <a href="./">Back to all articles</a>.</p>';
    });
  }

  function setMeta(name, content) {
    var sel = name.indexOf('og:') === 0 || name.indexOf('twitter:') === 0
      ? 'meta[property="' + name + '"]' : 'meta[name="' + name + '"]';
    var el = document.querySelector(sel);
    if (el) el.setAttribute('content', content);
  }

  function injectBlogPosting(post, url) {
    var data = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      url: url,
      inLanguage: 'en-US',
      author: { '@type': 'Organization', name: 'Axiovex Systems', url: 'https://axiovexsystems.com/' },
      publisher: { '@type': 'Organization', name: 'Axiovex Systems', url: 'https://axiovexsystems.com/' }
    };
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  // blog index: support ?q= prefill from tag pills on post pages
  function prefillSearch() {
    var search = document.getElementById('blog-search');
    if (!search) return;
    var m = /[?&]q=([^&]+)/.exec(location.search);
    if (m) { search.value = decodeURIComponent(m[1]); search.dispatchEvent(new Event('input')); }
  }

  // expose renderer for testing
  window.AxiovexBlog = { renderMarkdown: renderMarkdown, inlineMd: inlineMd };

  document.addEventListener('DOMContentLoaded', function () {
    initIndex();
    initPost();
    // prefill runs after index render; poll briefly
    var tries = 0;
    var t = setInterval(function () {
      var search = document.getElementById('blog-search');
      if ((search && document.getElementById('post-list').children.length) || ++tries > 40) {
        clearInterval(t);
        prefillSearch();
      }
    }, 100);
  });
})();
