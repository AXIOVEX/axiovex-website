import test from 'node:test';
import assert from 'node:assert/strict';
import { criterion, fresh, sourceConfirms, chooseEntry } from './breaking.mjs';
import { parseFeed } from '../lib/news-feeds.mjs';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
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

test('complete monitor publishes verified evidence once, expires it and exposes total outage', () => {
  const dir = mkdtempSync(join(tmpdir(), 'axiovex-breaking-test-'));
  try {
    mkdirSync(join(dir, 'data'));
    const published = new Date(Date.now() - 300000).toISOString();
    writeFileSync(join(dir, 'data/signal-sources.json'), JSON.stringify({ feeds: [{ id: 'manufacturing-dive', name: 'Fixture publisher', url: 'https://publisher.example/feed' }] }));
    writeFileSync(join(dir, 'data/breaking.json'), JSON.stringify({ active: null }));
    const feed = `<rss><item><title>${item.title}</title><link>https://publisher.example/story</link><pubDate>${published}</pubDate></item></rss>`;
    const html = `<h1>${item.title}</h1><meta property="article:published_time" content="${published}">`;
    const mock = join(dir, 'mock.mjs');
    writeFileSync(mock, `globalThis.fetch = async url => { if (process.env.TEST_OUTAGE) throw new Error('fixture outage'); const r = new Response(url.endsWith('/feed') ? ${JSON.stringify(feed)} : ${JSON.stringify(html)}); Object.defineProperty(r, 'url', { value: url }); return r; };`);
    const run = over => spawnSync(process.execPath, ['--import', pathToFileURL(mock).href, resolve('scripts/ops/breaking.mjs')], { cwd: dir, encoding: 'utf8', env: { ...process.env, GITHUB_STEP_SUMMARY: '', ...over } });
    const first = run();
    assert.equal(first.status, 0, first.stderr + first.stdout);
    const entry = JSON.parse(readFileSync(join(dir, 'data/breaking.json'))).active;
    assert.equal(entry.headline, item.title);
    assert.equal(entry.publishedUtc, published);
    assert.equal(entry.addedBy, 'github-actions:breaking-monitor');
    assert.equal(Date.parse(entry.expiresUtc) > Date.now(), true);
    writeFileSync(join(dir, 'data/breaking.json'), JSON.stringify({ active: { ...entry, expiresUtc: new Date(Date.now() - 1000).toISOString() } }));
    assert.equal(run().status, 0);
    assert.equal(JSON.parse(readFileSync(join(dir, 'data/breaking.json'))).active, null);
    assert.equal(run({ TEST_OUTAGE: '1' }).status, 1);
    assert.equal(JSON.parse(readFileSync(join(dir, 'ops-output/breaking/check.json'))).partial, true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
