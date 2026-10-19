import { windows, midnight, shift } from './calendar.mjs';
import { save, summary, request } from './io.mjs';
import { readTrafficArchive, persistTrafficArchive } from './traffic-archive.mjs';
import { pathToFileURL } from 'node:url';

export function aggregate(rows) {
  const result = { requests: 0, bytes: 0, cachedBytes: 0, statuses: {} };
  for (const row of rows) {
    for (const key of ['requests', 'bytes', 'cachedBytes']) {
      if (!Number.isFinite(row.sum?.[key]) || row.sum[key] < 0) throw new Error(`Invalid Cloudflare ${key}`);
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
  const additional = { 206: 'Partial content', 308: 'Permanent redirect', 422: 'Unprocessable content', 499: 'Client closed request' };
  return `${code} (${meanings[code] || additional[code] || ({ 1: 'Informational response', 2: 'Successful response', 3: 'Redirect response', 4: 'Client error', 5: 'Server error' })[String(code)[0]] || 'Unclassified status'})`;
}
export function hourlyBatches(start, end) {
  const batches = [];
  for (let cursor = start; cursor < end;) {
    // Free-plan hourly queries allow at most three days per request.
    // Two local days also stay below the limit over a DST fall-back.
    const next = shift(cursor, 2) < end ? shift(cursor, 2) : end;
    batches.push([cursor, next]);
    cursor = next;
  }
  return batches;
}
export function renderDimensions(dimensions) {
  return Object.entries(dimensions).map(([key, value]) => key === 'edgeResponseStatus' ? statusLabel(value) : value).join(' · ');
}

export async function graphql(token, query, name) {
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
export function validateDailyRows(rows, start, end, allowIncomplete = false) {
  if (!Array.isArray(rows) || rows.length >= 2000) throw new Error('Missing or truncated daily rollups');
  const expected = [];
  for (let d = start; d < end; d = shift(d, 1)) expected.push(d);
  const dates = rows.map(r => r.dimensions?.date);
  if (new Set(dates).size !== dates.length || (!allowIncomplete && expected.some(d => !dates.includes(d))) || dates.some(d => !expected.includes(d))) {
    throw new Error('Daily rollup coverage incomplete: absent days cannot be counted as zero');
  }
  for (const row of rows) {
    if (!Number.isFinite(row.uniq?.uniques) || row.uniq.uniques < 0) throw new Error('Invalid daily unique count');
    if (row.sum.cachedBytes > row.sum.bytes) throw new Error('Cached bandwidth exceeds total bandwidth');
    if ((row.sum.responseStatusMap || []).reduce((n, r) => n + r.requests, 0) !== row.sum.requests) throw new Error('Status totals do not reconcile with requests');
  }
  return rows;
}
export function measuredInsights(a, b, divisor = 1) {
  if (a.complete === false || b.complete === false) return ['A complete reporting window or comparison is unavailable. Headline totals and deltas for missing windows are unknown. The observed subset is disclosed separately; it cannot establish full-period traffic or zero server errors.'];
  const errors = Object.entries(a.statuses).filter(([code]) => +code >= 500).reduce((n, [, v]) => n + v, 0);
  const cacheChange = a.cacheRatio !== null && b.cacheRatio !== null ? ((a.cacheRatio - b.cacheRatio) * 100).toFixed(1) : null;
  return [
    `Requests changed ${delta(a.requests, b.requests / divisor)}; bandwidth changed ${delta(a.bytes, b.bytes / divisor)} against the comparison. These are all HTTP requests, including crawlers, assets and staging; they are not customer visits or conversions.`,
    cacheChange === null ? 'Cache share cannot be computed without bandwidth.' : `The share of bandwidth served from cache changed ${+cacheChange >= 0 ? '+' : ''}${cacheChange} percentage points. These totals do not identify the cause or imply a cache configuration failure.`,
    errors ? `${errors.toLocaleString('en-US')} server-error responses appear in the authoritative zone rollup. Hostname attribution in adaptive estimates requires corroboration before calling this a production incident.` : 'The complete zone rollup recorded zero 5xx responses. A zero zone total also rules out recorded production and staging 5xx for this window; it does not establish successful form delivery.',
  ];
}
async function main() {
  const cadence = process.argv[2], w = windows(cadence, new Date(), process.env.REPORT_DATA_MONTH);
  const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN;
  if (!token) throw new Error('Missing CLOUDFLARE_ANALYTICS_TOKEN');
  const response = await request('https://api.cloudflare.com/client/v4/zones?name=axiovexsystems.com', { headers: { Authorization: `Bearer ${token}` } });
  const lookup = await response.json();
  if (!response.ok || !lookup.success || lookup.result?.length !== 1) throw new Error('Cloudflare zone lookup failed');
  const zone = lookup.result[0].id;
  if (!/^[a-f0-9]{32}$/.test(zone)) throw new Error('Invalid zone ID');
  const gaps = [], totals = {}, series = {}, details = {};
  // Use the same complete UTC calendar days for both windows and adaptive detail.
  // The reference email uses this basis; never mix current ET with prior UTC totals.
  let archived = [];
  try { archived = await readTrafficArchive(w.previous, w.end); } catch (error) { gaps.push(error.message + '; daily evidence was not restored from persistent storage.'); }
  const freshRows = [];
  const range = (start, end) => `datetime_geq:"${start}T00:00:00Z",datetime_lt:"${end}T00:00:00Z"`;
  for (const [name, start, end] of [['current', w.start, w.end], ['previous', w.previous, w.start]]) {
    const data = await graphql(token, `{viewer{zones(filter:{zoneTag:"${zone}"}){rows:httpRequests1dGroups(limit:2000,filter:{date_geq:"${start}",date_lt:"${end}"},orderBy:[date_ASC]){dimensions{date} sum{requests bytes cachedBytes responseStatusMap{edgeResponseStatus requests} countryMap{clientCountryName requests}} uniq{uniques}}}}}`, name + '-utc');
    validateDailyRows(data.rows, start, end, true);
    freshRows.push(...data.rows);
    const merged = new Map(archived.filter(r => r.dimensions?.date >= start && r.dimensions.date < end).map(r => [r.dimensions.date, r]));
    for (const row of data.rows) merged.set(row.dimensions.date, row);
    data.rows = [...merged.values()].sort((a, b) => a.dimensions.date.localeCompare(b.dimensions.date));
    validateDailyRows(data.rows, start, end, true);
    const expectedDays = Math.round((Date.parse(end) - Date.parse(start)) / 86400000);
    const complete = data.rows.length === expectedDays;
    const observed = { ...aggregate(data.rows), visitorDays: data.rows.reduce((n, r) => n + r.uniq.uniques, 0) };
    totals[name] = { ...(complete ? observed : { requests: null, bytes: null, cachedBytes: null, visitorDays: null, statuses: {}, cacheRatio: null }), complete, observed, observedDays: data.rows.length, expectedDays };
    if (!complete) gaps.push(`${name}: only ${data.rows.length}/${expectedDays} UTC dates have evidence. Full-window totals and comparisons are unavailable; absent dates are not zero.`);
    save(`${name}-merged-daily.json`, data.rows);
    series[name] = Object.fromEntries(data.rows.map(r => [r.dimensions.date, r.sum.requests]));
    const countries = {};
    for (const row of data.rows) for (const c of row.sum.countryMap || []) countries[c.clientCountryName] = (countries[c.clientCountryName] || 0) + c.requests;
    if (name === 'current') details.countries = Object.entries(countries).sort((a, b) => b[1] - a[1]);
    save(`${name}-normalized.json`, totals[name]);
  }
  try { await persistTrafficArchive(freshRows); } catch (error) { gaps.push(error.message + '; future monthly coverage may be incomplete.'); }
  for (const [name, fields, filter] of [
    ['paths', 'clientRequestHTTPHost clientRequestPath', ''],
    ['host-status', 'clientRequestHTTPHost edgeResponseStatus', ''],
    ['contact', 'clientRequestHTTPHost edgeResponseStatus', ',clientRequestPath:"/api/contact"'],
    ['server-errors', 'clientRequestHTTPHost edgeResponseStatus', ',edgeResponseStatus_geq:500'],
    ['cache-status', 'cacheStatus', ''],
  ]) {
    try {
      const data = await graphql(token, `{viewer{zones(filter:{zoneTag:"${zone}"}){rows:httpRequestsAdaptiveGroups(limit:100,filter:{${range(w.start, w.end)}${filter}},orderBy:[count_DESC]){count dimensions{${fields}}}}}}`, name);
      if (!Array.isArray(data.rows) || data.rows.some(r => !Number.isFinite(r.count) || r.count < 0)) throw new Error('Invalid adaptive rows');
      details[name] = data.rows;
      if (data.rows.length === 100) gaps.push(`${name}: top 100 groups only; this is not complete coverage.`);
    } catch (error) { gaps.push(`${name} estimates unavailable: ${error.message}`); }
  }
  try {
    const data = await graphql(token, `{viewer{zones(filter:{zoneTag:"${zone}"}){rows:httpRequestsAdaptiveGroups(limit:100,filter:{${range(w.previous, w.start)}},orderBy:[count_DESC]){count dimensions{clientRequestHTTPHost clientRequestPath}}}}}`, 'previous-paths');
    if (!Array.isArray(data.rows)) throw new Error('Missing prior paths');
    details['previous-paths'] = data.rows;
  } catch (error) { gaps.push(`Prior path estimates unavailable: ${error.message}`); }
  const unconfirmedErrors = [];
  for (const name of ['host-status', 'contact', 'server-errors']) {
    if (details[name]) details[name] = details[name].filter(r => {
      if (totals.current.complete && !(totals.current.statuses[r.dimensions.edgeResponseStatus] > 0)) { unconfirmedErrors.push({ dataset: name, ...r }); return false; }
      return true;
    });
  }
  if (unconfirmedErrors.length) gaps.push(`${unconfirmedErrors.length} adaptive groups reported status codes absent from the complete authoritative rollup and were excluded. The untouched raw responses are retained for investigation.`);
  if (details['host-status']) {
    for (const [code, n] of Object.entries(totals.current.statuses)) {
      const sampled = details['host-status'].filter(r => r.dimensions.edgeResponseStatus === +code).reduce((s, r) => s + r.count, 0);
      if (sampled > n) gaps.push(`${code} adaptive hostname estimates sum to ${sampled}; the authoritative count is ${n}. Estimates cannot be treated as exact host counts.`);
    }
  }
  const movers = [];
  if (details.paths && details['previous-paths']) {
    const prior = new Map(details['previous-paths'].map(r => [JSON.stringify(r.dimensions), r.count]));
    for (const row of details.paths) {
      const before = prior.get(JSON.stringify(row.dimensions));
      if (before !== undefined) movers.push({ ...row.dimensions, current: row.count, previous: before / (cadence === 'daily' ? 7 : 1), change: row.count - before / (cadence === 'daily' ? 7 : 1) });
    }
    movers.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }
  save('window.json', { cadence, ...w, timezone: 'UTC', totals, series, details, unconfirmedErrors, movers, gaps });
  const a = totals.current, b = totals.previous, divisor = cadence === 'daily' ? 7 : 1;
  const classes = {};
  for (const [code, n] of Object.entries(a.statuses)) classes[code[0]] = (classes[code[0]] || 0) + n;
  const ratio = n => n === null ? 'Unavailable' : (n * 100).toFixed(1) + '%';
  const metric = (label, key) => `| ${label} | ${Number.isFinite(a[key]) ? a[key] : 'Unavailable'} | ${Number.isFinite(b[key]) ? b[key] / divisor : 'Unavailable'} | ${Number.isFinite(a[key]) && Number.isFinite(b[key]) ? delta(a[key], b[key] / divisor) : 'Unavailable'} |`;
  const cacheDelta = a.cacheRatio !== null && b.cacheRatio !== null ? `${((a.cacheRatio - b.cacheRatio) * 100).toFixed(1)} pts` : 'Unavailable';
  const insights = measuredInsights(a, b, divisor);
  const hostNote = 'Production: axiovexsystems.com plus www.axiovexsystems.com (redirect host). Staging: staging.axiovexsystems.com, kept separate in estimated detail. Zone totals include both; estimates never override the complete rollup.';
  const estimated = (name, limit = 12) => details[name] ? details[name].length ? details[name].slice(0, limit).map(r => `- ${renderDimensions(r.dimensions)}: ${r.count.toLocaleString('en-US')} estimated requests`).join('\n') : 'No groups returned; no sampled event is not proof of zero activity.' : 'Unavailable in this run.';
  const ranked = Object.entries(series.current).sort((a, b) => b[1] - a[1]);
  const text = `# Axiovex website — ${cadence} report\n\n${w.start} through ${w.end} (exclusive), UTC calendar days. Generated ${new Date().toISOString().slice(0, 10)}. Comparison starts ${w.previous}; ${cadence === 'daily' ? 'trailing seven-day daily average' : 'previous calendar period'}.\n\n## Headline numbers\n\n| Metric | This period | Comparison | Delta |\n|---|---:|---:|---|\n${metric('Requests', 'requests')}\n${metric(cadence === 'daily' ? 'Daily unique visitors*' : 'Daily unique visitor-days*', 'visitorDays')}\n${metric('bytes', 'bytes')}\n| Bandwidth served from cache | ${ratio(a.cacheRatio)} | ${ratio(b.cacheRatio)} | ${cacheDelta} |\n| 2xx / 3xx / 4xx / 5xx | ${a.complete ? [2,3,4,5].map(k => (classes[k] || 0).toLocaleString('en-US')).join(' / ') : 'Unavailable'} | — | ${a.complete ? (classes[5] || 0) + ' server errors' : 'Unknown'} |\n\n*Cloudflare daily uniques; multi-day values are visitor-days (a visitor present on two days counts twice), not distinct people across the period. These counts include automated traffic and staging.\n\n## What this means\n\n${insights.join(' ')}\n\n${Object.entries(totals).filter(([,t]) => !t.complete).map(([name,t]) => `${name} observed subset: ${t.observedDays}/${t.expectedDays} UTC dates; ${t.observedDays ? t.observed.requests.toLocaleString('en-US') + ' requests on returned dates only (not a period total)' : 'no observed traffic counts'}.`).join(' ')}\n\n## Top paths\n\nAdaptive estimates, ranked within the top 100 returned groups. They can exceed the unsampled rollup and are not percentages of exact total traffic.\n\n| Path / host | Estimated requests |\n|---|---:|\n${(details.paths || []).slice(0, 8).map(r => `| ${r.dimensions.clientRequestHTTPHost}${r.dimensions.clientRequestPath.replaceAll('|', '%7C')} | ${r.count} |`).join('\n') || '| Unavailable | — |'}\n\n## Traffic detail\n\n### Status codes — authoritative zone totals\n\n${Object.entries(a.statuses).map(([code, n]) => `- ${statusLabel(code)}: ${n.toLocaleString('en-US')}`).join('\n') || 'Full-window status totals unavailable.'}\n\n### Production and staging\n\n${hostNote}\n\n${estimated('host-status')}\n\n### Every server-error status\n\n${Object.entries(a.statuses).filter(([c]) => +c >= 500).map(([c, n]) => `- ${statusLabel(c)}: ${n}`).join('\n') || (a.complete ? 'Zero 5xx recorded in the complete zone rollup.' : 'Unavailable: incomplete date coverage cannot establish zero 5xx.')}\n\n### Top countries — returned rollup dates only\n\n${details.countries.slice(0, 5).map(([c,n]) => `- ${c}: ${n.toLocaleString('en-US')} requests`).join('\n')}\n\n### Contact endpoint /api/contact\n\n${estimated('contact')}\n\nHTTP success is not proof of a successful contact submission or email delivery.\n\n### Cache status — adaptive estimates\n\n${estimated('cache-status')}\n\n## Insights\n\n${insights.map(i => '- ' + i).join('\n')}\n\n## Suggestions\n\n- Owner decision: ${classes[5] ? 'inspect the listed server-error codes and deployment evidence; corroborate the affected host before attributing a production incident.' : 'review persistent changes over several days before attributing traffic to a campaign, audience or scanner.'}\n- Safe technical check: review the SEO/AEO audit below; apply only verified technical corrections. Traffic alone does not justify changing claims or branding.\n\n## Daily request trend\n\n${Object.entries(series.current).sort().map(([date, count]) => `- ${date}: ${count.toLocaleString('en-US')} requests`).join('\n')}\n\n${ranked.length ? `Highest observed day: ${ranked[0][0]} (${ranked[0][1].toLocaleString('en-US')} requests); lowest: ${ranked.at(-1)[0]} (${ranked.at(-1)[1].toLocaleString('en-US')} requests).` : 'No daily observations are available.'}\n\n## Path movers\n\n${movers.slice(0, 8).map(r => `- ${r.clientRequestHTTPHost}${r.clientRequestPath}: ${r.previous.toLocaleString('en-US', { maximumFractionDigits: 1 })} → ${r.current.toLocaleString('en-US')} estimated requests (${r.change >= 0 ? '+' : ''}${r.change.toLocaleString('en-US', { maximumFractionDigits: 1 })})`).join('\n') || 'No comparable path groups returned.'}\n\nOnly groups in both top-100 responses are compared. Missing paths are unknown; the daily prior count is divided by seven.\n\n## Notes\n\nBoth windows and detail use UTC calendar days, matching the owner’s example. Daily unique counts are never summed from hours. Cache share is cached bytes / total bytes, not cached-request count. Adaptive results are estimates derived from samples, not exact observed events.\n\n${gaps.map(g => '- ' + g).join('\n') || 'All requested traffic datasets returned; sampling limitations still apply.'}\n`;
  summary(text);
  if (gaps.length) process.exitCode = 2;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { summary(`# Analytics report failed\n\n${error.message}\n`); process.exitCode = 1; });
}
