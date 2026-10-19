import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { renderEmail } from '../newsletter/render.mjs';
import { renderReportEmail } from '../../functions/api/ops/_report-email.js';
import { request } from './io.mjs';
const args = process.argv.slice(2);
const option = name => args[args.indexOf(name) + 1];
const kind = option('--kind');
const date = option('--date');
if (!['newsletter', 'report'].includes(kind) || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new Error('Expected --kind newsletter|report --date YYYY-MM-DD');
let rendered;
if (kind === 'newsletter') rendered = renderEmail(JSON.parse(readFileSync(`newsletter/issues/${date}.json`, 'utf8')));
else {
  const reportPath = option('--report');
  if (!args.includes('--report') || !reportPath) throw new Error('Expected --report path');
  rendered = { ...renderReportEmail({ report: readFileSync(reportPath, 'utf8'), kind: 'daily' }), subject: `Axiovex website — formatted daily report ${date}` };
}
const directory = 'ops-output/email-review';
mkdirSync(directory, { recursive: true });
writeFileSync(`${directory}/${kind}.html`, rendered.html);
writeFileSync(`${directory}/${kind}.txt`, rendered.text);
const body = { kind, date, subject: rendered.subject, html: rendered.html, text: rendered.text };
writeFileSync(`${directory}/${kind}.json`, JSON.stringify(body, null, 2));
if (args.includes('--send')) {
  if (!process.env.NEWSLETTER_SEND_SECRET) throw new Error('Missing NEWSLETTER_SEND_SECRET');
  const response = await request('https://axiovexsystems.com/api/ops/preview', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-website-ops-secret': process.env.NEWSLETTER_SEND_SECRET }, body: JSON.stringify(body),
  });
  const receipt = await response.json().catch(() => ({}));
  writeFileSync(`${directory}/${kind}-receipt.json`, JSON.stringify({ ...receipt, httpStatus: response.status, sentAt: new Date().toISOString() }, null, 2));
  if (response.status !== 202 || !receipt.ok || receipt.recipient !== 'tristen@axiovexsystems.com' || receipt.sent !== 1) throw new Error(`Review send failed: HTTP ${response.status}`);
  console.log(`${kind} review accepted by Microsoft for tristen@axiovexsystems.com only.`);
} else console.log(`${kind} review generated; nothing sent.`);
