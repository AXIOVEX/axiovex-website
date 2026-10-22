#!/usr/bin/env node
/* build-listening.mjs — listening-edition generator (spec 029, WS4;
 * voice roster added by spec 030).
 *
 * Usage:
 *   node scripts/build-listening.mjs <slug> [--check-only]
 *   node scripts/build-listening.mjs <slug> --voice <id|name>
 *   node scripts/build-listening.mjs <slug> --all-voices [--force]
 *   node scripts/build-listening.mjs --samples [--force]
 *
 * Voices (spec 030): every article edition is narrated in a roster
 * of voices (VOICES below). The DEFAULT voice (Brian) is the track
 * at the flat paths assets/audio/<slug>/ch-NN.mp3 and the voice a
 * first-time listener hears; each other voice lives in
 * assets/audio/<slug>/<voice-id>/. chapters.json carries the roster
 * and a per-voice entry per chapter; the flat audio/durationSec
 * fields always describe the default voice. The standard ARTICLE
 * build is `--all-voices`; a plain invocation renders the default
 * voice only, which is what the daily Signals Briefing flow relies
 * on (briefings stay single-voice). Already-rendered files are
 * never re-rendered unless --force is passed.
 * --samples renders the shared picker sample sentence once per
 * roster voice into assets/audio/voice-samples/<voice-id>.mp3.
 *
 * What it does, given a blog post slug:
 *   1. Finds the post at blog/posts/*-<slug>.md (front-matter slug match).
 *   2. Requires a human/agent-drafted narration script at
 *      blog/listening/<slug>/script.md. THIS TOOL DOES NOT DRAFT PROSE.
 *      The script is drafted per article under the spec 029 standard:
 *      hook first, plain language, chapters at the article's natural
 *      section breaks, every figure traceable to the article, ~130 wpm,
 *      target 5–9 minutes; tables become spoken summaries of their key
 *      rows, never cell-by-cell readings; citations/links are omitted
 *      or spoken as "linked in the article".
 *   3. Runs the NUMBER-FIDELITY GATE: every number in the script's
 *      audience-facing content (key points, takeaway, narration) —
 *      digits or spelled out — must appear in the article text. On any
 *      mismatch the tool FAILS LOUDLY, lists each offending figure with
 *      its chapter, synthesizes NOTHING, and exits 1. Fix the script,
 *      never the gate.
 *   4. Synthesizes one MP3 per chapter with the ElevenLabs connector
 *      CLI for each selected voice (see the roster note above) into
 *      assets/audio/<slug>/ch-NN.mp3 (default voice) or
 *      assets/audio/<slug>/<voice-id>/ch-NN.mp3 (the other voices),
 *      probes durations with ffprobe, merges the results into
 *      blog/listening/<slug>/chapters.json, and refreshes the runtime
 *      figures recorded in script.md from the DEFAULT voice's
 *      durations.
 *
 * Script file format (the pilot's format — blog/listening/
 * robots-can-do-the-work/script.md is the worked example):
 *
 *   # Listening edition — <article title>
 *   <provenance / discipline lines>
 *   - Voice: Brian (ElevenLabs)
 *   - Chapters: N · Total runtime: M:SS (seconds, measured per file)
 *   - Audio: /assets/audio/<slug>/ch-01.mp3 … ch-NN.mp3
 *
 *   ## NN · KICKER — Headline (M:SS)
 *
 *   **Key points**
 *
 *   - point one (digits written as digits)
 *   - point two
 *   - point three            (exactly three, per spec FR-002)
 *
 *   **Takeaway:** one line.
 *
 *   **Narration**
 *
 *   The spoken text. Numbers are SPELLED OUT here ("eighty-one
 *   percent", "zero point three percent", "seven thousand five
 *   hundred ninety-four"); years read as "twenty fifteen".
 *
 * Environment: synthesis shells out to the ElevenLabs connector CLI
 * at ~/workspace/custom-connectors/custom.legacy-elevenlabs/bin/
 * elevenlabs_api.py (credential via the Secure Vault surrogate —
 * the CLI handles it; nothing secret is read here) plus ffprobe.
 * --check-only runs parsing + the fidelity gate and stops, which is
 * safe to run anywhere.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const EL_CLI = path.join(os.homedir(), 'workspace/custom-connectors/custom.legacy-elevenlabs/bin/elevenlabs_api.py');

/* The narrator roster (spec 030 — owner decisions 2026-10-22:
 * the roster is TWO voices, Brian the default and Sarah the
 * alternate; eight voices were auditioned and five further
 * voices were rendered before the owner narrowed the roster —
 * those renders were out of scope and are not shipped). The
 * order here is the order the player's picker lists them in.
 * Ids are the ElevenLabs voice ids; the default voice's id also
 * names nothing on disk — the default track keeps the flat
 * paths (see header). */
const VOICES = [
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: 'Deep and resonant, comforting and steady.' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Warm and reassuring, with a calm, confident delivery.' },
];
const DEFAULT_VOICE = VOICES[0];
const DEFAULT_VOICE_NAME = DEFAULT_VOICE.name + ' (ElevenLabs)';
/* The picker's sample sentence — identical in every voice, so
 * listeners compare the voice, not the words (spec 030, D3). */
const SAMPLE_TEXT = 'Welcome to an Axiovex listening edition. The article is read aloud, chapter by chapter, so you can listen the way you would read \u2014 and you can choose the voice that reads it to you.';

const rawArgs = process.argv.slice(2);
const checkOnly = rawArgs.includes('--check-only');
const allVoices = rawArgs.includes('--all-voices');
const forceRender = rawArgs.includes('--force');
const samplesMode = rawArgs.includes('--samples');
const voiceOptIdx = rawArgs.indexOf('--voice');
const voiceOpt = voiceOptIdx >= 0 ? rawArgs[voiceOptIdx + 1] : null;
const slug = rawArgs.find((a, i) => !a.startsWith('--') && (voiceOptIdx < 0 || i !== voiceOptIdx + 1));

/* ---------------- shared synthesis helpers ---------------- */
const env = { ...process.env, PYTHONPATH: '/opt/muse/skills/custom-connector-setup/bin' };
function fmt(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
/* Writes in this environment can be intermittently denied
 * ("Operation not permitted" on content writes — see the repo's
 * AGENTS.md notes). A 0-byte or missing file after a "successful"
 * call is a failed write: verify by size and retry a few times
 * before believing any output exists. */
function fileSize(p) { try { return statSync(p).size; } catch { return -1; } }
function synthesize(text, out, voiceId) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try { rmSync(out, { force: true }); } catch { /* ignore */ }
    try {
      execFileSync('python3', [EL_CLI, 'tts', '--text', text, '--voice', voiceId, '--out', out],
        { env, stdio: 'pipe' });
    } catch { /* fall through to the size check */ }
    if (fileSize(out) > 10000) return;
    console.error(`  write of ${path.basename(out)} did not land (attempt ${attempt}/4) — retrying`);
  }
  throw new Error(`synthesis failed: ${out} never landed after 4 attempts`);
}
function probeDuration(out) {
  return Math.round(parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out], { encoding: 'utf8' }).trim()));
}
function writeVerified(p, content) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try { writeFileSync(p, content); } catch { /* retry below */ }
    if (fileSize(p) === Buffer.byteLength(content)) return;
  }
  throw new Error(`write failed: ${p} never landed after 4 attempts`);
}

/* ---------------- picker sample clips (no slug needed) ---------------- */
if (samplesMode) {
  const dir = path.join(ROOT, 'assets', 'audio', 'voice-samples');
  mkdirSync(dir, { recursive: true });
  for (const v of VOICES) {
    const out = path.join(dir, v.id + '.mp3');
    if (!forceRender && fileSize(out) > 5000) {
      console.log(`sample ${v.name}: already rendered (${probeDuration(out)}s) — skipped`);
      continue;
    }
    synthesize(SAMPLE_TEXT, out, v.id);
    console.log(`sample ${v.name}: synthesized, ${probeDuration(out)}s`);
  }
  console.log('done: picker sample clips in assets/audio/voice-samples/');
  process.exit(0);
}

if (!slug) { console.error('usage: node scripts/build-listening.mjs <slug> [--check-only] [--voice <id|name>] [--all-voices] [--force] | --samples [--force]'); process.exit(2); }

/* ---------------- post + script loading ---------------- */
const postsDir = path.join(ROOT, 'blog', 'posts');
let postFile = null, postTitle = slug;
for (const f of readdirSync(postsDir).filter(f => f.endsWith('.md'))) {
  const raw = readFileSync(path.join(postsDir, f), 'utf8');
  const fm = raw.split('\n').slice(0, 12).join('\n');
  const mSlug = /^slug:\s*(.+)$/m.exec(fm);
  const derived = f.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
  if ((mSlug && mSlug[1].trim() === slug) || derived === slug) {
    postFile = path.join(postsDir, f);
    const mTitle = /^title:\s*(.+)$/m.exec(fm);
    if (mTitle) postTitle = mTitle[1].trim().replace(/^"|"$/g, '');
    break;
  }
}
if (!postFile) { console.error(`FAIL: no post found for slug "${slug}" in blog/posts/`); process.exit(1); }
const articleRaw = readFileSync(postFile, 'utf8');

const scriptPath = path.join(ROOT, 'blog', 'listening', slug, 'script.md');
if (!existsSync(scriptPath)) {
  console.error(`FAIL: no narration script at blog/listening/${slug}/script.md — draft it first (this tool does not draft prose).`);
  process.exit(1);
}
const scriptRaw = readFileSync(scriptPath, 'utf8');

/* ---------------- script parsing ---------------- */
function parseScript(text) {
  const chapters = [];
  const re = /^## (\d+) · (.+?) — (.+?)(?: \(([\d:]+)\))?\s*$/gm;
  const heads = [...text.matchAll(re)];
  heads.forEach((h, i) => {
    const body = text.slice(h.index + h[0].length, i + 1 < heads.length ? heads[i + 1].index : text.length);
    const pm = /\*\*Key points\*\*\s*\n((?:\s*- .*\n?)+)/.exec(body);
    const points = pm ? pm[1].trim().split('\n').map(l => l.replace(/^\s*- /, '').trim()) : [];
    const tm = /\*\*Takeaway:\*\*\s*(.+)/.exec(body);
    const nm = /\*\*Narration\*\*\s*\n([\s\S]+?)\s*$/.exec(body);
    chapters.push({
      num: Number(h[1]), kicker: h[2].trim(), headline: h[3].trim(),
      points, takeaway: tm ? tm[1].trim() : '',
      narration: nm ? nm[1].replace(/\s+/g, ' ').trim() : '',
    });
  });
  return chapters;
}
const chapters = parseScript(scriptRaw);
if (!chapters.length) { console.error('FAIL: no chapters parsed from script.md (check the "## NN · KICKER — Headline" headings).'); process.exit(1); }
let structuralError = false;
chapters.forEach((c, i) => {
  if (c.num !== i + 1) { console.error(`FAIL: chapter numbering broken at chapter ${c.num} (expected ${i + 1}).`); structuralError = true; }
  if (c.points.length !== 3) { console.error(`FAIL: chapter ${c.num} has ${c.points.length} key points (spec FR-002: exactly 3).`); structuralError = true; }
  if (!c.takeaway) { console.error(`FAIL: chapter ${c.num} has no takeaway.`); structuralError = true; }
  if (!c.narration) { console.error(`FAIL: chapter ${c.num} has no narration.`); structuralError = true; }
});
if (structuralError) process.exit(1);

/* ---------------- figure extraction (the gate) ---------------- */
const UNITS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19 };
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const SCALES = { hundred: 100, thousand: 1e3, million: 1e6, billion: 1e9 };
const ORDINALS = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9,
  tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16,
  seventeenth: 17, eighteenth: 18, nineteenth: 19, twentieth: 20, thirtieth: 30 };
const UNIT_NOUNS = new Set(['percent', 'dollars', 'dollar', 'hours', 'hour', 'days', 'day', 'weeks', 'week',
  'months', 'month', 'years', 'year', 'times', 'workers', 'jobs', 'tasks', 'points', 'point', 'miles',
  'minutes', 'minute', 'seconds', 'people', 'residents']);
const NUMWORD = new Set([...Object.keys(UNITS), ...Object.keys(TENS), ...Object.keys(SCALES), ...Object.keys(ORDINALS), 'point', 'and']);

function cleanText(t) {
  return t
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')          // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')         // links keep text
    .replace(/https?:\/\/\S+/g, ' ')                 // bare URLs
    .replace(/[*_`#>]/g, ' ');
}

function digitFigures(text) {
  const out = [];
  const t = cleanText(text);
  for (const m of t.matchAll(/\$?\d[\d,]*(?:\.\d+)?/g)) out.push(parseFloat(m[0].replace(/[$,]/g, '')));
  for (const m of t.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(thousand|million|billion)\b/gi))
    out.push(parseFloat(m[1].replace(/,/g, '')) * SCALES[m[2].toLowerCase()]);
  for (const m of t.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*([kM])\b/g))
    out.push(parseFloat(m[1].replace(/,/g, '')) * (m[2] === 'k' ? 1e3 : 1e6));
  return out;
}

function spelledFigures(text) {
  const out = [];
  let t = ' ' + cleanText(text).toLowerCase() + ' ';
  // Fraction idioms first (mask them out so the ordinal pass stays honest).
  for (const [re, v] of [[/\ba tenth\b/g, 0.1], [/\ba half\b/g, 0.5], [/\ba quarter\b/g, 0.25]]) {
    if (re.test(t)) { out.push(v); t = t.replace(re, ' fraction '); }
  }
  // Decade idiom: "the nineteen-nineties" is the decade 1990, not the
  // figure 19 — mask it before the run parser sees the century word.
  const DECADES = { twenties: 20, thirties: 30, forties: 40, fifties: 50, sixties: 60, seventies: 70, eighties: 80, nineties: 90 };
  t = t.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)[-\s]+(twenties|thirties|forties|fifties|sixties|seventies|eighties|nineties)\b/g,
    (m, cent, dec) => { out.push((UNITS[cent] ?? TENS[cent]) * 100 + DECADES[dec]); return ' decademark '; });
  // Year idiom: "twenty fifteen", "twenty eighty-five", "twenty twenty-six".
  const yearRe = /\btwenty\s+((?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:[-\s](?:one|two|three|four|five|six|seven|eight|nine))?|(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen))\b/g;
  t = t.replace(yearRe, (m, g) => {
    const words = g.split(/[-\s]+/);
    let v = 0;
    for (const w of words) v += (UNITS[w] ?? TENS[w] ?? 0);
    out.push(2000 + v);
    return ' yearmark ';
  });
  // Token stream. Clause punctuation becomes a run breaker: without it,
  // adjacent but distinct numbers merge into a phantom ("October
  // twenty-fifth, five hundred fifty-seven" would read as one run =
  // 3057). Hyphens stay spaces — they join words INSIDE one number
  // ("fifty-seven"). The '|' tokens break runs below.
  const words = t.replace(/[.,;:!?—–]+/g, ' | ').replace(/[^a-z\s|]/g, ' ').split(/\s+/).filter(Boolean);
  let i = 0;
  while (i < words.length) {
    if (!NUMWORD.has(words[i])) { i++; continue; }
    const run = [];
    let j = i;
    while (j < words.length && NUMWORD.has(words[j])) { run.push(words[j]); j++; }
    // Evaluate the run.
    let current = 0, total = 0, frac = null, seen = false;
    for (const w of run) {
      if (w === 'and') continue;
      if (w === 'point') { frac = ''; continue; }
      if (frac !== null && UNITS[w] !== undefined && UNITS[w] < 10) { frac += String(UNITS[w]); continue; }
      if (frac !== null && UNITS[w] !== undefined) { /* digit word >= 10 after point: ignore */ continue; }
      if (SCALES[w]) {
        // A pending fraction belongs to the integer part BEFORE scaling:
        // "one point four million" is 1.4 x 1e6, not 1e6 + 0.4.
        const eff = current + (frac ? parseFloat('0.' + frac) : 0);
        frac = null;
        if (w === 'hundred') current = (eff || 1) * 100;
        else { total += (eff || 1) * SCALES[w]; current = 0; }
        seen = true; continue;
      }
      const v = UNITS[w] ?? TENS[w] ?? ORDINALS[w];
      if (v !== undefined) { current += v; seen = true; }
    }
    let value = total + current;
    if (frac !== null && frac !== '') value += parseFloat('0.' + frac);
    const isDeterminerOne = run.length === 1 && run[0] === 'one' && !UNIT_NOUNS.has(words[j] || '');
    if (seen && !isDeterminerOne) out.push(value);
    i = j;
  }
  return out;
}

function figureSet(text) {
  const s = new Set();
  for (const v of [...digitFigures(text), ...spelledFigures(text)]) s.add(Math.round(v * 1e6) / 1e6);
  return s;
}

const articleFigures = figureSet(articleRaw);
if (process.env.LE_DEBUG) console.error('article figures:', [...articleFigures].sort((a, b) => a - b).join(', '));
const mismatches = [];
for (const c of chapters) {
  const scriptText = [...c.points, c.takeaway, c.narration].join('\n');
  if (process.env.LE_DEBUG) console.error(`chapter ${c.num} figures:`, [...figureSet(scriptText)].sort((a, b) => a - b).join(', '));
  for (const v of figureSet(scriptText)) {
    if (!articleFigures.has(v)) mismatches.push({ chapter: c.num, value: v });
  }
}
if (mismatches.length) {
  console.error(`FIDELITY GATE FAILED for "${slug}": ${mismatches.length} script figure(s) not found in the article:`);
  for (const m of mismatches) console.error(`  chapter ${m.chapter}: figure ${m.value}`);
  console.error('Nothing was synthesized. Fix the script to match the article — never weaken the gate.');
  process.exit(1);
}
const wordCount = chapters.reduce((a, c) => a + c.narration.split(/\s+/).length, 0);
console.log(`fidelity gate: PASS (${chapters.length} chapters, ${wordCount} spoken words, every figure traced to the article)`);
if (checkOnly) { console.log('--check-only: stopping before synthesis.'); process.exit(0); }

/* ---------------- synthesis ---------------- */
const audioDir = path.join(ROOT, 'assets', 'audio', slug);
mkdirSync(audioDir, { recursive: true });

/* Which voices this run renders: --all-voices = the whole roster,
 * --voice <id|name> = one voice, no option = the default voice only
 * (the behaviour the daily briefing flow relies on). */
function resolveVoice(opt) {
  const v = VOICES.find(v => v.id === opt || v.name.toLowerCase() === String(opt).toLowerCase());
  if (!v) { console.error(`FAIL: unknown voice "${opt}" — roster ids/names: ${VOICES.map(v => v.name).join(', ')}`); process.exit(2); }
  return v;
}
const selectedVoices = allVoices ? VOICES : [voiceOpt ? resolveVoice(voiceOpt) : DEFAULT_VOICE];

/* Load any existing chapters.json so a run for one voice MERGES
 * into the edition's data instead of dropping the other voices
 * (spec 030, D3). Static chapter fields always refresh from the
 * script; audio entries survive unless re-rendered here. */
const dataPath = path.join(ROOT, 'blog', 'listening', slug, 'chapters.json');
let data = { chapters: [] };
if (existsSync(dataPath)) {
  try { data = JSON.parse(readFileSync(dataPath, 'utf8')); } catch { data = { chapters: [] }; }
}
if (!Array.isArray(data.chapters)) data.chapters = [];
data.slug = slug;
data.title = postTitle;
data.voice = DEFAULT_VOICE_NAME;
data.defaultVoice = DEFAULT_VOICE.id;
data.voices = VOICES.map(v => ({ id: v.id, name: v.name, description: v.description }));
chapters.forEach((c, i) => {
  const prev = data.chapters[i] || {};
  const merged = {
    kicker: c.kicker, headline: c.headline, points: c.points, takeaway: c.takeaway,
    voices: (prev.voices && typeof prev.voices === 'object') ? prev.voices : {},
  };
  if (prev.audio) merged.audio = prev.audio;
  if (prev.durationSec) merged.durationSec = prev.durationSec;
  data.chapters[i] = merged;
});
data.chapters.length = chapters.length;

function renderVoice(voice) {
  const isDefault = voice.id === DEFAULT_VOICE.id;
  const dir = isDefault ? audioDir : path.join(audioDir, voice.id);
  mkdirSync(dir, { recursive: true });
  chapters.forEach((c, i) => {
    const nn = ('0' + c.num).slice(-2);
    const out = path.join(dir, `ch-${nn}.mp3`);
    const entryAudio = isDefault ? `/assets/audio/${slug}/ch-${nn}.mp3` : `/assets/audio/${slug}/${voice.id}/ch-${nn}.mp3`;
    /* Skip only audio this data model itself recorded for THIS
     * voice. For the default track that means a per-voice entry
     * pointing at the flat path AND the file present: the flat
     * files on disk may be a PREVIOUS default voice's renders
     * (spec 030 build finding, 2026-10-22 — after the default
     * changed Wellington → Brian, a bare file-exists check nearly
     * recorded Wellington's files as Brian's). Alternate folders
     * are voice-specific, so file presence is proof enough there. */
    const prevEntry = data.chapters[i].voices && data.chapters[i].voices[voice.id];
    const alreadyThisVoice = fileSize(out) > 10000 &&
      (!isDefault || (prevEntry && prevEntry.audio === entryAudio));
    if (!forceRender && alreadyThisVoice) {
      console.log(`${voice.name} ch-${nn}: already rendered — skipped`);
    } else {
      synthesize(c.narration, out, voice.id);
      console.log(`${voice.name} ch-${nn}: synthesized`);
    }
    const durationSec = probeDuration(out);
    console.log(`${voice.name} ch-${nn}: ${durationSec}s`);
    const entry = {
      audio: isDefault ? `/assets/audio/${slug}/ch-${nn}.mp3` : `/assets/audio/${slug}/${voice.id}/ch-${nn}.mp3`,
      durationSec,
    };
    data.chapters[i].voices[voice.id] = entry;
    if (isDefault) { data.chapters[i].audio = entry.audio; data.chapters[i].durationSec = entry.durationSec; }
  });
}
for (const voice of selectedVoices) renderVoice(voice);

/* chapters.json keeps a stable key order: per chapter the flat
 * default-track fields precede the per-voice map (spec 030, D3). */
const ordered = {
  slug: data.slug, title: data.title, voice: data.voice,
  defaultVoice: data.defaultVoice, voices: data.voices,
  chapters: data.chapters.map(c => {
    const o = { kicker: c.kicker, headline: c.headline, points: c.points, takeaway: c.takeaway };
    if (c.audio) o.audio = c.audio;
    if (c.durationSec) o.durationSec = c.durationSec;
    /* Only roster voices are written out: if the roster ever
     * narrows, a routine re-run prunes the dropped voices'
     * entries instead of leaving them in the data forever. */
    o.voices = {};
    for (const v of VOICES) if (c.voices && c.voices[v.id]) o.voices[v.id] = c.voices[v.id];
    return o;
  }),
};
writeVerified(dataPath, JSON.stringify(ordered, null, 2) + '\n');

/* Refresh the runtime figures in script.md so the script of record
 * stays true. The figures describe the DEFAULT voice's track, so
 * they are taken from the default voice's OWN per-voice entries —
 * never from whatever the flat fields happened to hold — and
 * script.md is touched only when the default voice is fully on
 * record (rendered in this run or an earlier one). */
const defaultDurs = ordered.chapters.map(c => c.voices && c.voices[DEFAULT_VOICE.id] && c.voices[DEFAULT_VOICE.id].durationSec);
if (defaultDurs.every(d => typeof d === 'number' && d > 0)) {
  let updated = scriptRaw.replace(/^- Voice:.*$/m, `- Voice: ${DEFAULT_VOICE_NAME}`);
  const totalSec = defaultDurs.reduce((a, b) => a + b, 0);
  updated = updated.replace(/- Chapters: \d+ · Total runtime: [^\n]*/,
    `- Chapters: ${chapters.length} · Total runtime: ${fmt(totalSec)} (${totalSec} seconds, measured per file)`);
  chapters.forEach((c, i) => {
    const head = `## ${('0' + c.num).slice(-2)} · ${c.kicker} — ${c.headline}`;
    updated = updated.replace(new RegExp(head.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '( \\([\\d:]+\\))?'),
      `${head} (${fmt(defaultDurs[i])})`);
  });
  writeVerified(scriptPath, updated);
  console.log(`done: ${chapters.length} chapters; default voice (${DEFAULT_VOICE.name}) total runtime ${fmt(totalSec)} — chapters.json + script.md updated for "${slug}".`);
} else {
  console.log(`done: ${chapters.length} chapters rendered for ${selectedVoices.map(v => v.name).join(', ')} — chapters.json updated for "${slug}" (script.md left as-is: the default voice is not fully on record yet).`);
}
