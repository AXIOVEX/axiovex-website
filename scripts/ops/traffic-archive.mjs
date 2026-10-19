import { request, save } from './io.mjs';
const base = 'https://axiovexsystems.com/api/ops/traffic-archive';
export async function readTrafficArchive(start, end) {
  const response = await request(`${base}?start=${start}&end=${end}`, { headers: { 'x-website-ops-secret': process.env.NEWSLETTER_SEND_SECRET || '' } });
  const data = await response.json();
  if (!response.ok || !data.ok || !Array.isArray(data.rows)) throw new Error('Persistent traffic archive unavailable');
  save('traffic-archive-read.json', data);
  return data.rows;
}
export async function persistTrafficArchive(rows) {
  const response = await request(base, { method: 'POST', headers: { 'content-type': 'application/json', 'x-website-ops-secret': process.env.NEWSLETTER_SEND_SECRET || '' }, body: JSON.stringify({ rows }) });
  const data = await response.json();
  save('traffic-archive-write.json', data);
  if (!response.ok || !data.ok) throw new Error('Persistent traffic archive write failed');
}
