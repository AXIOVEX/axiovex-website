// Spec 020 FR-005/FR-014/FR-020 — POST /api/newsletter/send
// The internal per-issue send job. NOT a public endpoint: it fails
// closed without the shared secret (NEWSLETTER_SEND_SECRET).
//
//  - Recipients are status='active' read AT SEND TIME (C-020-1) —
//    pending / unsubscribed / suppressed are excluded by the query.
//  - Sends are per-recipient (never bulk): each message carries
//    that subscriber's own unsubscribe URL in the footer and in
//    the List-Unsubscribe header (FR-011).
//  - Pacing: at most one send per SEND_PACE_MS (<=30/min, FR-014);
//    work is chunked (25/invocation, `offset` continues) under
//    Function limits; the sends log carries attempted/sent,
//    duration, bounces, complaints, throttling (FR-020).
//  - FR-005: refuses to run without the per-issue approval marker.
//  - FR-018: in production mode, refuses to run while the issue's
//    footerAddress is absent or still the staging placeholder.
//  - mode 'gauge': returns the FR-020 gauge line only (the
//    approval-request read), sending nothing.
//  - On staging, sendNewsletterMail enforces the test allowlist in
//    code (FR-017); non-allowlisted actives are counted as skipped.

import {
  jsonResponse, storeReady, sendNewsletterMail, unsubscribeToken,
  siteBase, senderGauge, SEND_PACE_MS,
} from "./_lib.js";

const CHUNK = 25;
const PLACEHOLDER_ADDRESS = "[Postal address pending — owner decision, spec 020 FR-018]";

function secretOk(request, env) {
  const provided = request.headers.get("x-newsletter-send-secret") || "";
  const expected = env.NEWSLETTER_SEND_SECRET || "";
  if (!expected || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "POST") return jsonResponse({ ok: false, message: "Method not allowed." }, 405);
  if (!secretOk(request, env)) return jsonResponse({ ok: false, message: "Forbidden." }, 403);
  if (!storeReady(env)) return jsonResponse({ ok: false, message: "Store not configured." }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, message: "Invalid JSON." }, 400);
  }

  if (body.mode === "gauge") {
    const gauge = await senderGauge(env);
    return jsonResponse({ ok: true, gauge });
  }

  const issue = typeof body.issue === "string" ? body.issue : "";
  const approval = typeof body.approval === "string" ? body.approval.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject : "";
  const html = typeof body.html === "string" ? body.html : "";
  const text = typeof body.text === "string" ? body.text : "";
  const footerAddress = typeof body.footerAddress === "string" ? body.footerAddress : "";
  const offset = Number.isInteger(body.offset) && body.offset > 0 ? body.offset : 0;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issue) || !subject || !html || !text) {
    return jsonResponse({ ok: false, message: "Issue id, subject, html and text parts are required." }, 422);
  }
  if (!approval) {
    return jsonResponse({ ok: false, message: "Refused: no per-issue approval marker (FR-005)." }, 422);
  }
  if (env.ENVIRONMENT === "production" && (!footerAddress || footerAddress === PLACEHOLDER_ADDRESS)) {
    return jsonResponse({ ok: false, message: "Refused: FR-018 postal address missing in production mode." }, 422);
  }

  const db = env.NEWSLETTER_DB;
  const startedAt = Date.now();
  const rows = await db.prepare(
    "SELECT email FROM subscribers WHERE status = 'active' ORDER BY email",
  ).all();
  const recipients = (rows.results || []).map((r) => r.email);
  const total = recipients.length;

  let sendsRowId = null;
  if (offset === 0) {
    const inserted = await db.prepare(
      "INSERT INTO sends (issue_id, started_at, recipient_count, provider_ref) VALUES (?, ?, ?, ?) RETURNING id",
    ).bind(issue, new Date(startedAt).toISOString(), total, "microsoft-graph").first();
    sendsRowId = inserted ? inserted.id : null;
  } else {
    const existing = await db.prepare(
      "SELECT id FROM sends WHERE issue_id = ? ORDER BY id DESC LIMIT 1",
    ).bind(issue).first();
    sendsRowId = existing ? existing.id : null;
  }

  const base = siteBase(env, request);
  const batch = recipients.slice(offset, offset + CHUNK);
  let sent = 0;
  let throttled = 0;
  let blocked = 0;
  let failed = 0;
  for (const email of batch) {
    const token = await unsubscribeToken(env, email);
    const unsubUrl = `${base}/newsletter/unsubscribe?t=${token}`;
    const personalize = (s) => s.split("{{UNSUBSCRIBE_URL}}").join(unsubUrl).split("{{WEB_URL}}").join(`${base}/newsletter/${issue}/`);
    const status = await sendNewsletterMail(env, {
      to: email,
      subject,
      html: personalize(html),
      text: personalize(text),
      unsubscribeUrl: unsubUrl,
    });
    if (status === "sent") sent++;
    else if (status === "throttled") throttled++;
    else if (status === "blocked-allowlist") blocked++;
    else failed++;
    if (batch.indexOf(email) < batch.length - 1) await sleep(SEND_PACE_MS);
  }

  const finishedAt = Date.now();
  if (sendsRowId) {
    await db.prepare(
      "UPDATE sends SET sent_count = sent_count + ?, throttle_events = throttle_events + ?, finished_at = ?, duration_ms = COALESCE(duration_ms, 0) + ? WHERE id = ?",
    ).bind(sent, throttled, new Date(finishedAt).toISOString(), finishedAt - startedAt, sendsRowId).run();
  }

  const gauge = await senderGauge(env);
  return jsonResponse({
    ok: true,
    issue,
    approval,
    assembled: total,
    offset,
    batch: batch.length,
    sent,
    throttled,
    blockedAllowlist: blocked,
    failed,
    remaining: Math.max(0, total - (offset + batch.length)),
    gauge,
  });
}
