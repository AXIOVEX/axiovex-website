// Spec 020 — The Axiovex Signal: shared newsletter plumbing.
//
// Used by the subscribe / confirm / unsubscribe / send endpoints.
// Design constraints (spec 020):
//  - FR-009: D1 store; tokens exist at rest only as SHA-256 hashes.
//  - FR-010: double opt-in; recipients are status='active' read at send time.
//  - FR-011: one-click unsubscribe (footer GET + RFC 8058 POST).
//  - FR-014: sending is Microsoft Graph Mail.Send from the dedicated
//    "Axiovex Website Newsletter" app as newsletter@axiovexsystems.com,
//    per-recipient, <=30 messages/minute.
//  - FR-015: no per-subscriber tracking — no pixels, no link rewriting.
//  - FR-017: on staging, outbound mail is allowlist-restricted in code.

export const NEWSLETTER_FROM = "newsletter@axiovexsystems.com";
export const NEWSLETTER_FROM_NAME = "The Axiovex Signal";
export const CONFIRM_TTL_MS = 48 * 60 * 60 * 1000;
export const SEND_PACE_MS = 2100; // <=30 messages/minute (FR-014)
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const TEST_SECRET_KEYS = new Set([
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);

export function siteBase(env, request) {
  if (env.NEWSLETTER_SITE_BASE) return env.NEWSLETTER_SITE_BASE.replace(/\/$/, "");
  const url = new URL(request.url);
  return url.origin;
}

export function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, maxLength);
}

export function validEmail(value) {
  return value.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// The unsubscribe token is an HMAC of the address under a server secret:
// reproducible by the send job (which must build per-recipient links) yet
// unguessable, and never stored raw — the row keeps only its SHA-256 hash
// (FR-009), which is what the unsubscribe endpoints look up.
export async function unsubscribeToken(env, email) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.NEWSLETTER_TOKEN_SECRET || ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("unsub:" + email.toLowerCase()));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function storeReady(env) {
  return Boolean(env.NEWSLETTER_DB && typeof env.NEWSLETTER_DB.prepare === "function");
}

export async function rateLimitHit(env, request) {
  // Per-IP-hash attempt counter in D1 (no raw IPs stored). >10 subscribe
  // attempts in 10 minutes from one source is treated as abuse.
  if (!storeReady(env)) return false;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const ipHash = await sha256Hex("ip:" + ip);
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  try {
    const row = await env.NEWSLETTER_DB.prepare(
      "SELECT COUNT(*) AS n FROM rate_events WHERE ip_hash = ? AND created_at > ?",
    ).bind(ipHash, since).first();
    await env.NEWSLETTER_DB.prepare(
      "INSERT INTO rate_events (ip_hash, created_at) VALUES (?, ?)",
    ).bind(ipHash, new Date().toISOString()).run();
    return row && row.n > 10;
  } catch {
    return false; // the limiter must never take the endpoint down with it
  }
}

export async function verifyTurnstile({ env, request, token }) {
  const secret = env.NEWSLETTER_TURNSTILE_SECRET_KEY || env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: false, configuration: true };
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) form.append("remoteip", remoteIp);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(SITEVERIFY_URL, { method: "POST", body: form, signal: controller.signal });
    if (!response.ok) return { ok: false };
    const data = await response.json();
    if (data.success !== true) return { ok: false };
    // Cloudflare's published testing secrets return a testing marker,
    // hostname "example.com", and no action (same handling as spec 005).
    const isTestingResult = data.metadata?.result_with_testing_key === true;
    if (isTestingResult && TEST_SECRET_KEYS.has(secret)) {
      return data.hostname === "example.com" ? { ok: true } : { ok: false };
    }
    if (data.hostname !== "axiovexsystems.com" && data.hostname !== "staging.axiovexsystems.com") {
      return { ok: false };
    }
    if (data.action !== "newsletter_subscribe") return { ok: false };
    return { ok: true };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timeout);
  }
}

// ---- Graph mail (spec 020 FR-014; mechanism mirrors spec 005) ----

async function getGraphToken(env) {
  const required = [env.NEWSLETTER_GRAPH_TENANT_ID, env.NEWSLETTER_GRAPH_CLIENT_ID, env.NEWSLETTER_GRAPH_CLIENT_SECRET];
  if (required.some((value) => !value)) return null;
  const body = new URLSearchParams({
    client_id: env.NEWSLETTER_GRAPH_CLIENT_ID,
    client_secret: env.NEWSLETTER_GRAPH_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(env.NEWSLETTER_GRAPH_TENANT_ID)}/oauth2/v2.0/token`,
      { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body, signal: controller.signal },
    );
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.access_token === "string" ? data.access_token : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function testAllowlist(env) {
  if (env.ENVIRONMENT !== "staging") return null; // production: no allowlist gate
  const raw = env.NEWSLETTER_TEST_ALLOWLIST || "";
  return new Set(raw.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean));
}

// The single outbound path for ALL newsletter mail (FR-017): on staging,
// recipients outside the allowlist are refused here, in code.
// Returns 'sent' | 'blocked-allowlist' | 'not-configured' | 'failed'.
export async function sendNewsletterMail(env, { to, subject, html, text, unsubscribeUrl }) {
  const allow = testAllowlist(env);
  if (allow && !allow.has(to.toLowerCase())) {
    console.error(`newsletter mail blocked by staging allowlist for ${to}`);
    return "blocked-allowlist";
  }
  // Test hook: a non-production host may inject a capture array to observe
  // mail without a tenant app. The Pages runtime never sets this.
  if (env.NEWSLETTER_MAIL_CAPTURE && Array.isArray(env.NEWSLETTER_MAIL_CAPTURE)) {
    env.NEWSLETTER_MAIL_CAPTURE.push({ to, subject, html, text, unsubscribeUrl: unsubscribeUrl || null });
    return "sent";
  }
  const accessToken = await getGraphToken(env);
  if (!accessToken) return "not-configured";
  const cleanSubject = subject.replace(/[\r\n]+/g, " ");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    let response;
    if (html && text) {
      // FR-006: the email is multipart/alternative (HTML + plain text).
      // Graph's JSON sendMail carries a single body, so a message with
      // both parts goes as a raw MIME send (base64, content-type
      // text/plain) — the documented Graph route for MIME content.
      const boundary = "axv-" + randomToken().slice(0, 24);
      const b64raw = (s) => {
        const bytes = new TextEncoder().encode(s);
        let bin = "";
        for (let i = 0; i < bytes.length; i += 0x8000) {
          bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        }
        return btoa(bin);
      };
      const b64 = (s) => b64raw(s).replace(/.{76}(?=.)/g, "$&\r\n");
      const mime = [
        `From: ${NEWSLETTER_FROM_NAME} <${NEWSLETTER_FROM}>`,
        `To: ${to}`,
        `Reply-To: ${NEWSLETTER_FROM}`,
        `Subject: ${cleanSubject}`,
        "MIME-Version: 1.0",
        ...(unsubscribeUrl
          ? [`List-Unsubscribe: <${unsubscribeUrl}>`, "List-Unsubscribe-Post: List-Unsubscribe=One-Click"]
          : []),
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        'Content-Type: text/plain; charset="utf-8"',
        "Content-Transfer-Encoding: base64",
        "",
        b64(text),
        `--${boundary}`,
        'Content-Type: text/html; charset="utf-8"',
        "Content-Transfer-Encoding: base64",
        "",
        b64(html),
        `--${boundary}--`,
        "",
      ].join("\r\n");
      response = await fetch(
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(NEWSLETTER_FROM)}/sendMail`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${accessToken}`, "content-type": "text/plain" },
          body: b64raw(mime),
          signal: controller.signal,
        },
      );
    } else {
      const headers = [];
      if (unsubscribeUrl) {
        headers.push({ name: "List-Unsubscribe", value: `<${unsubscribeUrl}>` });
        headers.push({ name: "List-Unsubscribe-Post", value: "List-Unsubscribe=One-Click" });
      }
      const payload = {
        message: {
          subject: cleanSubject,
          body: html
            ? { contentType: "html", content: html }
            : { contentType: "text", content: text || "" },
          toRecipients: [{ emailAddress: { address: to } }],
          replyTo: [{ emailAddress: { address: NEWSLETTER_FROM, name: NEWSLETTER_FROM_NAME } }],
          internetMessageHeaders: headers.length ? headers : undefined,
        },
        saveToSentItems: false,
      };
      response = await fetch(
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(NEWSLETTER_FROM)}/sendMail`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        },
      );
    }
    if (response.status === 429) {
      console.error("Graph newsletter sendMail THROTTLED (429)");
      return "throttled"; // FR-020 health override evidence
    }
    if (response.status !== 202) {
      const errBody = await response.text().catch(() => "");
      console.error(`Graph newsletter sendMail failed with status ${response.status}: ${errBody.slice(0, 500)}`);
      return "failed";
    }
    return "sent";
  } catch {
    console.error("Graph newsletter sendMail request failed");
    return "failed";
  } finally {
    clearTimeout(timeout);
  }
}

export function confirmationMail(confirmUrl) {
  const subject = "Confirm your subscription — The Axiovex Signal";
  // Spec 020 (owner direction 2026-10-09): the confirmation email is
  // the consent moment, so it carries the privacy policy link next to
  // the confirm action, on the same site base as the confirm link.
  const privacyUrl = `${new URL(confirmUrl).origin}/privacy/`;
  const text = [
    "You asked to subscribe to The Axiovex Signal, Axiovex Systems' weekly newsletter.",
    "",
    "Confirm your subscription by opening this link (good for 48 hours):",
    confirmUrl,
    "",
    "No click, no emails: until you confirm, nothing is sent to this address.",
    "If you did not ask for this, ignore this message — nothing will be sent.",
    "",
    "We collect only your email address. One email a week, no tracking pixels or per-reader analytics, and you can unsubscribe in one click, any time.",
    `Privacy policy: ${privacyUrl}`,
    "",
    "— Axiovex Systems",
  ].join("\n");
  const html = `<!doctype html>
<html lang="en"><body style="margin:0;background:#081F32;color:#F7FCFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Arial,sans-serif">
  <div style="max-width:620px;margin:0 auto;padding:36px 24px">
    <p style="color:#00DEF6;font-size:12px;letter-spacing:.14em;font-weight:700;margin:0 0 10px">THE AXIOVEX SIGNAL — WEEKLY</p>
    <h1 style="font-size:26px;line-height:1.25;margin:0 0 14px">Confirm your subscription</h1>
    <p style="color:rgba(247,252,255,.78);line-height:1.65">You asked to subscribe to The Axiovex Signal, Axiovex Systems&rsquo; weekly newsletter. Click below to confirm — the link is good for 48 hours.</p>
    <p style="margin:24px 0"><a href="${confirmUrl}" style="background:#00DEF6;color:#081F32;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:8px">Confirm subscription &rarr;</a></p>
    <p style="color:rgba(247,252,255,.6);line-height:1.6;font-size:13.5px">No click, no emails: until you confirm, nothing is sent to this address. If you did not ask for this, ignore this message — nothing will be sent.</p>
    <p style="color:rgba(247,252,255,.6);line-height:1.6;font-size:13.5px">We collect only your email address. One email a week, no tracking pixels or per-reader analytics, and you can unsubscribe in one click, any time. <a href="${privacyUrl}" style="color:#00DEF6">Privacy policy</a></p>
    <p style="color:rgba(247,252,255,.6);font-size:13.5px">— Axiovex Systems</p>
  </div>
</body></html>`;
  return { subject, text, html };
}

// ---- WF-17 landing pages (rendered by the token endpoints) ----

const LANDING_STATES = {
  confirmed: {
    title: "You\u2019re subscribed.",
    body: "The next edition arrives Wednesday at 10:00 AM ET. Until then, the archive has every past edition.",
    cta: { href: "/newsletter/", label: "Read past editions \u2192", primary: true },
  },
  unsubscribed: {
    title: "You\u2019ve unsubscribed.",
    body: "Done — effective now. No further editions will be sent to this address. If this was a mistake, subscribing again takes a fresh confirmation, so an address can never be re-added silently.",
    cta: { href: "/signals/#newsletter", label: "Subscribe again \u2192", primary: false },
  },
  expired: {
    title: "That link has expired.",
    body: "Confirmation links are good for 48 hours. Enter your email again on the Signals page and we\u2019ll send a fresh one.",
    cta: { href: "/signals/#newsletter", label: "Subscribe again \u2192", primary: true },
  },
  already: {
    title: "Nothing to change.",
    body: "This address is already in the state that link asks for. No error, no second email — the record stands as it was.",
    cta: { href: "/newsletter/", label: "Read past editions \u2192", primary: false },
  },
};

export function landingResponse(state) {
  const content = LANDING_STATES[state] || LANDING_STATES.already;
  const body = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${content.title} | The Axiovex Signal — Axiovex Systems</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #081F32; color: #F7FCFF; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif; }
    main { width: min(620px, calc(100% - 48px)); border: 1px solid rgba(0,222,246,.25); border-radius: 14px; padding: 36px; background: rgba(247,252,255,.03); text-align: center; }
    .eyebrow { color: #00DEF6; font-size: 12px; letter-spacing: .14em; font-weight: 700; margin: 0 0 10px; }
    h1 { margin: 0 0 12px; font-size: 30px; line-height: 1.2; }
    p { color: rgba(247,252,255,.76); line-height: 1.65; }
    a.btn { display: inline-block; margin-top: 14px; font-weight: 700; text-decoration: none; padding: 11px 20px; border-radius: 8px; border: 1px solid rgba(0,222,246,.5); color: #00DEF6; }
    a.btn.primary { background: #00DEF6; color: #081F32; border-color: #00DEF6; }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">THE AXIOVEX SIGNAL</p>
    <h1>${content.title}</h1>
    <p>${content.body}</p>
    <p><a class="btn${content.cta.primary ? " primary" : ""}" href="${content.cta.href}">${content.cta.label}</a></p>
  </main>
</body>
</html>`;
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

// ---- FR-020 sender-migration gauge ----
// Computed from the sends log + the active count. Reported in every
// approval request and post-send summary; a trip records a planning
// task for the owner — nothing auto-starts.
export const GAUGE_PLAN_AT = 750;
export const GAUGE_MOVE_AT = 1500;

export async function senderGauge(env) {
  const gauge = {
    active: null,
    planAt: GAUGE_PLAN_AT,
    moveAt: GAUGE_MOVE_AT,
    distanceToPlan: null,
    planTripped: false,
    moveTripped: false,
    healthOverrides: [],
    line: "gauge unavailable (store not configured)",
  };
  if (!storeReady(env)) return gauge;
  const db = env.NEWSLETTER_DB;
  const activeRow = await db.prepare("SELECT COUNT(*) AS n FROM subscribers WHERE status = 'active'").first();
  gauge.active = activeRow ? activeRow.n : 0;
  gauge.distanceToPlan = GAUGE_PLAN_AT - gauge.active;
  gauge.planTripped = gauge.active >= GAUGE_PLAN_AT;
  gauge.moveTripped = gauge.active >= GAUGE_MOVE_AT;
  const last = await db.prepare(
    "SELECT issue_id, sent_count, bounce_count, complaint_count, throttle_events, duration_ms FROM sends ORDER BY id DESC LIMIT 1",
  ).first();
  if (last && last.sent_count > 0) {
    if (last.complaint_count / last.sent_count >= 0.001) {
      gauge.healthOverrides.push(`complaint rate ${(100 * last.complaint_count / last.sent_count).toFixed(2)}% on ${last.issue_id} (>= 0.1%)`);
    }
    if (last.bounce_count / last.sent_count >= 0.02) {
      gauge.healthOverrides.push(`hard-bounce rate ${(100 * last.bounce_count / last.sent_count).toFixed(1)}% on ${last.issue_id} (>= 2%)`);
    }
    if (last.throttle_events > 0) {
      gauge.healthOverrides.push(`throttling events during ${last.issue_id}: ${last.throttle_events}`);
    }
    if (last.duration_ms && last.duration_ms > 60 * 60 * 1000) {
      gauge.healthOverrides.push(`send duration over 60 minutes on ${last.issue_id}`);
    }
  }
  gauge.line =
    `Sender gauge: ${gauge.active} active subscribers (${gauge.distanceToPlan} below the ${GAUGE_PLAN_AT} PLAN threshold` +
    (gauge.planTripped ? " — PLAN THRESHOLD REACHED" : "") +
    (gauge.moveTripped ? " — MOVE THRESHOLD REACHED" : "") +
    `); health overrides: ${gauge.healthOverrides.length ? gauge.healthOverrides.join("; ") : "none"}.`;
  return gauge;
}

export function notConfiguredResponse() {
  return new Response("The newsletter service is not configured on this environment yet.", {
    status: 503,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
