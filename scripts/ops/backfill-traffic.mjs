// Recover every available closed UTC day from the preceding 90 days.
// Never query or store today's incomplete rollup. The daily runner maintains it.
import { isDeepStrictEqual } from 'node:util';
import { graphql, validateDailyRows } from './analytics.mjs';
import { persistTrafficArchive, readTrafficArchive } from './traffic-archive.mjs';
import { request, save } from './io.mjs';
import { shift } from './calendar.mjs';
const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN;
if (!token || !process.env.NEWSLETTER_SEND_SECRET) throw new Error('Traffic backfill requires existing analytics and ops credentials');
const end = new Date().toISOString().slice(0, 10), start = shift(end, -90);
const lookup = await (await request('https://api.cloudflare.com/client/v4/zones?name=axiovexsystems.com', { headers: { Authorization: `Bearer ${token}` } })).json();
if (!lookup.success || lookup.result?.length !== 1 || !/^[a-f0-9]{32}$/.test(lookup.result[0].id)) throw new Error('Zone lookup failed');
const zone = lookup.result[0];
const data = await graphql(token, `{viewer{zones(filter:{zoneTag:"${zone.id}"}){rows:httpRequests1dGroups(limit:2000,filter:{date_geq:"${start}",date_lt:"${end}"},orderBy:[date_ASC]){dimensions{date} sum{requests bytes cachedBytes responseStatusMap{edgeResponseStatus requests} countryMap{clientCountryName requests}} uniq{uniques}}}}}`, 'backfill-source');
validateDailyRows(data.rows, start, end, true);
for (let i = 0; i < data.rows.length; i += 40) await persistTrafficArchive(data.rows.slice(i, i + 40));
const restored = await readTrafficArchive(start, end);
for (const row of data.rows) {
  const saved = restored.find(r => r.dimensions.date === row.dimensions.date);
  if (!saved || !isDeepStrictEqual(saved, row)) throw new Error(`Backfill verification failed for ${row.dimensions.date}`);
}
const monthStart = end.slice(0, 7) + '-01';
const missingCurrentMonth = [];
for (let d = monthStart; d < end; d = shift(d, 1)) if (!restored.some(r => r.dimensions.date === d)) missingCurrentMonth.push(d);
const result = { checkedAt: new Date().toISOString(), requestedStart: start, endExclusive: end, sourceZoneCreatedAt: zone.created_on,
  recoveredDays: data.rows.length, restoredDays: restored.length, firstObservedDay: restored[0]?.dimensions.date || null,
  currentMonth: monthStart.slice(0, 7), missingCurrentMonth, verified: true };
save('backfill-verification.json', result);
console.log(JSON.stringify(result, null, 2));
if (missingCurrentMonth.length) console.log('::warning::Some current-month dates remain unavailable; do not substitute zero.');
