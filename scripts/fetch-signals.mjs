#!/usr/bin/env node
/*
 * fetch-signals.mjs — Signals + Michigan Pulse ingest (spec 004).
 *
 * Fetches the configured RSS/API sources (data/signal-sources.json) and
 * the BLS Michigan series, filters them into lanes, and writes a
 * normalized snapshot to data/signals.json. The website renders ONLY
 * from that snapshot (build-time ingestion; no visitor-side fetching).
 *
 * Resilience contract (FR-005): a failed source keeps its last-good
 * items from the previous snapshot and is reported, never blanked.
 * The run fails (exit 1, snapshot untouched) only if EVERY source
 * fails and no previous snapshot exists to fall back on.
 * The snapshot is rewritten only when its content actually changed
 * (FR-010), so the hourly Action does not create empty commits.
 *
 * Usage: node scripts/fetch-signals.mjs [--config p] [--out p]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const argVal = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const CONFIG = argVal('--config', path.join(ROOT, 'data', 'signal-sources.json'));
const OUT = argVal('--out', path.join(ROOT, 'data', 'signals.json'));
const UA = 'AxiovexSignals/1.0 (+https://axiovexsystems.com/signals/)';

const cfg = JSON.parse(readFileSync(CONFIG, 'utf8'));
const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : null;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

/* ---------- fetch ---------- */
async function get(url, asJson) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctl.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return asJson ? await r.json() : await r.text();
  } finally { clearTimeout(t); }
}

/* ---------- tiny feed parsing (title / link / date / summary only) ---------- */
function decode(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
function tagValue(block, names) {
  for (const n of names) {
    const m = new RegExp('<' + n + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + n + '>', 'i').exec(block);
    if (m) return decode(m[1]);
  }
  return '';
}
function parseFeed(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks) {
    let link = tagValue(b, ['link']);
    if (!link) {
      const m = /<link[^>]+href="([^"]+)"/i.exec(b);
      if (m) link = decode(m[1]);
    }
    const title = tagValue(b, ['title']);
    const dateRaw = tagValue(b, ['pubDate', 'dc:date', 'published', 'updated']);
    const summary = tagValue(b, ['description', 'summary']);
    const d = dateRaw ? new Date(dateRaw) : null;
    if (title && link) {
      items.push({
        title, link,
        date: d && !isNaN(d) ? d.toISOString().slice(0, 10) : null,
        _text: (title + ' ' + summary).toLowerCase(),
      });
    }
  }
  return items;
}

/* ---------- keyword matching ---------- */
function termHit(text, term) {
  const t = term.toLowerCase();
  if (t.length <= 3) {
    return new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(text);
  }
  return text.includes(t);
}
function ruleMatch(item, rule) {
  const text = rule.titleOnly ? item.title.toLowerCase() : item._text;
  if (rule.exclude && rule.exclude.some(term => termHit(text, term))) return false;
  if (!rule.include || !rule.include.length) return true;
  return rule.include.some(term => termHit(text, term));
}
const canon = link => String(link || '').trim().replace(/#.*$/, '').replace(/\/$/, '').toLowerCase();

/* ---------- feeds -> lanes ---------- */
const failures = [];
let anySuccess = false; // any source incl. BLS
let feedSuccess = false; // any RSS/API feed
const byLane = new Map(cfg.lanes.map(l => [l.id, []]));
const pushItem = (laneId, sourceName, sourceId, item) => {
  byLane.get(laneId).push({
    source: sourceName, sourceId,
    title: item.title, link: item.link, date: item.date,
  });
};

async function ingestFeed(feed) {
  const xml = await get(feed.url, false);
  const items = parseFeed(xml);
  if (!items.length) throw new Error('0 items parsed');
  anySuccess = true; feedSuccess = true;
  for (const rule of feed.lanes) {
    for (const item of items) if (ruleMatch(item, rule)) pushItem(rule.lane, feed.name, feed.id, item);
  }
}

async function ingestFrApi(fr) {
  const q = new URLSearchParams();
  q.set('conditions[term]', fr.term || 'manufacturing');
  q.set('per_page', String(fr.perPage || 40));
  q.set('order', 'newest');
  q.append('fields[]', 'title'); q.append('fields[]', 'html_url'); q.append('fields[]', 'publication_date');
  const j = await get('https://www.federalregister.gov/api/v1/documents.json?' + q.toString(), true);
  const items = (j.results || []).map(r => ({
    title: decode(r.title), link: r.html_url, date: r.publication_date || null,
    _text: String(r.title || '').toLowerCase(),
  })).filter(i => i.title && i.link);
  if (!items.length) throw new Error('0 results');
  anySuccess = true; feedSuccess = true;
  for (const rule of fr.lanes) {
    for (const item of items) if (ruleMatch(item, rule)) pushItem(rule.lane, fr.name, fr.id, item);
  }
}

const jobs = [];
for (const feed of cfg.feeds || []) {
  jobs.push(ingestFeed(feed).catch(e => { failures.push(feed.id + ': ' + e.message); }));
}
if (cfg.frApi) jobs.push(ingestFrApi(cfg.frApi).catch(e => { failures.push(cfg.frApi.id + ': ' + e.message); }));
await Promise.all(jobs);

/* ---------- last-good carry-over for failed sources ---------- */
const failedIds = new Set(failures.map(f => f.split(':')[0]));
if (prev && failedIds.size) {
  for (const lane of Object.values(prev.lanes || {})) {
    for (const item of lane.items || []) {
      if (failedIds.has(item.sourceId) && byLane.has(lane.id)) byLane.get(lane.id).push(item);
    }
  }
}

/* ---------- lane restore: never blank a lane whose sources failed ---------- */
if (prev) {
  const laneSources = new Map(cfg.lanes.map(l => [l.id, new Set()]));
  for (const f of cfg.feeds || []) for (const r of f.lanes) laneSources.get(r.lane).add(f.id);
  if (cfg.frApi) for (const r of cfg.frApi.lanes) laneSources.get(r.lane).add(cfg.frApi.id);
  for (const laneCfg of cfg.lanes) {
    const cur = byLane.get(laneCfg.id) || [];
    const prevItems = (prev.lanes && prev.lanes[laneCfg.id] && prev.lanes[laneCfg.id].items) || [];
    const srcFailed = [...(laneSources.get(laneCfg.id) || [])].some(id => failedIds.has(id));
    if (!cur.length && prevItems.length && srcFailed) byLane.set(laneCfg.id, [...prevItems]);
  }
}

/* ---------- dedupe / sort / cap / age cutoff ---------- */
const cutoff = new Date(Date.now() - (cfg.maxAgeDays || 45) * 864e5).toISOString().slice(0, 10);
const lanesOut = {};
for (const laneCfg of cfg.lanes) {
  const seen = new Set();
  const items = (byLane.get(laneCfg.id) || [])
    .filter(i => i.date && i.date >= cutoff)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .filter(i => { const k = canon(i.link); if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, laneCfg.cap || 8)
    .map(({ source, sourceId, title, link, date }) => ({ source, sourceId, title, link, date }));
  lanesOut[laneCfg.id] = { id: laneCfg.id, title: laneCfg.title, items };
}

/* ---------- BLS Pulse ---------- */
let pulse = prev ? prev.pulse : null;
try {
  const tiles = [];
  let referenceMonth = null;
  for (const s of cfg.blsSeries || []) {
    const j = await get('https://api.bls.gov/publicAPI/v2/timeseries/data/' + s.id, true);
    const rows = (j.Results.series[0].data || [])
      .filter(d => /^M(0[1-9]|1[0-2])$/.test(d.period))
      .map(d => ({
        ym: d.year + '-' + d.period.slice(1),
        v: d.value === '-' || d.value === '' ? null : parseFloat(d.value),
        label: MONTHS[+d.period.slice(1) - 1] + ' ' + d.year,
      }))
      .sort((a, b) => (a.ym < b.ym ? -1 : 1));
    const valid = rows.filter(r => r.v !== null);
    if (!valid.length) throw new Error('no values for ' + s.id);
    const latest = valid[valid.length - 1];
    const prevValid = valid[valid.length - 2] || null;
    if (!referenceMonth) referenceMonth = latest.label;
    const fmt = v => {
      if (s.format === 'percent1') return v.toFixed(1) + '%';
      if (s.format === 'millions2') return (v / 1e6).toFixed(2) + 'M';
      return v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'k';
    };
    let delta = null;
    if (s.delta === 'mom' && prevValid) {
      const dv = +(latest.v - prevValid.v).toFixed(2);
      delta = {
        direction: dv > 0 ? 'up' : dv < 0 ? 'down' : 'flat',
        text: (dv > 0 ? '+' : '') + (s.format === 'percent1'
          ? dv.toFixed(1) + ' pts MoM'
          : dv.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'k MoM'),
      };
    }
    tiles.push({
      id: s.id, label: s.label, display: fmt(latest.v), delta,
      trend: rows.slice(-12).map(r => ({ ym: r.ym, v: r.v })),
    });
  }
  pulse = { source: 'U.S. Bureau of Labor Statistics', referenceMonth, tiles };
  anySuccess = true;
} catch (e) {
  failures.push('bls: ' + e.message);
}

/* ---------- write only on change ---------- */
const snapshot = { lanes: lanesOut, pulse };
if ((!feedSuccess || !anySuccess) && !prev) {
  console.error('fetch-signals: feed ingest failed wholesale and no previous snapshot exists:', failures.join(' | '));
  process.exit(1);
}
const stable = JSON.stringify(snapshot);
if (prev && JSON.stringify({ lanes: prev.lanes, pulse: prev.pulse }) === stable) {
  console.log('fetch-signals: no change (' + failures.length + ' source failure(s) absorbed: ' + failures.join(' | ') + ')');
  process.exit(0);
}
writeFileSync(OUT, JSON.stringify({ updatedUtc: new Date().toISOString(), ...snapshot }, null, 2) + '\n');
const counts = Object.values(lanesOut).map(l => l.id + '=' + l.items.length).join(' ');
console.log('fetch-signals: snapshot updated — ' + counts +
  (pulse ? ' · pulse ' + pulse.referenceMonth : '') +
  (failures.length ? ' · failures absorbed: ' + failures.join(' | ') : ''));
