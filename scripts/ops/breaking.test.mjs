import test from 'node:test';
import assert from 'node:assert/strict';
import { criterion, fresh, sourceConfirms, chooseEntry } from './breaking.mjs';
import { parseFeed } from '../lib/news-feeds.mjs';
const now = Date.parse('2026-10-19T18:00:00Z');
const item = { title: 'Michigan factory shuts down after cyberattack', publishedUtc: '2026-10-19T17:00:00.000Z' };
test('freshness rejects date-only, stale and future feed entries', () => {
  assert.equal(fresh(item, now), true);
  for (const publishedUtc of [null, '2026-10-19T19:00:00Z', '2026-10-19T14:59:00Z']) assert.equal(fresh({ publishedUtc }, now), false);
  assert.equal(parseFeed('<rss><item><title>X</title><link>https://example.com</link><pubDate>2026-10-19</pubDate></item></rss>')[0].publishedUtc, null);
});
test('ordinary and speculative news cannot trigger the breaking banner', () => {
  for (const title of ['CISA industrial control advisory batch', 'Michigan factory could close', 'DOE awards $2 million for manufacturing', 'Podcast: Michigan plant shutdown']) assert.equal(criterion({ title }, 'doe'), null);
  assert.equal(criterion(item, 'manufacturing-dive').rank, 3);
  assert.equal(criterion({ title: 'DOE announces $100 million for manufacturing' }, 'doe').rank, 1);
  assert.equal(criterion({ title: 'DOE announces $100 million for manufacturing' }, 'untrusted'), null);
});
test('source verification requires both verbatim headline and exact publication timestamp', () => {
  const html = `<h1>${item.title}</h1><meta property="article:published_time" content="2026-10-19T13:00:00-04:00">`;
  assert.equal(sourceConfirms(html, item), true);
  assert.equal(sourceConfirms(html.replace('shuts down', 'opens'), item), false);
  assert.equal(sourceConfirms(html.replace('13:00', '12:00'), item), false);
  assert.equal(sourceConfirms(`<h1>${item.title}</h1>`, item), false);
});
test('active manual entry survives; expired entry is cleared; previously posted story is never replayed', () => {
  const active = { id: 'manual', expiresUtc: '2026-10-19T19:00:00Z' };
  const candidate = { id: 'new' };
  assert.equal(chooseEntry(active, [candidate], {}, now), active);
  assert.equal(chooseEntry(active, [], {}, now + 7200000), null);
  assert.equal(chooseEntry(null, [candidate], { new: '2026-10-19' }, now), null);
  assert.equal(chooseEntry(null, [candidate], {}, now), candidate);
});
