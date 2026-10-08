#!/usr/bin/env node
/* Spec 014 (FR-007): refresh for the committed talent-geography
   datasets in data/geo/.

   - LAUS county unemployment (map b): BLS Public Data API v2,
     one batched read of the 83 county series (LAUCN + FIPS + 0000000003).
     MONTHLY and month-gated: when BLS's latest published month
     equals the committed file's reference month, the file is
     left untouched. A genuine hole month in the source (the
     October 2025 federal-lapse month) stays a hole — values
     are never interpolated.
   - QCEW county x industry employment (map a): BLS QCEW
     per-area CSV API, 2024 annual averages, all 83 counties.
     QCEW publishes county x sector rows BY OWNERSHIP only
     (agglvl 74 has own 1/2/3/5 rows; a total-ownership
     sector row does not exist in QCEW — verified against
     the per-area API and the full 2024 single file), so the
     sector grain is PRIVATE ownership (own_code 5), labeled
     as such wherever it renders. Disclosure-suppressed
     cells (disclosure_code 'N') are stored valueless — the
     zeroed source values are never transcribed; a sector
     row the source omits entirely is stored as absent
     (same not-disclosed rendering; counted separately in
     the audit record).

   Last-good resilience (spec 004 pattern): a refresh replaces
   a committed file only with a complete, check-passing read.
   Any failure keeps the prior file and exits 0 — unless no
   committed file exists yet, in which case it exits 1.
   Usage: node scripts/fetch-geo.mjs [laus|qcew|all] */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GEO_DIR = path.join(ROOT, 'data', 'geo');
const UA = { 'User-Agent': 'axiovex-website-build (spec 014 geo refresh)' };

/* BLS v2 registration key (optional): the process environment
 * first, then the data-apis key file — the same env sources as
 * scripts/fetch-pack.mjs (rate-limit audit S1, 2026-10-08). Sent
 * as the LAUS POST body's registrationkey when present; keyless
 * behavior is unchanged when it is absent. */
const envFile = process.env.PACK_ENV_FILE ||
  path.join(homedir(), 'workspace', 'system', 'data-apis', '.env');
let BLS_API_KEY = process.env.BLS_API_KEY || null;
if (!BLS_API_KEY && existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = /^\s*BLS_API_KEY\s*=\s*(.+?)\s*$/.exec(line);
    if (m) { BLS_API_KEY = m[1].replace(/^["']|["']$/g, ''); break; }
  }
}

function todayET() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Detroit' })
    .format(new Date());
}
function countyFips() {
  const geo = JSON.parse(readFileSync(path.join(GEO_DIR, 'mi-county-paths.json'), 'utf8'));
  return geo.counties.map(c => ({ fips: c.fips, name: c.name }));
}
async function fetchRetry(url, opts = {}, tries = 4) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    let res = null;
    try {
      res = await fetch(url, { headers: UA, ...opts });
    } catch (e) { lastErr = e; }
    if (res) {
      if (res.ok) return res;
      /* 429 (Too Many Requests) means stop, not retry in a second —
       * especially for daily-quota APIs (rate-limit audit S5,
       * 2026-10-08). Surface any Retry-After the server sent. */
      if (res.status === 429) {
        const ra = res.headers.get('retry-after');
        throw new Error('HTTP 429 (Too Many Requests) for ' + url +
          (ra ? ' — Retry-After: ' + ra : '') + ' (not retried)');
      }
      lastErr = new Error('HTTP ' + res.status + ' for ' + url);
    }
    /* Backoff floor of 5 s between tries (S5): 5s, 10s, 15s. */
    if (i < tries - 1) await new Promise(r => setTimeout(r, 5000 * (i + 1)));
  }
  throw lastErr;
}

/* ------------------------------ LAUS ------------------------------ */
const LAUS_OUT = path.join(GEO_DIR, 'laus-county.json');
async function refreshLaus() {
  const counties = countyFips();
  const committed = existsSync(LAUS_OUT)
    ? JSON.parse(readFileSync(LAUS_OUT, 'utf8')) : null;
  const ids = counties.map(c => 'LAUCN' + c.fips + '0000000003');
  const series = new Map();
  for (let i = 0; i < ids.length; i += 20) {
    const batch = ids.slice(i, i + 20);
    const body = { seriesid: batch, startyear: '2025', endyear: '2026' };
    if (BLS_API_KEY) body.registrationkey = BLS_API_KEY;
    const res = await fetchRetry('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.status !== 'REQUEST_SUCCEEDED') {
      throw new Error('BLS API status: ' + json.status + ' ' + (json.message || []).join('; '));
    }
    for (const s of json.Results.series) series.set(s.seriesID, s.data || []);
    // A nonexistent series comes back as a shell with no data —
    // that is a failed read, never a county full of holes.
    for (const s of json.Results.series) {
      if (!s.data || !s.data.length) {
        throw new Error('BLS API returned no data for ' + s.seriesID);
      }
    }
  }
  if (series.size !== ids.length) {
    throw new Error('LAUS: ' + series.size + ' of ' + ids.length + ' series answered');
  }
  // Parse every point; value '-' (or non-numeric) is a hole, kept as one.
  const points = new Map(); // id -> Map ym -> {v|null, prelim}
  const months = new Set();
  for (const [id, data] of series) {
    const m = new Map();
    for (const d of data) {
      const ym = d.year + '-' + d.period.slice(1);
      months.add(ym);
      const v = Number(d.value);
      m.set(ym, {
        v: Number.isFinite(v) ? v : null,
        prelim: (d.footnotes || []).some(f => f && f.code === 'P'),
        footnote: (d.footnotes || []).map(f => f && f.text).filter(Boolean).join(' '),
      });
    }
    points.set(id, m);
  }
  const sortedMonths = [...months].sort();
  const latest = sortedMonths[sortedMonths.length - 1];
  if (committed && committed.referenceMonth === latest) {
    console.log('laus: committed file already at latest month ' + latest + ' — untouched');
    return;
  }
  // Statewide hole months: every county valueless that month.
  const holeMonths = sortedMonths.filter(ym =>
    counties.every(c => {
      const p = points.get('LAUCN' + c.fips + '0000000003').get(ym);
      return !p || p.v === null;
    }));
  const out = {
    source: 'U.S. Bureau of Labor Statistics, Local Area Unemployment Statistics (LAUS), county unemployment rate, not seasonally adjusted',
    sourceUrl: 'https://api.bls.gov/publicAPI/v2/timeseries/data/ (series LAUCN{countyFIPS}0000000003)',
    vintage: 'Monthly; reference month ' + latest,
    referenceMonth: latest,
    preliminary: counties.some(c => {
      const p = points.get('LAUCN' + c.fips + '0000000003').get(latest);
      return p && p.prelim;
    }),
    retrievedOn: todayET(),
    holeMonths,
    counties: counties.map(c => {
      const p = points.get('LAUCN' + c.fips + '0000000003').get(latest);
      return { fips: c.fips, name: c.name, rate: p && p.v !== null ? p.v : null };
    }),
  };
  writeFileSync(LAUS_OUT, JSON.stringify(out, null, 2) + '\n');
  console.log('laus: wrote ' + out.counties.length + ' counties, reference month ' +
    latest + (out.preliminary ? ' (preliminary)' : '') +
    ', hole months: ' + (holeMonths.join(', ') || 'none'));
}

/* ------------------------------ QCEW ------------------------------ */
/* BLS-published NAICS sector titles (QCEW naming). */
const SECTOR_LABELS = {
  '10': 'Total, all industries',
  '11': 'Agriculture, forestry, fishing and hunting',
  '21': 'Mining, quarrying, and oil and gas extraction',
  '22': 'Utilities',
  '23': 'Construction',
  '31-33': 'Manufacturing',
  '42': 'Wholesale trade',
  '44-45': 'Retail trade',
  '48-49': 'Transportation and warehousing',
  '51': 'Information',
  '52': 'Finance and insurance',
  '53': 'Real estate and rental and leasing',
  '54': 'Professional and technical services',
  '55': 'Management of companies and enterprises',
  '56': 'Administrative and waste services',
  '61': 'Educational services',
  '62': 'Health care and social assistance',
  '71': 'Arts, entertainment, and recreation',
  '72': 'Accommodation and food services',
  '81': 'Other services, except public administration',
  '92': 'Public administration',
  '99': 'Unclassified',
};
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch !== '\r') field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const head = rows[0];
  return rows.slice(1).filter(r => r.length > 1)
    .map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const QCEW_OUT = path.join(GEO_DIR, 'qcew-county-industry.json');
const QCEW_URL = fips => 'https://data.bls.gov/cew/data/api/2024/a/area/' + fips + '.csv';
async function fetchQcewRows(fips) {
  const res = await fetchRetry(QCEW_URL(fips));
  return parseCsv(await res.text());
}
async function refreshQcew() {
  const counties = countyFips();
  const cellOf = (rows, agglvl, own, code) => {
    const r = rows.find(x => x.agglvl_code === agglvl && x.own_code === own && x.industry_code === code);
    if (!r) return { absent: true };
    if (r.disclosure_code === 'N') return { disclosed: false };
    return {
      disclosed: true,
      emplvl: parseInt(r.annual_avg_emplvl, 10),
      lq: Number(r.lq_annual_avg_emplvl),
    };
  };
  const raw = [];
  const queue = [...counties];
  async function worker() {
    while (queue.length) {
      const c = queue.shift();
      const rows = await fetchQcewRows(c.fips);
      if (!rows.length) throw new Error('QCEW: ' + c.name + ' file empty');
      raw.push({ county: c, rows });
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  if (raw.length !== counties.length) {
    throw new Error('QCEW: read ' + raw.length + ' of ' + counties.length + ' counties');
  }
  // Sector universe = the union of private-ownership sector
  // rows the 83 county files publish (QCEW's sector set).
  const sectorCodes = [...new Set(raw.flatMap(({ rows }) =>
    rows.filter(r => r.agglvl_code === '74' && r.own_code === '5' && SECTOR_LABELS[r.industry_code])
      .map(r => r.industry_code)))].sort();
  if (!sectorCodes.includes('31-33') || sectorCodes.length < 15) {
    throw new Error('QCEW: sector universe implausible: ' + sectorCodes.join(','));
  }
  const outCounties = raw.map(({ county: c, rows }) => {
    const sectors = {};
    for (const code of sectorCodes) {
      const cell = cellOf(rows, '74', '5', code);
      sectors[code] = cell.disclosed === true
        ? { emplvl: cell.emplvl, lq: cell.lq }
        : cell.absent ? { absent: true } : { disclosed: false };
    }
    const totalPrivate = cellOf(rows, '71', '5', '10');
    const totalAll = cellOf(rows, '70', '0', '10');
    if (!totalPrivate.disclosed || !totalAll.disclosed) {
      throw new Error('QCEW: ' + c.name + ' county totals not disclosed');
    }
    return {
      fips: c.fips, name: c.name,
      totalPrivate: { emplvl: totalPrivate.emplvl, lq: totalPrivate.lq },
      totalAllOwnership: { emplvl: totalAll.emplvl },
      sectors,
    };
  }).sort((a, b) => a.fips < b.fips ? -1 : 1);
  // Sanity cross-checks for the 2024 vintage (verified samples,
  // specs/014-michigan-talent-maps/sources.md): Wayne private
  // manufacturing 89,659; Wayne all-ownership total 725,504.
  // If BLS revises the 2024 annual file, update these with the
  // revision noted in sources.md — never silently.
  const wayne = outCounties.find(c => c.fips === '26163');
  if (!wayne || wayne.sectors['31-33'].emplvl !== 89659 || wayne.totalAllOwnership.emplvl !== 725504) {
    throw new Error('QCEW check failed for Wayne County (mfg ' +
      (wayne && wayne.sectors['31-33'].emplvl) + ', total ' +
      (wayne && wayne.totalAllOwnership.emplvl) + ')');
  }
  const out = {
    source: 'U.S. Bureau of Labor Statistics, Quarterly Census of Employment and Wages (QCEW), per-area CSV API',
    sourceUrl: 'https://data.bls.gov/cew/data/api/2024/a/area/{countyFips}.csv',
    vintage: '2024 annual averages',
    retrievedOn: todayET(),
    grain: 'County x NAICS sector at agglvl_code 74, PRIVATE ownership (own_code 5) — the only ownership grain at which QCEW publishes county x sector rows; county totals are total-ownership (agglvl 70) and private (agglvl 71). Cells: {emplvl, lq} published; {disclosed:false} = disclosure_code N (values zeroed in the source, never transcribed); {absent:true} = the source publishes no row for the cell.',
    sectors: sectorCodes.map(code => ({ code, label: SECTOR_LABELS[code] })),
    counties: outCounties,
  };
  writeFileSync(QCEW_OUT, JSON.stringify(out, null, 2) + '\n');
  const suppressed = outCounties.reduce((n, c) =>
    n + Object.values(c.sectors).filter(s => s.disclosed === false).length, 0);
  const absent = outCounties.reduce((n, c) =>
    n + Object.values(c.sectors).filter(s => s.absent).length, 0);
  console.log('qcew: wrote ' + outCounties.length + ' counties x ' + out.sectors.length +
    ' sectors; ' + suppressed + ' suppressed + ' + absent + ' absent cells stored valueless');
}

/* ------------------------------ main ------------------------------ */
const which = process.argv[2] || 'all';
let failed = false;
if (which === 'laus' || which === 'all') {
  try { await refreshLaus(); }
  catch (e) {
    failed = true;
    console.warn('laus: refresh failed, committed file kept — ' + e.message);
    if (!existsSync(LAUS_OUT)) process.exitCode = 1;
  }
}
if (which === 'qcew' || which === 'all') {
  try { await refreshQcew(); }
  catch (e) {
    failed = true;
    console.warn('qcew: refresh failed, committed file kept — ' + e.message);
    if (!existsSync(QCEW_OUT)) process.exitCode = 1;
  }
}
if (!failed) console.log('fetch-geo: done');
