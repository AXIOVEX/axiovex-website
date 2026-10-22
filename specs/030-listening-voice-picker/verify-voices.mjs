#!/usr/bin/env node
/* verify-voices.mjs — spec 030 FR-002 completeness check, extended
 * 2026-10-22 for the owner's universal roster rule (spec 030
 * amendment): every TTS/listening surface offers the full roster.
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
 * remote). It also asserts the picker sample clips exist/serve.
 *
 * Signals Briefing (universal roster rule, 2026-10-22): editions
 * dated 2026-10-22 or later are REQUIRED to pass the same
 * two-voice checks on every chapter. Editions before that date
 * are grandfathered as recorded. Local mode scans every dated
 * edition in signals/listening/; served mode checks the edition
 * the /signals/ page itself carries (its inline data block).
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
const BRIEFING_TWO_VOICE_FROM = '2026-10-22';

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

/* The full two-voice completeness check for one edition's data. */
async function checkEdition(data, label) {
  const ids = (data.voices || []).map(v => v.id);
  if (JSON.stringify(ids) !== JSON.stringify(ROSTER)) fail(`${label}: roster mismatch — ${JSON.stringify(ids)}`);
  if (data.defaultVoice !== DEFAULT_ID) fail(`${label}: defaultVoice is ${data.defaultVoice}, expected Brian (${DEFAULT_ID})`);
  if (!String(data.voice || '').startsWith('Brian')) fail(`${label}: voice field is "${data.voice}", expected Brian's name`);
  for (const [i, c] of (data.chapters || []).entries()) {
    const cl = `${label} ch-${String(i + 1).padStart(2, '0')}`;
    if (!c.audio || !(c.durationSec > 0)) fail(`${cl}: flat default track missing or duration not > 0`);
    else await checkAudio(c.audio, cl + ' [default]');
    for (const id of ROSTER) {
      const e = c.voices && c.voices[id];
      if (!e || !e.audio || !(e.durationSec > 0)) { fail(`${cl}: no entry for voice ${id}`); continue; }
      await checkAudio(e.audio, `${cl} [${id}]`);
    }
  }
}

for (const slug of EDITIONS) {
  const data = await readJson(`blog/listening/${slug}/chapters.json`);
  if (!data) continue;
  await checkEdition(data, slug);
}
for (const id of ROSTER) await checkAudio(`/assets/audio/voice-samples/${id}.mp3`, `sample ${id}`);

/* Signals Briefing — universal roster rule (spec 030 amendment,
 * 2026-10-22): editions dated BRIEFING_TWO_VOICE_FROM or later
 * must offer both voices on every chapter; older editions are
 * grandfathered as recorded and are not checked. */
let briefingsChecked = 0;
if (!base) {
  const sdir = path.join(root, 'signals', 'listening');
  if (existsSync(sdir)) {
    for (const d of readdirSync(sdir).sort()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d < BRIEFING_TWO_VOICE_FROM) continue;
      const data = await readJson(`signals/listening/${d}/chapters.json`);
      if (!data) continue;
      briefingsChecked++;
      await checkEdition(data, `signals briefing ${d}`);
    }
  }
} else {
  const r = await fetch(base + '/signals/');
  if (!r.ok) fail(`signals page: HTTP ${r.status}`);
  else {
    const html = await r.text();
    const m = /data-le-data>([\s\S]*?)<\/script>/.exec(html);
    if (!m) fail('signals page: no inline listening data block found');
    else {
      try {
        const data = JSON.parse(m[1]);
        if (data.editionDate && data.editionDate >= BRIEFING_TWO_VOICE_FROM) {
          briefingsChecked++;
          await checkEdition(data, `signals briefing ${data.editionDate} (served page)`);
        }
      } catch (e) { fail(`signals page: inline data does not parse (${e.message})`); }
    }
  }
}

console.log(`verify-voices (${base ? 'served: ' + base : 'local tree: ' + root}): ${filesChecked} audio files checked across ${EDITIONS.length} editions + ${ROSTER.length} samples + ${briefingsChecked} briefing edition(s)`);
if (failures.length) {
  console.error(`FAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log('PASS — every edition offers both voices for every chapter; default is Brian; samples present; briefings dated ' + BRIEFING_TWO_VOICE_FROM + ' or later offer both voices (older briefings grandfathered).');
