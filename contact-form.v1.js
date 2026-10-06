    (function () {
      var form = document.getElementById('contact-form');
      if (!form) return;
      var summary = document.getElementById('form-summary');
      var submit = document.getElementById('contact-submit');
      var startedAt = document.getElementById('contact-started-at');
      var submitLabel = submit.textContent;

      function resetStartedAt() { startedAt.value = String(Date.now()); }
      resetStartedAt();

      function fieldFor(name) { return form.querySelector('[name="' + name + '"]'); }
      function errorFor(name) { return form.querySelector('[data-error-for="' + name + '"]'); }

      function clearError(name) {
        var field = fieldFor(name);
        var error = errorFor(name);
        if (field) field.removeAttribute('aria-invalid');
        if (error) { error.textContent = ''; error.hidden = true; }
      }

      function setError(name, message) {
        var field = fieldFor(name);
        var error = errorFor(name);
        if (field && name !== 'turnstile') field.setAttribute('aria-invalid', 'true');
        if (error) { error.textContent = message; error.hidden = false; }
      }

      function showSummary(message, isError) {
        summary.textContent = message;
        summary.classList.toggle('error', isError);
        summary.classList.toggle('success', !isError);
        summary.hidden = false;
      }

      function resetTurnstile() {
        if (window.turnstile && window.axiovexTurnstileWidgetId !== null) {
          window.turnstile.reset(window.axiovexTurnstileWidgetId);
        }
      }

      ['name', 'email', 'company', 'topic', 'message'].forEach(function (name) {
        var field = fieldFor(name);
        if (field) field.addEventListener('input', function () { clearError(name); });
        if (field) field.addEventListener('change', function () { clearError(name); });
      });

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }

        var data = Object.fromEntries(new FormData(form).entries());
        if (!data['cf-turnstile-response']) {
          var turnstileMessage = 'Please complete the spam check. If it does not appear, email start@axiovexsystems.com instead.';
          setError('turnstile', turnstileMessage);
          showSummary(turnstileMessage, true);
          summary.focus();
          return;
        }

        summary.hidden = true;
        submit.disabled = true;
        submit.textContent = 'Sending...';

        fetch(form.action, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }).then(function (response) {
          return response.json().catch(function () {
            return { ok: false, message: 'We could not send your message. Please email start@axiovexsystems.com instead.' };
          }).then(function (payload) { return { response: response, payload: payload }; });
        }).then(function (result) {
          var payload = result.payload || {};
          if (result.response.ok && payload.ok) {
            form.reset();
            resetStartedAt();
            resetTurnstile();
            showSummary(payload.message || 'Message sent. A founder will reply.', false);
            summary.focus();
            return;
          }

          var firstErrorField = null;
          if (payload.errors) {
            Object.keys(payload.errors).forEach(function (name) {
              setError(name, payload.errors[name]);
              if (!firstErrorField && name !== 'turnstile') firstErrorField = fieldFor(name);
            });
          }
          showSummary(payload.message || 'We could not send your message. Please email start@axiovexsystems.com instead.', true);
          if (payload.resetTurnstile) resetTurnstile();
          (firstErrorField || summary).focus();
        }).catch(function () {
          showSummary('We could not send your message. Please email start@axiovexsystems.com instead.', true);
          resetTurnstile();
          summary.focus();
        }).finally(function () {
          submit.disabled = false;
          submit.textContent = submitLabel;
        });
      });
    })();
