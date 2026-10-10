// Spec 020 FR-011 / WF-17 — /newsletter/unsubscribe?t=<token>
// One URL, two verbs (RFC 8058):
//  - GET  (footer link): the status flip happens BEFORE the page
//    renders (WF-17 State B) — no "are you sure" screen. A repeat
//    visit lands on State D; an unknown token gets the same
//    neutral State D (no membership disclosure).
//  - POST (List-Unsubscribe-Post: List-Unsubscribe=One-Click):
//    the mail client performs it; the flip is committed
//    server-side immediately and no page is rendered.

import { sha256Hex, storeReady, landingResponse, notConfiguredResponse, jsonResponse } from "../api/newsletter/_lib.js";

async function flipUnsubscribe(env, token) {
  const hash = await sha256Hex(token);
  const row = await env.NEWSLETTER_DB.prepare(
    "SELECT email, status FROM subscribers WHERE unsub_token_hash = ?",
  ).bind(hash).first();
  if (!row) return "unknown";
  if (row.status === "unsubscribed") return "already";
  await env.NEWSLETTER_DB.prepare(
    "UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = ? WHERE email = ?",
  ).bind(new Date().toISOString(), row.email).run();
  return "flipped";
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!storeReady(env)) return notConfiguredResponse();
  const token = new URL(request.url).searchParams.get("t") || "";
  if (!token || token.length > 200) return landingResponse("already");
  const result = await flipUnsubscribe(env, token);
  return landingResponse(result === "flipped" ? "unsubscribed" : "already");
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!storeReady(env)) return jsonResponse({ ok: false, message: "Not configured." }, 503);
  const token = new URL(request.url).searchParams.get("t") || "";
  if (!token || token.length > 200) return jsonResponse({ ok: false }, 400);
  await flipUnsubscribe(env, token);
  return jsonResponse({ ok: true });
}
