import test from 'node:test';
import assert from 'node:assert/strict';
import { signalsContext } from '../lib/signals-context.mjs';
const fred = values => ({ series: [{ id: 'IPMAN', observations: values.map(([period, value]) => ({ period, value })) }] });
test('insight changes when actual source values change, retaining the source month', () => {
  const a = signalsContext(fred([['2026-08-01', 100], ['2026-09-01', 102]]), null);
  const b = signalsContext(fred([['2026-08-01', 100], ['2026-09-01', 99]]), null);
  assert.match(a[0].text, /rose 2.0%.*2026-09/);
  assert.match(b[0].text, /fell 1.0%/);
  assert.match(a[0].text, /national context/);
});
test('missing comparison month or incomplete counties never produce a fake insight', () => {
  assert.deepEqual(signalsContext(fred([['2026-07-01', 100], ['2026-09-01', 102]]), { counties: [] }), []);
});
test('county insight computes range from 83 actual values and reports all ties', () => {
  const counties = Array.from({ length: 83 }, (_, n) => ({ name: 'County ' + n, rate: n < 2 ? 3 : 8 }));
  const [item] = signalsContext(null, { counties, referenceMonth: '2026-08', preliminary: true });
  assert.match(item.text, /3.0% \(County 0, County 1\)/);
  assert.match(item.text, /5.0 percentage-point spread/);
  assert.match(item.text, /not seasonally adjusted, preliminary/);
});
