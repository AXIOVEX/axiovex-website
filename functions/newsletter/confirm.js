// Spec 020 FR-010 / WF-17 — GET /newsletter/confirm?t=<token>
// Redeeming a live confirmation token flips pending -> active (State A).
// Expired or unknown tokens land on State C; a token whose address is
// already active lands on State D. No address is ever shown.

import { sha256Hex, storeReady, landingResponse, notConfiguredResponse } from "../api/newsletter/_lib.js";

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "GET") return new Response("Method not allowed.", { status: 405 });
  if (!storeReady(env)) return notConfiguredResponse();
  const token = new URL(request.url).searchParams.get("t") || "";
  if (!token || token.length > 200) return landingResponse("expired");
  const hash = await sha256Hex(token);
  const row = await env.NEWSLETTER_DB.prepare(
    "SELECT email, status, confirm_expires_at FROM subscribers WHERE confirm_token_hash = ?",
  ).bind(hash).first();
  if (!row) return landingResponse("expired");
  if (row.status === "active") return landingResponse("already");
  if (row.status !== "pending") return landingResponse("expired");
  if (!row.confirm_expires_at || Date.parse(row.confirm_expires_at) < Date.now()) {
    return landingResponse("expired");
  }
  await env.NEWSLETTER_DB.prepare(
    "UPDATE subscribers SET status = 'active', confirmed_at = ? WHERE email = ?",
  ).bind(new Date().toISOString(), row.email).run();
  return landingResponse("confirmed");
}
