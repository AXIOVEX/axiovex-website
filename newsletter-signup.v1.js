// Spec 020 (WF-G8) — The Axiovex Signal signup block behavior.
// Mirrors the spec 005 contact form's client patterns: explicit
// Turnstile render, fetch+JSON submit, inline errors, and the
// honest pending state (the block says "Check your inbox", never
// "Subscribed" — double opt-in is the product truth, FR-010).
window.axiovexNewsletterWidgetId = null;
window.initAxiovexNewsletterTurnstile = function () {
  var container = document.getElementById('nl-turnstile');
  if (!container || !window.turnstile || window.axiovexNewsletterWidgetId !== null) return;
  var production = window.location.hostname === 'axiovexsystems.com';
  // The production widget is created at promotion (spec 020 T011);
  // until then production renders no widget and the endpoint fails
  // closed. Non-production uses Cloudflare's public test sitekey.
  var sitekey = production ? '' : '1x00000000000000000000AA';
  if (!sitekey) return;
  window.axiovexNewsletterWidgetId = window.turnstile.render(container, {
    sitekey: sitekey,
    action: 'newsletter_subscribe',
    theme: 'dark',
    size: 'flexible',
    appearance: 'always'
  });
};

(function () {
  var block = document.getElementById('newsletter');
  if (!block) return;
  var form = block.querySelector('.nl-form');
  if (!form) return;
  var startedAt = form.querySelector('[name="startedAt"]');
  var done = block.querySelector('.nl-done');
  var summary = block.querySelector('.nl-summary');
  var submit = form.querySelector('[type="submit"]');

  function resetStartedAt() { if (startedAt) startedAt.value = String(Date.now()); }
  resetStartedAt();

  function setError(name, message) {
    var error = form.querySelector('[data-error-for="' + name + '"]');
    if (error) { error.textContent = message; error.hidden = false; }
  }
  function clearErrors() {
    form.querySelectorAll('.field-error').forEach(function (e) { e.textContent = ''; e.hidden = true; });
  }
  function showSummary(message, isError) {
    if (!summary) return;
    summary.textContent = message;
    summary.classList.toggle('error', isError);
    summary.hidden = false;
  }
  function resetTurnstile() {
    if (window.turnstile && window.axiovexNewsletterWidgetId !== null && window.axiovexNewsletterWidgetId !== undefined) {
      window.turnstile.reset(window.axiovexNewsletterWidgetId);
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearErrors();
    var data = new FormData(form);
    if (!data.get('cf-turnstile-response')) {
      // The widget appends its token on render; if absent, the form
      // still posts so the server gives the authoritative answer.
      data.append('cf-turnstile-response', '');
    }
    submit.disabled = true;
    fetch(form.action, {
      method: 'POST',
      headers: { 'accept': 'application/json' },
      body: data
    }).then(function (response) {
      return response.json().catch(function () { return { ok: false, message: 'Something went wrong. Please try again.' }; });
    }).then(function (result) {
      submit.disabled = false;
      if (result.ok) {
        form.hidden = true;
        if (done) done.hidden = false;
        showSummary('', false);
        if (summary) summary.hidden = true;
      } else {
        if (result.errors) {
          Object.keys(result.errors).forEach(function (name) { setError(name, result.errors[name]); });
        }
        showSummary(result.message || 'Please check the form and try again.', true);
        if (result.resetTurnstile) resetTurnstile();
        resetStartedAt();
      }
    }).catch(function () {
      submit.disabled = false;
      showSummary('Something went wrong. Please try again.', true);
    });
  });
})();
