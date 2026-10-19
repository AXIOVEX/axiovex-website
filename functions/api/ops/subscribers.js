// Aggregate operational measurements only. Never return addresses or tokens.
import { jsonResponse, storeReady, senderGauge } from '../newsletter/_lib.js';
export async function onRequest({ request, env }) {
  if (request.method !== 'GET') return jsonResponse({ ok: false }, 405);
  const expected = env.NEWSLETTER_SEND_SECRET || '';
  const supplied = request.headers.get('x-website-ops-secret') || '';
  let diff = supplied.length ^ expected.length;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ (supplied.charCodeAt(i) || 0);
  if (!expected || diff) return jsonResponse({ ok: false }, 403);
  if (env.ENVIRONMENT !== 'production' || !storeReady(env)) return jsonResponse({ ok: false }, 503);
  const days = Number(new URL(request.url).searchParams.get('days') || 1);
  if (![1, 7, 30].includes(days)) return jsonResponse({ ok: false }, 422);
  try {
    const db = env.NEWSLETTER_DB, now = new Date();
    const date = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(d);
    const today = date(now), cutoff = date(new Date(now.getTime() - days * 86400000));
    await db.prepare('CREATE TABLE IF NOT EXISTS subscriber_snapshots (day TEXT PRIMARY KEY, captured_at TEXT NOT NULL, active INTEGER NOT NULL, pending INTEGER NOT NULL, unsubscribed INTEGER NOT NULL, suppressed INTEGER NOT NULL)').run();
    const counts = { active: 0, pending: 0, unsubscribed: 0, suppressed: 0 };
    const statuses = await db.prepare('SELECT status, COUNT(*) AS n FROM subscribers GROUP BY status').all();
    for (const row of statuses.results || []) if (Object.hasOwn(counts, row.status)) counts[row.status] = row.n;
    const prior = await db.prepare('SELECT * FROM subscriber_snapshots WHERE day <= ? ORDER BY day DESC LIMIT 1').bind(cutoff).first();
    await db.prepare('INSERT INTO subscriber_snapshots (day,captured_at,active,pending,unsubscribed,suppressed) VALUES (?,?,?,?,?,?) ON CONFLICT(day) DO UPDATE SET captured_at=excluded.captured_at, active=excluded.active, pending=excluded.pending, unsubscribed=excluded.unsubscribed, suppressed=excluded.suppressed')
      .bind(today, now.toISOString(), counts.active, counts.pending, counts.unsubscribed, counts.suppressed).run();
    const flows = {};
    for (const period of [1, 7, 30]) {
      const since = new Date(now.getTime() - period * 86400000).toISOString();
      flows[period] = await db.prepare('SELECT SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS signups, SUM(CASE WHEN confirmed_at >= ? THEN 1 ELSE 0 END) AS confirmations, SUM(CASE WHEN unsubscribed_at >= ? THEN 1 ELSE 0 END) AS unsubscribes FROM subscribers').bind(since, since, since).first();
      for (const key of ['signups', 'confirmations', 'unsubscribes']) flows[period][key] ||= 0;
    }
    const sources = await db.prepare("SELECT COALESCE(source,'unknown') AS source, COUNT(*) AS n FROM subscribers WHERE status='active' GROUP BY source").all();
    const gauge = await senderGauge(env);
    return jsonResponse({ ok: true, measuredAt: now.toISOString(), counts, baseline: prior, activeChange: prior ? counts.active - prior.active : null,
      comparisonDays: days, changesByStatus: prior ? Object.fromEntries(Object.keys(counts).map(k => [k, counts[k] - prior[k]])) : null, flows, activeBySource: sources.results || [], gauge,
      method: 'Counts are a current production snapshot, not historical website-window totals. Net active change uses the dated saved snapshot when available. Flows use each row’s latest timestamps; repeated re-confirmations/unsubscribes are not an event history. No opens/clicks tracked.' });
  } catch { return jsonResponse({ ok: false, message: 'Subscriber measurement failed; no zero substituted' }, 502); }
}
