/*
 * pack/scorecard.mjs — College Scorecard (api.data.gov), spec 019 FR-007.
 *
 * Endpoint: GET https://api.data.gov/ed/collegescorecard/v1/schools.json
 *   ?api_key=<key>&school.state=MI&per_page=100&page=<n>&fields=<csv>
 * Response: { metadata: { total, page, per_page }, results: [...] }.
 * With an explicit fields list, scalar results come back under dotted
 * keys ("latest.student.size"); the field-of-study array comes back as
 * a real array under "latest.programs.cip_4_digit".
 *
 * Fields (all verified against the official API documentation at
 * collegescorecard.ed.gov/data/api-documentation and the data
 * dictionary naming, and confirmed live — see below):
 *   id, school.name, school.city
 *   latest.student.size                                  enrollment
 *   latest.completion.completion_rate_4yr_150nt          completion rate, 4-yr, 150% time
 *   latest.completion.consumer_rate                      fallback completion rate
 *   latest.earnings.6_yrs_after_entry.median             median earnings 6 yrs after entry
 *   latest.earnings.10_yrs_after_entry.median            median earnings 10 yrs after entry
 *   latest.programs.cip_4_digit                          field-of-study array:
 *     { code, title, credential: { level, title },
 *       earnings: { "1_yr": { overall_median_earnings },
 *                   "4_yr": { overall_median_earnings },
 *                   median_earnings (older shape, if present) } }
 *   Per institution the array is summarized to its top-earning program
 *   (highest available median earnings; 1-yr figure preferred).
 *
 * Live shape check (2026-10-08): api.data.gov's public DEMO_KEY —
 * a documented shared demo credential, not the project key — returned
 * real data for this exact field set: metadata.total = 172 Michigan
 * institutions, all scalar fields above populated, and the programs
 * array in the nested shape described. The project key (DATAGOV_API_KEY)
 * is still KEY PENDING, so this source is reported key-pending per
 * spec 019 even though the response shape is verified.
 *
 * Cross-section shape: one value per institution (the Scorecard
 * "latest" snapshot; per-metric years vary — see the API docs), so
 * series entries use values: [{ name, value }] like the Census module.
 */
const FIELDS = [
  'id',
  'school.name',
  'school.city',
  'latest.student.size',
  'latest.completion.completion_rate_4yr_150nt',
  'latest.completion.consumer_rate',
  'latest.earnings.6_yrs_after_entry.median',
  'latest.earnings.10_yrs_after_entry.median',
  'latest.programs.cip_4_digit',
].join(',');
const PER_PAGE = 100;

function programMedianEarnings(p) {
  if (!p || typeof p !== 'object' || !p.earnings) return null;
  const e = p.earnings;
  const candidates = [
    e['1_yr'] && e['1_yr'].overall_median_earnings,
    e.median_earnings,
    e['4_yr'] && e['4_yr'].overall_median_earnings,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (c != null && Number.isFinite(n)) return n;
  }
  return null;
}
function topProgram(school) {
  const arr = school['latest.programs.cip_4_digit'];
  if (!Array.isArray(arr) || !arr.length) return null;
  let best = null;
  for (const p of arr) {
    const earn = programMedianEarnings(p);
    if (earn == null) continue;
    if (!best || earn > best.value) {
      best = {
        name: school['school.name'],
        value: earn,
        program: p.title || null,
        credential: (p.credential && p.credential.title) || null,
      };
    }
  }
  return best;
}
const numOrNull = v => {
  const n = Number(v);
  return v != null && Number.isFinite(n) ? n : null;
};

export default {
  id: 'scorecard',
  name: 'College Scorecard',
  publisher: 'U.S. Department of Education',
  requiresKey: 'DATAGOV_API_KEY',
  async fetch(ctx) {
    const key = ctx.env.DATAGOV_API_KEY;
    const schools = [];
    let total = Infinity;
    for (let page = 0; schools.length < total; page++) {
      const url = 'https://api.data.gov/ed/collegescorecard/v1/schools.json' +
        '?api_key=' + encodeURIComponent(key) +
        '&school.state=MI&per_page=' + PER_PAGE + '&page=' + page +
        '&fields=' + encodeURIComponent(FIELDS);
      const json = await ctx.get(url);
      const batch = Array.isArray(json && json.results) ? json.results : [];
      if (json && json.metadata && Number.isFinite(Number(json.metadata.total))) {
        total = Number(json.metadata.total);
      } else if (!batch.length) break;
      schools.push(...batch);
      if (!batch.length) break;
    }
    if (!schools.length) throw new Error('College Scorecard returned no Michigan institutions');

    const byValueDesc = (a, b) => b.value - a.value;
    const collect = (get) => schools
      .map(s => { const v = get(s); return v == null ? null : { name: s['school.name'], value: v }; })
      .filter(Boolean)
      .sort(byValueDesc);
    const completionOf = s => {
      const primary = numOrNull(s['latest.completion.completion_rate_4yr_150nt']);
      return primary != null ? primary : numOrNull(s['latest.completion.consumer_rate']);
    };
    const topPrograms = schools.map(topProgram).filter(Boolean).sort(byValueDesc);

    return {
      vintage: 'College Scorecard "latest" snapshot via schools.json (per-metric latest years vary by variable; API metadata carries total/page only, no single release vintage)',
      referencePeriod: 'latest',
      series: [
        { id: 'student-size', label: 'Enrolled student size, Michigan institutions', unit: 'Students', values: collect(s => numOrNull(s['latest.student.size'])) },
        { id: 'completion-rate', label: 'Completion rate (4-year, 150% of normal time; consumer_rate fallback), Michigan institutions', unit: 'Fraction (0–1)', values: collect(completionOf) },
        { id: 'earnings-6yr', label: 'Median earnings 6 years after entry, Michigan institutions', unit: 'Dollars per year', values: collect(s => numOrNull(s['latest.earnings.6_yrs_after_entry.median'])) },
        { id: 'earnings-10yr', label: 'Median earnings 10 years after entry, Michigan institutions', unit: 'Dollars per year', values: collect(s => numOrNull(s['latest.earnings.10_yrs_after_entry.median'])) },
        { id: 'top-program-earnings', label: 'Top-earning field of study per institution (median earnings, 1-yr after completion preferred), Michigan institutions', unit: 'Dollars per year', values: topPrograms },
      ],
      notes: 'Cross-section: series use values:[{name, value}] (one value per institution) instead of observations; top-program entries add program + credential fields. ' + schools.length + ' Michigan institutions returned by the API metadata total at pull time. Null/suppressed metrics are omitted per series, so series lengths differ. Response shape verified live 2026-10-08 with api.data.gov\u2019s public DEMO_KEY (172 MI institutions); project DATAGOV_API_KEY still KEY PENDING.',
    };
  },
};
