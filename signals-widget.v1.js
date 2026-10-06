/* Axiovex Signals floating widget (spec 008, WF-G6 / WF-12).
   Fetches the build-generated, first-party /signals-widget.json and
   renders a collapsible bottom-right pill + panel. If the data
   fails to load or is empty, the widget renders nothing at all —
   every page is complete without it. All feed text is inserted via
   textContent (headlines are third-party text; never innerHTML). */
(function () {
  'use strict';
  var mount = document.getElementById('signals-widget');
  if (!mount) return;
  mount.classList.add('sw-root');

  var STORE_KEY = 'axiovex-signals-open';
  var PANEL_ID = 'signals-widget-panel';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  function removeWidget() {
    if (mount.parentNode) mount.parentNode.removeChild(mount);
  }

  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    if (!m) return String(iso || '');
    return MONTHS[Number(m[2]) - 1] + ' ' + Number(m[3]) + ', ' + m[1];
  }
  function shortPeriod(period) {
    var m = /^([A-Za-z]+)\s+(.*)$/.exec(String(period || ''));
    if (!m) return String(period || '');
    var idx = MONTHS_LONG.indexOf(m[1]);
    return (idx >= 0 ? MONTHS[idx] : m[1]) + ' ' + m[2];
  }
  function fmtUpdated(iso) {
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      }).formatToParts(new Date(iso)).reduce(function (o, p) { o[p.type] = p.value; return o; }, {});
      return parts.month + ' ' + parts.day + ', ' + parts.year + ' at ' +
        parts.hour + ':' + parts.minute + ' ' + parts.dayPeriod + ' ET';
    } catch (e) { return ''; }
  }

  /* FR-006: on article pages, headlines from the lane matching the
     article's tags surface first; the rest fill by freshness. */
  var TAG_TO_LANE = {
    michigan: 'michigan', workforce: 'michigan',
    ai: 'ai-standards',
    cybersecurity: 'ot-security', security: 'ot-security',
    manufacturing: 'manufacturing',
    funding: 'funding-policy', policy: 'funding-policy',
  };
  function orderedHeadlines(items) {
    var tags = (mount.getAttribute('data-tags') || '')
      .split(',').map(function (t) { return t.trim().toLowerCase(); }).filter(Boolean);
    var boost = [];
    tags.forEach(function (t) {
      var lane = TAG_TO_LANE[t];
      if (lane && boost.indexOf(lane) === -1) boost.push(lane);
    });
    var sorted = items.slice().sort(function (a, b) {
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });
    if (!boost.length) return sorted;
    return sorted.sort(function (a, b) {
      var ra = boost.indexOf(a.lane); if (ra === -1) ra = 99;
      var rb = boost.indexOf(b.lane); if (rb === -1) rb = 99;
      if (ra !== rb) return ra - rb;
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function render(data) {
    var pulse = Array.isArray(data.pulse) ? data.pulse.filter(function (s) { return s && s.value; }) : [];
    var headlines = orderedHeadlines(Array.isArray(data.headlines) ? data.headlines : []).slice(0, 3);
    if (!pulse.length && !headlines.length) { removeWidget(); return; }

    /* ----- expanded panel ----- */
    var panel = el('div', 'sw-panel');
    panel.id = PANEL_ID;
    panel.hidden = true;

    var head = el('div', 'sw-head');
    var title = el('span', 'sw-title');
    title.appendChild(el('span', 'sw-live-dot'));
    title.appendChild(document.createTextNode('Axiovex Signals'));
    var collapseBtn = el('button', 'sw-collapse', '▾ collapse');
    collapseBtn.type = 'button';
    collapseBtn.setAttribute('aria-expanded', 'true');
    collapseBtn.setAttribute('aria-controls', PANEL_ID);
    head.appendChild(title);
    head.appendChild(collapseBtn);
    panel.appendChild(head);

    if (pulse.length) {
      var kickerText = 'Michigan Pulse';
      if (data.pulsePeriod) kickerText += ' · ' + shortPeriod(data.pulsePeriod);
      if (data.pulseSource) kickerText += ' · ' + data.pulseSource;
      panel.appendChild(el('p', 'sw-kicker', kickerText));
      var grid = el('div', 'sw-pulse');
      pulse.forEach(function (s) {
        var p = el('p', null, s.label);
        p.appendChild(el('b', null, s.value));
        grid.appendChild(p);
      });
      panel.appendChild(grid);
    }

    headlines.forEach(function (h) {
      var item = el('div', 'sw-item');
      item.setAttribute('data-lane', h.lane || '');
      item.appendChild(el('p', 'sw-lane', h.laneLabel || ''));
      var hl = el('p', 'sw-hl');
      var a = el('a', null, h.title || '');
      a.href = h.url || '#';
      a.target = '_blank';
      a.rel = 'noopener';
      hl.appendChild(a);
      item.appendChild(hl);
      item.appendChild(el('p', 'sw-meta', (h.source || '') + ' · ' + fmtDate(h.date)));
      panel.appendChild(item);
    });

    var all = el('a', 'sw-all', 'All signals →');
    all.href = data.signalsUrl || '/signals/';
    panel.appendChild(all);

    var updatedText = '';
    if (data.updatedUtc) {
      var u = fmtUpdated(data.updatedUtc);
      if (u) updatedText = 'Snapshot updated ' + u + '. ';
    }
    panel.appendChild(el('p', 'sw-updated',
      updatedText + 'Headline, source, and date only — every headline links to its publisher.'));

    /* ----- collapsed pill (the toggle) ----- */
    var pill = el('button', 'sw-pill');
    pill.type = 'button';
    pill.setAttribute('aria-expanded', 'false');
    pill.setAttribute('aria-controls', PANEL_ID);
    pill.setAttribute('aria-label', 'Show Axiovex Signals highlights');
    pill.appendChild(el('span', 'sw-live-dot'));
    pill.appendChild(document.createTextNode('Signals'));
    pill.appendChild(el('span', 'sw-chev', '▴'));

    mount.appendChild(panel);
    mount.appendChild(pill);

    var expanded = false;
    function setExpanded(on, moveFocus) {
      expanded = on;
      panel.hidden = !on;
      pill.hidden = on;
      pill.setAttribute('aria-expanded', on ? 'true' : 'false');
      try {
        if (on) sessionStorage.setItem(STORE_KEY, '1');
        else sessionStorage.removeItem(STORE_KEY);
      } catch (e) { /* private mode: state simply doesn't persist */ }
      if (!on && moveFocus) pill.focus();
    }
    pill.addEventListener('click', function () { setExpanded(true, false); });
    collapseBtn.addEventListener('click', function () { setExpanded(false, true); });
    document.addEventListener('keydown', function (e) {
      if (expanded && (e.key === 'Escape' || e.key === 'Esc')) setExpanded(false, true);
    });

    var startOpen = false;
    try { startOpen = sessionStorage.getItem(STORE_KEY) === '1'; } catch (e) { /* ignore */ }
    if (startOpen) setExpanded(true, false);
  }

  fetch('/signals-widget.json', { credentials: 'same-origin' })
    .then(function (r) {
      if (!r.ok) throw new Error('signals-widget.json ' + r.status);
      return r.json();
    })
    .then(render)
    .catch(removeWidget);
})();
