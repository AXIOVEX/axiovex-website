// CI -> Cloudflare -> Microsoft Graph. Microsoft application credentials stay
// in Pages; the existing Newsletter app remains scoped to the Newsletter mailbox.
import { renderReportEmail } from './_report-email.js';
const FROM = 'analytics@axiovexsystems.com';
const FROM_NAME = 'Axiovex Analytics';
const RECIPIENTS = ['tristen@axiovexsystems.com', 'rockson@axiovexsystems.com'];
const KINDS = new Set(['daily', 'weekly', 'monthly', 'health', 'workforce', 'newsletter-draft']);
const MAX_BYTES = 262144;
function json(body, status) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}
function authorized(request, env) {
  const expected = env.NEWSLETTER_SEND_SECRET || '';
  const actual = request.headers.get('x-website-ops-secret') || '';
  if (!expected || actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  return diff === 0;
}
export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return json({ ok: false, message: 'Method not allowed' }, 405);
  if (!authorized(request, env)) return json({ ok: false, message: 'Forbidden' }, 403);
  if (env.ENVIRONMENT !== 'production') return json({ ok: false, message: 'Founder reports send only from production' }, 409);
  if ([env.NEWSLETTER_GRAPH_TENANT_ID, env.NEWSLETTER_GRAPH_CLIENT_ID, env.NEWSLETTER_GRAPH_CLIENT_SECRET].some(v => !v)) {
    return json({ ok: false, message: 'Microsoft report sender is not configured' }, 503);
  }
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ ok: false, message: 'JSON required' }, 415);
  if (Number(request.headers.get('content-length')) > MAX_BYTES) return json({ ok: false, message: 'Report too large' }, 413);
  let body;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > MAX_BYTES) return json({ ok: false, message: 'Report too large' }, 413);
    body = JSON.parse(text);
  } catch { return json({ ok: false, message: 'Invalid JSON' }, 400); }
  if (!body || Array.isArray(body) || Object.keys(body).some(k => !['kind', 'report', 'runUrl'].includes(k)) ||
      !KINDS.has(body.kind) || typeof body.report !== 'string' || !body.report.trim() ||
      (body.runUrl && (typeof body.runUrl !== 'string' || !/^https:\/\/github\.com\/AXIOVEX\/axiovex-website\/actions\/runs\/\d+$/.test(body.runUrl)))) {
    return json({ ok: false, message: 'Invalid report; sender and recipients are fixed' }, 422);
  }
  try {
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(env.NEWSLETTER_GRAPH_TENANT_ID)}/oauth2/v2.0/token`, {
      method: 'POST', signal: AbortSignal.timeout(15000),
      body: new URLSearchParams({ client_id: env.NEWSLETTER_GRAPH_CLIENT_ID, client_secret: env.NEWSLETTER_GRAPH_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' }),
    });
    if (!tokenResponse.ok) return json({ ok: false, message: 'Microsoft authentication failed', upstreamStatus: tokenResponse.status }, 502);
    const token = await tokenResponse.json();
    if (!token.access_token) return json({ ok: false, message: 'Microsoft authentication returned no token' }, 502);
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
    const rendered = renderReportEmail({ report: body.report, kind: body.kind, runUrl: body.runUrl });
    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(FROM)}/sendMail`, {
      method: 'POST', signal: AbortSignal.timeout(20000),
      headers: { Authorization: `Bearer ${token.access_token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ message: {
        from: { emailAddress: { address: FROM, name: FROM_NAME } },
        subject: `Axiovex website — ${body.kind} report ${date}`,
        body: { contentType: 'HTML', content: rendered.html },
        toRecipients: RECIPIENTS.map(address => ({ emailAddress: { address } })),
      }, saveToSentItems: true }),
    });
    if (response.status !== 202) return json({ ok: false, message: 'Microsoft report send failed', upstreamStatus: response.status }, 502);
    return json({ ok: true, status: 'accepted', from: FROM, recipients: RECIPIENTS }, 202);
  } catch { return json({ ok: false, message: 'Microsoft report request failed or timed out; verify delivery before retrying' }, 502); }
}
