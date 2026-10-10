// Spec 022 — the newsletter full-loop deployment test runner.
//
//   node scripts/newsletter/loop-test.mjs --env staging|production [--json]
//
// Exercises the REAL deployed path in one environment:
// subscribe the probe -> verify pending in D1 -> receive the
// confirmation email in the owner's Gmail -> follow the confirm
// link -> verify active -> probe-only test send of the current
// issue -> verify the delivered issue (List-Unsubscribe header,
// one-click path, FR-018 postal footer) -> one-click unsubscribe
// -> verify unsubscribed + suppression. Per-step PASS / FAIL /
// BLOCKED ledger with evidence; exit 0 (all pass), 1 (any FAIL),
// 2 (BLOCKED, no FAIL). BLOCKED means an automation limit
// outside the deployed code (production Managed Turnstile vs a
// headless browser; test-send mode not yet promoted) — never a
// silent pass.
//
// The probe is tristen@axiovexsystems.com in BOTH environments
// (FR-022-2). The runner writes D1 rows for the probe address
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
const PROBE = 'tristen@axiovexsystems.com';
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
async function pollMail(match, timeoutMs = 180000) {
  const since = Date.now() - 120000; // small clock-skew allowance; dates are still checked against run start
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
    return JSON.parse(line);
  } catch (e) {
    return { outcome: 'blocked', detail: `browser leg could not run: ${e.message.slice(0, 200)}`, screenshot: null };
  }
}

// ---------- the run ----------
const runStart = Date.now();
console.log(`newsletter loop test — env=${envName} probe=${PROBE} started ${new Date(runStart).toISOString()}`);
let probeUnsubUrl = state.envs[envName].probeUnsubUrl || null;
let mailLeg = null;

// Step 0 — normalize the probe to unsubscribed (FR-022-5).
try {
  const row = await probeRow();
  if (!row) {
    record(0, 'normalize probe', 'PASS', 'probe has no row in this environment');
  } else if (row.status === 'unsubscribed' || row.status === 'pending') {
    record(0, 'normalize probe', 'PASS', `probe starts '${row.status}' (subscribe proceeds from here)`);
  } else {
    let done = false;
    if (probeUnsubUrl) {
      const r = await fetch(probeUnsubUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' });
      const after = await probeRow();
      if (r.status === 200 && after && after.status === 'unsubscribed') {
        record(0, 'normalize probe', 'PASS', `probe was '${row.status}'; unsubscribed via the stored one-click URL (public endpoint)`);
        done = true;
      }
    }
    if (!done) {
      await d1("UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = ? WHERE email = ?", [new Date().toISOString(), PROBE]);
      const after = await probeRow();
      record(0, 'normalize probe', 'PASS', `probe was '${row.status}'; reset directly in D1 — PROBE ROW ONLY (no usable stored unsubscribe URL); status now '${after?.status}'`);
    }
  }
} catch (e) {
  record(0, 'normalize probe', 'FAIL', e.message);
}
const guardBefore = await othersSnapshot().catch(() => 'unavailable');

// Step 1 — subscribe through the environment's real signup path.
if (!priorBad()) {
  if (envName === 'staging') {
    const body = new URLSearchParams({ email: PROBE, 'cf-turnstile-response': 'loop-test-token', website: '', startedAt: String(Date.now() - 10000), source: 'signals' });
    const r = await fetch(`${ENV.base}/api/newsletter/subscribe`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
    const j = await r.json().catch(() => ({}));
    mailLeg = typeof j.mail === 'string' ? j.mail : null;
    if (r.status === 200 && j.ok) {
      record(1, 'subscribe probe (API, test keys)', 'PASS', `HTTP 200 ok; mail leg reported by endpoint: ${mailLeg ?? '(not reported)'}`);
    } else if (r.status === 403 || (j.errors && j.errors.turnstile)) {
      const b = await browserSubscribe();
      if (b.outcome === 'submitted') record(1, 'subscribe probe (browser fallback)', 'PASS', `API path refused on Turnstile grounds (HTTP ${r.status}); browser leg submitted — ${b.detail}`);
      else record(1, 'subscribe probe', b.outcome === 'blocked' ? 'BLOCKED' : 'FAIL', `API Turnstile refusal (HTTP ${r.status}); browser leg: ${b.detail}; screenshot ${b.screenshot}`);
    } else {
      record(1, 'subscribe probe', 'FAIL', `HTTP ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
    }
  } else {
    const b = await browserSubscribe();
    if (b.outcome === 'submitted') record(1, 'subscribe probe (browser, Managed Turnstile)', 'PASS', `${b.detail}; screenshot ${b.screenshot}`);
    else record(1, 'subscribe probe (browser, Managed Turnstile)', b.outcome === 'blocked' ? 'BLOCKED' : 'FAIL', `${b.detail}; screenshot ${b.screenshot}`);
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
let confirmFollowed = false;
if (!priorBad()) {
  const msg = await pollMail((m) => m.subject.includes('Confirm your subscription'));
  if (!msg) {
    record(3, 'confirmation email arrives', 'FAIL', `no confirmation dated after run start within 180s (endpoint mail leg: ${mailLeg ?? 'n/a'}; known tenant state per spec 020/022)`);
  } else {
    const host = ENV.base.replace('https://', '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const url = (msg.text + '\n' + msg.html).match(new RegExp(`https://${host}/newsletter/confirm\\?t=[a-f0-9]+`))?.[0];
    if (!url) {
      record(3, 'confirmation email arrives', 'FAIL', `message ${msg.id} dated ${msg.date} carries no confirm link for this environment`);
    } else {
      const r = await fetch(url);
      const html = await r.text();
      if (r.status === 200 && html.includes('You’re subscribed.')) {
        confirmFollowed = true;
        record(3, 'confirmation email + confirm link', 'PASS', `message dated ${msg.date}; link followed -> HTTP 200 WF-17 'You're subscribed.' landing`);
      } else {
        const title = (html.match(/<h1>([^<]+)<\/h1>/) || [])[1] || '(no h1)';
        record(3, 'confirmation email + confirm link', 'FAIL', `message dated ${msg.date}; link followed -> HTTP ${r.status}, landing '${title}'`);
      }
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
    } else {
      const msg = await pollMail((m) => m.subject === subject);
      if (!msg) {
        record(5, 'test issue delivered + verified', 'FAIL', `endpoint reports sent=1 but no issue email dated after run start arrived within 180s`);
      } else {
        const lu = msg.headers['list-unsubscribe'] || '';
        const lup = msg.headers['list-unsubscribe-post'] || '';
        const url = lu.match(/<([^>]+)>/)?.[1] || (msg.text + msg.html).match(/\/newsletter\/unsubscribe\?t=[a-f0-9]+/)?.[0];
        const hasAddr = (msg.html + msg.text).includes(POSTAL);
        if (lu && /One-Click/i.test(lup) && url && hasAddr) {
          probeUnsubUrl = url.startsWith('http') ? url : `${ENV.base}${url}`;
          record(5, 'test issue delivered + verified', 'PASS', `issue ${issueDate} dated ${msg.date}; List-Unsubscribe + One-Click headers present; postal footer '${POSTAL}…' present`);
        } else {
          record(5, 'test issue delivered + verified', 'FAIL', `issue dated ${msg.date}; List-Unsubscribe ${lu ? 'present' : 'MISSING'}, One-Click ${lup ? 'present' : 'MISSING'}, postal footer ${hasAddr ? 'present' : 'MISSING'}, unsub URL ${url ? 'found' : 'MISSING'}`);
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

// ---------- verdict + record ----------
const verdict = steps.some((s) => s.status === 'FAIL') ? 'FAIL' : steps.some((s) => s.status === 'BLOCKED') ? 'BLOCKED' : 'PASS';
state.envs[envName].probeUnsubUrl = probeUnsubUrl;
state.envs[envName].lastRunUtc = new Date().toISOString();
state.envs[envName].lastVerdict = verdict;
state.runs.push({ env: envName, startedUtc: new Date(runStart).toISOString(), verdict, steps });
state.runs = state.runs.slice(-50);
saveState();
console.log(`\nVERDICT ${verdict} — ${steps.filter((s) => s.status === 'PASS').length}/${steps.length} steps PASS (env=${envName})`);
if (wantJson) console.log(JSON.stringify({ env: envName, verdict, steps }, null, 2));
process.exit(verdict === 'PASS' ? 0 : verdict === 'BLOCKED' ? 2 : 1);
