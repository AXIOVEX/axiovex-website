import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildBrief } from './workforce-brief.mjs';
const signals = JSON.parse(readFileSync('data/signals.json'));
const geo = JSON.parse(readFileSync('data/geo/laus-county.json'));
const month = signals.pulse.tiles[0].trend.at(-1).ym;
// Freeze one coherent fixture even when live state and county releases are asynchronous.
geo.referenceMonth = month;
test('monthly article uses complete actual source periods and identifies its evidence limits', () => {
  const brief = buildBrief(signals, geo, { date: '2026-10-30', dataMonth: month }, null);
  assert.match(brief.text, /not represent a new reviewed research edition/);
  assert.match(brief.text, /not seasonally adjusted/);
  assert.match(brief.text, /Macomb/);
  assert.ok(brief.text.includes(signals.pulse.tiles[0].display));
  assert.ok(brief.commentary.includes(brief.url));
  assert.throws(() => buildBrief(signals, { ...geo, counties: geo.counties.slice(1) }, { date: '2026-10-30', dataMonth: month }, null));
  const unavailableMonth = `${Number(month.slice(0,4))+1}${month.slice(4)}`;
  assert.throws(() => buildBrief(signals, geo, { date: '2026-10-30', dataMonth: unavailableMonth }, null));
});
