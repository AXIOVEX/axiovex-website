// Spec 020 (WF-G8) — The Axiovex Signal signup block behavior.
// Mirrors the spec 005 contact form's client patterns: fetch+JSON
// submit, inline errors, and the honest pending state (the block
// says "Check your inbox", never "Subscribed" — double opt-in is
// the product truth, FR-010).
//
// Turnstile is INTERACTION-TRIGGERED (spec 020 FR-008, owner
// direction 2026-10-09): the Turnstile script is NOT loaded and no
// widget is rendered on page view, so passive readers make no
// challenges.cloudflare.com requests and run no Turnstile checks.
// The script loads lazily and the widget renders the first time the
// reader interacts with the email field (focus). The endpoint's
// posture is unchanged: server-side Siteverify stays fail-closed,
// so a missing or expired token is still rejected server-side, and
// the no-JS / no-widget path still posts tokenless and lets the
// server answer.
window.axiovexNewsletterWidgetId = null;
window.axiovexNewsletterTurnstileState = 'idle'; // idle | loading | ready | failed

window.axiovexNewsletterRenderWidget = function () {
  var container = document.getElementById('nl-turnstile');
  if (!container || !window.turnstile || window.axiovexNewsletterWidgetId !== null) return;
  var production = window.location.hostname === 'axiovexsystems.com';
  // The production widget is created at promotion (spec 020 T011);
  // until then production renders no widget and the endpoint fails
  // closed. Non-production uses Cloudflare's public test sitekey.
  var sitekey = production ? '0x4AAAAAAFTBdQTVEtAWPN6y' : '1x00000000000000000000AA';
  if (!sitekey) return;
  window.axiovexNewsletterWidgetId = window.turnstile.render(container, {
    sitekey: sitekey,
    action: 'newsletter_subscribe',
    theme: 'dark',
    size: 'flexible',
    appearance: 'always'
  });
};

// Called by the Turnstile api.js onload parameter once it arrives.
window.initAxiovexNewsletterTurnstile = function () {
  window.axiovexNewsletterTurnstileState = 'ready';
  window.axiovexNewsletterRenderWidget();
};

window.axiovexNewsletterEnsureTurnstile = function () {
  if (window.turnstile) { window.initAxiovexNewsletterTurnstile(); return; }
  if (window.axiovexNewsletterTurnstileState === 'loading' ||
      window.axiovexNewsletterTurnstileState === 'ready') return;
  window.axiovexNewsletterTurnstileState = 'loading';
  var script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=initAxiovexNewsletterTurnstile';
  script.async = true;
  script.defer = true;
  script.onerror = function () { window.axiovexNewsletterTurnstileState = 'failed'; };
  document.head.appendChild(script);
};

(function () {
  var block = document.getElementById('newsletter');
  if (!block) return;
  var form = block.querySelector('.nl-form');
  if (!form) return;
  var email = form.querySelector('[name="email"]');
  var startedAt = form.querySelector('[name="startedAt"]');
  var done = block.querySelector('.nl-done');
  var summary = block.querySelector('.nl-summary');
  var submit = form.querySelector('[type="submit"]');

  function resetStartedAt() { if (startedAt) startedAt.value = String(Date.now()); }
  resetStartedAt();

  // Interaction trigger: the first focus (or first input, for
  // autofill paths that never focus) of the email field loads
  // Turnstile and renders the widget. Nothing loads before this.
  function armTurnstile() { window.axiovexNewsletterEnsureTurnstile(); }
  if (email) {
    email.addEventListener('focus', armTurnstile);
    email.addEventListener('input', armTurnstile);
  }

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
  function widgetRendered() {
    return window.axiovexNewsletterWidgetId !== null && window.axiovexNewsletterWidgetId !== undefined;
  }
  function currentToken() {
    if (!widgetRendered() || !window.turnstile) return '';
    try { return window.turnstile.getResponse(window.axiovexNewsletterWidgetId) || ''; }
    catch (e) { return ''; }
  }
  function resetTurnstile() {
    if (window.turnstile && widgetRendered()) {
      window.turnstile.reset(window.axiovexNewsletterWidgetId);
    } else {
      // Widget never rendered (or the script failed): try to arm it
      // now so the reader's next attempt can complete the check.
      window.axiovexNewsletterEnsureTurnstile();
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearErrors();
    var token = currentToken();
    if (widgetRendered() && !token) {
      // The widget is on the page but has no live token — unsolved,
      // or issued more than 300s ago and expired. Refresh it and ask
      // the reader to submit again rather than posting a submission
      // we know the server must reject (still fail-closed: nothing
      // is sent).
      resetTurnstile();
      resetStartedAt();
      setError('turnstile', 'Please complete the spam check, then subscribe again.');
      showSummary('The spam check needs a fresh pass — it has been refreshed above. Press Subscribe again.', true);
      return;
    }
    var data = new FormData(form);
    if (!token) {
      // Widget not rendered (reader never focused the field, script
      // blocked, or no JS widget on this host): post tokenless and
      // let the server give the authoritative fail-closed answer.
      data.set('cf-turnstile-response', '');
      armTurnstile();
    } else {
      data.set('cf-turnstile-response', token);
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
