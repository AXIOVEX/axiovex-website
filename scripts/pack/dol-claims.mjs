/*
 * pack/dol-claims.mjs — DOL ETA weekly UI claims, spec 019 FR-003.
 *
 * *** APIv4 SHAPE — from the DOL Open Data Portal's own documentation ***
 * (dataportal.dol.gov: /getting-started, /user-guide, /api-examples, /faq;
 * read live 2026-10-08.)
 *
 *   Base:     https://apiprod.dol.gov/v4/get/<agency>/<endpoint>/<format>
 *   Dataset:  ETA "ui_national_weekly_claims" (portal dataset 10305,
 *             "Unemployment Insurance National Weekly Claims", weekly).
 *   Auth:     the API key travels as the X-API-KEY QUERY PARAMETER
 *             (the guide shows no header form). Because the key sits in
 *             the URL, every error this module throws redacts it — a
 *             keyed URL must never reach a log, report, or commit.
 *   Paging:   limit/offset parameters; default limit is 10 records;
 *             per-request cap is 10,000 records or 5 MB.
 *   RATE LIMIT (portal FAQ, updated July 2025): 10 requests per
 *             10 minutes per key. This module makes exactly ONE request
 *             per pack run (weekly cadence) — far inside the limit.
 *             Never add tight-loop retries against this API.
 *
 * The legacy developer.dol.gov V1 API this module was first written
 * against (api.dol.gov/V1/Statistics/OUI_InitialClaims, header auth) is
 * not mentioned anywhere in the portal documentation, and on 2026-10-08
 * every V1 route probed with the portal-issued key returned the same
 * HTTP 400 {"message":null} (metadata route: 403 "Missing
 * Authentication Token") — the portal key does not authenticate there.
 * The V1 shape is superseded by APIv4; this module targets v4 only.
 *
 * STATE QUESTION — RESOLVED from the dataset itself: the v4 claims
 * dataset is the NATIONAL weekly claims series (its name and portal
 * description are explicitly national; fields are week-level national
 * aggregates). There is no Michigan split in this dataset, so the
 * series are labeled United States (national) — never dressed as
 * Michigan figures. (Michigan-level claims context continues to come
 * from the workforce study's own sources.) The runtime state-field
 * check below stays as a guard: if live rows ever carry a state field
 * with Michigan rows, the module filters and relabels honestly.
 *
 * Field names are discovered by pattern on the first rows (the portal
 * documents the endpoint, not a field list); if none of the patterns
 * match, the module fails loudly and names the actual row keys.
 *
 * FRESHNESS (observed 2026-10-08): the portal copy lags the Thursday
 * weekly release — the newest row carrying claims values was the week
 * ending 2026-09-05, about five weeks behind. The snapshot's
 * referencePeriod states the true latest week; treat this source as
 * structural context, not a breaking-news feed.
 */
const DATA_URL = 'https://apiprod.dol.gov/v4/get/ETA/ui_national_weekly_claims/json';
const WEEKS = 26;

function rowsOf(json) {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.results)) return json.results;
  if (json && Array.isArray(json.data)) return json.data;
  if (json && json.d && Array.isArray(json.d.results)) return json.d.results;
  if (json && Array.isArray(json.value)) return json.value;
  return [];
}

function periodOf(v) {
  if (v == null) return null;
  const s = String(v).trim();
  const ms = s.match(/\/Date\((-?\d+)\)\//);
  if (ms) return new Date(Number(ms[1])).toISOString().slice(0, 10);
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[1] + '-' + iso[2] + '-' + iso[3];
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (us) return us[3] + '-' + us[1].padStart(2, '0') + '-' + us[2].padStart(2, '0');
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function pickField(keys, patterns) {
  for (const re of patterns) {
    const hit = keys.find(k => re.test(k));
    if (hit) return hit;
  }
  return null;
}

export default {
  id: 'dol-claims',
  name: 'DOL UI Weekly Claims',
  publisher: 'U.S. Department of Labor, Employment and Training Administration',
  requiresKey: 'DOL_API_KEY',
  async fetch(ctx) {
    const key = ctx.env.DOL_API_KEY;
    const url = DATA_URL + '?X-API-KEY=' + encodeURIComponent(key) + '&limit=10000&offset=0';
    let json;
    try {
      json = await ctx.get(url);
    } catch (e) {
      throw new Error('DOL APIv4 claims request failed: ' + String(e && e.message ? e.message : e).split(key).join('<KEY>').split(encodeURIComponent(key)).join('<KEY>'));
    }
    let rows = rowsOf(json);
    if (!rows.length) throw new Error('DOL APIv4 ui_national_weekly_claims returned no rows');
    const keys = Object.keys(rows[0]);

    // State guard (see header): only filter if a state field truly exists.
    const stateField = ['state', 'stateCode', 'State', 'state_code']
      .find(f => rows.some(r => r && r[f] != null));
    let scope = 'United States (national — ETA ui_national_weekly_claims dataset is the national series; no state split)';
    if (stateField) {
      const mi = rows.filter(r => {
        const v = String(r[stateField] == null ? '' : r[stateField]).trim().toUpperCase();
        return v === 'MI' || v === 'MICHIGAN' || v === '26';
      });
      if (mi.length) { rows = mi; scope = 'Michigan (state field "' + stateField + '" present in live rows)'; }
    }

    // Field map — VERIFIED against the dataset's own APIv4 metadata
    // (…/ui_national_weekly_claims/json/metadata, read 2026-10-08):
    //   rptdate = week-ending report date
    //   c1 = initial claims seasonal FACTOR (not a count — excluded)
    //   c2 = continued claims seasonal factor (excluded)
    //   c3 = covered employment            c4 = initial claims NSA
    //   c5 = initial claims SA             c6 = continued claims NSA
    //   c7 = continued claims SA           c8/c9 = SA 4-week moving
    //   averages (not carried in this pack)
    // Name-pattern guessing is deliberately NOT used: it would have
    // risked mapping the c1 seasonal factor as a claims count.
    const dateField = 'rptdate';
    const fInitialNsa = 'c4', fInitialSa = 'c5', fContinuedNsa = 'c6', fContinuedSa = 'c7', fCovered = 'c3';
    for (const f of [dateField, fInitialNsa, fInitialSa, fContinuedNsa, fContinuedSa]) {
      if (!keys.includes(f)) throw new Error('DOL APIv4 rows missing metadata-verified field "' + f + '"; actual row keys: ' + keys.join(', '));
    }

    const byPeriodAll = rows
      .map(r => ({ period: periodOf(r[dateField]), row: r }))
      .filter(x => x.period)
      .sort((a, b) => (a.period < b.period ? -1 : a.period > b.period ? 1 : 0));
    // The dataset carries FUTURE rows (seasonal factors are published
    // ahead — rows extend into 2027 with the claims counts still null).
    // The pack window is the latest WEEKS of REPORTED claims, so drop
    // rows with no claims values before slicing.
    const reported = byPeriodAll.filter(x => [fInitialNsa, fInitialSa, fContinuedNsa, fContinuedSa].some(f => num(x.row[f]) != null));
    const byPeriod = reported.slice(-WEEKS);
    const mk = (id, label, field, unit) => {
      if (!field) return null;
      const observations = byPeriod
        .map(x => ({ period: x.period, value: num(x.row[field]) }))
        .filter(o => o.value != null);
      return observations.length ? { id, label, unit: unit || 'Claims (count)', observations } : null;
    };
    const series = [
      mk('initial-nsa', 'Initial claims, not seasonally adjusted — ' + scope, fInitialNsa),
      mk('initial-sa', 'Initial claims, seasonally adjusted — ' + scope, fInitialSa),
      mk('continued-nsa', 'Continued claims (weeks claimed), not seasonally adjusted — ' + scope, fContinuedNsa),
      mk('continued-sa', 'Continued claims (weeks claimed), seasonally adjusted — ' + scope, fContinuedSa),
      mk('covered-employment', 'Covered employment — ' + scope, fCovered, 'Persons (count)'),
    ].filter(Boolean);
    if (!series.length) throw new Error('DOL APIv4 rows carried none of the claims fields (keys: ' + keys.join(', ') + ')');

    return {
      vintage: 'ETA UI National Weekly Claims via DOL Open Data Portal APIv4 (apiprod.dol.gov/v4), latest ' + WEEKS + ' reported weeks of ' + reported.length + ' rows carrying claims values (' + byPeriodAll.length + ' dated rows returned, including future seasonal-factor rows)',
      referencePeriod: byPeriod.length ? byPeriod[byPeriod.length - 1].period : null,
      series,
      notes: 'APIv4 shape verified against the portal documentation (User Guide / API Examples / FAQ, read 2026-10-08): key as X-API-KEY query parameter, limit/offset paging, rate limit 10 requests per 10 minutes — this module makes one request per weekly run. The legacy api.dol.gov/V1 endpoint uniformly rejected the portal-issued key (HTTP 400 on all routes) and is not documented by the portal; superseded. Scope: ' + scope + '. Field mapping verified against the dataset metadata endpoint (2026-10-08): rptdate=week-ending date, c4=initial NSA, c5=initial SA, c6=continued NSA, c7=continued SA, c3=covered employment; c1/c2 are seasonal factors (excluded), c8/c9 are SA 4-week moving averages (not carried).',
    };
  },
};
