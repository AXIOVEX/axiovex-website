          (function () {
            var sec = document.getElementById('geo-section');
            if (!sec) return;
            sec.classList.add('geo-js');
            function activate(group, key) {
              sec.querySelectorAll('[data-geo-btn]').forEach(function (b) {
                var parts = b.getAttribute('data-geo-btn').split(':');
                if (parts[0] === group) b.setAttribute('aria-pressed', parts[1] === key ? 'true' : 'false');
              });
              sec.querySelectorAll('[data-geo-layer]').forEach(function (l) {
                var parts = l.getAttribute('data-geo-layer').split(':');
                if (parts[0] === group) l.hidden = parts[1] !== key;
              });
            }
            sec.querySelectorAll('[data-geo-btn]').forEach(function (b) {
              b.addEventListener('click', function () {
                var parts = b.getAttribute('data-geo-btn').split(':');
                activate(parts[0], parts[1]);
              });
            });
            activate('qcew', '31-33');
            activate('ipeds', 'ALL');
          })();
