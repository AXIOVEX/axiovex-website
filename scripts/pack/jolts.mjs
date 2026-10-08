/*
 * jolts.mjs — JOLTS state estimates for Michigan (spec 019 FR-001).
 *
 * Source: BLS public API v2, no key. Series IDs verified directly
 * against BLS on 2026-10-08:
 *
 *   BLS JOLTS series IDs are 21 characters (BLS "Changes to JOLTS
 *   Series Codes", 2020-10-06; "Series ID Formats" help page):
 *     JT + seasonal(1) + industry(6) + state(2) + area(5)
 *        + sizeclass(2) + dataelement(2) + ratelevel(1)
 *   Michigan state_code is 26 (its FIPS code — BLS JOLTS State
 *   Estimates Methodology table lists "Michigan | 26 | Midwest").
 *   Total nonfarm industry is 000000, area 00000, sizeclass 00.
 *   Data elements: JO = job openings, LD = layoffs and discharges;
 *   ratelevel L = level, R = rate.
 *
 *     JTS000000260000000JOL  openings level   (thousands, SA)
 *     JTS000000260000000JOR  openings rate    (percent, SA)
 *     JTS000000260000000LDL  layoffs & discharges level (thousands, SA)
 *     JTS000000260000000LDR  layoffs & discharges rate  (percent, SA)
 *
 * Cross-check (2026-10-08): the API's current vintage matches the
 * BLS State JOLTS Annual 2025 release (USDL-26-1258, 2026-07-22)
 * exactly for Michigan, Jul–Dec 2025 — openings level
 * 250/241/233/248/221/221, rate 5.3/5.1/4.9/5.2/4.7/4.7 (Table 1);
 * layoffs level 60/60/52/74/30/58, rate 1.3/1.3/1.2/1.7/0.7/1.3
 * (Table 5). Those Dec 2025 figures (221 / 4.7 / 58 / 1.3) supersede
 * the preliminary values in the last monthly Michigan release
 * (2026-02-26: 205 / 4.3 / 64 / 1.4): the annual release revised the
 * monthly state estimates with national JOLTS benchmark revisions
 * and updated CES/QCEW data.
 *
 * Publication model: state JOLTS moved from a monthly to an ANNUAL
 * release in 2026. Monthly estimates for a calendar year are
 * published/revised with the annual release the following July, so
 * the latest reference period normally ends with the prior December
 * and lags the national JOLTS series by ~7 months. An empty current
 * year from the API is expected, not a failure.
 */

const API = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

const DEFS = [
  {
    id: 'JTS000000260000000JOL',
    label: 'Job openings level — Michigan, total nonfarm, seasonally adjusted',
    unit: 'thousands',
  },
  {
    id: 'JTS000000260000000JOR',
    label: 'Job openings rate — Michigan, total nonfarm, seasonally adjusted',
    unit: 'percent',
  },
  {
    id: 'JTS000000260000000LDL',
    label: 'Layoffs and discharges level — Michigan, total nonfarm, seasonally adjusted',
    unit: 'thousands',
  },
  {
    id: 'JTS000000260000000LDR',
    label: 'Layoffs and discharges rate — Michigan, total nonfarm, seasonally adjusted',
    unit: 'percent',
  },
];

export default {
  id: 'jolts',
  name: 'JOLTS (state)',
  publisher: 'U.S. Bureau of Labor Statistics',
  requiresKey: null,

  async fetch(ctx) {
    // The pack runner's ctx.get is GET-only, so query one series per
    // request (the BLS GET form supports startyear/endyear). Ask for
    // four calendar years so the latest ~24 published months are
    // always in window even though state data lags (see header).
    const endYear = new Date().getUTCFullYear();
    const startYear = endYear - 3;

    const series = [];
    for (const def of DEFS) {
      const url = API + def.id + '?startyear=' + startYear + '&endyear=' + endYear;
      const res = await ctx.get(url);
      const raw = res?.Results?.series?.[0]?.data || [];
      const observations = raw
        .filter(d => /^M(0[1-9]|1[0-2])$/.test(d.period) && d.value !== '-' && Number.isFinite(Number(d.value)))
        .map(d => ({
          period: d.year + '-' + d.period.slice(1),
          value: Number(d.value),
        }))
        .sort((a, b) => a.period.localeCompare(b.period))
        .slice(-24);
      if (observations.length === 0) {
        const msg = (res?.message || []).join('; ') || 'no observations returned';
        throw new Error('BLS returned no data for ' + def.id + ' (' + msg + ')');
      }
      series.push({ id: def.id, label: def.label, unit: def.unit, observations });
    }

    const latest = series
      .map(s => s.observations[s.observations.length - 1].period)
      .sort()
      .at(-1);

    return {
      vintage: 'BLS public API v2 retrieval ' + new Date().toISOString().slice(0, 10) +
        '; state JOLTS annual-release vintage (monthly state estimates are ' +
        'revised with each July annual release)',
      referencePeriod: latest,
      series,
      notes:
        'Michigan total nonfarm, seasonally adjusted, model-based state JOLTS ' +
        'estimates. Levels in thousands; rates in percent. State JOLTS moved ' +
        'from a monthly to an annual release in 2026: monthly estimates for a ' +
        'calendar year are published/revised with the annual release the ' +
        'following July, so the latest reference period is the prior December ' +
        'until the next annual release. Current-vintage Dec 2025 values ' +
        '(openings 221k / 4.7%; layoffs & discharges 58k / 1.3%) are the ' +
        'July 2026 annual-release revisions and supersede the preliminary ' +
        'Feb 2026 monthly-release values (205k / 4.3%; 64k / 1.4%).',
    };
  },
};
