// Spec 020 T007 — the operator-side send tool (FR-005).
// Reads the committed, owner-approved issue render
// (newsletter/issues/<date>.email.json) and drives the internal
// send endpoint chunk by chunk. It refuses to run without an
// approval marker, exactly as the endpoint does.
//
//   NEWSLETTER_SEND_SECRET=... node scripts/newsletter/send.mjs \
//     <yyyy-mm-dd> --approved-by "Tristen Pierson 2026-10-14" \
//     [--base https://staging.axiovexsystems.com] [--gauge-only]
//
// The secret comes from the caller's environment (the ops store),
// never from a file in this repo, and is never printed.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const date = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const base = (opt('--base') || 'https://staging.axiovexsystems.com').replace(/\/$/, '');
const secret = process.env.NEWSLETTER_SEND_SECRET || '';
if (!date || !secret) {
  console.error('usage: NEWSLETTER_SEND_SECRET=... node scripts/newsletter/send.mjs <yyyy-mm-dd> --approved-by "<marker>" [--base <url>] [--gauge-only]');
  process.exit(1);
}

async function call(body) {
  const response = await fetch(`${base}/api/newsletter/send`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-newsletter-send-secret': secret },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(`send endpoint: ${response.status} ${data.message || ''}`);
  return data;
}

if (args.includes('--gauge-only')) {
  const { gauge } = await call({ mode: 'gauge' });
  console.log(gauge.line);
  process.exit(0);
}

const approval = opt('--approved-by');
if (!approval) {
  console.error('REFUSED: no --approved-by marker (FR-005: an issue sends only on the owner\u2019s approval for that issue).');
  process.exit(1);
}
const email = JSON.parse(readFileSync(path.join(ROOT, 'newsletter', 'issues', `${date}.email.json`), 'utf8'));

let offset = 0;
for (;;) {
  const r = await call({
    issue: date, approval, subject: email.subject, html: email.html, text: email.text,
    footerAddress: email.footerAddress, offset,
  });
  console.log(`chunk @${r.offset}: sent ${r.sent}, throttled ${r.throttled}, blocked(allowlist) ${r.blockedAllowlist}, failed ${r.failed}, remaining ${r.remaining}`);
  console.log(r.gauge.line);
  if (r.gauge.planTripped || r.gauge.moveTripped || r.gauge.healthOverrides.length) {
    console.log('FR-020 GAUGE TRIPPED — record the planning task in specs/020-newsletter/tasks.md Follow-ups and flag the owner.');
  }
  if (r.remaining <= 0 || r.batch === 0) break;
  offset += r.batch;
}
console.log(`issue ${date}: send complete.`);
