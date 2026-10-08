/*
 * census.mjs — Census API pack module (spec 019 FR-004).
 *
 * Datasets (Michigan, state FIPS 26), latest vintage that answers:
 *   1. ACS 5-year — bachelor's-or-higher share of the population 25+,
 *      all 83 Michigan counties (table B15003).
 *   2. County Business Patterns — manufacturing (NAICS 31-33)
 *      employment + establishments per Michigan county.
 *   3. QWI (timeseries/qwi/sa) — Michigan beginning-of-quarter
 *      employment, hires, separations; all-private (ownercode A05),
 *      all sexes (sex 0), all ages (agegrp A00), not seasonally
 *      adjusted (seasonadj U — the only adjustment QWI publishes);
 *      total (industry 00) and manufacturing (industry 31-33).
 *
 * Key handling: the runner skips this module while CENSUS_API_KEY is
 * absent (requiresKey below). The fetch itself only appends &key=
 * when a key is present, so it also runs keyless wherever the API
 * still answers keyless queries. NOTE (verified 2026-10-08): data
 * queries to api.census.gov currently redirect to a "Missing Key"
 * page without a key — metadata endpoints (variables.json etc.)
 * still answer keyless, data endpoints do not. If every dataset
 * fails, fetch() throws so the runner keeps the last-good snapshot
 * instead of writing an empty one.
 *
 * Vintages are probed, not hardcoded: ACS/CBP try recent years in
 * descending order until one returns rows; QWI scans all returned
 * quarters and takes the latest with data (Michigan QWI currently
 * ends at 2021-Q4 in the LEHD R2026Q3 release — a Michigan-specific
 * production gap, verified against the LEHD files 2026-10-08).
 */

const STATE = '26';
const ACS_VARS = 'NAME,B15003_001E,B15003_022E,B15003_023E,B15003_024E,B15003_025E';

function keySuffix(env) {
  const k = env && env.CENSUS_API_KEY;
  return k ? '&key=' + encodeURIComponent(k) : '';
}

/* Census array-JSON -> array of row objects keyed by header name. */
function rowsFrom(data) {
  if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[0])) {
    throw new Error('unexpected Census response shape (no data rows)');
  }
  const head = data[0];
  return data.slice(1).map(r => {
    const o = {};
    head.forEach((h, i) => { o[h] = r[i]; });
    return o;
  });
}

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function countyName(name) {
  return String(name || '').replace(/,\s*Michigan$/, '').trim();
}

/* Probe candidate years (descending) with a builder fn until rows. */
async function probeYears(years, build) {
  let lastErr = null;
  for (const year of years) {
    try {
      const rows = await build(year);
      if (rows && rows.length) return { year, rows };
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('no candidate year returned rows');
}

function candidateYears() {
  const y = new Date().getUTCFullYear();
  // Latest ACS 5-year / CBP is normally currentYear-2; try -1..-3.
  return [...new Set([y - 1, y - 2, y - 3])];
}

/* ---------------- ACS 5-year ---------------- */
async function fetchAcs(ctx) {
  const { year, rows } = await probeYears(candidateYears(), async yr => {
    const url = 'https://api.census.gov/data/' + yr + '/acs/acs5?get=' + ACS_VARS +
      '&for=county:*&in=state:' + STATE + keySuffix(ctx.env);
    return rowsFrom(await ctx.get(url));
  });
  const values = [];
  for (const r of rows) {
    const total = num(r.B15003_001E);
    const bach = num(r.B15003_022E), mast = num(r.B15003_023E);
    const prof = num(r.B15003_024E), doc = num(r.B15003_025E);
    if (!total || total <= 0 || bach === null || mast === null || prof === null || doc === null) continue;
    const share = Math.round(((bach + mast + prof + doc) / total) * 1000) / 10;
    values.push({ name: countyName(r.NAME), value: share });
  }
  values.sort((a, b) => a.name.localeCompare(b.name));
  if (!values.length) throw new Error('ACS ' + year + ': no usable county rows');
  return {
    vintage: 'ACS ' + year + ' 5-year',
    series: {
      id: 'acs5-bachelor-plus-share',
      label: "Bachelor's degree or higher, share of population 25+ (ACS table B15003)",
      unit: 'percent',
      geography: 'Michigan counties',
      vintage: 'ACS ' + year + ' 5-year',
      values,
    },
    countyCount: values.length,
  };
}

/* ---------------- County Business Patterns ---------------- */
async function fetchCbp(ctx) {
  const { year, rows } = await probeYears(candidateYears(), async yr => {
    // NAICS2017 predicate + LFO=001 (all legal forms) + EMPSZES=001
    // (all employment sizes) per the official CBP example calls, so
    // each county returns exactly one total row for NAICS 31-33.
    const url = 'https://api.census.gov/data/' + yr + '/cbp?get=NAME,EMP,ESTAB' +
      '&for=county:*&in=state:' + STATE +
      '&NAICS2017=31-33&LFO=001&EMPSZES=001' + keySuffix(ctx.env);
    return rowsFrom(await ctx.get(url));
  });
  const emp = [], est = [];
  for (const r of rows) {
    const name = countyName(r.NAME);
    const e = num(r.EMP), s = num(r.ESTAB);
    if (e !== null) emp.push({ name, value: e });
    if (s !== null) est.push({ name, value: s });
  }
  emp.sort((a, b) => a.name.localeCompare(b.name));
  est.sort((a, b) => a.name.localeCompare(b.name));
  if (!emp.length || !est.length) throw new Error('CBP ' + year + ': no usable county rows');
  return {
    vintage: 'CBP ' + year,
    series: [
      {
        id: 'cbp-manufacturing-employment',
        label: 'Manufacturing (NAICS 31-33) employment, County Business Patterns',
        unit: 'employees',
        geography: 'Michigan counties',
        vintage: 'CBP ' + year,
        values: emp,
      },
      {
        id: 'cbp-manufacturing-establishments',
        label: 'Manufacturing (NAICS 31-33) establishments, County Business Patterns',
        unit: 'establishments',
        geography: 'Michigan counties',
        vintage: 'CBP ' + year,
        values: est,
      },
    ],
    countyCount: emp.length,
  };
}

/* ---------------- QWI ---------------- */
const QWI_PREDICATES = 'sex=0&agegrp=A00&ownercode=A05&seasonadj=U&periodicity=Q';
const QWI_WALKBACK_QUARTERS = 8; // S3 bound (was 40)

/* HTTP-layer failures will not heal quarter by quarter, so the
 * walk-back is skipped for them (rate-limit audit S3, 2026-10-08):
 * auth failures (401), 403 (Blocked), 429 (Too Many Requests), 5xx
 * (server errors), and the non-JSON "Missing Key" page Census
 * serves keyless data queries (an auth failure in HTML form). */
function isHttpLayerFailure(e) {
  const m = (e && e.message) || '';
  const status = /^HTTP (\d{3})\b/.exec(m);
  if (status) {
    const s = Number(status[1]);
    return s === 401 || s === 403 || s === 429 || (s >= 500 && s <= 599);
  }
  return m.startsWith('non-JSON response');
}

async function qwiIndustry(ctx, industry) {
  const base = 'https://api.census.gov/data/timeseries/qwi/sa?get=year,quarter,Emp,HirA,Sep' +
    '&for=state:' + STATE + '&' + QWI_PREDICATES + '&industry=' + industry + keySuffix(ctx.env);
  // Primary: no time predicate — the API returns every quarter for
  // the slice; take the latest with an employment figure, plus the
  // latest with a separations figure (Sep needs a following quarter
  // of data, so it trails Emp by one quarter at the series edge).
  try {
    const rows = rowsFrom(await ctx.get(base));
    const usable = rows
      .map(r => ({ year: num(r.year), quarter: num(r.quarter), Emp: num(r.Emp), HirA: num(r.HirA), Sep: num(r.Sep) }))
      .filter(r => r.year && r.quarter && r.Emp !== null)
      .sort((a, b) => (a.year - b.year) || (a.quarter - b.quarter));
    if (usable.length) {
      const withSep = usable.filter(r => r.Sep !== null);
      return { latest: usable[usable.length - 1], latestSep: withSep.length ? withSep[withSep.length - 1] : null };
    }
  } catch (e) {
    // S3: an HTTP-layer failure (auth / 403 / 429 / 5xx) is
    // deterministic — rethrow instead of burning walk-back calls.
    if (isHttpLayerFailure(e)) throw e;
    /* otherwise fall through to quarter walk-back */
  }
  // Fallback: walk back quarter by quarter from the most recent
  // plausible quarter (QWI lags ~2 quarters; Michigan much longer),
  // bounded at QWI_WALKBACK_QUARTERS per industry (S3).
  const now = new Date();
  let y = now.getUTCFullYear(), q = Math.floor(now.getUTCMonth() / 3) + 1;
  for (let i = 0; i < QWI_WALKBACK_QUARTERS; i++) {
    q -= 1; if (q === 0) { q = 4; y -= 1; }
    const t = y + '-Q' + q;
    try {
      const rows = rowsFrom(await ctx.get(base + '&time=' + t));
      const r = rows[0];
      const Emp = r ? num(r.Emp) : null;
      if (Emp !== null) {
        const row = { year: y, quarter: q, Emp, HirA: num(r.HirA), Sep: num(r.Sep) };
        return { latest: row, latestSep: row.Sep !== null ? row : null };
      }
    } catch { /* keep walking */ }
  }
  throw new Error('no quarter with data found for industry ' + industry);
}

async function fetchQwi(ctx) {
  const total = await qwiIndustry(ctx, '00');
  const mfg = await qwiIndustry(ctx, '31-33');
  const periodOf = r => r.year + '-Q' + r.quarter;
  const period = periodOf(
    (mfg.latest.year * 10 + mfg.latest.quarter) >= (total.latest.year * 10 + total.latest.quarter)
      ? mfg.latest : total.latest);
  const mk = (id, label, key, pick) => ({
    id,
    label,
    unit: 'jobs',
    geography: 'Michigan (state)',
    vintage: 'QWI ' + period,
    values: [
      { row: pick(total), name: 'Michigan — all industries (private)' },
      { row: pick(mfg), name: 'Michigan — manufacturing NAICS 31-33 (private)' },
    ].filter(v => v.row && v.row[key] !== null)
     .map(v => ({ name: v.name, value: v.row[key], period: periodOf(v.row) })),
  });
  const series = [
    mk('qwi-employment', 'Beginning-of-quarter employment (QWI Emp, all private ownership)', 'Emp', r => r.latest),
    mk('qwi-hires', 'Hires, all (QWI HirA, all private ownership)', 'HirA', r => r.latest),
    mk('qwi-separations', 'Separations (QWI Sep, all private ownership)', 'Sep', r => r.latestSep),
  ].filter(s => s.values.length);
  if (!series.length) throw new Error('no usable series');
  const notes = [];
  const sepPeriods = series.filter(s => s.id === 'qwi-separations')
    .flatMap(s => s.values.map(v => v.period));
  if (sepPeriods.length && sepPeriods.some(p => p !== period)) {
    notes.push('QWI separations (Sep) require a following quarter of data, so the ' +
      'separations series ends at ' + [...new Set(sepPeriods)].join(' / ') +
      ', one quarter behind employment/hires at ' + period + '.');
  }
  return { vintage: 'QWI ' + period, period, series, notes };
}

/* ---------------- module ---------------- */
export default {
  id: 'census',
  name: 'Census API (ACS / CBP / QWI)',
  publisher: 'U.S. Census Bureau',
  requiresKey: 'CENSUS_API_KEY',
  async fetch(ctx) {
    const series = [];
    const vintages = [];
    const notes = [];
    const failures = [];
    let acsCounties = null, cbpCounties = null, qwiPeriod = null;

    try {
      const acs = await fetchAcs(ctx);
      series.push(acs.series);
      vintages.push(acs.vintage);
      acsCounties = acs.countyCount;
    } catch (e) { failures.push('ACS: ' + e.message); }

    try {
      const cbp = await fetchCbp(ctx);
      series.push(...cbp.series);
      vintages.push(cbp.vintage);
      cbpCounties = cbp.countyCount;
    } catch (e) { failures.push('CBP: ' + e.message); }

    try {
      const qwi = await fetchQwi(ctx);
      series.push(...qwi.series);
      vintages.push(qwi.vintage);
      qwiPeriod = qwi.period;
      notes.push(...qwi.notes);
    } catch (e) {
      failures.push('QWI: ' + e.message);
      notes.push('QWI gap: ' + e.message);
    }

    if (!series.length) {
      const keyHint = !(ctx.env && ctx.env.CENSUS_API_KEY)
        ? ' No CENSUS_API_KEY was present: as of 2026-10-08 api.census.gov data ' +
          'queries redirect to a "Missing Key" page without a key (metadata ' +
          'endpoints still answer keyless), so a key is required in practice.'
        : '';
      throw new Error('Census: all datasets failed — ' + failures.join(' · ') + keyHint);
    }
    if (failures.length) notes.push('Partial fetch — failed datasets: ' + failures.join(' · '));
    if (acsCounties !== null && acsCounties !== 83) {
      notes.push('ACS returned ' + acsCounties + ' Michigan counties (expected 83).');
    }
    if (cbpCounties !== null && cbpCounties !== 83) {
      notes.push('CBP returned ' + cbpCounties + ' Michigan counties with manufacturing employment (expected 83).');
    }
    if (qwiPeriod) {
      notes.push('QWI reference quarter ' + qwiPeriod + ' is the latest Michigan quarter ' +
        'published (Michigan QWI lags other states in the current LEHD release). ' +
        'Scope: private ownership (ownercode A05), all sexes, all ages, not seasonally adjusted.');
    }

    return {
      vintage: vintages.join('; '),
      referencePeriod: vintages.join('; '),
      series,
      ...(notes.length ? { notes: notes.join(' ') } : {}),
    };
  },
};
