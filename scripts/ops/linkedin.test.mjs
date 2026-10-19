import test from 'node:test';
import assert from 'node:assert/strict';
import { companyDue, dueTarget, postPayload } from './linkedin.mjs';
test('company reshare follows the personal post on next Tuesday at 09:30 Eastern, including DST', () => {
  assert.equal(companyDue('2026-10-30T14:30:00Z'), '2026-11-03T14:30:00.000Z');
  assert.equal(companyDue('2026-11-03T14:30:00Z'), '2026-11-10T14:30:00.000Z');
  assert.equal(dueTarget({ date: '2026-10-30', personal: { status: 'queued' } }, new Date('2026-10-30T14:29:00Z')), null);
});
test('payload binds public article and authorized author; company cannot precede personal post', () => {
  const record = { date: '2026-10-30', dataMonth: '2026-09', articleUrl: 'https://axiovexsystems.com/blog/monthly-data/', title: 'Published data', sourceSHA256: 'source-hash', authorization: 'owner', personal: { commentary: 'Personal copy' }, company: { commentary: 'Company copy' } };
  assert.equal(postPayload(record, 'personal', 'urn:li:person:owner').author, 'urn:li:person:owner');
  assert.throws(() => postPayload(record, 'company', 'urn:li:person:owner'));
  assert.throws(() => postPayload({ ...record, articleUrl: 'https://untrusted.example/' }, 'personal', 'urn:li:person:owner'));
  record.personal.postUrn = 'urn:li:share:123';
  assert.equal(postPayload(record, 'company', 'urn:li:person:owner').reshareContext.parent, 'urn:li:share:123');
});
