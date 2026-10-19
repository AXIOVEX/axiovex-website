import { windows, midnight } from './calendar.mjs';
import { save, summary, request } from './io.mjs';
import { pathToFileURL } from 'node:url';

export function aggregate(rows) {
  const result = { requests: 0, bytes: 0, cachedBytes: 0, statuses: {} };
  for (const row of rows) {
    for (const key of ['requests', 'bytes', 'cachedBytes']) {
      if (!Number.isFinite(row.sum?.[key])) throw new Error(`Invalid Cloudflare ${key}`);
      result[key] += row.sum[key];
    }
    for (const status of row.sum.responseStatusMap || []) {
      result.statuses[status.edgeResponseStatus] = (result.statuses[status.edgeResponseStatus] || 0) + status.requests;
    }
  }
  result.cacheRatio = result.bytes ? result.cachedBytes / result.bytes : null;
  return result;
}
export function delta(current, previous) {
  return previous === 0 ? (current === 0 ? 'unchanged at zero' : 'no percentage baseline (prior zero)') : `${((current / previous - 1) * 100).toFixed(1)}%`;
}
const meanings = { 200: 'OK', 201: 'Created', 204: 'No content', 301: 'Permanent redirect', 302: 'Temporary redirect', 304: 'Not modified', 400: 'Bad request', 401: 'Authentication required', 403: 'Forbidden', 404: 'Not found', 405: 'Method not allowed', 408: 'Request timeout', 429: 'Too many requests', 500: 'Internal server error', 502: 'Bad gateway', 503: 'Service unavailable', 504: 'Gateway timeout', 520: 'Unknown origin error', 521: 'Origin server down', 522: 'Origin connection timed out', 523: 'Origin unreachable', 524: 'Origin response timed out', 525: 'TLS handshake failed', 526: 'Invalid TLS certificate' };
export function statusLabel(code) {
  return `${code} (${meanings[code] || ({ 1: 'Informational response', 2: 'Successful response', 3: 'Redirect response', 4: 'Client error', 5: 'Server error' })[String(code)[0]] || 'Unclassified status'})`;
}

async function graphql(token, query, name) {
  const response = await request('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const data = await response.json();
  save(`${name}.json`, data);
  if (!response.ok || data.errors?.length) throw new Error(`Cloudflare ${name}: API rejected query (HTTP ${response.status}); inspect raw artifact`);
  const zone = data.data?.viewer?.zones?.[0];
  if (!zone) throw new Error(`Cloudflare ${name}: no authorized zone returned`);
  return zone;
}
async function main() {
  const cadence = process.argv[2];
  const w = windows(cadence);
  const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN;
  if (!token) throw new Error('Missing CLOUDFLARE_ANALYTICS_TOKEN: migrate the zone-scoped Analytics Read + Zone Read token from the Muse vault to GitHub Actions secrets.');
  const response = await request('https://api.cloudflare.com/client/v4/zones?name=axiovexsystems.com', { headers: { Authorization: `Bearer ${token}` } });
  const lookup = await response.json();
  if (!response.ok || !lookup.success || lookup.result?.length !== 1) throw new Error('Cloudflare zone lookup failed');
  const zone = lookup.result[0].id;
  if (!/^[a-f0-9]{32}$/.test(zone)) throw new Error('Invalid zone ID');
  const gaps = ['Distinct visitors unavailable: summing hourly uniques would double-count people.'];
  if (cadence !== 'daily') gaps.push('Official AEO/Seobility scores unavailable: Muse checker access and score history have not been migrated. Baselines: AEO 100, Seobility 90.');
  if (['REPORT_GMAIL_CLIENT_ID', 'REPORT_GMAIL_CLIENT_SECRET', 'REPORT_GMAIL_REFRESH_TOKEN'].some(k => !process.env[k])) gaps.push('Report email delivery unavailable until Gmail OAuth credentials are configured (see operations runbook).');
  const range = (start, end) => `datetime_geq: ${JSON.stringify(midnight(start))}, datetime_lt: ${JSON.stringify(midnight(end))}`;
  const totals = {};
  const series = {};
  for (const [name, start, end] of [['current', w.start, w.end], ['previous', w.previous, w.start]]) {
    // Separate calls keep a plan restriction on adaptive detail from destroying totals.
    let data;
    try {
      data = await graphql(token, `{viewer{zones(filter:{zoneTag:"${zone}"}){rows:httpRequests1hGroups(limit:2000,filter:{${range(start, end)}},orderBy:[datetime_ASC]){dimensions{datetime} sum{requests bytes cachedBytes responseStatusMap{edgeResponseStatus requests}}}}}}`, name);
    } catch {
      // Older hourly data can be outside plan retention. A UTC daily fallback
      // is labeled explicitly and is never represented as exact ET totals.
      data = await graphql(token, `{viewer{zones(filter:{zoneTag:"${zone}"}){rows:httpRequests1dGroups(limit:2000,filter:{date_geq:"${start}",date_lt:"${end}"},orderBy:[date_ASC]){dimensions{date} sum{requests bytes cachedBytes responseStatusMap{edgeResponseStatus requests}}}}}}`, name + '-utc-fallback');
      gaps.push(`${name}: hourly ET rollups unavailable; totals use UTC calendar dates ${start} through ${end} exclusive. This is a timezone-degraded comparison.`);
    }
    if (!Array.isArray(data.rows) || data.rows.length === 2000) throw new Error('Missing or truncated hourly rollups');
    totals[name] = aggregate(data.rows);
    const byDay = {};
    for (const row of data.rows) {
      const day = row.dimensions.date || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(row.dimensions.datetime));
      byDay[day] = (byDay[day] || 0) + row.sum.requests;
    }
    series[name] = byDay;
    if (!data.rows.length) gaps.push(`${name} window has no returned rollups; zero activity cannot be established.`);
    save(`${name}-normalized.json`, totals[name]);
  }
  const details = {};
  for (const [name, fields, filter] of [
    ['paths', 'clientRequestHTTPHost clientRequestPath', ''],
    ['countries', 'clientCountryName', ''],
    ['contact', 'clientRequestHTTPHost edgeResponseStatus', ',clientRequestPath:"/api/contact"'],
    ['server-errors', 'clientRequestHTTPHost edgeResponseStatus', ',edgeResponseStatus_geq:500'],
  ]) {
    try {
      const data = await graphql(token, `{viewer{zones(filter:{zoneTag:"${zone}"}){rows:httpRequestsAdaptiveGroups(limit:100,filter:{${range(w.start, w.end)}${filter}},orderBy:[count_DESC]){count dimensions{${fields}}}}}}`, name);
      if (!Array.isArray(data.rows)) throw new Error('Missing adaptive rows');
      details[name] = data.rows;
      if (data.rows.length === 100) gaps.push(`${name}: top 100 groups only; totals are truncated.`);
    } catch (error) { gaps.push(`${name} detail unavailable: ${error.message}`); }
  }
  if (cadence !== 'daily') {
    try {
      const data = await graphql(token, `{viewer{zones(filter:{zoneTag:"${zone}"}){rows:httpRequestsAdaptiveGroups(limit:100,filter:{${range(w.previous, w.start)}},orderBy:[count_DESC]){count dimensions{clientRequestHTTPHost clientRequestPath}}}}}`, 'previous-paths');
      details['previous-paths'] = data.rows;
      if (!Array.isArray(data.rows)) throw new Error('Missing prior paths');
    } catch (error) { gaps.push(`Prior paths unavailable; no mover comparison: ${error.message}`); }
  }
  const movers = [];
  if (details.paths && details['previous-paths']) {
    const prior = new Map(details['previous-paths'].map(r => [JSON.stringify(r.dimensions), r.count]));
    for (const row of details.paths) {
      const before = prior.get(JSON.stringify(row.dimensions));
      // A missing top-N group is unknown, never an assumed zero.
      if (before !== undefined) movers.push({ ...row.dimensions, current: row.count, previous: before, change: row.count - before });
    }
    movers.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }
  save('window.json', { cadence, ...w, timezone: 'America/New_York', totals, series, details, movers, gaps });
  const a = totals.current, b = totals.previous;
  const divisor = cadence === 'daily' ? 7 : 1;
  const metrics = ['requests', 'bytes', 'cachedBytes'].map(k => `| ${k} | ${a[k]} | ${b[k] / divisor} | ${delta(a[k], b[k] / divisor)} |`).join('\n');
  const serverErrors = Object.entries(a.statuses).filter(([code]) => +code >= 500).reduce((n, [, count]) => n + count, 0);
  const text = `# Axiovex website — ${cadence} report\n\n${w.start} through ${w.end} (exclusive), America/New_York. Comparison starts ${w.previous}; ${cadence === 'daily' ? 'trailing seven-day daily average' : 'previous period'}.\n\n## Measured facts\n\nZone-wide unsampled hourly rollups include production and staging. Adaptive detail is sampled and never overrides rollups.\n\n| Metric | Current | Comparison | Computed change |\n|---|---:|---:|---|\n${metrics}\n\nCache ratio by bytes: ${a.cacheRatio === null ? 'unavailable (no bandwidth)' : (a.cacheRatio * 100).toFixed(2) + '%'}.\n\n${Object.entries(a.statuses).map(([code, count]) => `- ${statusLabel(code)}: ${count}`).join('\n')}\n\n## Adaptive detail\n\nHostnames are retained to distinguish production from staging.\n\n${Object.entries(details).map(([name, rows]) => `### ${name}\n\n${rows.length ? rows.slice(0, name === 'paths' ? 5 : 20).map(r => `- ${Object.values(r.dimensions).join(' · ')}: ${r.count} sampled requests`).join('\n') : 'No groups returned; absence of a sampled event does not establish zero.'}`).join('\n\n')}\n\n## Insights\n\n${serverErrors ? `${serverErrors} server-error responses in authoritative zone totals. Inspect host-split samples before attributing them to production.` : 'No server errors in returned rollups; this does not prove application health.'} Request change: ${delta(a.requests, b.requests / divisor)}. Causes remain unexplained until checked against deployment and incident evidence.\n\n## Suggestions\n\n- Owner decision: investigate any server errors and traffic movement against releases before changing content.\n- Safe technical check: inspect failing health probes in the health workflow; no automatic copy or branding edits.\n\n## Unavailable / migration gaps\n\n${gaps.map(g => '- ' + g).join('\n')}\n`;
  const ranked = Object.entries(series.current).sort((a, b) => b[1] - a[1]);
  const extra = `\n## Daily request trend\n\n${Object.entries(series.current).sort().map(([date, count]) => `- ${date}: ${count}`).join('\n')}\n\n${ranked.length ? `Highest observed day: ${ranked[0][0]} (${ranked[0][1]} requests); lowest observed day: ${ranked.at(-1)[0]} (${ranked.at(-1)[1]} requests). Missing days are not imputed as zero.` : 'No daily observations.'}\n\n## Path movers\n\n${movers.length ? movers.slice(0, 10).map(r => `- ${r.clientRequestHTTPHost}${r.clientRequestPath}: ${r.previous} → ${r.current} sampled requests (${r.change >= 0 ? '+' : ''}${r.change})`).join('\n') : 'No comparable path groups returned.'}\n\nComparison includes only paths present in both top-100 responses. Missing groups are unknown. Sampling and query truncation limit mover rankings; they do not establish causal changes.\n`;
  summary(text + extra);
  if (!totals.current.requests && !totals.previous.requests) throw new Error('No traffic evidence returned; report retained for diagnosis');
  if (gaps.length) process.exitCode = 2; // A partial report is never a green complete report.
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { summary(`# Analytics report failed\n\n${error.message}\n`); process.exitCode = 1; });
}
