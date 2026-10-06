    window.axiovexTurnstileWidgetId = null;
    window.initAxiovexTurnstile = function () {
      var container = document.getElementById('turnstile-container');
      if (!container || !window.turnstile || window.axiovexTurnstileWidgetId !== null) return;
      var production = window.location.hostname === 'axiovexsystems.com';
      window.axiovexTurnstileWidgetId = window.turnstile.render(container, {
        sitekey: production ? '0x4AAAAAAFOkyD9ikBMt8aVk' : '1x00000000000000000000AA',
        action: 'contact',
        theme: 'dark',
        size: 'flexible',
        appearance: 'always'
      });
    };
