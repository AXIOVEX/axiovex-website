// Dedicated Gmail OAuth grant, configured as Actions secrets. Never reuse
// the mailbox-scoped newsletter Graph credential for founder reports.
import { readFileSync } from 'node:fs';
import { request } from './io.mjs';
const names = ['REPORT_GMAIL_CLIENT_ID', 'REPORT_GMAIL_CLIENT_SECRET', 'REPORT_GMAIL_REFRESH_TOKEN'];
try {
  if (names.some(n => !process.env[n])) throw new Error('Founder email not sent: missing REPORT_GMAIL_CLIENT_ID / REPORT_GMAIL_CLIENT_SECRET / REPORT_GMAIL_REFRESH_TOKEN');
  const tokenResponse = await request('https://oauth2.googleapis.com/token', { method: 'POST',
    body: new URLSearchParams({ client_id: process.env.REPORT_GMAIL_CLIENT_ID,
      client_secret: process.env.REPORT_GMAIL_CLIENT_SECRET,
      refresh_token: process.env.REPORT_GMAIL_REFRESH_TOKEN, grant_type: 'refresh_token' }) });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) throw new Error('Report Gmail OAuth refresh failed');
  const report = readFileSync((process.env.OPS_OUTPUT || 'ops-output') + '/report.md', 'utf8');
  const message = ['From: tristen.pierson@gmail.com',
    'To: tristen@axiovexsystems.com, rockson@axiovexsystems.com',
    'Subject: Axiovex website report ' + new Date().toISOString().slice(0, 10),
    'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64', '', Buffer.from(report).toString('base64')].join('\r\n');
  const response = await request('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: Buffer.from(message).toString('base64url') }),
  });
  if (!response.ok) throw new Error(`Founder email send failed: HTTP ${response.status}`);
  console.log('Report accepted by Gmail for delivery to both founders.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
