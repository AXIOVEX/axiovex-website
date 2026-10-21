// Privacy-policy update notices — the Actions-side driver for
// functions/api/ops/privacy-notify.js (owner directive 2026-10-21).
// Computes the policy version key (sha256 of privacy/index.html as
// checked out), reads the "Last updated:" date from the page when
// POLICY_DATE is not supplied, and calls the endpoint until every
// active subscriber is notified for the version. The endpoint
// enforces exactly-once in D1, so this driver may re-run safely.
// DRY_RUN=true renders and counts only: nothing is sent and the
// endpoint writes nothing.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { save } from './io.mjs';

const secret = process.env.NEWSLETTER_SEND_SECRET;
if (!secret) { console.error('Privacy notice not sent: missing NEWSLETTER_SEND_SECRET'); process.exit(1); }
const dryRun = process.env.DRY_RUN === 'true';
const page = readFileSync('privacy/index.html', 'utf8');
const versionKey = createHash('sha256').update(page).digest('hex');
let policyDate = (process.env.POLICY_DATE || '').trim();
if (!policyDate) {
  const m = page.match(/Last updated:\s*([A-Z][a-z]+ \d{1,2}, \d{4})/);
  if (!m) { console.error('Privacy notice not sent: no "Last updated:" date found in privacy/index.html; supply POLICY_DATE'); process.exit(1); }
  policyDate = m[1];
}
const summary = (process.env.POLICY_SUMMARY || '').trim();

async function call(payload) {
  const response = await fetch('https://axiovexsystems.com/api/ops/privacy-notify', {
    method: 'POST',
    headers: { 'x-website-ops-secret': secret, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(240000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(`Privacy notify failed: HTTP ${response.status}, ${data.message || 'unexpected response'}`);
  return data;
}

try {
  if (dryRun) {
    const data = await call({ versionKey, policyDate, ...(summary ? { summary } : {}), dryRun: true });
    save('privacy-notify-dry-run.json', data);
    console.log('DRY RUN — nothing sent, nothing recorded.');
    console.log(`versionKey: ${data.versionKey}`);
    console.log(`policyDate: ${data.policyDate}`);
    console.log(`from: ${data.from}`);
    console.log(`active recipients: ${data.recipientCount}; already notified for this version: ${data.alreadyLogged}; would send: ${data.wouldSend}`);
    console.log(`subject: ${data.subject}`);
    console.log('--- message (text) ---');
    console.log(data.text);
    console.log('--- end of message ---');
  } else {
    const totals = { sent: 0, failed: 0, throttled: 0, blockedAllowlist: 0 };
    for (let round = 1; round <= 200; round++) {
      const data = await call({ versionKey, policyDate, ...(summary ? { summary } : {}), dryRun: false });
      totals.sent += data.sent; totals.failed += data.failed; totals.throttled += data.throttled; totals.blockedAllowlist += data.blockedAllowlist;
      console.log(`round ${round}: attempted ${data.attempted}, sent ${data.sent}, failed ${data.failed}, throttled ${data.throttled}, remaining ${data.remaining}`);
      save('privacy-notify.json', { versionKey, policyDate, totals, last: data, checkedAt: new Date().toISOString() });
      if (data.done) {
        console.log(`Privacy notice complete for version ${versionKey} (${policyDate}): ${totals.sent} sent this run, ${data.total} active subscribers, ${data.alreadyLogged} already notified before this run.`);
        break;
      }
      if (data.sent === 0) {
        console.error('Privacy notice incomplete: a round made no progress. Un-notified recipients are NOT logged; a re-run resumes without double-sending.');
        process.exit(1);
      }
      if (round === 200) { console.error('Privacy notice incomplete: round limit reached.'); process.exit(1); }
    }
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
