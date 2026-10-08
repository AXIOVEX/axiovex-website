#!/usr/bin/env node
/*
 * fetch-pack.mjs — external data analysis pack (spec 019).
 *
 * Runs one module per source from scripts/pack/ and writes a committed
 * snapshot per source to data/pack/<source>.json. Snapshots are
 * analysis inputs for reporting (spec 007 evidence flow); they are
 * never rendered on the site and never published verbatim as claims.
 *
 * Module contract (scripts/pack/<id>.mjs):
 *   export default {
 *     id: 'fred',                       // file name in data/pack/
 *     name: 'FRED',
 *     publisher: 'Federal Reserve Bank of St. Louis',
 *     requiresKey: 'FRED_API_KEY',      // env var name, or null
 *     async fetch(ctx) -> { vintage, referencePeriod, series, notes? }
 *   }
 * ctx = { env, get, getText, post } — get(url) parses JSON, getText
 * returns text, post(url, body) POSTs a JSON body and parses the JSON
 * response; all throw on non-200 with a 30s timeout.
 *
 * Resilience: a failed source keeps its last-good snapshot file; a
 * source whose required key is absent is skipped (logged). The run
 * exits non-zero only if every ATTEMPTED source failed.
 *
 * Keys are read from the process environment, falling back to
 * ~/workspace/system/data-apis/.env (never committed). In CI the
 * workflow injects the same variables from repository secrets.
 *
 * Usage: node scripts/fetch-pack.mjs [--only id[,id...]] [--list]
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PACK_DIR = path.join(ROOT, 'scripts', 'pack');
const OUT_DIR = path.join(ROOT, 'data', 'pack');
const UA = 'AxiovexDataPack/1.0 (+https://axiovexsystems.com/signals/)';
const args = process.argv.slice(2);
const argVal = name => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
};

/* ---------- key loading (values are never printed) ---------- */
const env = { ...process.env };
const envFile = process.env.PACK_ENV_FILE ||
  path.join(homedir(), 'workspace', 'system', 'data-apis', '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/.exec(line);
    if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

/* ---------- fetch helpers ---------- */
/* Per-run call accounting by provider host + distinct 429 logging
 * (rate-limit audit S5, 2026-10-08): a 429 (Too Many Requests) is
 * logged with any Retry-After value, then thrown like any other
 * failure so the module fails soft to its last-good snapshot.
 * Nothing is ever retried in-run. */
const callCounts = new Map();
function noteCall(url, status, retryAfter) {
  let host = url;
  try { host = new URL(url).hostname; } catch { /* keep raw */ }
  callCounts.set(host, (callCounts.get(host) || 0) + 1);
  if (status === 429) {
    console.error('fetch-pack: HTTP 429 (Too Many Requests) from ' + host +
      ' — rate limited' + (retryAfter ? '; Retry-After: ' + retryAfter : '; no Retry-After header') +
      ' (failing soft to last-good; no in-run retry)');
  }
}
async function requestRaw(url, headers, init) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 30000);
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, ...(headers || {}) },
      signal: ctl.signal,
      ...(init || {}),
    });
    noteCall(url, r.status, r.headers.get('retry-after'));
    if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url.split('?')[0]);
    return r;
  } finally { clearTimeout(t); }
}
const getRaw = (url, headers) => requestRaw(url, headers);
const get = async (url, headers) => {
  const r = await getRaw(url, headers);
  const text = await r.text();
  try { return JSON.parse(text); } catch { throw new Error('non-JSON response from ' + url.split('?')[0]); }
};
const getText = async (url, headers) => (await getRaw(url, headers)).text();
const post = async (url, body, headers) => {
  const r = await requestRaw(url,
    { 'Content-Type': 'application/json', ...(headers || {}) },
    { method: 'POST', body: JSON.stringify(body) });
  const text = await r.text();
  try { return JSON.parse(text); } catch { throw new Error('non-JSON response from ' + url.split('?')[0]); }
};

/* ---------- discover modules ---------- */
const only = argVal('--only') ? argVal('--only').split(',').map(s => s.trim()) : null;
const files = readdirSync(PACK_DIR).filter(f => f.endsWith('.mjs')).sort();
const modules = [];
for (const f of files) {
  const mod = (await import(path.join(PACK_DIR, f))).default;
  if (mod && mod.id && typeof mod.fetch === 'function') modules.push(mod);
}
if (args.includes('--list')) {
  for (const m of modules) {
    console.log(m.id + ' — ' + m.name + ' (' + m.publisher + ')' +
      (m.requiresKey ? ' · key ' + m.requiresKey + ': ' + (env[m.requiresKey] ? 'present' : 'ABSENT') : ' · no key'));
  }
  process.exit(0);
}

/* ---------- run ---------- */
mkdirSync(OUT_DIR, { recursive: true });
let attempted = 0, succeeded = 0;
const results = [];
for (const mod of modules) {
  if (only && !only.includes(mod.id)) continue;
  const outPath = path.join(OUT_DIR, mod.id + '.json');
  if (mod.requiresKey && !env[mod.requiresKey]) {
    results.push(mod.id + ': SKIPPED (key ' + mod.requiresKey + ' absent)');
    continue;
  }
  attempted++;
  try {
    const data = await mod.fetch({ env, get, getText, post });
    const snapshot = {
      source: mod.name,
      publisher: mod.publisher,
      retrievedUtc: new Date().toISOString(),
      vintage: data.vintage || null,
      referencePeriod: data.referencePeriod || null,
      series: data.series || [],
      ...(data.notes ? { notes: data.notes } : {}),
    };
    const prevRaw = existsSync(outPath) ? readFileSync(outPath, 'utf8') : null;
    const prevBody = prevRaw ? JSON.stringify({ ...JSON.parse(prevRaw), retrievedUtc: null }) : null;
    if (prevBody !== JSON.stringify({ ...snapshot, retrievedUtc: null })) {
      writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + '\n');
      results.push(mod.id + ': updated (' + snapshot.series.length + ' series, ref ' + (snapshot.referencePeriod || '?') + ')');
    } else {
      results.push(mod.id + ': unchanged (ref ' + (snapshot.referencePeriod || '?') + ')');
    }
    succeeded++;
  } catch (e) {
    results.push(mod.id + ': FAILED — ' + e.message + (existsSync(outPath) ? ' (last-good kept)' : ' (no last-good)'));
  }
}
console.log('fetch-pack: ' + results.join(' · '));
console.log('fetch-pack: call counts — ' +
  ([...callCounts.entries()].map(([h, n]) => h + '=' + n).join(' · ') || 'none'));
if (attempted > 0 && succeeded === 0) {
  console.error('fetch-pack: every attempted source failed');
  process.exit(1);
}
