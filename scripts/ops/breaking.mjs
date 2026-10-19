import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { decode, parseFeed, preciseTime } from '../lib/news-feeds.mjs';

export function criterion(item, sourceId) {
  const t = item.title;
  if (/\b(opinion|podcast|webinar|preview|roundup|could|may|might|proposed)\b/i.test(t)) return null;
  const industry = /\b(manufactur\w*|industrial|factory|plant|OT|ICS|robot\w*|semiconductor\w*|automot\w*)\b/i.test(t);
  if (industry && /\b(actively exploited|known exploited|under attack)\b/i.test(t)) return { rank: 4, reason: 'Active exploitation affecting industrial systems' };
  if (industry && /\b(breach|cyberattack|emergency|recall|shuts? down|shutdown|halt\w*)\b/i.test(t)) return { rank: 3, reason: 'Industrial incident or safety disruption' };
  if (/\b(Michigan|Detroit|Flint|Lansing|Grand Rapids)\b/i.test(t) && industry && /\b(opens?|opening|closes?|closing|closure|layoffs?)\b/i.test(t)) return { rank: 2, reason: 'Michigan industrial opening, closure or layoffs' };
  const amounts = [...t.matchAll(/\$([\d,.]+)\s*(billion|million)\b/gi)].map(m => Number(m[1].replaceAll(',', '')) * (m[2].toLowerCase() === 'billion' ? 1000 : 1));
  if (['nist', 'nsf', 'doe'].includes(sourceId) && amounts.some(n => n >= 100) &&
      /\b(announces?|launch\w*|awards?|invest\w*)\b/i.test(t) &&
      (industry || /\b(AI|artificial intelligence|workforce)\b/i.test(t))) return { rank: 1, reason: 'Official industry, AI or workforce announcement of at least $100 million' };
  return null;
}
export function fresh(item, now) {
  const t = Date.parse(item.publishedUtc);
  return Boolean(item.publishedUtc) && Number.isFinite(t) && t <= now && now - t <= 3 * 3600000;
}
export function sourceConfirms(html, item) {
  const title = decode(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1]);
  const times = [];
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = Object.fromEntries([...m[0].matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(a => [a[1].toLowerCase(), a[2]]));
    if (/^(article:published_time|datePublished|date|pubdate)$/i.test(attrs.property || attrs.name || attrs.itemprop || '')) times.push(attrs.content);
  }
  for (const m of html.matchAll(/"datePublished"\s*:\s*"([^"]+)"/g)) times.push(m[1]);
  return title === decode(item.title) && times.some(t => preciseTime(t) === item.publishedUtc);
}
export function chooseEntry(current, candidates, seen, now) {
  if (current && Date.parse(current.expiresUtc) > now) return current;
  return candidates.find(c => !seen[c.id]) || null;
}
async function get(url) {
  if (new URL(url).protocol !== 'https:') throw new Error('Source must use HTTPS');
  const r = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'AxiovexNewsMonitor/1.0 (+https://axiovexsystems.com/signals/)' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  if (new URL(r.url).hostname.replace(/^www\./, '') !== new URL(url).hostname.replace(/^www\./, '')) throw new Error('Unexpected source redirect');
  return r.text();
}
async function main() {
  const now = Date.now();
  const cfg = JSON.parse(readFileSync('data/signal-sources.json', 'utf8'));
  const before = JSON.parse(readFileSync('data/breaking.json', 'utf8'));
  const statePath = 'data/breaking-state.json';
  const seen = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')).seen : {};
  const results = await Promise.all(cfg.feeds.map(async f => {
    try {
      const items = parseFeed(await get(f.url));
      if (!items.length) throw new Error('No feed items parsed');
      return { id: f.id, ok: true, items: items.filter(i => fresh(i, now) && criterion(i, f.id)).map(i => ({ ...i, sourceId: f.id, source: f.name, ...criterion(i, f.id) })) };
    } catch (e) { return { id: f.id, ok: false, error: e.message, items: [] }; }
  }));
  const verified = [], rejected = [];
  const candidates = results.flatMap(r => r.items).sort((a, b) => b.rank - a.rank || Date.parse(b.publishedUtc) - Date.parse(a.publishedUtc));
  for (const i of candidates.slice(0, 5)) {
    const id = createHash('sha256').update(i.link.replace(/#.*$/, '').replace(/\/$/, '')).digest('hex').slice(0, 24);
    if (seen[id]) continue;
    const publisher = cfg.feeds.find(f => f.id === i.sourceId);
    try {
      if (new URL(i.link).hostname.replace(/^www\./, '') !== new URL(publisher.url).hostname.replace(/^www\./, '')) throw new Error('Article outside configured publisher domain');
      if (!sourceConfirms(await get(i.link), i)) throw new Error('Source headline or precise publication time did not match');
      verified.push({ id, headline: i.title, sourceName: i.source, url: i.link, publishedUtc: i.publishedUtc,
        expiresUtc: new Date(now + 12 * 3600000).toISOString(), addedBy: 'github-actions:breaking-monitor', reason: i.reason });
    } catch (e) { rejected.push({ url: i.link, reason: e.message }); }
  }
  const active = chooseEntry(before.active, verified, seen, now);
  if (active) seen[active.id] = active.publishedUtc;
  const after = { active };
  if (JSON.stringify(before) !== JSON.stringify(after)) writeFileSync('data/breaking.json', JSON.stringify(after, null, 2) + '\n');
  const state = { seen: Object.fromEntries(Object.entries(seen).filter(([, t]) => now - Date.parse(t) < 30 * 86400000)) };
  if (!existsSync(statePath) || readFileSync(statePath, 'utf8') !== JSON.stringify(state, null, 2) + '\n') writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
  mkdirSync('ops-output/breaking', { recursive: true });
  const report = { checkedUtc: new Date(now).toISOString(), partial: results.some(r => !r.ok), sources: results.map(({ items, ...r }) => ({ ...r, candidates: items.length })), rejected, verified, active };
  writeFileSync('ops-output/breaking/check.json', JSON.stringify(report, null, 2) + '\n');
  const summary = `Breaking news: ${results.filter(r => r.ok).length}/${results.length} feeds checked; ${verified.length} verified candidates; banner ${active ? active.id : 'inactive'}. Coverage ${report.partial ? 'PARTIAL' : 'complete'}.`;
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
  for (const r of results.filter(r => !r.ok)) console.log(`::warning::${r.id}: ${r.error}`);
  if (results.every(r => !r.ok)) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
