/*
 * pack/bea.mjs — BEA Regional county data (apps.bea.gov API), spec 019 FR-005.
 *
 * Endpoint: GET https://apps.bea.gov/api/data/
 *   ?UserID=<key>&method=GETDATA&datasetname=Regional&ResultFormat=JSON
 *   &TableName=<table>&LineCode=<line>&GeoFips=<csv>&Year=LAST5
 * Response: { BEAAPI: { Results: { Data: [ { GeoFips, GeoName,
 *   TimePeriod, DataValue, UnitOfMeasure, ... } ] } } } — errors arrive
 * in-body as Results.Error even on HTTP 200, and are thrown here.
 *
 * Tables (BEA Regional dataset):
 *   CAGDP2  County GDP by industry. LineCode=1 = all-industry total,
 *           current dollars (UnitOfMeasure is read from the rows at
 *           runtime — county GDP is published in thousands of dollars).
 *   CAINC1  County personal income summary. LineCode=1 = total personal
 *           income (thousands of dollars), LineCode=2 = per capita
 *           personal income (dollars). Units likewise read from rows.
 *
 * Year semantics (BEA API User Guide): Year accepts a comma list, ALL,
 * LAST10, or LAST5 (the default). There is no bare "LAST". This module
 * requests LAST5 and keeps only the maximum year actually returned,
 * so the snapshot is always the latest year the API offers.
 *
 * Geography: all 83 Michigan counties. Michigan county FIPS codes are
 * the odd numbers 001–165 under state FIPS 26, built programmatically
 * below ('26001'…'26165').
 *
 * Cross-section shape: because each series is one value per county for
 * a single year (not a time series), series entries use
 *   values: [{ name, value }]     // name = BEA GeoName, e.g. "Oakland County, MI"
 * instead of observations — the same cross-section style as the Census
 * pack module. DataValue strings are comma-formatted ("1,234,567") and
 * parsed to numbers; suppressed cells — "(D)" (also "(NA)"/"(NM)") —
 * are skipped and counted in `notes`.
 *
 * Probe (2026-10-08, placeholder UserID): HTTP 200 with in-body error
 * APIErrorCode 4, "This UserId is not active" — endpoint, dataset and
 * parameter shape accepted; the failure was the key only. KEY PENDING
 * (BEA_API_KEY not yet registered); not verified end-to-end.
 */
const MI_COUNTY_GEOFIPS = [];
for (let n = 1; n <= 165; n += 2) MI_COUNTY_GEOFIPS.push('26' + String(n).padStart(3, '0'));

function parseValue(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s || s.startsWith('(')) return null; // (D) suppressed, (NA), (NM)
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

async function fetchTable(ctx, key, tableName, lineCode) {
  const url = 'https://apps.bea.gov/api/data/' +
    '?UserID=' + encodeURIComponent(key) +
    '&method=GETDATA&datasetname=Regional&ResultFormat=JSON' +
    '&TableName=' + encodeURIComponent(tableName) +
    '&LineCode=' + encodeURIComponent(String(lineCode)) +
    '&GeoFips=' + MI_COUNTY_GEOFIPS.join(',') +
    '&Year=LAST5';
  const json = await ctx.get(url);
  const results = json && json.BEAAPI && json.BEAAPI.Results;
  if (!results) throw new Error('BEA ' + tableName + ': unexpected response shape (no BEAAPI.Results)');
  if (results.Error) {
    const e = results.Error;
    throw new Error('BEA ' + tableName + ' API error ' + (e.APIErrorCode || '?') + ': ' + (e.APIErrorDescription || 'unknown'));
  }
  const rows = Array.isArray(results.Data) ? results.Data : [];
  if (!rows.length) throw new Error('BEA ' + tableName + ' LineCode ' + lineCode + ' returned no rows');
  return rows;
}

// Keep only the latest year's rows; return { year, values, unit, suppressed }.
function latestYearCrossSection(rows) {
  const years = [...new Set(rows.map(r => String(r.TimePeriod)))].sort();
  const year = years[years.length - 1];
  const inYear = rows.filter(r => String(r.TimePeriod) === year);
  const unit = (inYear.find(r => r.UnitOfMeasure) || {}).UnitOfMeasure || null;
  let suppressed = 0;
  const values = [];
  for (const r of inYear) {
    const v = parseValue(r.DataValue);
    if (v == null) { suppressed++; continue; }
    values.push({ name: r.GeoName, value: v });
  }
  values.sort((a, b) => a.name.localeCompare(b.name));
  return { year, values, unit, suppressed };
}

export default {
  id: 'bea',
  name: 'BEA Regional',
  publisher: 'U.S. Bureau of Economic Analysis',
  requiresKey: 'BEA_API_KEY',
  async fetch(ctx) {
    const key = ctx.env.BEA_API_KEY;
    const [gdpRows, incRows, pcRows] = [
      await fetchTable(ctx, key, 'CAGDP2', 1),
      await fetchTable(ctx, key, 'CAINC1', 1),
      await fetchTable(ctx, key, 'CAINC1', 2),
    ];
    const gdp = latestYearCrossSection(gdpRows);
    const inc = latestYearCrossSection(incRows);
    const pc = latestYearCrossSection(pcRows);
    const latestYear = [gdp.year, inc.year, pc.year].sort().pop();
    const suppressedTotal = gdp.suppressed + inc.suppressed + pc.suppressed;
    const mk = (id, label, cs, fallbackUnit) => ({
      id, label, unit: cs.unit || fallbackUnit, values: cs.values,
    });
    return {
      vintage: 'BEA Regional dataset, Year=LAST5 request filtered to the latest returned year per table (CAGDP2 year ' + gdp.year + ', CAINC1 year ' + inc.year + ')',
      referencePeriod: latestYear,
      series: [
        mk('cagdp2-total', 'County GDP, all industries (CAGDP2 LineCode 1), Michigan counties, ' + gdp.year, gdp, 'Thousands of current dollars'),
        mk('cainc1-total', 'County total personal income (CAINC1 LineCode 1), Michigan counties, ' + inc.year, inc, 'Thousands of dollars'),
        mk('cainc1-percapita', 'County per capita personal income (CAINC1 LineCode 2), Michigan counties, ' + pc.year, pc, 'Dollars'),
      ],
      notes: 'Cross-section: series use values:[{name, value}] (one value per county, latest year) instead of observations. Geography = all 83 Michigan counties (GeoFips 26001–26165, odd codes). DataValue comma-formatted strings parsed to numbers; ' + suppressedTotal + ' suppressed/unavailable cells (e.g. "(D)") skipped in this pull. Units taken from each row set\u2019s UnitOfMeasure where present. KEY PENDING at first write (2026-10-08): endpoint probed live (in-body key error only), real-key run not yet done.',
    };
  },
};
