import { sendNewsletterMail } from '../newsletter/_lib.js';
const RECIPIENT = 'tristen@axiovexsystems.com';
const MAX_BYTES = 262144;
const json = (body, status) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return json({ ok: false, message: 'Method not allowed' }, 405);
  const expected = env.NEWSLETTER_SEND_SECRET || '';
  const actual = request.headers.get('x-website-ops-secret') || '';
  let difference = expected.length ^ actual.length;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ (actual.charCodeAt(i) || 0);
  if (!expected || difference) return json({ ok: false, message: 'Forbidden' }, 403);
  if (env.ENVIRONMENT !== 'production') return json({ ok: false, message: 'Review endpoint is production-only' }, 409);
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ ok: false, message: 'JSON required' }, 415);
  if (Number(request.headers.get('content-length')) > MAX_BYTES) return json({ ok: false, message: 'Preview too large' }, 413);
  let body;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BYTES) return json({ ok: false, message: 'Preview too large' }, 413);
    body = JSON.parse(raw);
  } catch { return json({ ok: false, message: 'Invalid JSON' }, 400); }
  if (!body || Array.isArray(body) || Object.keys(body).some(k => !['kind', 'date', 'subject', 'html', 'text'].includes(k)) ||
      !['newsletter', 'report'].includes(body.kind) || !/^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ||
      !['subject', 'html', 'text'].every(k => typeof body[k] === 'string' && body[k].trim()) || body.subject.length > 180) {
    return json({ ok: false, message: 'Invalid preview; recipient is fixed to Tristen' }, 422);
  }
  const base = 'https://axiovexsystems.com';
  const personalize = value => value.replaceAll('{{WEB_URL}}', `${base}/newsletter/${body.date}/`)
    .replaceAll('{{PRIVACY_URL}}', `${base}/privacy/`).replaceAll('{{UNSUBSCRIBE_URL}}', `${base}/newsletter/`);
  const notice = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#fff1d8"><tr><td align="center" style="padding:12px;font-family:Arial,sans-serif;font-size:13px;color:#805514;">REVIEW COPY — sent only to Tristen. Customer distribution is not authorized by this preview.</td></tr></table>';
  const html = personalize(body.html.replace(/(<body[^>]*>)/i, '$1' + notice)
    .replaceAll('Unsubscribe in one click', 'Unsubscribe (disabled in review copy)'));
  const text = 'REVIEW COPY — sent only to Tristen.\n\n' + personalize(body.text.replaceAll('Unsubscribe in one click', 'Unsubscribe (disabled in review copy)'));
  // No subscriber query, subscription change, sends-ledger write or list send.
  const mailStatus = await sendNewsletterMail(env, { to: RECIPIENT, subject: '[REVIEW ONLY] ' + body.subject, html, text });
  if (mailStatus !== 'sent') return json({ ok: false, mailStatus, message: 'Review email was not accepted by Microsoft' }, 502);
  return json({ ok: true, status: 'accepted', recipient: RECIPIENT, sent: 1, kind: body.kind }, 202);
}
