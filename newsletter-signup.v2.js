// Spec 021 (WF-G8 placement expansion) — The Axiovex Signal signup
// behavior, multi-instance. Generalizes spec 020's v1: a page can
// carry several WF-G8 blocks (full, compact, landing, footer
// variants), and every instance binds independently — its own form
// state, its own errors, and its own Turnstile widget. The product
// truth is unchanged from v1: the block says "Check your inbox",
// never "Subscribed" — double opt-in (spec 020 FR-010).
//
// Turnstile stays INTERACTION-TRIGGERED (spec 020 FR-008, carried
// by spec 021 FR-008): the Turnstile script is NOT loaded and no
// widget is rendered on page view, on any page, so passive readers
// make no challenges.cloudflare.com requests. The script loads
// lazily — once, globally — the first time a reader interacts with
// ANY instance's email field (focus), and each armed instance's
// widget renders in that instance's own container. The endpoint's
// posture is unchanged: server-side Siteverify stays fail-closed,
// so a missing or expired token is still rejected server-side, and
// the no-JS / no-widget path still posts tokenless and lets the
// server answer.
var axiovexNlScriptState = 'idle'; // idle | loading | ready | failed
var axiovexNlInstances = [];

function axiovexNlRenderInstance(inst) {
  if (!window.turnstile || inst.widgetId !== null || !inst.container) return;
  var production = window.location.hostname === 'axiovexsystems.com';
  // The production widget is the spec 020 production sitekey;
  // non-production uses Cloudflare's public test sitekey.
  var sitekey = production ? '0x4AAAAAAFTBdQTVEtAWPN6y' : '1x00000000000000000000AA';
  if (!sitekey) return;
  inst.widgetId = window.turnstile.render(inst.container, {
    sitekey: sitekey,
    action: 'newsletter_subscribe',
    theme: 'dark',
    size: 'flexible',
    appearance: 'always'
  });
}

// Called by the Turnstile api.js onload parameter once it arrives.
window.initAxiovexNewsletterTurnstile = function () {
  axiovexNlScriptState = 'ready';
  axiovexNlInstances.forEach(function (inst) {
    if (inst.armed) axiovexNlRenderInstance(inst);
  });
};

function axiovexNlEnsureScript() {
  if (window.turnstile) { window.initAxiovexNewsletterTurnstile(); return; }
  if (axiovexNlScriptState === 'loading' || axiovexNlScriptState === 'ready') return;
  axiovexNlScriptState = 'loading';
  var script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=initAxiovexNewsletterTurnstile';
  script.async = true;
  script.defer = true;
  script.onerror = function () { axiovexNlScriptState = 'failed'; };
  document.head.appendChild(script);
}

function axiovexNlInitInstance(block) {
  var form = block.querySelector('.nl-form');
  if (!form) return;
  var inst = {
    block: block,
    form: form,
    container: form.querySelector('[data-nl-turnstile]'),
    widgetId: null,
    armed: false
  };
  axiovexNlInstances.push(inst);
  var email = form.querySelector('[name="email"]');
  var startedAt = form.querySelector('[name="startedAt"]');
  var done = block.querySelector('.nl-done');
  var summary = block.querySelector('.nl-summary');
  var submit = form.querySelector('[type="submit"]');
  var compact = block.classList.contains('nl-compact');

  function resetStartedAt() { if (startedAt) startedAt.value = String(Date.now()); }
  resetStartedAt();

  // Interaction trigger: the first focus (or first input, for
  // autofill paths that never focus) of THIS instance's email
  // field arms this instance and loads Turnstile. Nothing loads
  // before this.
  function armTurnstile() {
    inst.armed = true;
    axiovexNlEnsureScript();
    if (window.turnstile) axiovexNlRenderInstance(inst);
  }
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
    return inst.widgetId !== null && inst.widgetId !== undefined;
  }
  function currentToken() {
    if (!widgetRendered() || !window.turnstile) return '';
    try { return window.turnstile.getResponse(inst.widgetId) || ''; }
    catch (e) { return ''; }
  }
  function resetTurnstile() {
    if (window.turnstile && widgetRendered()) {
      window.turnstile.reset(inst.widgetId);
    } else {
      // Widget never rendered (or the script failed): try to arm it
      // now so the reader's next attempt can complete the check.
      armTurnstile();
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
        if (compact) {
          // The compact variant swaps in place (WF-G8): its heading
          // and fine print yield to the pending state.
          block.querySelectorAll('[data-nl-vanish]').forEach(function (el) { el.hidden = true; });
        }
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
}

(function () {
  document.querySelectorAll('[data-nl-block]').forEach(axiovexNlInitInstance);
})();
