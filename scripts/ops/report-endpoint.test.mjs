import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../../functions/api/ops/report.js';
const env = { ENVIRONMENT: 'production', NEWSLETTER_SEND_SECRET: 'test-automation-secret',
  NEWSLETTER_GRAPH_TENANT_ID: 'test-tenant', NEWSLETTER_GRAPH_CLIENT_ID: 'test-client', NEWSLETTER_GRAPH_CLIENT_SECRET: 'test-microsoft-secret' };
function call(body = { kind: 'daily', report: 'Measured traffic report.' }, overrides = {}, headers = {}) {
  return onRequest({ env: { ...env, ...overrides }, request: new Request('https://axiovexsystems.com/api/ops/report', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-website-ops-secret': env.NEWSLETTER_SEND_SECRET, ...headers },
    body: JSON.stringify(body),
  }) });
}
test('report endpoint rejects unauthenticated requests before making any Microsoft call', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('must not call Microsoft'); });
  assert.equal((await call(undefined, {}, { 'x-website-ops-secret': 'wrong' })).status, 403);
  assert.equal(fetch.mock.callCount(), 0);
});
test('report endpoint fixes recipients, rejects overrides and is production-only', async () => {
  assert.equal((await call({ kind: 'daily', report: 'test', to: 'other@example.com' })).status, 422);
  assert.equal((await call(undefined, { ENVIRONMENT: 'staging' })).status, 409);
  assert.equal((await call(undefined, { NEWSLETTER_GRAPH_CLIENT_SECRET: '' })).status, 503);
  assert.equal((await call({ kind: 'daily', report: 'x'.repeat(262145) })).status, 413);
});
test('report uses Microsoft Newsletter mailbox and only the two founders', async t => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, options });
    return String(url).includes('login.microsoftonline.com') ? Response.json({ access_token: 'test-token' }) : new Response(null, { status: 202 });
  });
  const response = await call();
  assert.equal(response.status, 202);
  assert.equal(requests.length, 2);
  assert.match(requests[1].url, /newsletter%40axiovexsystems\.com\/sendMail$/);
  const payload = JSON.parse(requests[1].options.body);
  assert.deepEqual(payload.message.toRecipients.map(r => r.emailAddress.address), ['tristen@axiovexsystems.com', 'rockson@axiovexsystems.com']);
  assert.equal(payload.saveToSentItems, true);
  assert.ok(!(await response.text()).includes('test-microsoft-secret'));
});
test('Microsoft errors never become successful delivery', async t => {
  t.mock.method(globalThis, 'fetch', async url => String(url).includes('login.microsoftonline.com')
    ? Response.json({ access_token: 'test-token' }) : new Response(null, { status: 403 }));
  const response = await call();
  assert.equal(response.status, 502);
  assert.equal((await response.json()).upstreamStatus, 403);
});
