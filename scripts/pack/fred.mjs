/*
 * pack/fred.mjs — FRED (Federal Reserve Bank of St. Louis), spec 019 FR-002.
 *
 * Endpoint: GET https://api.stlouisfed.org/fred/series/observations
 *   ?series_id=<ID>&api_key=<key>&file_type=json&sort_order=desc&limit=36
 * Response: { observations: [{ date: 'YYYY-MM-DD', value: '<string>' }] },
 * newest first. Values are strings; '.' marks a missing observation and
 * is dropped. Output observations are re-sorted ascending by period.
 *
 * Every series below was verified to exist on its public FRED series
 * page (https://fred.stlouisfed.org/series/<ID>) on 2026-10-08:
 *   INDPRO   Industrial Production: Total Index — Index 2017=100, SA, monthly
 *   IPMAN    Industrial Production: Manufacturing (NAICS) — Index 2017=100, SA, monthly
 *   MCUMFN   Capacity Utilization: Manufacturing (NAICS) — Percent, SA, monthly
 *   MIPCPI   Per Capita Personal Income in Michigan — Dollars, NSA, annual
 *   MISTHPI  All-Transactions House Price Index for Michigan — Index 1980:Q1=100, NSA, quarterly
 *   MIBPPRIV New Private Housing Units Authorized by Building Permits for Michigan — monthly
 *   MIPOP    Resident Population in Michigan — Thousands of Persons, NSA, annual
 *
 * Status: KEY PENDING (FRED_API_KEY not yet registered). The endpoint
 * itself was probed with a placeholder key on 2026-10-08 and returned a
 * structured HTTP 400 ("api_key is not registered"), confirming the
 * host/route is live. Not verified end-to-end with a real key.
 */
const SERIES = [
  { id: 'INDPRO', label: 'Industrial Production: Total Index (US)', unit: 'Index 2017=100, seasonally adjusted' },
  { id: 'IPMAN', label: 'Industrial Production: Manufacturing (US)', unit: 'Index 2017=100, seasonally adjusted' },
  { id: 'MCUMFN', label: 'Capacity Utilization: Manufacturing (US)', unit: 'Percent, seasonally adjusted' },
  { id: 'MIPCPI', label: 'Per Capita Personal Income in Michigan', unit: 'Dollars, not seasonally adjusted' },
  { id: 'MISTHPI', label: 'All-Transactions House Price Index for Michigan', unit: 'Index 1980:Q1=100, not seasonally adjusted' },
  { id: 'MIBPPRIV', label: 'New Private Housing Units Authorized by Building Permits for Michigan', unit: 'Units' },
  { id: 'MIPOP', label: 'Resident Population in Michigan', unit: 'Thousands of persons, not seasonally adjusted' },
];
const LIMIT = 36;

export default {
  id: 'fred',
  name: 'FRED',
  publisher: 'Federal Reserve Bank of St. Louis',
  requiresKey: 'FRED_API_KEY',
  async fetch(ctx) {
    const key = ctx.env.FRED_API_KEY;
    const series = [];
    let latestPeriod = null;
    for (const s of SERIES) {
      const url = 'https://api.stlouisfed.org/fred/series/observations' +
        '?series_id=' + encodeURIComponent(s.id) +
        '&api_key=' + encodeURIComponent(key) +
        '&file_type=json&sort_order=desc&limit=' + LIMIT;
      const json = await ctx.get(url);
      const raw = Array.isArray(json && json.observations) ? json.observations : [];
      const observations = raw
        .filter(o => o && o.value !== '.' && o.value !== '' && o.value != null)
        .map(o => ({ period: o.date, value: Number(o.value) }))
        .filter(o => o.period && Number.isFinite(o.value))
        .sort((a, b) => (a.period < b.period ? -1 : a.period > b.period ? 1 : 0));
      if (!observations.length) throw new Error('FRED series ' + s.id + ' returned no usable observations');
      const newest = observations[observations.length - 1].period;
      if (!latestPeriod || newest > latestPeriod) latestPeriod = newest;
      series.push({ id: s.id, label: s.label, unit: s.unit, observations });
    }
    return {
      vintage: 'FRED series/observations pull, latest ' + LIMIT + ' observations per series (mixed frequencies: monthly/quarterly/annual as labeled)',
      referencePeriod: latestPeriod,
      series,
      notes: 'Values are FRED strings parsed to numbers; "." (missing) observations dropped. Frequencies differ by series — see each series label/unit. KEY PENDING at first write (2026-10-08): endpoint probed live (structured 400 for placeholder key), series pages verified, real-key run not yet done.',
    };
  },
};
