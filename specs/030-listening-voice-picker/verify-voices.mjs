#!/usr/bin/env node
/* verify-voices.mjs — spec 030 FR-002 completeness check.
 *
 * Usage:
 *   node specs/030-listening-voice-picker/verify-voices.mjs [--root <repo-dir>]
 *   node specs/030-listening-voice-picker/verify-voices.mjs --base https://staging.axiovexsystems.com
 *
 * Local mode (default) checks the tree on disk; --base mode checks
 * the site AS SERVED (HEAD/GET against the base URL). For each of
 * the six article editions it asserts: chapters.json parses; the
 * roster is exactly the two spec voices; defaultVoice is Brian;
 * every chapter carries the flat default track and a per-voice
 * entry for every roster voice with durationSec > 0; and every
 * referenced audio file exists (local) or serves 200 (remote)
 * with a plausible size (> 10 KB local, content-length > 10 KB
 * remote). It also asserts the picker sample clips exist/serve
 * and that Signals Briefing data stays single-voice (FR-012).
 * Exits 1 and prints every failure if anything is off.
 */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROSTER = [
  'nPczCjzI2devNBz1zQrb', // Brian (default)
  'EXAVITQu4vr4xnSDxMaL', // Sarah
];
const DEFAULT_ID = ROSTER[0];
const EDITIONS = [
  'robots-can-do-the-work', 'cloudflare-github-website-costs',
  'michigan-workforce-september-2026', 'what-superintelligence-means',
  'oakland-county-job-losses', 'trinity-health-livonia-557',
];

const args = process.argv.slice(2);
const baseIdx = args.indexOf('--base');
const rootIdx = args.indexOf('--root');
const base = baseIdx >= 0 ? args[baseIdx + 1].replace(/\/$/, '') : null;
const root = rootIdx >= 0 ? args[rootIdx + 1]
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const failures = [];
let filesChecked = 0;
function fail(msg) { failures.push(msg); }

async function readJson(rel) {
  if (base) {
    const r = await fetch(base + '/' + rel);
    if (!r.ok) { fail(`${rel}: HTTP ${r.status}`); return null; }
    return r.json();
  }
  const p = path.join(root, rel);
  if (!existsSync(p)) { fail(`${rel}: missing`); return null; }
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch (e) { fail(`${rel}: does not parse (${e.message})`); return null; }
}
async function checkAudio(relFromSiteRoot, label) {
  filesChecked++;
  if (base) {
    const r = await fetch(base + relFromSiteRoot, { method: 'HEAD' });
    const len = Number(r.headers.get('content-length') || 0);
    if (!r.ok) fail(`${label}: ${relFromSiteRoot} serves HTTP ${r.status}`);
    else if (len && len < 10000) fail(`${label}: ${relFromSiteRoot} implausibly small (${len} bytes)`);
  } else {
    const p = path.join(root, relFromSiteRoot.replace(/^\//, ''));
    if (!existsSync(p)) fail(`${label}: ${relFromSiteRoot} missing on disk`);
    else if (statSync(p).size < 10000) fail(`${label}: ${relFromSiteRoot} implausibly small (${statSync(p).size} bytes)`);
  }
}

for (const slug of EDITIONS) {
  const data = await readJson(`blog/listening/${slug}/chapters.json`);
  if (!data) continue;
  const ids = (data.voices || []).map(v => v.id);
  if (JSON.stringify(ids) !== JSON.stringify(ROSTER)) fail(`${slug}: roster mismatch — ${JSON.stringify(ids)}`);
  if (data.defaultVoice !== DEFAULT_ID) fail(`${slug}: defaultVoice is ${data.defaultVoice}, expected Brian (${DEFAULT_ID})`);
  if (!String(data.voice || '').startsWith('Brian')) fail(`${slug}: voice field is "${data.voice}", expected Brian's name`);
  for (const [i, c] of (data.chapters || []).entries()) {
    const label = `${slug} ch-${String(i + 1).padStart(2, '0')}`;
    if (!c.audio || !(c.durationSec > 0)) fail(`${label}: flat default track missing or duration not > 0`);
    else await checkAudio(c.audio, label + ' [default]');
    for (const id of ROSTER) {
      const e = c.voices && c.voices[id];
      if (!e || !e.audio || !(e.durationSec > 0)) { fail(`${label}: no entry for voice ${id}`); continue; }
      await checkAudio(e.audio, `${label} [${id}]`);
    }
  }
}
for (const id of ROSTER) await checkAudio(`/assets/audio/voice-samples/${id}.mp3`, `sample ${id}`);

/* Briefings stay single-voice (FR-012). */
if (!base) {
  const sdir = path.join(root, 'signals', 'listening');
  if (existsSync(sdir)) {
    for (const d of readdirSync(sdir)) {
      const p = path.join(sdir, d, 'chapters.json');
      if (!existsSync(p)) continue;
      const data = JSON.parse(readFileSync(p, 'utf8'));
      if (data.voices && data.voices.length > 1) fail(`signals briefing ${d}: offers ${data.voices.length} voices — briefings stay single-voice`);
    }
  }
}

console.log(`verify-voices (${base ? 'served: ' + base : 'local tree: ' + root}): ${filesChecked} audio files checked across ${EDITIONS.length} editions + ${ROSTER.length} samples`);
if (failures.length) {
  console.error(`FAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log('PASS — every edition offers both voices for every chapter; default is Brian; samples present; briefings single-voice.');
