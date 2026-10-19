import test from 'node:test';
import assert from 'node:assert/strict';
import { transientSource, mergeAttempts, completeRefresh } from './refresh-pack.mjs';
test('economic refresh cannot report success with failed or missing-key sources', () => {
  for (const status of ['failed', 'skipped']) assert.equal(completeRefresh({ sources: [{ id: 'fred', status }] }), false);
  assert.equal(completeRefresh({ sources: [] }), false);
});
test('retry is limited to transient errors and retains both exact attempt statuses', () => {
  for (const reason of ['HTTP 502 for provider', 'This operation was aborted']) assert.equal(transientSource({ status: 'failed', reason }), true);
  for (const reason of ['HTTP 429', 'HTTP 403', 'Invalid series schema']) assert.equal(transientSource({ status: 'failed', reason }), false);
  const first = { sources: [{ id: 'fred', status: 'failed', reason: 'HTTP 502' }, { id: 'bea', status: 'success' }] };
  const retry = { sources: [{ id: 'fred', status: 'success', referencePeriod: '2026-09-01' }] };
  const merged = mergeAttempts(first, retry);
  assert.equal(completeRefresh(merged), true);
  assert.equal(merged.sources[0].referencePeriod, '2026-09-01');
  assert.equal(merged.attempts[0].sources[0].status, 'failed');
  assert.equal(merged.sources[1].id, 'bea');
  assert.equal(completeRefresh(mergeAttempts(first, null)), false);
});
