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
