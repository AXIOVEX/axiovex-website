    document.getElementById('year').textContent = new Date().getFullYear();
    (function () {
      var t = document.querySelector('.nav-toggle');
      var m = document.getElementById('mobile-menu');
      if (!t || !m) return;
      function set(open) {
        m.classList.toggle('open', open);
        t.setAttribute('aria-expanded', open ? 'true' : 'false');
        t.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      }
      t.addEventListener('click', function () { set(!m.classList.contains('open')); });
      m.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    })();
    // FAQ: one open at a time; EXPLORE links land on an open answer.
    (function () {
      var items = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));
      if (!items.length) return;
      items.forEach(function (d) {
        d.addEventListener('toggle', function () {
          if (d.open) items.forEach(function (o) { if (o !== d) o.open = false; });
        });
      });
      function openFromHash() {
        var el = location.hash && document.querySelector(location.hash);
        if (el && el.classList && el.classList.contains('faq-item')) el.open = true;
      }
      window.addEventListener('hashchange', openFromHash);
      openFromHash();
    })();
    // Scroll reveal (progressive: content is visible if this never runs).
    (function () {
      if (!('IntersectionObserver' in window)) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var els = document.querySelectorAll('main .section, main .cta-band');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.08 });
      els.forEach(function (el) { el.classList.add('rv'); io.observe(el); });
    })();
