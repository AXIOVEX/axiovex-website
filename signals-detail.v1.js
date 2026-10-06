          (function () {
            var b = document.getElementById('detail-toggle');
            var r = document.getElementById('detail-region');
            var s = document.getElementById('detail-sub');
            if (!b || !r) return;
            function set(open) {
              b.setAttribute('aria-expanded', open ? 'true' : 'false');
              b.textContent = open ? 'Hide details \u2212' : 'Show details +';
              r.hidden = !open;
              if (s) s.hidden = open;
            }
            set(false);
            b.addEventListener('click', function () {
              set(b.getAttribute('aria-expanded') !== 'true');
            });
          })();
