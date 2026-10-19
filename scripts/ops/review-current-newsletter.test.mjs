import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeReviewIssue} from './review-current-newsletter.mjs';
test('review date uses numeric source month while preserving human-readable vintage labels',()=>{
  const signals=JSON.parse(readFileSync('data/signals.json')),geo=JSON.parse(readFileSync('data/geo/laus-county.json'));
  // One coherent fixture despite asynchronous live state/county release times.
  geo.referenceMonth=signals.pulse.tiles[0].trend.at(-1).ym;
  const issue=makeReviewIssue(signals,geo,'2026-10-19');
  assert.equal(issue.date,'2026-10-19');assert.equal(issue.dataMonth,geo.referenceMonth);
  assert.ok(issue.pulse[0].vintage.includes(signals.pulse.referenceMonth));
  assert.match(issue.lede,/actual reference period/);
  assert.throws(()=>makeReviewIssue(signals,{...geo,counties:geo.counties.slice(1)},'2026-10-19'),/coherent/);
});
