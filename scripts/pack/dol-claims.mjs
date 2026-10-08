/*
 * pack/dol-claims.mjs — DOL ETA weekly UI claims (api.dol.gov V1), spec 019 FR-003.
 *
 * *** ENDPOINT SHAPE FROM DOL DOCS, UNVERIFIED — NO KEY YET ***
 *
 * What the official DOL developer documentation (developer.dol.gov,
 * mirrored at github.com/USDepartmentofLabor/Developer) pins down:
 *   Dataset:  https://api.dol.gov/V1/Statistics/OUI_InitialClaims
 *   Table:    unemploymentInsuranceInitialClaims
 *   Fields:   week (datetime, week-ending date),
 *             nonSeasonallyAdjustedInitialClaims,
 *             seasonallyAdjustedInitialClaims,
 *             nonSeasonallyAdjustedContinuingClaims,
 *             seasonallyAdjustedContinuingClaims,
 *             seasonallyAdjustedInsuredUnemploymentRate,
 *             coveredEmployment,
 *             initialClaimsSeasonalFactor, continuingClaimsSeasonalFactor
 *   The V1 API is OData-style: $top / $orderby / $format=json query
 *   options, key sent in the X-API-KEY request header.
 *
 * What the docs do NOT pin down: the published table schema above is
 * explicitly NATIONAL-level ("time-series data at the National level")
 * and contains NO state column, so a Michigan-only split could not be
 * confirmed from the documentation. This module therefore:
 *   1. requests the documented table, latest ~26 weeks;
 *   2. IF the live rows carry a state field (state / stateCode / State),
 *      filters to Michigan (MI / Michigan) and labels the series as
 *      Michigan;
 *   3. OTHERWISE emits the documented national series and says so in
 *      the series labels and in `notes` — it never labels national
 *      figures as Michigan figures.
 * Verify the state question on the first real-key run and update this
 * header + notes with the finding.
 *
 * Probe (2026-10-08, placeholder key): the data URL returned HTTP 400
 * with body {"message":null} and the dataset $metadata URL returned
 * HTTP 403 "Missing Authentication Token" — the host and auth gate are
 * live; no end-to-end verification without a real key. KEY PENDING.
 */
const DATASET_URL = 'https://api.dol.gov/V1/Statistics/OUI_InitialClaims/unemploymentInsuranceInitialClaims';
const WEEKS = 26;

function rowsOf(json) {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.d)) return json.d;
  if (json && json.d && Array.isArray(json.d.results)) return json.d.results;
  if (json && Array.isArray(json.value)) return json.value;
  if (json && Array.isArray(json.results)) return json.results;
  return [];
}
const num = v => {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};
// `week` may arrive as 'YYYY-MM-DD', an ISO datetime, or an OData
// '/Date(<ms>)/' literal depending on the format negotiation.
function periodOf(v) {
  if (v == null) return null;
  const s = String(v);
  const m = /\/Date\((-?\d+)\)\//.exec(s);
  if (m) return new Date(Number(m[1])).toISOString().slice(0, 10);
  const d = s.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : s;
}

export default {
  id: 'dol-claims',
  name: 'DOL UI Weekly Claims',
  publisher: 'U.S. Department of Labor, Employment and Training Administration',
  requiresKey: 'DOL_API_KEY',
  async fetch(ctx) {
    const key = ctx.env.DOL_API_KEY;
    const url = DATASET_URL +
      '?$top=' + WEEKS +
      '&$orderby=' + encodeURIComponent('week desc') +
      '&$format=json';
    const json = await ctx.get(url, { 'X-API-KEY': key });
    let rows = rowsOf(json);
    if (!rows.length) throw new Error('DOL OUI_InitialClaims returned no rows (shape unverified — no key at first write)');

    // State handling: only filter if a state field actually exists.
    const stateField = ['state', 'stateCode', 'State', 'state_code']
      .find(f => rows.some(r => r && r[f] != null));
    let scope = 'United States (national — documented OUI_InitialClaims table has no state column)';
    if (stateField) {
      const mi = rows.filter(r => {
        const v = String(r[stateField] == null ? '' : r[stateField]).trim().toUpperCase();
        return v === 'MI' || v === 'MICHIGAN' || v === '26';
      });
      if (mi.length) { rows = mi; scope = 'Michigan (state field "' + stateField + '" present in live rows)'; }
    }

    const byPeriod = rows
      .map(r => ({ period: periodOf(r.week), row: r }))
      .filter(x => x.period)
      .sort((a, b) => (a.period < b.period ? -1 : a.period > b.period ? 1 : 0));
    const mk = (id, label, field) => {
      const observations = byPeriod
        .map(x => ({ period: x.period, value: num(x.row[field]) }))
        .filter(o => o.value != null);
      return observations.length ? { id, label, unit: 'Claims (count)', observations } : null;
    };
    const series = [
      mk('initial-nsa', 'Initial claims, not seasonally adjusted — ' + scope, 'nonSeasonallyAdjustedInitialClaims'),
      mk('initial-sa', 'Initial claims, seasonally adjusted — ' + scope, 'seasonallyAdjustedInitialClaims'),
      mk('continued-nsa', 'Continued claims (weeks claimed), not seasonally adjusted — ' + scope, 'nonSeasonallyAdjustedContinuingClaims'),
      mk('continued-sa', 'Continued claims (weeks claimed), seasonally adjusted — ' + scope, 'seasonallyAdjustedContinuingClaims'),
    ].filter(Boolean);
    if (!series.length) throw new Error('DOL rows carried none of the documented claims fields (shape unverified — no key at first write)');

    return {
      vintage: 'ETA weekly claims via api.dol.gov V1, OUI_InitialClaims dataset, latest ' + WEEKS + ' weeks requested',
      referencePeriod: byPeriod.length ? byPeriod[byPeriod.length - 1].period : null,
      series,
      notes: 'Endpoint shape from DOL docs, unverified — no key yet. Documented OUI_InitialClaims table (unemploymentInsuranceInitialClaims) is national-level with fields week / nonSeasonallyAdjustedInitialClaims / seasonallyAdjustedInitialClaims / nonSeasonallyAdjustedContinuingClaims / seasonallyAdjustedContinuingClaims; no state column is documented. Scope resolved at runtime: ' + scope + '. If a Michigan state-level dataset is confirmed on the first keyed run, switch this module to it and update this note.',
    };
  },
};
