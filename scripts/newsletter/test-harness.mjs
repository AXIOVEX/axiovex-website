// Spec 020 T009 evidence harness (local): drives the REAL Pages
// Function modules against a D1-compatible shim backed by
// node:sqlite, with outbound mail captured in-process. Proves the
// subscribe -> confirm -> send -> unsubscribe -> resubscribe loop
// and the C-020-1 / C-020-2 falsifiers without a tenant app or a
// deployed D1 binding. Live-staging state is reported separately.
//
//   node scripts/newsletter/test-harness.mjs

import { DatabaseSync } from 'node:sqlite';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const EVIDENCE = process.env.HARNESS_EVIDENCE || '/tmp/spec020-harness';
mkdirSync(EVIDENCE, { recursive: true });

// ---------- D1 shim ----------
const raw = new DatabaseSync(':memory:');
raw.exec(readFileSync(path.join(ROOT, 'scripts', 'newsletter', 'schema.sql'), 'utf8'));
const db = {
  prepare(sql) {
    const stmt = raw.prepare(sql);
    let args = [];
    const api = {
      bind(...a) { args = a; return api; },
      async first() { const row = stmt.get(...args); return row === undefined ? null : row; },
      async all() { return { results: stmt.all(...args) }; },
      async run() { stmt.run(...args); return { success: true }; },
    };
    return api;
  },
};

// ---------- env ----------
const outbox = [];
const env = {
  ENVIRONMENT: 'staging',
  NEWSLETTER_DB: db,
  NEWSLETTER_TEST_ALLOWLIST: 'tristen@axiovexsystems.com',
  NEWSLETTER_TOKEN_SECRET: 'harness-token-secret-not-a-real-secret',
  NEWSLETTER_SEND_SECRET: 'harness-send-secret',
  NEWSLETTER_TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA', // CF public always-pass test secret
  NEWSLETTER_SITE_BASE: 'https://staging.axiovexsystems.com',
  NEWSLETTER_MAIL_CAPTURE: outbox,
};

const subscribe = (await import(path.join(ROOT, 'functions', 'api', 'newsletter', 'subscribe.js'))).onRequest;
const send = (await import(path.join(ROOT, 'functions', 'api', 'newsletter', 'send.js'))).onRequest;
const confirm = (await import(path.join(ROOT, 'functions', 'newsletter', 'confirm.js'))).onRequest;
const unsubGet = (await import(path.join(ROOT, 'functions', 'newsletter', 'unsubscribe.js'))).onRequestGet;
const unsubPost = (await import(path.join(ROOT, 'functions', 'newsletter', 'unsubscribe.js'))).onRequestPost;

const BASE = 'https://staging.axiovexsystems.com';
const OWNER = 'tristen@axiovexsystems.com';
const results = [];
function check(name, cond, detail = '') {
  results.push({ name, pass: Boolean(cond), detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}
const ctx = (request) => ({ request, env, waitUntil() {}, passThroughOnException() {} });
function formPost(url, fields) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'accept': 'application/json' },
    body: new URLSearchParams(fields).toString(),
  });
}
const subFields = (over = {}) => ({
  email: OWNER, 'cf-turnstile-response': 'dummy-token', website: '',
  startedAt: String(Date.now() - 10000), source: 'signals', ...over,
});
const rowOf = (email) => raw.prepare('SELECT * FROM subscribers WHERE email = ?').get(email);
const issueEmail = JSON.parse(readFileSync(path.join(ROOT, 'newsletter', 'issues', '2026-10-14.email.json'), 'utf8'));
const sendIssue = (over = {}) => send(ctx(new Request(BASE + '/api/newsletter/send', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-newsletter-send-secret': 'harness-send-secret' },
  body: JSON.stringify({ issue: '2026-10-14', approval: 'test-issue approval (harness)', subject: issueEmail.subject, html: issueEmail.html, text: issueEmail.text, footerAddress: issueEmail.footerAddress, ...over }),
}))).then((r) => r.json());

// ---------- negative ladder ----------
let res = await subscribe(ctx(formPost(BASE + '/api/newsletter/subscribe', subFields({ website: 'http://spam.example' }))));
let j = await res.json();
check('N1 honeypot -> apparent success, nothing stored', res.status === 200 && j.ok && !rowOf(OWNER) && outbox.length === 0);

res = await subscribe(ctx(new Request(BASE + '/api/newsletter/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: OWNER, pad: 'x'.repeat(9000) }) })));
check('N2 oversized payload -> 413', res.status === 413, `status ${res.status}`);

res = await subscribe(ctx(formPost(BASE + '/api/newsletter/subscribe', subFields({ 'cf-turnstile-response': '' }))));
check('N3 missing Turnstile token -> 422', res.status === 422, `status ${res.status}`);

env.NEWSLETTER_TURNSTILE_SECRET_KEY = '2x0000000000000000000000000000000AA'; // CF public always-fail test secret
res = await subscribe(ctx(formPost(BASE + '/api/newsletter/subscribe', subFields())));
check('N4 failing Turnstile -> 403, nothing stored', res.status === 403 && !rowOf(OWNER), `status ${res.status}`);
env.NEWSLETTER_TURNSTILE_SECRET_KEY = '1x0000000000000000000000000000000AA';

res = await send(ctx(new Request(BASE + '/api/newsletter/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })));
check('N5 send without secret -> 403', res.status === 403, `status ${res.status}`);
j = await sendIssue({ approval: '' });
check('N6 send without approval marker -> 422 (FR-005)', j.ok === false && /approval/.test(j.message || ''), j.message);

// ---------- subscribe (owner, allowlisted) ----------
res = await subscribe(ctx(formPost(BASE + '/api/newsletter/subscribe', subFields())));
j = await res.json();
const row1 = rowOf(OWNER);
check('S1 subscribe -> pending row + confirmation captured', res.status === 200 && j.ok && row1?.status === 'pending' && outbox.length === 1 && outbox[0].to === OWNER, `mail=${j.mail}`);
const confirmUrl = /https:\/\/staging\.axiovexsystems\.com\/newsletter\/confirm\?t=[a-f0-9]+/.exec(outbox[0].text)?.[0];
check('S1 confirmation email carries the confirm link', Boolean(confirmUrl));

// ---------- C-020-1 falsifier: pending address receives nothing ----------
const mailBefore = outbox.length;
j = await sendIssue();
check('F1 C-020-1: send with only a PENDING subscriber -> 0 sent', j.ok && j.assembled === 0 && j.sent === 0 && outbox.length === mailBefore, `assembled=${j.assembled} sent=${j.sent}`);
check('F1 gauge line present in send summary (FR-020)', typeof j.gauge?.line === 'string' && /active subscribers/.test(j.gauge.line), j.gauge?.line);

// ---------- confirm ----------
res = await confirm(ctx(new Request(confirmUrl)));
const confirmHtml = await res.text();
writeFileSync(path.join(EVIDENCE, 'landing-confirmed.html'), confirmHtml);
check('S2 confirm link -> State A page + status active', confirmHtml.includes('You\u2019re subscribed.') && rowOf(OWNER)?.status === 'active');

// ---------- first real send ----------
j = await sendIssue();
const issueMail = outbox[outbox.length - 1];
check('S3 send to ACTIVE owner -> exactly 1 issue mail', j.ok && j.sent === 1 && issueMail.subject === issueEmail.subject, `sent=${j.sent}`);
check('S3 issue mail carries List-Unsubscribe URL + footer link', Boolean(issueMail.unsubscribeUrl) && issueMail.html.includes('/newsletter/unsubscribe?t=') && issueMail.text.includes('Unsubscribe in one click'));
const sendsRow = raw.prepare('SELECT * FROM sends ORDER BY id DESC LIMIT 1').get();
check('S3 sends log: attempted/sent/duration recorded (FR-020)', sendsRow.recipient_count === 1 && sendsRow.sent_count === 1 && sendsRow.duration_ms >= 0, JSON.stringify({ attempted: sendsRow.recipient_count, sent: sendsRow.sent_count, duration_ms: sendsRow.duration_ms, bounces: sendsRow.bounce_count, complaints: sendsRow.complaint_count, throttle: sendsRow.throttle_events }));
check('S3 gauge after send: 1 active, 749 to PLAN', j.gauge.active === 1 && j.gauge.distanceToPlan === 749 && j.gauge.healthOverrides.length === 0, j.gauge.line);

// ---------- one-click unsubscribe (RFC 8058 POST) ----------
const unsubUrl = issueMail.unsubscribeUrl;
res = await unsubPost(ctx(new Request(unsubUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' })));
check('S4 one-click POST -> status unsubscribed immediately', res.status === 200 && rowOf(OWNER)?.status === 'unsubscribed');
j = await sendIssue();
check('S5 send after unsubscribe -> 0 sent (address excluded)', j.ok && j.assembled === 0 && j.sent === 0);

// ---------- resubscribe requires fresh confirmation (C-020-2) ----------
const mailBefore2 = outbox.length;
res = await subscribe(ctx(formPost(BASE + '/api/newsletter/subscribe', subFields())));
const row2 = rowOf(OWNER);
check('S6 resubscribe -> PENDING again (never active), fresh confirmation sent', res.status === 200 && row2?.status === 'pending' && outbox.length === mailBefore2 + 1);
j = await sendIssue();
check('F2 C-020-2: resubscribed-but-unconfirmed -> 0 sent', j.ok && j.sent === 0 && outbox.filter((m) => m.subject === issueEmail.subject).length === 1);

// ---------- fresh confirmation restores delivery; footer GET path ----------
const confirmUrl2 = /https:\/\/staging\.axiovexsystems\.com\/newsletter\/confirm\?t=[a-f0-9]+/.exec(outbox[outbox.length - 1].text)?.[0];
res = await confirm(ctx(new Request(confirmUrl2)));
check('S7 fresh confirmation -> active again', rowOf(OWNER)?.status === 'active');
j = await sendIssue();
check('S7 delivery restored -> 1 sent', j.ok && j.sent === 1);
const issueMail2 = outbox[outbox.length - 1];
res = await unsubGet(ctx(new Request(issueMail2.unsubscribeUrl)));
const unsubHtml = await res.text();
writeFileSync(path.join(EVIDENCE, 'landing-unsubscribed.html'), unsubHtml);
check('S8 footer GET unsubscribe -> State B page + status unsubscribed', unsubHtml.includes('You\u2019ve unsubscribed.') && rowOf(OWNER)?.status === 'unsubscribed');
res = await unsubGet(ctx(new Request(issueMail2.unsubscribeUrl)));
const againHtml = await res.text();
writeFileSync(path.join(EVIDENCE, 'landing-already.html'), againHtml);
check('S8 repeat unsubscribe -> State D (Nothing to change)', againHtml.includes('Nothing to change.'));

// ---------- expired confirmation token -> State C ----------
raw.prepare("INSERT INTO subscribers (email, status, confirm_token_hash, confirm_expires_at, created_at, source) VALUES ('expired@example.com', 'pending', ?, '2020-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z', 'harness')")
  .run(await (async () => { const { createHash } = await import('node:crypto'); return createHash('sha256').update('expired-token').digest('hex'); })());
res = await confirm(ctx(new Request(BASE + '/newsletter/confirm?t=expired-token')));
const expiredHtml = await res.text();
writeFileSync(path.join(EVIDENCE, 'landing-expired.html'), expiredHtml);
check('S9 expired confirm token -> State C page', expiredHtml.includes('That link has expired.'));

// ---------- spec 021 placement sources (FR-009 / C-021-2) ----------
// Each placement's form submits its own source; the endpoint stores
// exactly that value. Out-of-set or missing sources coerce to the
// pre-021 default 'signals'. (These addresses are outside the test
// allowlist, so their mail is blocked-allowlist by design — the
// stored row's source is the evidence.)
for (const src of ['signals-top', 'article', 'landing', 'home', 'footer']) {
  const addr = 'placement-' + src + '@example.com';
  res = await subscribe(ctx(formPost(BASE + '/api/newsletter/subscribe', subFields({ email: addr, source: src }))));
  j = await res.json();
  check('P1 source ' + src + ' stored verbatim', res.status === 200 && j.ok && rowOf(addr)?.source === src, `stored=${rowOf(addr)?.source}`);
}
res = await subscribe(ctx(formPost(BASE + '/api/newsletter/subscribe', subFields({ email: 'placement-bogus@example.com', source: 'billboard' }))));
j = await res.json();
check('P2 out-of-set source coerced to signals', res.status === 200 && j.ok && rowOf('placement-bogus@example.com')?.source === 'signals', `stored=${rowOf('placement-bogus@example.com')?.source}`);
res = await subscribe(ctx(formPost(BASE + '/api/newsletter/subscribe', subFields({ email: 'placement-missing@example.com', source: '' }))));
j = await res.json();
check('P3 missing source coerced to signals', res.status === 200 && j.ok && rowOf('placement-missing@example.com')?.source === 'signals', `stored=${rowOf('placement-missing@example.com')?.source}`);

// ---------- spec 022 probe-only test send (FR-022-3) ----------
// The loop test's send leg. Guardrails under test: the secret
// gate applies, any recipient but the hard-coded probe is
// refused before any send, an inactive probe sends 0, and an
// active probe receives exactly one mail even while another
// active, allowlisted subscriber exists (C-022-2 falsifier).
// The probe is per-environment (spec 022 read-path correction,
// 2026-10-10): this harness simulates ENVIRONMENT 'staging',
// whose probe is the owner's gmail; production's probe is
// tristen@axiovexsystems.com (OWNER above).
const SECOND = 'second-active@example.com';
const PROBE = 'tristen.pierson@gmail.com';
env.NEWSLETTER_TEST_ALLOWLIST = OWNER + ',' + SECOND + ',' + PROBE;
const lib = await import(path.join(ROOT, 'functions', 'api', 'newsletter', '_lib.js'));
const secondUnsubHash = await lib.sha256Hex(await lib.unsubscribeToken(env, SECOND));
raw.prepare("INSERT INTO subscribers (email, status, unsub_token_hash, created_at, source) VALUES (?, 'active', ?, ?, 'harness')")
  .run(SECOND, secondUnsubHash, new Date().toISOString());
const testSend = (over = {}) => send(ctx(new Request(BASE + '/api/newsletter/send', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-newsletter-send-secret': 'harness-send-secret' },
  body: JSON.stringify({ mode: 'test', testRecipient: PROBE, issue: '2026-10-14', subject: issueEmail.subject, html: issueEmail.html, text: issueEmail.text, footerAddress: issueEmail.footerAddress, ...over }),
}))).then((r) => r.json());

res = await send(ctx(new Request(BASE + '/api/newsletter/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'test', testRecipient: PROBE }) })));
check('LT1 test mode without secret -> 403', res.status === 403, `status ${res.status}`);

let outboxBefore = outbox.length;
j = await testSend({ testRecipient: SECOND });
check('LT2 test mode wrong recipient -> refused, no mail', j.ok === false && outbox.length === outboxBefore, j.message);

j = await testSend();
check('LT3 test mode with inactive probe (no row yet) -> sent 0, probeActive false', j.ok && j.probeActive === false && j.sent === 0 && outbox.length === outboxBefore, j.reason);

res = await subscribe(ctx(formPost(BASE + '/api/newsletter/subscribe', subFields({ email: PROBE }))));
const confirmUrl3 = /https:\/\/staging\.axiovexsystems\.com\/newsletter\/confirm\?t=[a-f0-9]+/.exec(outbox[outbox.length - 1].text)?.[0];
res = await confirm(ctx(new Request(confirmUrl3)));
check('LT4 setup: probe subscribed + confirmed -> active', rowOf(PROBE)?.status === 'active');
outboxBefore = outbox.length;
j = await testSend();
const lt4Mail = outbox[outbox.length - 1];
check('LT4 test send -> exactly 1 mail, to the probe only', j.ok && j.sent === 1 && j.mailStatus === 'sent' && outbox.length === outboxBefore + 1 && lt4Mail.to === PROBE && lt4Mail.subject === issueEmail.subject, `sent=${j.sent} mail=${j.mailStatus}`);
const lt4Row = raw.prepare("SELECT * FROM sends WHERE provider_ref = 'loop-test' ORDER BY id DESC LIMIT 1").get();
check('LT4 sends log marks the test send (provider_ref loop-test)', Boolean(lt4Row) && lt4Row.sent_count === 1 && lt4Row.recipient_count === 1);
j = await sendIssue();
check('LT4 control: list send reaches both active subscribers', j.ok && j.sent === 2, `sent=${j.sent}`);

console.log('\n' + results.filter((r) => r.pass).length + '/' + results.length + ' checks passed');
process.exit(results.every((r) => r.pass) ? 0 : 1);
