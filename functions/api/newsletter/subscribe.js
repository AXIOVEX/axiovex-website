// Spec 020 FR-008/FR-010 — POST /api/newsletter/subscribe
// Creates (or refreshes) a PENDING subscriber and sends the double
// opt-in confirmation email. Never claims "subscribed" — the WF-G8
// pending state is the product truth. Abuse controls mirror spec 005:
// Turnstile (fail-closed), honeypot + timing trap, D1 rate limiting,
// payload caps. An already-active address gets the same neutral
// response as everyone else (no list-membership disclosure).

import {
  cleanText, validEmail, sha256Hex, randomToken, siteBase, jsonResponse,
  storeReady, rateLimitHit, verifyTurnstile, sendNewsletterMail,
  confirmationMail, unsubscribeToken, CONFIRM_TTL_MS,
} from "./_lib.js";

const MAX_BODY_BYTES = 8192;

async function parseSubmission(request) {
  const contentType = request.headers.get("content-type") || "";
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) return { error: "oversized" };
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    try {
      const form = await request.formData();
      const data = {};
      let size = 0;
      for (const [key, value] of form.entries()) {
        if (typeof value !== "string") return { error: "invalid" };
        size += key.length + value.length;
        if (size > MAX_BODY_BYTES) return { error: "oversized" };
        data[key] = value;
      }
      return { data };
    } catch {
      return { error: "invalid" };
    }
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return { error: "oversized" };
  if (!raw) return { data: {} };
  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(raw);
      return { data: parsed && typeof parsed === "object" ? parsed : {} };
    } catch {
      return { error: "invalid" };
    }
  }
  return { error: "unsupported" };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, message: "Method not allowed." }, 405);
  }
  const parsed = await parseSubmission(request);
  if (parsed.error === "oversized") {
    return jsonResponse({ ok: false, message: "That submission is too large." }, 413);
  }
  if (parsed.error) {
    return jsonResponse({ ok: false, message: "We could not read that submission. Please try again." }, 400);
  }

  const email = cleanText(parsed.data.email, 254).toLowerCase();
  const token = typeof parsed.data["cf-turnstile-response"] === "string" ? parsed.data["cf-turnstile-response"].trim() : "";
  const honeypot = typeof parsed.data.website === "string" ? parsed.data.website.trim() : "";
  const startedAt = Number(parsed.data.startedAt || 0);
  // Spec 021 FR-009: the source is constrained to the known
  // placement set (pre-021 it was stored as free text). Placements
  // compare per 1,000 visitors, so stored values must stay in the
  // vocabulary; anything else coerces to the pre-021 default.
  const KNOWN_SOURCES = new Set(["signals", "signals-top", "article", "landing", "home", "footer", "archive", "issue"]);
  const rawSource = cleanText(parsed.data.source, 40);
  const source = KNOWN_SOURCES.has(rawSource) ? rawSource : "signals";

  // Honeypot / timing trap: apparent success, nothing stored, nothing sent.
  const submittedTooFast = Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < 1500;
  if (honeypot || submittedTooFast) {
    return jsonResponse({ ok: true, message: "Check your inbox to confirm your subscription." });
  }

  if (!email || !validEmail(email)) {
    return jsonResponse({ ok: false, message: "Please enter a valid email address.", errors: { email: "Please enter a valid email address." } }, 422);
  }
  if (!token) {
    return jsonResponse({ ok: false, message: "Please complete the spam check.", errors: { turnstile: "Please complete the spam check." } }, 422);
  }

  if (!storeReady(env)) {
    console.error("newsletter subscribe: NEWSLETTER_DB binding missing");
    return jsonResponse({ ok: false, message: "The newsletter is not configured on this environment yet." }, 503);
  }
  if (await rateLimitHit(env, request)) {
    return jsonResponse({ ok: false, message: "Too many attempts. Please try again later." }, 429);
  }

  const verification = await verifyTurnstile({ env, request, token });
  if (!verification.ok) {
    const message = verification.configuration
      ? "The signup is not configured correctly. Please try again later."
      : "The spam check could not verify this submission. Please try again.";
    return jsonResponse({ ok: false, message, errors: { turnstile: message }, resetTurnstile: true }, verification.configuration ? 500 : 403);
  }

  const db = env.NEWSLETTER_DB;
  const now = new Date();
  const nowIso = now.toISOString();
  const existing = await db.prepare("SELECT email, status FROM subscribers WHERE email = ?").bind(email).first();

  // Already active: neutral response, no email, no change (WF-G8 note).
  if (existing && existing.status === "active") {
    return jsonResponse({ ok: true, message: "Check your inbox to confirm your subscription." });
  }

  const rawToken = randomToken();
  const tokenHash = await sha256Hex(rawToken);
  const expiresIso = new Date(now.getTime() + CONFIRM_TTL_MS).toISOString();
  // The unsubscribe token is derived (HMAC of the address), so its hash
  // is stable for the life of the row and the send job can always build
  // the per-recipient link without any raw token at rest (FR-009).
  const unsubHash = await sha256Hex(await unsubscribeToken(env, email));
  if (existing) {
    // pending / unsubscribed / suppressed -> fresh confirmation required
    // (FR-012: a known address returns only as pending, never active).
    await db.prepare(
      "UPDATE subscribers SET status = 'pending', confirm_token_hash = ?, confirm_expires_at = ?, unsub_token_hash = ?, source = ? WHERE email = ?",
    ).bind(tokenHash, expiresIso, unsubHash, source, email).run();
  } else {
    await db.prepare(
      "INSERT INTO subscribers (email, status, confirm_token_hash, confirm_expires_at, unsub_token_hash, created_at, source) VALUES (?, 'pending', ?, ?, ?, ?, ?)",
    ).bind(email, tokenHash, expiresIso, unsubHash, nowIso, source).run();
  }

  const confirmUrl = `${siteBase(env, request)}/newsletter/confirm?t=${rawToken}`;
  const mail = confirmationMail(confirmUrl);
  const mailStatus = await sendNewsletterMail(env, { to: email, ...mail });
  if (mailStatus !== "sent") console.error(`newsletter confirmation mail to ${email}: ${mailStatus}`);
  return jsonResponse({
    ok: true,
    message: "Check your inbox to confirm your subscription.",
    ...(env.ENVIRONMENT !== "production" ? { mail: mailStatus } : {}),
  });
}
