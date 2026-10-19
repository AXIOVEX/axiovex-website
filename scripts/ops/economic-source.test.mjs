import { test } from 'node:test';
import assert from 'node:assert/strict';
import eia from '../pack/eia.mjs';
test('EIA missing or blank prices never become manufactured zeros', async () => {
  const data = await eia.fetch({ env: { EIA_API_KEY: 'test-only' }, get: async () => ({ response: { data: [
    { period: '2026-05', price: null, value: null },
    { period: '2026-06', price: '', value: ' ' },
    { period: '2026-07', price: '0', value: 0 },
    { period: '2026-08', price: '8.6', value: '5.2' },
  ] } }) });
  assert.equal(data.series[0].observations.length, 2);
  assert.equal(data.series[0].observations[0].value, 0);
  assert.equal(data.series[1].observations.length, 2);
  assert.equal(data.referencePeriod, '2026-08');
});
