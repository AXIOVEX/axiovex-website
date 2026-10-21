// Privacy-policy update notices (owner directive 2026-10-21) —
// CI -> Cloudflare -> Microsoft Graph, the same secret-gated bridge
// as report.js, sending through the newsletter plumbing (_lib.js).
//
// POST /api/ops/privacy-notify, header x-website-ops-secret. The
// GitHub Actions workflow (.github/workflows/privacy-policy-notify.yml)
// fires when privacy/index.html changes on main (and on manual
// dispatch) and drives this endpoint until every active subscriber
// has been notified for the policy version.
//
// Exactly-once per version: a row in D1 privacy_notice_log
// (version_key, email) is written ONLY after Graph accepts that
// recipient's message, and every invocation skips recipients
// already logged for the version — re-runs, repeat pushes and
// resumed partial runs can never re-notify a version. dryRun
// renders and counts, sends nothing, and writes nothing (it does
// not even create the log table).

import {
  jsonResponse, storeReady, sendNewsletterMail, unsubscribeToken,
  siteBase, NEWSLETTER_FROM, SEND_PACE_MS,
} from "../newsletter/_lib.js";
import { emailLayout, esc } from "./_email-layout.js";

const CHUNK = 25;
export const PRIVACY_SUBJECT = "Our privacy policy was updated";
export const PRIVACY_POLICY_URL = "https://axiovexsystems.com/privacy/";
const DEFAULT_SUMMARY =
  "The revised policy describes our current practices in plain language — what we collect and why, who processes it for us, how long we keep it, and the rights and choices you have, including asking for your information to be deleted.";

function authorized(request, env) {
  const expected = env.NEWSLETTER_SEND_SECRET || "";
  const actual = request.headers.get("x-website-ops-secret") || "";
  if (!expected || actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  return diff === 0;
}

export function renderPrivacyNotice({ policyDate, summary, unsubscribeUrl }) {
  const covers =
    "The policy explains what we collect (contact-form messages, and — for newsletter subscribers — an email address and signup source), why we collect it, who processes it for us (Cloudflare and Microsoft 365), how long we keep it, and your rights and choices.";
  const text = [
    "Our privacy policy was updated",
    "",
    `We updated the Axiovex Systems privacy policy. The current version is dated ${policyDate}.`,
    "",
    summary,
    "",
    covers,
    "",
    `Read the full policy: ${PRIVACY_POLICY_URL}`,
    "",
    "You are receiving this notice because you subscribe to The Axiovex Signal, the Axiovex Systems newsletter.",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");
  const content = [
    `<p>We updated the Axiovex Systems privacy policy. The current version is dated <strong>${esc(policyDate)}</strong>.</p>`,
    `<p>${esc(summary)}</p>`,
    `<p>${esc(covers)}</p>`,
    `<p><a href="${PRIVACY_POLICY_URL}">Read the full privacy policy</a></p>`,
  ].join("\n");
  const footer =
    `You are receiving this notice because you subscribe to The Axiovex Signal, the Axiovex Systems newsletter.<br>` +
    `<a href="${esc(unsubscribeUrl)}">Unsubscribe</a> · <a href="${PRIVACY_POLICY_URL}">Privacy policy</a><br>` +
    `Axiovex Systems · Sent from ${esc(NEWSLETTER_FROM)}`;
  const html = emailLayout({
    title: PRIVACY_SUBJECT,
    eyebrow: "Axiovex Systems · Privacy notice",
    preheader: `The Axiovex Systems privacy policy was updated — current version dated ${policyDate}.`,
    content,
    footer,
  });
  return { subject: PRIVACY_SUBJECT, text, html };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return jsonResponse({ ok: false, message: "Method not allowed." }, 405);
  if (!authorized(request, env)) return jsonResponse({ ok: false, message: "Forbidden." }, 403);
  if (env.ENVIRONMENT !== "production") return jsonResponse({ ok: false, message: "Privacy notices send only from production." }, 409);
  if (!storeReady(env)) return jsonResponse({ ok: false, message: "Store not configured." }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, message: "Invalid JSON." }, 400);
  }
  if (!body || Array.isArray(body) || Object.keys(body).some((k) => !["versionKey", "policyDate", "summary", "dryRun"].includes(k))) {
    return jsonResponse({ ok: false, message: "Invalid request." }, 422);
  }
  const versionKey = typeof body.versionKey === "string" ? body.versionKey : "";
  const policyDate = typeof body.policyDate === "string" ? body.policyDate.trim() : "";
  const summary = typeof body.summary === "string" && body.summary.trim() ? body.summary.trim().slice(0, 1200) : DEFAULT_SUMMARY;
  const dryRun = body.dryRun === true;
  if (!/^[0-9a-f]{64}$/.test(versionKey) || !policyDate || policyDate.length > 40) {
    return jsonResponse({ ok: false, message: "versionKey (sha256 hex) and policyDate are required." }, 422);
  }

  const db = env.NEWSLETTER_DB;
  const base = siteBase(env, request);
  const rows = await db.prepare("SELECT email FROM subscribers WHERE status = 'active' ORDER BY email").all();
  const recipients = (rows.results || []).map((r) => r.email);

  // Read the sent-log if it exists; a missing table means nothing
  // has ever been logged for any version. Dry runs never create it.
  let logged = new Set();
  try {
    const sentRows = await db.prepare("SELECT email FROM privacy_notice_log WHERE version_key = ?").bind(versionKey).all();
    logged = new Set((sentRows.results || []).map((r) => r.email));
  } catch {
    logged = new Set();
  }
  const pending = recipients.filter((e) => !logged.has(e));

  if (dryRun) {
    const sample = renderPrivacyNotice({
      policyDate,
      summary,
      unsubscribeUrl: `${base}/newsletter/unsubscribe?t=<per-recipient token>`,
    });
    return jsonResponse({
      ok: true,
      dryRun: true,
      versionKey,
      policyDate,
      from: NEWSLETTER_FROM,
      recipientCount: recipients.length,
      alreadyLogged: recipients.length - pending.length,
      wouldSend: pending.length,
      subject: sample.subject,
      text: sample.text,
      html: sample.html,
    });
  }

  await db.prepare(
    "CREATE TABLE IF NOT EXISTS privacy_notice_log (version_key TEXT NOT NULL, email TEXT NOT NULL, sent_at TEXT NOT NULL, PRIMARY KEY (version_key, email))",
  ).run();

  const batch = pending.slice(0, CHUNK);
  let sent = 0;
  let failed = 0;
  let throttled = 0;
  let blocked = 0;
  for (let i = 0; i < batch.length; i++) {
    const email = batch[i];
    const token = await unsubscribeToken(env, email);
    const unsubscribeUrl = `${base}/newsletter/unsubscribe?t=${token}`;
    const message = renderPrivacyNotice({ policyDate, summary, unsubscribeUrl });
    const status = await sendNewsletterMail(env, {
      to: email,
      subject: message.subject,
      html: message.html,
      text: message.text,
      unsubscribeUrl,
    });
    if (status === "sent") {
      sent++;
      // The log row is the exactly-once record: written only after
      // Graph accepted this recipient's message.
      await db.prepare("INSERT OR IGNORE INTO privacy_notice_log (version_key, email, sent_at) VALUES (?, ?, ?)")
        .bind(versionKey, email, new Date().toISOString())
        .run();
    } else if (status === "throttled") throttled++;
    else if (status === "blocked-allowlist") blocked++;
    else failed++;
    if (i < batch.length - 1) await sleep(SEND_PACE_MS);
  }
  const remaining = Math.max(0, pending.length - batch.length);
  return jsonResponse({
    ok: true,
    dryRun: false,
    versionKey,
    policyDate,
    from: NEWSLETTER_FROM,
    total: recipients.length,
    alreadyLogged: logged.size,
    attempted: batch.length,
    sent,
    failed,
    throttled,
    blockedAllowlist: blocked,
    remaining,
    done: remaining === 0,
  });
}
