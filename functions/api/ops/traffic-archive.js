import { jsonResponse, storeReady } from '../newsletter/_lib.js';
export function validRow(row) {
  if (!row || !/^\d{4}-\d{2}-\d{2}$/.test(row.dimensions?.date || '') || !Number.isFinite(Date.parse(row.dimensions.date)) || new Date(row.dimensions.date).toISOString().slice(0, 10) !== row.dimensions.date) return false;
  const sum = row.sum;
  if (!sum || ['requests', 'bytes', 'cachedBytes'].some(k => !Number.isSafeInteger(sum[k]) || sum[k] < 0) || sum.cachedBytes > sum.bytes) return false;
  if (!Number.isSafeInteger(row.uniq?.uniques) || row.uniq.uniques < 0 || !Array.isArray(sum.responseStatusMap) || !Array.isArray(sum.countryMap)) return false;
  if (sum.responseStatusMap.some(s => !Number.isInteger(s.edgeResponseStatus) || s.edgeResponseStatus < 100 || s.edgeResponseStatus > 599 || !Number.isSafeInteger(s.requests) || s.requests < 0)) return false;
  if (sum.countryMap.some(c => !/^[A-Z0-9]{2}$/.test(c.clientCountryName) || !Number.isSafeInteger(c.requests) || c.requests < 0)) return false;
  return sum.responseStatusMap.reduce((n, s) => n + s.requests, 0) === sum.requests;
}
export async function onRequest({ request, env }) {
  if (!['GET', 'POST'].includes(request.method)) return jsonResponse({ ok: false }, 405);
  const expected = env.NEWSLETTER_SEND_SECRET || '', actual = request.headers.get('x-website-ops-secret') || '';
  let diff = expected.length ^ actual.length;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ (actual.charCodeAt(i) || 0);
  if (!expected || diff) return jsonResponse({ ok: false }, 403);
  if (env.ENVIRONMENT !== 'production' || !storeReady(env)) return jsonResponse({ ok: false }, 503);
  try {
    const db = env.NEWSLETTER_DB;
    await db.prepare('CREATE TABLE IF NOT EXISTS traffic_daily_rollups (day TEXT PRIMARY KEY, payload TEXT NOT NULL, captured_at TEXT NOT NULL)').run();
    if (request.method === 'GET') {
      const q = new URL(request.url).searchParams, start = q.get('start'), end = q.get('end');
      if (![start, end].every(d => /^\d{4}-\d{2}-\d{2}$/.test(d || '')) || !(Date.parse(end) > Date.parse(start)) || Date.parse(end) - Date.parse(start) > 93 * 86400000) return jsonResponse({ ok: false }, 422);
      const rows = await db.prepare('SELECT payload FROM traffic_daily_rollups WHERE day >= ? AND day < ? ORDER BY day').bind(start, end).all();
      return jsonResponse({ ok: true, rows: (rows.results || []).map(r => JSON.parse(r.payload)) });
    }
    if (Number(request.headers.get('content-length')) > 262144) return jsonResponse({ ok: false }, 413);
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 262144) return jsonResponse({ ok: false }, 413);
    let body;
    try { body = JSON.parse(text); } catch { return jsonResponse({ ok: false }, 400); }
    if (!Array.isArray(body.rows) || body.rows.length > 80 || body.rows.some(r => !validRow(r) || r.dimensions.date >= new Date().toISOString().slice(0, 10))) return jsonResponse({ ok: false }, 422);
    const captured = new Date().toISOString();
    const statements = body.rows.map(row => {
      // Reconstruct an aggregate-only record; no arbitrary supplied fields persist.
      const record = { dimensions: { date: row.dimensions.date }, uniq: { uniques: row.uniq.uniques }, sum: { requests: row.sum.requests, bytes: row.sum.bytes, cachedBytes: row.sum.cachedBytes,
        responseStatusMap: row.sum.responseStatusMap.map(s => ({ edgeResponseStatus: s.edgeResponseStatus, requests: s.requests })),
        countryMap: row.sum.countryMap.map(c => ({ clientCountryName: c.clientCountryName, requests: c.requests })) } };
      return db.prepare('INSERT INTO traffic_daily_rollups VALUES (?,?,?) ON CONFLICT(day) DO UPDATE SET payload=excluded.payload, captured_at=excluded.captured_at').bind(row.dimensions.date, JSON.stringify(record), captured);
    });
    if (statements.length) await db.batch(statements);
    return jsonResponse({ ok: true, saved: statements.length });
  } catch { return jsonResponse({ ok: false, message: 'Aggregate traffic archive unavailable' }, 502); }
}
