import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { onRequest } from '../../functions/api/ops/subscribers.js';
function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync('scripts/newsletter/schema.sql', 'utf8'));
  sqlite.prepare('INSERT INTO subscribers(email,status,created_at,confirmed_at,source) VALUES (?,?,?,?,?)').run('private@example.com', 'active', new Date().toISOString(), new Date().toISOString(), 'signals-top');
  const db = { prepare(sql) { const statement = sqlite.prepare(sql); let args = []; return { bind(...values) { args = values; return this; }, async first() { return statement.get(...args) || null; }, async all() { return { results: statement.all(...args) }; }, async run() { return statement.run(...args); } }; } };
  return { sqlite, env: { ENVIRONMENT: 'production', NEWSLETTER_SEND_SECRET: 'test', NEWSLETTER_DB: db } };
}
const request = key => new Request('https://axiovexsystems.com/api/ops/subscribers?days=1', { headers: { 'x-website-ops-secret': key } });
test('aggregate metrics establish baseline without fabricating historical net change or revealing addresses', async () => {
  const { sqlite, env } = fixture();
  assert.equal((await onRequest({ request: request('wrong'), env })).status, 403);
  let response = await onRequest({ request: request('test'), env });
  assert.equal(response.status, 200);
  let data = await response.json();
  assert.equal(data.counts.active, 1);
  assert.equal(data.activeChange, null);
  assert.equal(data.flows[1].signups, 1);
  assert.ok(!JSON.stringify(data).includes('private@example.com'));
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(Date.now() - 86400000));
  sqlite.prepare('INSERT INTO subscriber_snapshots VALUES (?,?,?,?,?,?)').run(day, day + 'T12:00:00Z', 3, 0, 0, 0);
  data = await (await onRequest({ request: request('test'), env })).json();
  assert.equal(data.activeChange, -2);
  assert.equal(data.baseline.active, 3);
  assert.equal((await onRequest({ request: request('test'), env: { ...env, ENVIRONMENT: 'staging' } })).status, 503);
  sqlite.close();
});
