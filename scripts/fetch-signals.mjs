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
import { homedir } from 'node:os';
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

/* ---------- env (BLS registration key) ----------
 * Same sources as scripts/fetch-pack.mjs: the process environment,
 * falling back to ~/workspace/system/data-apis/.env. The key is
 * optional — keyless BLS behavior is unchanged when it is absent. */
const env = { ...process.env };
const envFile = process.env.PACK_ENV_FILE ||
  path.join(homedir(), 'workspace', 'system', 'data-apis', '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/.exec(line);
    if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const BLS_API_KEY = env.BLS_API_KEY || null;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

/* ---------- fetch ---------- */
/* Per-run call accounting by provider host + distinct 429 logging
 * (rate-limit audit S5, 2026-10-08): a 429 (Too Many Requests) is
 * logged with any Retry-After value, then thrown like any other
 * failure so the source fails soft to last-good. Nothing is ever
 * retried in-run. */
const callCounts = new Map();
function noteCall(url, status, retryAfter) {
  let host = url;
  try { host = new URL(url).hostname; } catch { /* keep raw */ }
  callCounts.set(host, (callCounts.get(host) || 0) + 1);
  if (status === 429) {
    console.error('fetch-signals: HTTP 429 (Too Many Requests) from ' + host +
      ' — rate limited' + (retryAfter ? '; Retry-After: ' + retryAfter : '; no Retry-After header') +
      ' (failing soft to last-good; no in-run retry)');
  }
}
const callCountsLine = () =>
  'calls: ' + ([...callCounts.entries()].map(([h, n]) => h + '=' + n).join(' · ') || 'none');

async function get(url, asJson, userAgent) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': userAgent || UA }, signal: ctl.signal });
    noteCall(url, r.status, r.headers.get('retry-after'));
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return asJson ? await r.json() : await r.text();
  } finally { clearTimeout(t); }
}
async function postJson(url, body) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 30000);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    noteCall(url, r.status, r.headers.get('retry-after'));
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
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

/* ---------- Michigan WARN (LEO) -> Michigan lane (spec 004 FR-011) ----------
 * The LEO WARN listing is a Sitecore SXA search page; its results
 * endpoint returns JSON whose per-result HTML carries the published
 * notice fields. Headlines are composed ONLY from those fields and
 * always carry the announced framing (announced != completed). The
 * item date is the notice's filed (posting) date, taken from the
 * result's search-data path; the layoff effective date appears in
 * the headline text only. */
function warnText(s) {
  return decode(String(s || '')
    .replace(/&nbsp;/gi, ' ').replace(/&mdash;/gi, '—').replace(/&ndash;/gi, '–'));
}
function parseWarnResult(r, pageUrl) {
  const html = String((r && r.Html) || '');
  const company = warnText((/<h3>([\s\S]*?)<\/h3>/i.exec(html) || [])[1] || '');
  if (!company) return null;
  const dm = /searchdata\/(\d{4})\/(\d{2})\/(\d{2})/i.exec(String((r && r.Url) || ''));
  if (!dm) return null;
  const date = dm[1] + '-' + dm[2] + '-' + dm[3];
  const fields = {};
  for (const m of html.matchAll(/<li>([\s\S]*?)<\/li>/gi)) {
    const kv = /^([^:]{3,40}):\s*([\s\S]*)$/.exec(warnText(m[1]));
    if (kv) {
      const key = kv[1].trim().toLowerCase();
      if (!(key in fields)) fields[key] = kv[2].trim();
    }
  }
  const addr = fields['site address'] || fields['site addresses'] || '';
  const cityM = /, ([^,]+), MI \d{5}/.exec(addr);
  let place = cityM ? cityM[1].trim() : '';
  const countyRaw = fields['county'] || fields['counties'] || '';
  if (!place && countyRaw && !/,/.test(countyRaw) && !/remote|statewide/i.test(countyRaw)) {
    place = countyRaw + ' County';
  }
  const action = fields['type of company action'] || '';
  const jobsM = /^(\d[\d,]*)/.exec(fields['number of jobs impacted'] || '');
  const jobs = jobsM ? parseInt(jobsM[1].replace(/,/g, ''), 10) : null;
  const dateParts = (fields['layoff date'] || '').match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [];
  let effective = '';
  if (dateParts.length) {
    const p = dateParts[0].split('/').map(Number);
    effective = MONTHS[p[0] - 1] + ' ' + p[1] + ', ' + p[2];
  }
  let link;
  const pdfM = /href="([^"]+\.pdf[^"]*)"/i.exec(html);
  if (pdfM) {
    link = warnText(pdfM[1]);
    if (link.startsWith('/')) link = 'https://www.michigan.gov' + link;
  } else {
    const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    link = pageUrl + '?notice=' + date + '-' + slug;
  }
  const segs = [action
    ? 'announced ' + action.charAt(0).toLowerCase() + action.slice(1)
    : 'WARN notice announced'];
  if (place) segs.push(place);
  if (jobs) segs.push(jobs.toLocaleString('en-US') + (jobs === 1 ? ' job' : ' jobs'));
  if (effective) segs.push((dateParts.length > 1 ? 'starting ' : 'effective ') + effective);
  const title = company + ' — ' + segs.join(', ');
  return { title, link, date, _text: title.toLowerCase() };
}

async function ingestWarnApi(warn) {
  const j = await get(warn.resultsUrl, true, warn.userAgent);
  const items = ((j && j.Results) || []).map(r => parseWarnResult(r, warn.pageUrl)).filter(Boolean);
  if (!items.length) throw new Error('0 items parsed');
  anySuccess = true; feedSuccess = true;
  for (const rule of warn.lanes) {
    for (const item of items) if (ruleMatch(item, rule)) pushItem(rule.lane, warn.name, warn.id, item);
  }
}

/* ---------- USAspending -> Funding & policy lane (spec 019 FR-006) ----------
 * Filter design (verified against the live API 2026-10-08):
 * - POST /api/v2/search/spending_by_award/ needs no key, but
 *   award_type_codes is a REQUIRED filter (422 without it): A-D =
 *   contract awards (grants carry no NAICS, so contracts are the
 *   manufacturing-relevant award class here).
 * - Manufacturing relevance via naics_codes as 2-digit SECTOR
 *   PREFIXES ['31','32','33'] — the Census definition of the
 *   manufacturing sector. The API accepts prefixes and filters
 *   server-side (verified: an award with NAICS 339113 and one with
 *   326199 were kept, one with 485991 was excluded). Full 6-digit
 *   codes returned 0 rows in the window — too narrow to be useful.
 *   PSC codes were not used: the search response returns PSC as null
 *   and PSC mixes product/service categories; NAICS classifies the
 *   recipient's industry directly. No awarding-agency restriction:
 *   a Department-of-Defense-only slice returned 0 rows in the window,
 *   so any awarding agency is accepted.
 * - Dates: the time_period filter uses date_type 'action_date' over
 *   the last maxAgeDays (45). The response's 'Action Date' field is
 *   null at award level (verified for contracts and grants) and is
 *   rejected as a sort key (HTTP 400), so the item date is
 *   'Base Obligation Date' — populated on every row, equal to the
 *   award's date_signed in spot checks — sorted desc server-side
 *   and re-sorted desc here.
 * - minAmount floor (config, $10,000): without it the lane fills
 *   with micro-purchase orders (verified rows of $86 / $190 / $512).
 * Headlines are facts only, composed from the response fields:
 * "<Awarding Agency> → <Recipient Name> — $<amount> award, <date>". */
function usaAmount(n) {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e5) return '$' + Math.round(n / 1e3) + 'K';
  return '$' + Math.round(n).toLocaleString('en-US');
}

async function ingestUsaSpendingApi(usa) {
  const end = new Date();
  const start = new Date(Date.now() - (cfg.maxAgeDays || 45) * 864e5);
  const iso = d => d.toISOString().slice(0, 10);
  const j = await postJson(usa.endpoint, {
    filters: {
      time_period: [{ start_date: iso(start), end_date: iso(end), date_type: 'action_date' }],
      recipient_locations: [{ country: 'USA', state: usa.recipientState || 'MI' }],
      award_type_codes: usa.awardTypeCodes || ['A', 'B', 'C', 'D'],
      naics_codes: usa.naicsCodes || ['31', '32', '33'],
    },
    fields: ['Awarding Agency', 'Recipient Name', 'Award Amount', 'Action Date',
      'Base Obligation Date', 'generated_internal_id'],
    page: 1,
    limit: usa.limit || 100,
    sort: 'Base Obligation Date',
    order: 'desc',
  });
  const items = ((j && j.results) || []).map(r => {
    const agency = decode(r['Awarding Agency'] || '');
    const recipient = decode(r['Recipient Name'] || '');
    const amount = Number(r['Award Amount']);
    const date = String(r['Action Date'] || r['Base Obligation Date'] || '').slice(0, 10);
    const genId = r['generated_internal_id'] || '';
    if (!agency || !recipient || !genId || !(amount > 0)) return null;
    if (usa.minAmount && amount < usa.minAmount) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const p = date.split('-').map(Number);
    const dateLabel = MONTHS[p[1] - 1] + ' ' + p[2] + ', ' + p[0];
    const title = agency + ' → ' + recipient + ' — ' + usaAmount(amount) + ' award, ' + dateLabel;
    return {
      title,
      link: 'https://www.usaspending.gov/award/' + genId,
      date,
      _text: title.toLowerCase(),
    };
  }).filter(Boolean)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, usa.maxItems || 6);
  if (!items.length) throw new Error('0 items parsed');
  anySuccess = true; feedSuccess = true;
  for (const rule of usa.lanes) {
    for (const item of items) if (ruleMatch(item, rule)) pushItem(rule.lane, usa.name, usa.id, item);
  }
}

const jobs = [];
for (const feed of cfg.feeds || []) {
  jobs.push(ingestFeed(feed).catch(e => { failures.push(feed.id + ': ' + e.message); }));
}
if (cfg.frApi) jobs.push(ingestFrApi(cfg.frApi).catch(e => { failures.push(cfg.frApi.id + ': ' + e.message); }));
if (cfg.warnApi) jobs.push(ingestWarnApi(cfg.warnApi).catch(e => { failures.push(cfg.warnApi.id + ': ' + e.message); }));
if (cfg.usaSpendingApi) jobs.push(ingestUsaSpendingApi(cfg.usaSpendingApi).catch(e => { failures.push(cfg.usaSpendingApi.id + ': ' + e.message); }));
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
  if (cfg.warnApi) for (const r of cfg.warnApi.lanes) laneSources.get(r.lane).add(cfg.warnApi.id);
  if (cfg.usaSpendingApi) for (const r of cfg.usaSpendingApi.lanes) laneSources.get(r.lane).add(cfg.usaSpendingApi.id);
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
  const seriesDefs = cfg.blsSeries || [];
  /* One batched POST for every Pulse series (rate-limit audit S1,
   * 2026-10-08): the BLS v2 API accepts a seriesid array (up to 50
   * registered / 25 unregistered), collapsing the previous 4 GETs
   * per run to 1 query. The optional registration key (BLS_API_KEY)
   * rides in the POST body; keyless behavior is unchanged without
   * it. No startyear/endyear, matching the previous GETs' default
   * window. */
  const blsBody = { seriesid: seriesDefs.map(s => s.id) };
  if (BLS_API_KEY) blsBody.registrationkey = BLS_API_KEY;
  const j = await postJson('https://api.bls.gov/publicAPI/v2/timeseries/data/', blsBody);
  if (j && j.status && j.status !== 'REQUEST_SUCCEEDED') {
    throw new Error('BLS request failed: ' + j.status + ' ' + ((j.message || []).join('; ')));
  }
  const byId = new Map(
    ((j && j.Results && j.Results.series) || []).map(x => [x.seriesID, x]));
  for (const s of seriesDefs) {
    const entry = byId.get(s.id);
    const rows = ((entry && entry.data) || [])
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
  console.error('fetch-signals: feed ingest failed wholesale and no previous snapshot exists: ' +
    failures.join(' | ') + ' · ' + callCountsLine());
  process.exit(1);
}
const stable = JSON.stringify(snapshot);
if (prev && JSON.stringify({ lanes: prev.lanes, pulse: prev.pulse }) === stable) {
  console.log('fetch-signals: no change (' + failures.length + ' source failure(s) absorbed: ' + failures.join(' | ') + ') · ' + callCountsLine());
  process.exit(0);
}
writeFileSync(OUT, JSON.stringify({ updatedUtc: new Date().toISOString(), ...snapshot }, null, 2) + '\n');
const counts = Object.values(lanesOut).map(l => l.id + '=' + l.items.length).join(' ');
console.log('fetch-signals: snapshot updated — ' + counts +
  (pulse ? ' · pulse ' + pulse.referenceMonth : '') +
  (failures.length ? ' · failures absorbed: ' + failures.join(' | ') : '') +
  ' · ' + callCountsLine());
