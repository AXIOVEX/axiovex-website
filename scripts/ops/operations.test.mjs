import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { due, midnight, windows, scheduledTime } from './calendar.mjs';
import { aggregate, delta, statusLabel } from './analytics.mjs';
import { verifyApproval } from './newsletter.mjs';
import { inspect } from './health.mjs';

test('ET schedules run once across both UTC offsets', () => {
  assert.deepEqual(due(new Date('2026-10-19T12:39:00Z')), ['daily']);
  assert.deepEqual(due(new Date('2026-10-19T13:39:00Z')), ['weekly', 'health']);
  assert.deepEqual(due(new Date('2026-10-19T14:39:00Z')), []);
  assert.deepEqual(due(new Date('2026-12-07T13:39:00Z')), ['daily']);
  assert.deepEqual(due(new Date('2026-12-07T14:39:00Z')), ['weekly', 'health']);
  assert.deepEqual(due(new Date('2026-10-21T14:00:00Z')), ['newsletter-send']);
  assert.deepEqual(due(new Date('2026-10-21T14:39:00Z')), []);
  assert.deepEqual(due(new Date('2026-10-21T15:00:00Z')), []);
  assert.deepEqual(due(new Date('2026-12-09T15:00:00Z')), ['newsletter-send']);
  assert.deepEqual(due(new Date('2026-10-20T13:39:00Z')), ['newsletter-draft']);
});
test('runner queue delays do not lose a scheduled task', () => {
  const slot = scheduledTime('39 12 * * *', new Date('2026-10-19T16:17:22Z'));
  assert.equal(slot.toISOString(), '2026-10-19T12:39:00.000Z');
  assert.deepEqual(due(slot), ['daily']);
  assert.deepEqual(due(scheduledTime('0 14 * * 3', new Date('2026-10-21T18:20:00Z'))), ['newsletter-send']);
  assert.throws(() => scheduledTime('39 12,13 * * *'));
});
test('monthly amendments include leap years and February last day', () => {
  assert.deepEqual(due(new Date('2027-02-28T14:39:00Z')), ['monthly', 'workforce']);
  assert.deepEqual(due(new Date('2028-02-29T14:39:00Z')), ['monthly', 'workforce', 'newsletter-draft']);
  assert.deepEqual(windows('monthly', new Date('2026-10-30T13:39:00Z')), { start: '2026-09-01', end: '2026-10-01', previous: '2026-08-01' });
});
test('report windows use ET midnight including DST transitions', () => {
  assert.equal(midnight('2026-03-08'), '2026-03-08T05:00:00.000Z');
  assert.equal(midnight('2026-03-09'), '2026-03-09T04:00:00.000Z');
  assert.equal(midnight('2026-11-01'), '2026-11-01T04:00:00.000Z');
  assert.equal(midnight('2026-11-02'), '2026-11-02T05:00:00.000Z');
  assert.deepEqual(windows('daily', new Date('2026-10-19T02:00:00Z')), { start: '2026-10-17', end: '2026-10-18', previous: '2026-10-10' });
  assert.throws(() => windows('bad'));
});
test('traffic sums bytes, preserves real zero and rejects malformed rows', () => {
  const rows = [{ sum: { requests: 4, bytes: 100, cachedBytes: 30, responseStatusMap: [{ edgeResponseStatus: 500, requests: 1 }] } }];
  const a = aggregate(rows);
  assert.equal(a.cacheRatio, 0.3);
  assert.equal(a.statuses[500], 1);
  assert.equal(aggregate([]).cacheRatio, null);
  assert.throws(() => aggregate([{ sum: { requests: 1 } }]));
  assert.equal(delta(20, 10), '100.0%');
  assert.match(delta(10, 0), /no percentage baseline/);
  assert.equal(statusLabel(503), '503 (Service unavailable)');
});
test('newsletter approval binds owner, issue and exact bytes', () => {
  const bytes = Buffer.from('{"subject":"reviewed"}');
  const approval = { issue: '2026-10-21', approvedBy: 'Tristen Pierson', approvedAt: '2026-10-18T12:00:00Z', sha256: createHash('sha256').update(bytes).digest('hex') };
  verifyApproval(approval, bytes, '2026-10-21');
  assert.throws(() => verifyApproval(approval, Buffer.from('changed'), approval.issue));
  assert.throws(() => verifyApproval(approval, bytes, '2026-10-28'));
  assert.throws(() => verifyApproval({ ...approval, approvedBy: 'bot' }, bytes, approval.issue));
});
test('research noindex is intentional; public pages must stay indexable', () => {
  const html = '<meta name="robots" content="noindex">';
  assert.equal(inspect(html, 'https://axiovexsystems.com/research/').checks.indexingPolicy, true);
  assert.equal(inspect(html, 'https://axiovexsystems.com/').checks.indexingPolicy, false);
  assert.equal(inspect('', 'https://axiovexsystems.com/research/').checks.indexingPolicy, false);
});
