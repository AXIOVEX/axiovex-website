import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderReportEmail, bytes, count } from '../../functions/api/ops/_report-email.js';
import { renderEmail } from '../newsletter/render.mjs';
import { onRequest } from '../../functions/api/ops/preview.js';
test('email metrics are rounded, labeled and rendered as semantic HTML', () => {
  const email = renderReportEmail({ kind: 'daily', report: 'Report status: **PARTIAL — limitations**\n\n# Axiovex website — daily report\n\n2026-10-18 through 2026-10-19 (exclusive), America/New_York.\n\n## Measured facts\n\n| Metric | Current | Comparison | Computed change |\n|---|---:|---:|---|\n| requests | 1181 | 1581.142857142857 | -25.3% |\n| bytes | 16360882 | 32238891.85714286 | -49.3% |\n\n- 200 (OK): 1012' });
  assert.match(email.html, /<thead>/);
  assert.match(email.html, /1,181/);
  assert.match(email.html, /1,581\.1/);
  assert.match(email.html, /16\.4 MB/);
  assert.match(email.html, /32\.2 MB/);
  assert.match(email.html, /October 18, 2026/);
  assert.match(email.html, /Partial data coverage/);
  assert.ok(!email.html.includes('**PARTIAL'));
  assert.ok(!email.html.includes('| requests |'));
  assert.ok(!email.html.includes('1581.142857'));
  assert.equal(bytes(598308), '598.3 KB');
  assert.equal(count(1181), '1,181');
});
test('raw source text cannot inject active HTML into reports or newsletters', () => {
  const report = renderReportEmail({ report: '<img src=x onerror=alert(1)> **Evidence** [source](https://example.com/)' });
  assert.ok(!report.html.includes('<img src=x'));
  assert.match(report.html, /&lt;img/);
  const issue = JSON.parse(readFileSync('newsletter/issues/2026-10-14.json', 'utf8'));
  issue.lede = '<script>bad()</script>';
  issue.article.url = 'javascript:alert(1)';
  const newsletter = renderEmail(issue);
  assert.ok(!newsletter.html.includes('<script>'));
  assert.ok(!newsletter.html.includes('href="javascript:'));
  assert.match(newsletter.html, /role="presentation"/);
  assert.match(newsletter.html, /\{\{UNSUBSCRIBE_URL\}\}/);
  assert.match(newsletter.html, /6633 18 Mile Rd/);
});
const env = { ENVIRONMENT: 'production', NEWSLETTER_SEND_SECRET: 'test-secret',
  NEWSLETTER_GRAPH_TENANT_ID: 'tenant', NEWSLETTER_GRAPH_CLIENT_ID: 'client', NEWSLETTER_GRAPH_CLIENT_SECRET: 'test-client-secret' };
const request = body => new Request('https://axiovexsystems.com/api/ops/preview', { method: 'POST', headers: { 'content-type': 'application/json', 'x-website-ops-secret': 'test-secret' }, body: JSON.stringify(body) });
const preview = { kind: 'newsletter', date: '2026-10-14', subject: 'The Axiovex Signal', html: '<html><body>Customer edition</body></html>', text: 'Customer edition' };
test('preview cannot address Rockson or any subscriber', async () => {
  const response = await onRequest({ env, request: request({ ...preview, to: 'rockson@axiovexsystems.com' }) });
  assert.equal(response.status, 422);
});
test('preview sends multipart HTML and text only to Tristen, without touching subscriber storage', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return url.includes('login.microsoftonline.com') ? Response.json({ access_token: 'test-token' }) : new Response(null, { status: 202 });
  });
  const response = await onRequest({ env: { ...env, NEWSLETTER_DB: { prepare() { throw new Error('must not touch subscriber storage'); } } }, request: request(preview) });
  assert.equal(response.status, 202);
  assert.equal((await response.json()).recipient, 'tristen@axiovexsystems.com');
  const mime = Buffer.from(calls[1].options.body, 'base64').toString('utf8');
  assert.match(mime, /To: tristen@axiovexsystems\.com/);
  assert.ok(!mime.includes('rockson@'));
  assert.match(mime, /multipart\/alternative/);
  assert.match(mime, /Content-Type: text\/html/);
  assert.match(mime, /Content-Type: text\/plain/);
  assert.match(mime, /\[REVIEW ONLY\]/);
});
