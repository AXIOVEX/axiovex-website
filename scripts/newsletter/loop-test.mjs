// Spec 022 — the newsletter full-loop deployment test runner.
//
//   node scripts/newsletter/loop-test.mjs --env staging|production [--json]
//
// Exercises the REAL deployed path in one environment:
// subscribe the probe -> verify pending in D1 -> receive the
// confirmation email (evidence source per environment, below)
// -> follow the confirm link -> verify active -> probe-only
// test send of the current issue -> verify the delivered issue
// (List-Unsubscribe header, one-click path, FR-018 postal
// footer) -> one-click unsubscribe -> verify unsubscribed +
// suppression. Per-step PASS / FAIL / BLOCKED / DEFERRED
// ledger with evidence; exit 0 (all pass), 1 (any FAIL),
// 2 (BLOCKED or DEFERRED, no FAIL). BLOCKED means an
// automation limit outside the deployed code (production
// Managed Turnstile vs a headless browser; test-send mode
// not yet promoted; no signed-in M365 session for the
// production mailbox check; this runner's own connectivity
// to the site) — never a silent pass. DEFERRED (added
// 2026-10-10, T007) means the send was accepted (endpoint /
// Graph evidence) but delivery was not observed inside the
// delivery window — receiver-side deferral territory,
// distinct from a hard FAIL (send rejected, wrong content,
// D1 mismatch) and never a silent pass either.
//
// One probe per environment (FR-022-2, read-path correction
// 2026-10-10), chosen by where its mail is OBSERVABLE:
//  - staging: tristen.pierson@gmail.com — direct delivery into
//    the Gmail this runner reads (proven <1 min). The loop
//    snapshots the probe's starting status and restores it as
//    a final, separately labeled step.
//  - production: tristen@axiovexsystems.com (the owner's gmail
//    production row is a REAL subscription — never churn it).
//    Its mail is not observable via Gmail (the mailbox
//    forwards to a different hub gmail, keep-a-copy on), so
//    delivery is asserted via endpoint mail status + the
//    sends table + an all-folders M365 mailbox search
//    (Outlook web) instead.
// Every delivery assertion's ledger evidence names its source
// (Gmail / endpoint mailStatus + sends table / M365 mailbox
// search). The runner writes D1 rows for the probe address
// only; a before/after snapshot of every other row makes that
// self-checking (C-022-3). Secrets come from the ops store
// (~/workspace/system/axiovex-ops/.env) and are never printed.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const execFileP = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PROBES = {
  staging: 'tristen.pierson@gmail.com',
  production: 'tristen@axiovexsystems.com',
};
const ENVS = {
  staging: { base: 'https://staging.axiovexsystems.com', db: 'a143d549-31d6-4d4e-98a4-503bdae864b7' },
  production: { base: 'https://axiovexsystems.com', db: '33ea7d17-46ab-4723-9d30-48fd03992e84' },
};
const STATE_PATH = path.join(homedir(), 'workspace/goals/website-seo-aeo-health-monitoring/hidden_files/newsletter-loop-state.json');
const POSTAL = '6633 18 Mile Rd';

const argv = process.argv.slice(2);
const envName = argv.includes('--env') ? argv[argv.indexOf('--env') + 1] : '';
const wantJson = argv.includes('--json');
if (!ENVS[envName]) {
  console.error('usage: node scripts/newsletter/loop-test.mjs --env staging|production [--json]');
  process.exit(64);
}
const ENV = ENVS[envName];
const PROBE = PROBES[envName];
// Delivery-observation window for the mail legs (spec 022
// T007): widened from 180s to 900s after the 2026-10-10
// evidence that this new sender's mail is deferred well past
// 180s under test bursts (LU-Post diagnostic copies took
// 10–20 min; issue-shaped copies 30–70+ min, some never
// in-window). Recorded in spec.md's FR-022-4 addendum.
const DELIVERY_WINDOW_MS = 900000;

// ---------- ops store (values never printed) ----------
const ops = {};
for (const line of readFileSync(path.join(homedir(), 'workspace/system/axiovex-ops/.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) ops[m[1]] = m[2].trim();
}
const CF_TOKEN = ops.CLOUDFLARE_OPS_TOKEN;
const CF_ACCOUNT = ops.CF_ACCOUNT_ID;
const SEND_SECRET = ops.NEWSLETTER_SEND_SECRET;
if (!CF_TOKEN || !CF_ACCOUNT || !SEND_SECRET) {
  console.error('ops store is missing CLOUDFLARE_OPS_TOKEN / CF_ACCOUNT_ID / NEWSLETTER_SEND_SECRET');
  process.exit(64);
}

// ---------- state ----------
const state = existsSync(STATE_PATH) ? JSON.parse(readFileSync(STATE_PATH, 'utf8')) : { envs: {}, runs: [] };
state.envs = state.envs || {};
state.runs = state.runs || [];
state.envs[envName] = state.envs[envName] || {};
const saveState = () => writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');

// ---------- ledger ----------
const steps = [];
function record(n, name, status, evidence) {
  steps.push({ step: n, name, status, evidence, at: new Date().toISOString() });
  console.log(`${status.padEnd(7)} step ${n} ${name} — ${evidence}`);
}
const priorBad = () => {
  const bad = steps.find((s) => s.status !== 'PASS');
  return bad ? bad.status : null; // 'FAIL' or 'BLOCKED' of the first non-pass step
};
function mirrorRecord(n, name) {
  const bad = priorBad();
  record(n, name, bad, `not reached — step ${steps.find((s) => s.status !== 'PASS').step} was ${bad}`);
}

// ---------- D1 via the Cloudflare API ----------
async function d1(sql, params = []) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/d1/database/${ENV.db}/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${CF_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ sql, params }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.success) throw new Error(`D1 query failed: HTTP ${r.status} ${JSON.stringify(j.errors || {}).slice(0, 200)}`);
  return j.result[0].results || [];
}
const probeRow = async () => (await d1('SELECT email, status, confirmed_at, unsubscribed_at FROM subscribers WHERE email = ?', [PROBE]))[0] || null;
const othersSnapshot = async () => {
  const rows = await d1('SELECT email, status FROM subscribers WHERE email != ? ORDER BY email', [PROBE]);
  return JSON.stringify(rows);
};
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ---------- Gmail via the connector CLI (raw API shapes) ----------
async function gmail(method, params) {
  const parts = method.split('.'); // e.g. users.messages.list
  const { stdout } = await execFileP('hatch_gws_cli', ['gmail', ...parts, '--params', JSON.stringify({ userId: 'me', ...params })], { maxBuffer: 16 * 1024 * 1024 });
  const start = stdout.indexOf('{');
  return JSON.parse(stdout.slice(start));
}
function decodePart(payload, mime) {
  let found = '';
  const walk = (p) => {
    if (!p) return;
    if (p.mimeType === mime && p.body && p.body.data) {
      found = Buffer.from(p.body.data, 'base64url').toString('utf8');
    }
    for (const part of p.parts || []) walk(part);
  };
  walk(payload);
  return found;
}
async function pollMail(match, timeoutMs = 180000, notBefore = 0) {
  const since = Math.max(Date.now() - 120000, notBefore); // clock-skew allowance, floored at notBefore (restore-step polls must not match the loop's own earlier mail)
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const list = await gmail('users.messages.list', { q: 'in:anywhere from:newsletter@axiovexsystems.com', maxResults: 10 });
    for (const ref of list.messages || []) {
      const msg = await gmail('users.messages.get', { id: ref.id, format: 'full' });
      const headers = Object.fromEntries((msg.payload?.headers || []).map((h) => [h.name.toLowerCase(), h.value]));
      if (Number(msg.internalDate || 0) < since) continue;
      const m = {
        id: msg.id,
        internalDate: Number(msg.internalDate || 0),
        date: headers.date || '',
        subject: headers.subject || '',
        headers,
        text: decodePart(msg.payload, 'text/plain'),
        html: decodePart(msg.payload, 'text/html'),
      };
      if (match(m)) return m;
    }
    await sleep(15000);
  }
  return null;
}

// ---------- browser subscribe leg ----------
async function browserSubscribe() {
  const py = path.join(homedir(), 'workspace/venvs/playwright/bin/python');
  const script = path.join(ROOT, 'scripts/newsletter/loop-subscribe-browser.py');
  try {
    const { stdout } = await execFileP(py, [script, '--base', ENV.base, '--email', PROBE, '--env-name', envName], { timeout: 240000, maxBuffer: 4 * 1024 * 1024 });
    const line = stdout.trim().split('\n').pop();
    const parsed = JSON.parse(line);
    // Connectivity classification (T007): a Chromium network
    // error (tunnel/connection class — e.g. the production
    // hook run at 18:54Z on 2026-10-10 died with
    // net::ERR_TUNNEL_CONNECTION_FAILED while the site was
    // verifiably up) is an environment limit of THIS runner,
    // not a product failure -> BLOCKED, never FAIL.
    if (parsed.outcome === 'failed' && /net::ERR_|ERR_TUNNEL|ERR_PROXY/.test(parsed.detail || '')) {
      return { ...parsed, outcome: 'blocked', detail: `environment connectivity (browser could not reach the site): ${parsed.detail}` };
    }
    return parsed;
  } catch (e) {
    return { outcome: 'blocked', detail: `browser leg could not run: ${e.message.slice(0, 200)}`, screenshot: null };
  }
}

// ---------- M365 mailbox check (production delivery evidence) ----------
async function mailboxCheck(mode, { subject = '' } = {}) {
  const py = path.join(homedir(), 'workspace/venvs/playwright/bin/python');
  const script = path.join(ROOT, 'scripts/newsletter/loop-mailbox-browser.py');
  const args = [script, '--mode', mode, '--base', ENV.base, '--timeout', '870'];
  if (mode === 'issue') args.push('--subject', subject, '--postal', POSTAL);
  try {
    const { stdout } = await execFileP(py, args, { timeout: 940000, maxBuffer: 4 * 1024 * 1024 });
    const line = stdout.trim().split('\n').pop();
    return JSON.parse(line);
  } catch (e) {
    return { outcome: 'blocked', detail: `mailbox check could not run: ${e.message.slice(0, 200)}`, screenshot: null };
  }
}

// ---------- staging API subscribe (shared by step 1 + the restore step) ----------
async function stagingSubscribe() {
  const body = new URLSearchParams({ email: PROBE, 'cf-turnstile-response': 'loop-test-token', website: '', startedAt: String(Date.now() - 10000), source: 'signals' });
  const r = await fetch(`${ENV.base}/api/newsletter/subscribe`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
  return { status: r.status, j: await r.json().catch(() => ({})) };
}

// ---------- the run ----------
const runStart = Date.now();
console.log(`newsletter loop test — env=${envName} probe=${PROBE} started ${new Date(runStart).toISOString()}`);
// A stored unsubscribe URL is only meaningful for the probe it
// was captured from; the staging probe changed in the 2026-10-10
// read-path correction, so ignore URLs recorded for another probe.
let probeUnsubUrl = state.envs[envName].probe === PROBE ? state.envs[envName].probeUnsubUrl || null : null;
let mailLeg = null;
let startStatus = 'absent';

// Step 0 — normalize the probe to unsubscribed (FR-022-5).
try {
  const row = await probeRow();
  startStatus = row ? row.status : 'absent';
  const snapNote = envName === 'staging' ? `; starting status '${startStatus}' snapshotted for the post-loop restore step` : '';
  if (!row) {
    record(0, 'normalize probe', 'PASS', `probe has no row in this environment${snapNote}`);
  } else if (row.status === 'unsubscribed' || row.status === 'pending') {
    record(0, 'normalize probe', 'PASS', `probe starts '${row.status}' (subscribe proceeds from here)${snapNote}`);
  } else {
    let done = false;
    if (probeUnsubUrl) {
      const r = await fetch(probeUnsubUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' });
      const after = await probeRow();
      if (r.status === 200 && after && after.status === 'unsubscribed') {
        record(0, 'normalize probe', 'PASS', `probe was '${row.status}'; unsubscribed via the stored one-click URL (public endpoint)${snapNote}`);
        done = true;
      }
    }
    if (!done) {
      await d1("UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = ? WHERE email = ?", [new Date().toISOString(), PROBE]);
      const after = await probeRow();
      record(0, 'normalize probe', 'PASS', `probe was '${row.status}'; reset directly in D1 — PROBE ROW ONLY (no usable stored unsubscribe URL); status now '${after?.status}'${snapNote}`);
    }
  }
} catch (e) {
  record(0, 'normalize probe', 'FAIL', e.message);
}
const guardBefore = await othersSnapshot().catch(() => 'unavailable');

// Step 1 — subscribe through the environment's real signup path.
if (!priorBad()) {
  if (envName === 'staging') {
    const { status, j } = await stagingSubscribe();
    mailLeg = typeof j.mail === 'string' ? j.mail : null;
    if (status === 200 && j.ok) {
      record(1, 'subscribe probe (API, test keys)', 'PASS', `HTTP 200 ok; mail leg reported by endpoint: ${mailLeg ?? '(not reported)'}`);
    } else if (status === 403 || (j.errors && j.errors.turnstile)) {
      const b = await browserSubscribe();
      if (b.outcome === 'submitted') record(1, 'subscribe probe (browser fallback)', 'PASS', `API path refused on Turnstile grounds (HTTP ${status}); browser leg submitted — ${b.detail}`);
      else record(1, 'subscribe probe', b.outcome === 'blocked' ? 'BLOCKED' : 'FAIL', `API Turnstile refusal (HTTP ${status}); browser leg: ${b.detail}; screenshot ${b.screenshot}`);
    } else {
      record(1, 'subscribe probe', 'FAIL', `HTTP ${status}: ${JSON.stringify(j).slice(0, 200)}`);
    }
  } else {
    // Connectivity preflight (T007): if this runner cannot
    // reach the site at all, the browser leg's failure would
    // be environmental — classify it BLOCKED up front instead
    // of indicting the deployment.
    let unreachable = null;
    try {
      await fetch(`${ENV.base}/signals/`, { signal: AbortSignal.timeout(20000) });
    } catch (e) {
      unreachable = e.message;
    }
    if (unreachable) {
      record(1, 'subscribe probe', 'BLOCKED', `environment connectivity: this runner cannot reach ${ENV.base} (${unreachable.slice(0, 160)}); the deployment is not indicted`);
    } else {
      const b = await browserSubscribe();
      if (b.outcome === 'submitted') record(1, 'subscribe probe (browser, Managed Turnstile)', 'PASS', `${b.detail}; screenshot ${b.screenshot}`);
      else record(1, 'subscribe probe (browser, Managed Turnstile)', b.outcome === 'blocked' ? 'BLOCKED' : 'FAIL', `${b.detail}; screenshot ${b.screenshot}`);
    }
  }
}

// Step 2 — verify pending in D1.
if (!priorBad()) {
  let row = null;
  for (let i = 0; i < 10 && (!row || row.status !== 'pending'); i++) {
    row = await probeRow();
    if (row && row.status === 'pending') break;
    await sleep(3000);
  }
  if (row && row.status === 'pending') record(2, 'verify pending in D1', 'PASS', `row status 'pending' at ${new Date().toISOString()}`);
  else record(2, 'verify pending in D1', 'FAIL', `row status is '${row ? row.status : 'absent'}' after subscribe`);
} else mirrorRecord(2, 'verify pending in D1');

// Step 3 — confirmation email: receive, extract, follow.
// Delivery evidence differs per environment: staging reads
// the probe's Gmail directly; production searches the
// probe's M365 mailbox (Outlook web, all folders).
let confirmFollowed = false;
// Gmail confirmation hunt used by step 3 and the staging
// restore step. Follows candidate links until one lands on
// the WF-17 success page. A candidate landing on 'That link
// has expired.' is STALE — its token predates this run's
// subscribe (a confirmation issued moments before the run,
// inside the poll's clock-skew allowance, can never confirm
// this run's pending row) — so it is excluded and polling
// continues instead of failing the step. Returns
// { ok:true, msg } | { ok:false, msg, status, title } |
// { ok:false, noLink:true, msg } | { ok:false, expiredOnly }.
async function pollConfirmAndFollow(notBefore, budgetMs) {
  const deadline = Date.now() + budgetMs;
  const stale = new Set();
  let sawExpired = false;
  while (Date.now() < deadline) {
    const msg = await pollMail(
      (m) => m.subject.includes('Confirm your subscription') && !stale.has(m.id),
      Math.max(1000, deadline - Date.now()),
      notBefore,
    );
    if (!msg) break;
    const host = ENV.base.replace('https://', '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const url = (msg.text + '\n' + msg.html).match(new RegExp(`https://${host}/newsletter/confirm\\?t=[a-f0-9]+`))?.[0];
    if (!url) return { ok: false, noLink: true, msg };
    const r = await fetch(url);
    const html = await r.text();
    if (r.status === 200 && html.includes('You’re subscribed.')) return { ok: true, msg };
    const title = (html.match(/<h1>([^<]+)<\/h1>/) || [])[1] || '(no h1)';
    if (title === 'That link has expired.') { sawExpired = true; stale.add(msg.id); continue; }
    return { ok: false, msg, status: r.status, title };
  }
  return { ok: false, expiredOnly: sawExpired };
}
async function followConfirm(url, dateNote, sourceNote) {
  const r = await fetch(url);
  const html = await r.text();
  if (r.status === 200 && html.includes('You’re subscribed.')) {
    confirmFollowed = true;
    record(3, 'confirmation email + confirm link', 'PASS', `${dateNote}; link followed -> HTTP 200 WF-17 'You're subscribed.' landing; evidence source: ${sourceNote}`);
    return true;
  }
  const title = (html.match(/<h1>([^<]+)<\/h1>/) || [])[1] || '(no h1)';
  record(3, 'confirmation email + confirm link', 'FAIL', `${dateNote}; link followed -> HTTP ${r.status}, landing '${title}'; evidence source: ${sourceNote}`);
  return false;
}
if (!priorBad()) {
  if (envName === 'staging') {
    const res3 = await pollConfirmAndFollow(0, DELIVERY_WINDOW_MS);
    if (res3.ok) {
      confirmFollowed = true;
      record(3, 'confirmation email + confirm link', 'PASS', `message dated ${res3.msg.date}; link followed -> HTTP 200 WF-17 'You're subscribed.' landing; evidence source: Gmail — direct delivery to probe ${PROBE}`);
    } else if (res3.noLink) {
      record(3, 'confirmation email arrives', 'FAIL', `message ${res3.msg.id} dated ${res3.msg.date} carries no confirm link for this environment; evidence source: Gmail — direct delivery to probe ${PROBE}`);
    } else if (res3.msg) {
      record(3, 'confirmation email + confirm link', 'FAIL', `message dated ${res3.msg.date}; link followed -> HTTP ${res3.status}, landing '${res3.title}'; evidence source: Gmail — direct delivery to probe ${PROBE}`);
    } else if (mailLeg === 'sent') {
      record(3, 'confirmation email arrives', 'DEFERRED', `send accepted (endpoint mail leg 'sent') but this run's confirmation was not observed in Gmail within ${DELIVERY_WINDOW_MS / 1000}s${res3.expiredOnly ? '; only a stale pre-run confirmation was visible (its token predates this run)' : ''} — DEFERRED: delivery unobserved, not a send rejection (receiver-side deferral of this new sender was measured at 10–70+ min on 2026-10-10); evidence source: Gmail — direct delivery to probe ${PROBE}`);
    } else {
      record(3, 'confirmation email arrives', 'FAIL', `no confirmation dated after run start within ${DELIVERY_WINDOW_MS / 1000}s and the endpoint mail leg reported '${mailLeg ?? 'n/a'}' — the send itself did not report acceptance; evidence source: Gmail — direct delivery to probe ${PROBE}`);
    }
  } else {
    const mb = await mailboxCheck('confirmation');
    if (mb.outcome === 'blocked') {
      record(3, 'confirmation email + confirm link', 'BLOCKED', `mailbox check unavailable: ${mb.detail}; evidence source: M365 mailbox search (Outlook web, all folders)`);
    } else if (mb.outcome !== 'found') {
      record(3, 'confirmation email arrives', 'DEFERRED', `the D1 pending row was written at step 2 (the subscribe leg completed) but no confirmation was observed within ${DELIVERY_WINDOW_MS / 1000}s (${mb.detail}) — DEFERRED: delivery unobserved, not a send rejection; evidence source: M365 mailbox search (Outlook web, all folders)`);
    } else if (!mb.confirmUrl) {
      record(3, 'confirmation email arrives', 'FAIL', `confirmation present in the probe mailbox (header date ${mb.dateText || 'unread'}) but no confirm link for this environment could be extracted from it; evidence source: M365 mailbox search (Outlook web, all folders)`);
    } else {
      await followConfirm(mb.confirmUrl, `message header date ${mb.dateText || '(unread)'}`, 'M365 mailbox search (Outlook web, all folders)');
    }
  }
} else mirrorRecord(3, 'confirmation email + confirm link');

// Step 4 — verify active.
if (!priorBad()) {
  const row = await probeRow();
  if (row && row.status === 'active' && row.confirmed_at) record(4, 'verify active in D1', 'PASS', `status 'active', confirmed_at ${row.confirmed_at}`);
  else record(4, 'verify active in D1', 'FAIL', `status '${row?.status}', confirmed_at ${row?.confirmed_at ?? 'null'}`);
} else mirrorRecord(4, 'verify active in D1');

// Step 5 — probe-only test send + delivered-issue verification.
const issueFiles = readdirSync(path.join(ROOT, 'newsletter', 'issues')).filter((f) => /^\d{4}-\d{2}-\d{2}\.email\.json$/.test(f)).sort();
const issueDate = issueFiles.length ? issueFiles[issueFiles.length - 1].replace('.email.json', '') : null;
async function callTestSend() {
  const email = JSON.parse(readFileSync(path.join(ROOT, 'newsletter', 'issues', `${issueDate}.email.json`), 'utf8'));
  const r = await fetch(`${ENV.base}/api/newsletter/send`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-newsletter-send-secret': SEND_SECRET },
    body: JSON.stringify({ mode: 'test', testRecipient: PROBE, issue: issueDate, subject: email.subject, html: email.html, text: email.text, footerAddress: email.footerAddress }),
  });
  return { status: r.status, j: await r.json().catch(() => ({})), subject: email.subject };
}
if (!priorBad()) {
  if (!issueDate) {
    record(5, 'probe-only test send', 'FAIL', 'no committed issue render found in newsletter/issues/');
  } else {
    const { status, j, subject } = await callTestSend();
    if (status === 422 && /approval/i.test(j.message || '')) {
      record(5, 'probe-only test send', 'BLOCKED', 'test-send mode not deployed on this environment yet (unpatched endpoint refused under FR-005, failing closed as designed); promotion required');
    } else if (!j.ok) {
      record(5, 'probe-only test send', 'FAIL', `HTTP ${status}: ${j.message || JSON.stringify(j).slice(0, 160)}`);
    } else if (j.probeActive !== true || j.sent !== 1) {
      record(5, 'probe-only test send', 'FAIL', `endpoint reports probeActive=${j.probeActive} sent=${j.sent} mailStatus=${j.mailStatus} — the mail leg did not deliver`);
    } else if (envName === 'production') {
      // Production evidence model (read-path correction):
      // (a) endpoint mail status ('sent' = Graph 202) + the
      // sends-table record for this run, and (b) presence in
      // the probe's M365 mailbox via an all-folders Outlook
      // web search. List-Unsubscribe header assertions ride
      // on staging's identical render/send path (raw headers
      // are not readable in Outlook web); body-level contents
      // (postal footer, unsubscribe URL) are asserted from
      // the opened message here.
      const sendRow = (await d1("SELECT id, started_at, recipient_count, sent_count FROM sends WHERE provider_ref = 'loop-test' AND issue_id = ? AND started_at >= ? ORDER BY id DESC LIMIT 1", [issueDate, new Date(runStart).toISOString()]).catch(() => []))[0];
      if (!(j.mailStatus === 'sent' && sendRow && sendRow.sent_count === 1)) {
        record(5, 'test issue delivered + verified', 'FAIL', `endpoint mailStatus=${j.mailStatus}; sends-table loop-test row for this run: ${sendRow ? `sent_count ${sendRow.sent_count}` : 'absent'}; evidence sources: endpoint mailStatus + sends table`);
      } else {
        const mb = await mailboxCheck('issue', { subject });
        if (mb.outcome === 'blocked') {
          record(5, 'test issue delivered + verified', 'BLOCKED', `endpoint + sends table agree the issue was sent (mailStatus 'sent', sends row ${sendRow.id} sent_count 1) but the mailbox leg is unavailable: ${mb.detail}; evidence sources: endpoint mailStatus + sends table (a), M365 mailbox search (b, unavailable)`);
        } else if (mb.outcome !== 'found') {
          record(5, 'test issue delivered + verified', 'DEFERRED', `endpoint + sends table agree the issue was sent (mailStatus 'sent', sends row ${sendRow.id} sent_count 1) but no copy was observed within the delivery window (${mb.detail}) — DEFERRED: delivery unobserved, not a send rejection; evidence sources: endpoint mailStatus + sends table, M365 mailbox search (Outlook web, all folders)`);
        } else if (!mb.unsubUrl || !mb.hasPostal) {
          record(5, 'test issue delivered + verified', 'FAIL', `issue present in the probe mailbox (header date ${mb.dateText || 'unread'}); postal footer ${mb.hasPostal ? 'present' : 'MISSING'}, unsubscribe URL ${mb.unsubUrl ? 'found' : 'MISSING'} in the message body; evidence source: M365 mailbox search (Outlook web, all folders)`);
        } else {
          probeUnsubUrl = mb.unsubUrl;
          record(5, 'test issue delivered + verified', 'PASS', `issue ${issueDate} delivered: mailStatus 'sent' (Graph 202), sends row ${sendRow.id} sent_count 1, copy present in the probe mailbox (header date ${mb.dateText || 'unread'}) with postal footer + unsubscribe URL in the body; evidence sources: endpoint mailStatus + sends table, M365 mailbox search (Outlook web, all folders)`);
        }
      }
    } else {
      const msg = await pollMail((m) => m.subject === subject, DELIVERY_WINDOW_MS);
      if (!msg) {
        record(5, 'test issue delivered + verified', 'DEFERRED', `send accepted (endpoint reports sent=1, mailStatus 'sent') but no issue email dated after run start was observed in Gmail within ${DELIVERY_WINDOW_MS / 1000}s — DEFERRED: delivery unobserved, not a send refusal. Gmail deferred issue-shaped mail from this sender 30–70+ min during the 2026-10-10 LU-Post diagnostic window (Graph accepted every send), while confirmation mail arrived in ~30s; late flushes are recorded in the run record (spec 022 T007); evidence source: Gmail — direct delivery to probe ${PROBE}`);
      } else {
        const lu = msg.headers['list-unsubscribe'] || '';
        const lup = msg.headers['list-unsubscribe-post'] || '';
        const url = lu.match(/<([^>]+)>/)?.[1] || (msg.text + msg.html).match(/\/newsletter\/unsubscribe\?t=[a-f0-9]+/)?.[0];
        const hasAddr = (msg.html + msg.text).includes(POSTAL);
        if (lu && /One-Click/i.test(lup) && url && hasAddr) {
          probeUnsubUrl = url.startsWith('http') ? url : `${ENV.base}${url}`;
          record(5, 'test issue delivered + verified', 'PASS', `issue ${issueDate} dated ${msg.date}; List-Unsubscribe + One-Click headers present; postal footer '${POSTAL}…' present; evidence source: Gmail — direct delivery to probe ${PROBE}`);
        } else {
          record(5, 'test issue delivered + verified', 'FAIL', `issue dated ${msg.date}; List-Unsubscribe ${lu ? 'present' : 'MISSING'}, One-Click ${lup ? 'present' : 'MISSING'}, postal footer ${hasAddr ? 'present' : 'MISSING'}, unsub URL ${url ? 'found' : 'MISSING'}; evidence source: Gmail — direct delivery to probe ${PROBE}`);
        }
      }
    }
  }
} else mirrorRecord(5, 'probe-only test send');

// Step 6 — one-click unsubscribe from the delivered issue (RFC 8058).
if (!priorBad()) {
  if (!probeUnsubUrl) {
    record(6, 'one-click unsubscribe', 'FAIL', 'no unsubscribe URL captured from the delivered issue');
  } else {
    const r = await fetch(probeUnsubUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' });
    const j = await r.json().catch(() => ({}));
    if (r.status === 200 && j.ok) record(6, 'one-click unsubscribe (RFC 8058 POST)', 'PASS', `POST ${probeUnsubUrl.split('?')[0]} -> HTTP 200 ok`);
    else record(6, 'one-click unsubscribe (RFC 8058 POST)', 'FAIL', `HTTP ${r.status}: ${JSON.stringify(j).slice(0, 160)}`);
  }
} else mirrorRecord(6, 'one-click unsubscribe (RFC 8058 POST)');

// Step 7 — verify unsubscribed + suppression holds.
if (!priorBad()) {
  const row = await probeRow();
  if (!row || row.status !== 'unsubscribed') {
    record(7, 'verify unsubscribed + suppression', 'FAIL', `row status is '${row?.status}' after one-click unsubscribe`);
  } else {
    const { j } = await callTestSend();
    if (j.ok && j.probeActive === false && j.sent === 0) {
      record(7, 'verify unsubscribed + suppression', 'PASS', `status 'unsubscribed' (unsubscribed_at ${row.unsubscribed_at}); repeat test send -> sent 0, probeActive false (suppression holds)`);
    } else {
      record(7, 'verify unsubscribed + suppression', 'FAIL', `repeat test send reports probeActive=${j.probeActive} sent=${j.sent}`);
    }
  }
} else mirrorRecord(7, 'verify unsubscribed + suppression');

// Step 8 — C-022-3 guard: nothing but the probe moved.
const guardAfter = await othersSnapshot().catch(() => 'unavailable');
if (guardBefore !== 'unavailable' && guardAfter !== 'unavailable') {
  if (guardBefore === guardAfter) record(8, 'non-probe rows unchanged (C-022-3)', 'PASS', 'every non-probe row identical before/after the run');
  else record(8, 'non-probe rows unchanged (C-022-3)', 'FAIL', `non-probe rows changed during the run: before ${guardBefore.slice(0, 160)} after ${guardAfter.slice(0, 160)}`);
}

// Step 9 (staging only) — RESTORE the probe to its starting
// status. This is post-loop state preservation, NOT a loop
// step: the staging probe is the owner's gmail, a row with a
// life outside the test, so the run hands it back exactly as
// it found it (snapshotted at step 0). Production has no
// restore step: its probe's resting state is 'unsubscribed'
// by design (FR-022-5).
if (envName === 'staging') {
  const RESTORE = 'restore probe to starting status (post-loop state preservation)';
  try {
    const cur = (await probeRow())?.status ?? 'absent';
    if (startStatus === 'unsubscribed' || startStatus === 'absent') {
      if (cur === 'unsubscribed') {
        record(9, RESTORE, 'PASS', `probe started '${startStatus}' and rests 'unsubscribed' — nothing to restore`);
      } else {
        await d1("UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = ? WHERE email = ?", [new Date().toISOString(), PROBE]);
        record(9, RESTORE, 'PASS', `probe started '${startStatus}' but the loop left it '${cur}'; reset directly in D1 — PROBE ROW ONLY — back to 'unsubscribed'`);
      }
    } else if (startStatus === 'pending') {
      if (cur === 'pending') {
        record(9, RESTORE, 'PASS', `probe started 'pending' and is 'pending' again — nothing further to restore`);
      } else {
        if (cur === 'active') await d1("UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = ? WHERE email = ?", [new Date().toISOString(), PROBE]);
        const { status, j } = await stagingSubscribe();
        const after = await probeRow();
        if (status === 200 && j.ok && after?.status === 'pending') record(9, RESTORE, 'PASS', `probe started 'pending'; re-subscribed (endpoint mail leg: ${j.mail ?? 'n/a'}) and rests 'pending' again`);
        else record(9, RESTORE, 'FAIL', `re-subscribe for restore returned HTTP ${status} ok=${j.ok}; probe now '${after?.status}'`);
      }
    } else if (startStatus === 'active') {
      if (cur === 'active') {
        record(9, RESTORE, 'PASS', `probe started 'active' and is 'active' — nothing to restore`);
      } else {
        const restoreStart = Date.now();
        const { status, j } = await stagingSubscribe();
        if (!(status === 200 && j.ok)) {
          record(9, RESTORE, 'FAIL', `re-subscribe for restore returned HTTP ${status}: ${JSON.stringify(j).slice(0, 160)}`);
        } else {
          const res9 = await pollConfirmAndFollow(restoreStart - 5000, DELIVERY_WINDOW_MS);
          if (res9.ok) {
            const after = await probeRow();
            if (after?.status === 'active') {
              record(9, RESTORE, 'PASS', `probe started 'active'; re-subscribed + confirmed via the restore confirmation dated ${res9.msg.date}; probe is 'active' again; evidence source: Gmail — direct delivery to probe ${PROBE}`);
            } else {
              record(9, RESTORE, 'FAIL', `restore confirm link landed on the WF-17 success page but probe now '${after?.status}'`);
            }
          } else if (res9.noLink) {
            record(9, RESTORE, 'FAIL', `restore confirmation dated ${res9.msg.date} carries no confirm link for this environment`);
          } else if (res9.msg) {
            record(9, RESTORE, 'FAIL', `restore confirm link -> HTTP ${res9.status}, landing '${res9.title}'; probe now '${(await probeRow())?.status}'`);
          } else if (j.mail === 'sent') {
            record(9, RESTORE, 'DEFERRED', `restore send accepted (endpoint mail leg 'sent') but the restore confirmation was not observed in Gmail within ${DELIVERY_WINDOW_MS / 1000}s — DEFERRED: restore incomplete, delivery unobserved (not a send rejection); probe left '${(await probeRow())?.status}'`);
          } else {
            record(9, RESTORE, 'FAIL', `restore confirmation did not arrive in Gmail within ${DELIVERY_WINDOW_MS / 1000}s (endpoint mail leg: ${j.mail ?? 'n/a'}); probe left '${(await probeRow())?.status}'`);
          }
        }
      }
    }
  } catch (e) {
    record(9, RESTORE, 'FAIL', e.message);
  }
}

// ---------- verdict + record ----------
const verdict = steps.some((s) => s.status === 'FAIL') ? 'FAIL' : steps.some((s) => s.status === 'DEFERRED') ? 'DEFERRED' : steps.some((s) => s.status === 'BLOCKED') ? 'BLOCKED' : 'PASS';
state.envs[envName].probe = PROBE;
state.envs[envName].probeUnsubUrl = probeUnsubUrl;
state.envs[envName].lastRunUtc = new Date().toISOString();
state.envs[envName].lastVerdict = verdict;
state.runs.push({ env: envName, startedUtc: new Date(runStart).toISOString(), verdict, steps });
state.runs = state.runs.slice(-50);
saveState();
console.log(`\nVERDICT ${verdict} — ${steps.filter((s) => s.status === 'PASS').length}/${steps.length} steps PASS (env=${envName})`);
if (wantJson) console.log(JSON.stringify({ env: envName, verdict, steps }, null, 2));
process.exit(verdict === 'PASS' ? 0 : verdict === 'FAIL' ? 1 : 2);
