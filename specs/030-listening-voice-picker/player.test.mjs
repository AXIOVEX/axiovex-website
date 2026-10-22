#!/usr/bin/env node
/* player.test.mjs — spec 030 player-logic tests (R3–R8) for
 * blog/listening.v4.js, run against a minimal DOM stub (no
 * browser needed):
 *
 *   node specs/030-listening-voice-picker/player.test.mjs
 *
 * Covers: presence rule (R3), switch semantics incl. the clamp
 * (R4), persistence + default resolution (R5), resume integrity —
 * legacy records read as Wellington positions, cross-voice
 * chapter-and-fraction mapping (R6), fallbacks (R7), and the
 * mini-player playing the selected voice with no new controls
 * (R8). Exits 1 on the first failed assertion group summary.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLAYER = readFileSync(path.join(HERE, '..', '..', 'blog', 'listening.v4.js'), 'utf8');

const BRIAN = 'nPczCjzI2devNBz1zQrb';
const WELL = 'HSBWXljo3oivWhybh3YX';
const SARAH = 'EXAVITQu4vr4xnSDxMaL';
const BILL = 'pqHfZKP75CvOlQylNhV4';

/* ---------------- minimal DOM stub ---------------- */
let elSeq = 0;
class El {
  constructor(tag) {
    this.tagName = (tag || 'div').toUpperCase();
    this._id = ++elSeq;
    this.children = [];
    this.parentNode = null;
    this.attrs = {};
    this.listeners = {};
    this.style = {};
    this.dataset = {};
    this.hidden = false;
    this.value = 0;
    this._text = '';
    this._classes = new Set();
    const self = this;
    this.classList = {
      add: c => self._classes.add(c),
      remove: c => self._classes.delete(c),
      toggle: (c, on) => { if (on === undefined) on = !self._classes.has(c); on ? self._classes.add(c) : self._classes.delete(c); },
      contains: c => self._classes.has(c),
    };
  }
  get className() { return [...this._classes].join(' '); }
  set className(v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get textContent() { return this._text + this.children.map(c => c.textContent).join(''); }
  set textContent(v) { this._text = String(v); this.children = []; }
  set innerHTML(v) {
    this.children = [];
    this._text = '';
    if (!v) return;
    // Flat-parse the stub HTML the player builds (mini-player):
    // one child per classed tag, in document order.
    const re = /<(\w+)[^>]*class="([^"]+)"/g;
    let m;
    while ((m = re.exec(v))) {
      const child = new El(m[1]);
      child.className = m[2];
      this.appendChild(child);
    }
  }
  get innerHTML() { return ''; }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'class') this.className = v; }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  removeAttribute(k) { delete this.attrs[k]; }
  hasAttribute(k) { return k in this.attrs; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  insertBefore(c, ref) {
    c.parentNode = this;
    const i = ref ? this.children.indexOf(ref) : -1;
    if (i < 0) this.children.push(c); else this.children.splice(i, 0, c);
    return c;
  }
  get nextSibling() {
    if (!this.parentNode) return null;
    const sibs = this.parentNode.children;
    return sibs[sibs.indexOf(this) + 1] || null;
  }
  addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); }
  emit(t, ev) { (this.listeners[t] || []).slice().forEach(fn => fn(ev || { target: this })); }
  click() { this.emit('click', { target: this }); }
  focus() { this._focused = true; }
  matches(sel) {
    if (sel.startsWith('.')) return this._classes.has(sel.slice(1));
    const m = /^\[([a-z0-9-]+)(?:="([^"]*)")?\]$/.exec(sel);
    if (m) return m[2] === undefined ? this.hasAttribute(m[1]) : this.getAttribute(m[1]) === m[2];
    return false;
  }
  _walk(out) { for (const c of this.children) { out.push(c); c._walk(out); } return out; }
  querySelector(sel) { return this._walk([]).find(e => e.matches(sel)) || null; }
  querySelectorAll(sel) { return this._walk([]).filter(e => e.matches(sel)); }
  contains(el) { return el === this || this._walk([]).includes(el); }
}
class AudioEl extends El {
  constructor() {
    super('audio');
    this.currentTime = 0;
    this.paused = true;
    this.ended = false;
    this.readyState = 4;
    this.playbackRate = 1;
    this.preload = '';
  }
  get src() { return this.getAttribute('src') || ''; }
  set src(v) { this.setAttribute('src', v); }
  play() { this.paused = false; this.emit('play'); return Promise.resolve(); }
  pause() { this.paused = true; this.emit('pause'); }
}

/* ---------------- fixture ---------------- */
function chapterData(n, flat, perVoice) {
  const voices = {};
  for (const [id, e] of Object.entries(perVoice)) voices[id] = e;
  return {
    kicker: 'K' + n, headline: 'Chapter ' + n, points: ['a', 'b', 'c'], takeaway: 't' + n,
    audio: flat.audio, durationSec: flat.durationSec, voices,
  };
}
/* Chapters with deliberately different lengths per voice:
 * Brian 100/200, Wellington 120/240, Sarah 80/160, Bill 90/180. */
function multiVoiceData() {
  const ch = (n, b, w, s, bi, slug) => chapterData(n,
    { audio: `/assets/audio/${slug}/ch-0${n}.mp3`, durationSec: b },
    {
      [BRIAN]: { audio: `/assets/audio/${slug}/ch-0${n}.mp3`, durationSec: b },
      [WELL]: { audio: `/assets/audio/${slug}/${WELL}/ch-0${n}.mp3`, durationSec: w },
      [SARAH]: { audio: `/assets/audio/${slug}/${SARAH}/ch-0${n}.mp3`, durationSec: s },
      [BILL]: { audio: `/assets/audio/${slug}/${BILL}/ch-0${n}.mp3`, durationSec: bi },
    });
  return {
    slug: 'fixture-article', title: 'Fixture', voice: 'Brian (ElevenLabs)', defaultVoice: BRIAN,
    voices: [
      { id: BRIAN, name: 'Brian', description: 'd' },
      { id: WELL, name: 'Mr Wellington', description: 'd' },
      { id: SARAH, name: 'Sarah', description: 'd' },
      { id: BILL, name: 'Bill', description: 'd' },
    ],
    chapters: [ch(1, 100, 120, 80, 90, 'fixture-article'), ch(2, 200, 240, 160, 180, 'fixture-article')],
  };
}
function singleVoiceData() {
  return {
    slug: 'signals-briefing', title: 'Signals Briefing', voice: 'Brian (ElevenLabs)',
    chapters: [1, 2].map(n => ({
      kicker: 'K' + n, headline: 'Chapter ' + n, points: ['a', 'b', 'c'], takeaway: 't' + n,
      audio: `/assets/audio/signals-briefing/ch-0${n}.mp3`, durationSec: 100 * n,
    })),
  };
}

function loadPlayer(data, seed) {
  const store = new Map(Object.entries(seed || {}));
  const localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  };
  const section = new El('section');
  section.setAttribute('id', 'listening-edition');
  const mk = (tag, attr, parent) => {
    const e = tag === 'audio' ? new AudioEl() : new El(tag);
    if (attr) e.setAttribute(attr, '');
    (parent || section).appendChild(e);
    return e;
  };
  const dataEl = mk('script', 'data-le-data');
  dataEl.textContent = JSON.stringify(data);
  const meta = new El('p'); meta.className = 'le-meta';
  meta.textContent = 'Narrated · 2 chapters · about 5 minutes';
  section.appendChild(meta);
  const kicker = mk('p', 'data-le-kicker'), headline = mk('h3', 'data-le-headline');
  const points = mk('ul', 'data-le-points'), takeaway = mk('span', 'data-le-takeaway');
  const controls = new El('div'); controls.className = 'le-controls'; section.appendChild(controls);
  const play = mk('button', 'data-le-play', controls);
  const elapsed = mk('span', 'data-le-elapsed', controls), totalEl = mk('span', 'data-le-total', controls);
  const progress = mk('input', 'data-le-progress', controls);
  const now = mk('span', 'data-le-now', controls);
  const rate = mk('button', 'data-le-rate', controls);
  const resume = mk('button', 'data-le-resume', controls);
  resume.hidden = true;
  const chapterBtns = data.chapters.map(() => mk('button', 'data-le-chapter'));
  const audio = mk('audio', 'data-le-audio');
  const body = new El('body');
  const documentStub = {
    getElementById: id => (id === 'listening-edition' ? section : null),
    createElement: tag => (tag === 'audio' ? new AudioEl() : new El(tag)),
    body,
    title: 'Fixture — Axiovex Systems',
    listeners: {},
    addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); },
    emit(t, ev) { (this.listeners[t] || []).forEach(fn => fn(ev)); },
  };
  const windowStub = {
    localStorage,
    matchMedia: () => ({ matches: false, addEventListener: () => {} }),
    location: { pathname: '/blog/fixture-article/' },
  };
  class IO { observe() {} }
  const ctx = vm.createContext({
    window: windowStub, document: documentStub, navigator: {},
    IntersectionObserver: IO, console,
  });
  ctx.window.document = documentStub;
  vm.runInContext(PLAYER, ctx, { filename: 'listening.v4.js' });
  return { section, controls, play, rate, resume, progress, chapterBtns, audio, store, documentStub };
}

/* ---------------- assertions ---------------- */
let passed = 0, failed = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passed++; else { failed++; console.error(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
}
function near(name, got, want, tol) {
  const ok = Math.abs(got - want) <= (tol || 1);
  if (ok) passed++; else { failed++; console.error(`FAIL ${name}: got ${got}, want ~${want}`); }
}
function ok(name, cond) { if (cond) passed++; else { failed++; console.error(`FAIL ${name}`); } }

/* ---- R3: presence rule ---- */
{
  const p = loadPlayer(multiVoiceData());
  ok('R3 multi-voice: voice button rendered', !!p.controls.querySelector('[data-le-voice]'));
  eq('R3 multi-voice: panel lists every voice', p.controls.querySelectorAll('[data-le-voice-pick]').length, 4);
  eq('R3 multi-voice: one sample button per voice', p.controls.querySelectorAll('.le-voice-sample').length, 4);
  const s = loadPlayer(singleVoiceData());
  ok('R3 single-voice: no voice button', !s.controls.querySelector('[data-le-voice]'));
  ok('R3 single-voice: player still initialises (ch-01 cued)', s.audio.getAttribute('src') === '/assets/audio/signals-briefing/ch-01.mp3');
}

/* ---- R5: default resolution + persistence of the choice ---- */
{
  const p = loadPlayer(multiVoiceData());
  eq('R5 first visit: default (Brian, flat path) plays', p.audio.getAttribute('src'), '/assets/audio/fixture-article/ch-01.mp3');
  eq('R5 first visit: button names the default', p.controls.querySelector('[data-le-voice]').textContent, 'Voice: Brian');
  const s = loadPlayer(multiVoiceData(), { 'le-voice': SARAH });
  eq('R5 saved choice wins over the default', s.audio.getAttribute('src'), `/assets/audio/fixture-article/${SARAH}/ch-01.mp3`);
  eq('R5 saved choice: button names the saved voice', s.controls.querySelector('[data-le-voice]').textContent, 'Voice: Sarah');
  eq('R5 saved choice: totals follow that voice (80+160)', s.section.querySelector('[data-le-total]').textContent, '4:00');
}

/* ---- R4: switch semantics (playing, paused, clamp) + sample pauses edition ---- */
{
  const p = loadPlayer(multiVoiceData());
  const voiceBtn = p.controls.querySelector('[data-le-voice]');
  const picks = p.controls.querySelectorAll('[data-le-voice-pick]');
  const pickFor = id => picks.find(b => b.getAttribute('data-voice-id') === id);
  p.play.click();                       // start chapter 1, playing
  p.chapterBtns[1].click();             // chapter 2, playing (Brian, 200s)
  p.audio.currentTime = 150;
  voiceBtn.click();                     // open panel
  const panel = p.controls.querySelector('.le-voice-panel');
  ok('R4 panel opens', panel.hidden === false);
  pickFor(SARAH).click();               // switch to Sarah mid-chapter
  eq('R4 switch: same chapter, new voice file', p.audio.getAttribute('src'), `/assets/audio/fixture-article/${SARAH}/ch-02.mp3`);
  eq('R4 switch: position carried (150s)', p.audio.currentTime, 150);
  eq('R4 switch: keeps playing', p.audio.paused, false);
  eq('R4 switch: choice persisted', p.store.get('le-voice'), SARAH);
  eq('R4 switch: totals re-total (80+160)', p.section.querySelector('[data-le-total]').textContent, '4:00');
  ok('R4 switch: meta minutes follow the voice', p.section.querySelector('.le-meta').textContent.includes('about 4 minutes'));
  const rec = JSON.parse(p.store.get('le-resume:fixture-article'));
  eq('R4/R6 switch: position re-saved in the new voice', rec.voice, SARAH);
  eq('R4/R6 switch: re-saved offset is edition-wide in the new voice', rec.offsetSeconds, 80 + 150);
  // paused switch stays paused
  p.audio.pause();
  pickFor(BILL).click();
  eq('R4 paused switch: stays paused', p.audio.paused, true);
  eq('R4 paused switch: file + position (Bill ch-02 at 150s)', [p.audio.getAttribute('src'), p.audio.currentTime],
    [`/assets/audio/fixture-article/${BILL}/ch-02.mp3`, 150]);
  // clamp: 195s into Bill's 180s chapter 2 -> Sarah's 160s chapter clamps to 158
  p.audio.currentTime = 195;
  pickFor(SARAH).click();
  eq('R4 clamp: position clamped to new chapter end - 2s', p.audio.currentTime, 158);
  // sample playback pauses the edition
  p.play.click();
  eq('setup: edition playing again', p.audio.paused, false);
  voiceBtn.click();
  const sampleBtns = p.controls.querySelectorAll('.le-voice-sample');
  sampleBtns[3].click();                // Bill's sample
  eq('R4-adjacent: starting a sample pauses the edition', p.audio.paused, true);
  eq('sample button shows stop state', sampleBtns[3].textContent, '❚❚');
  sampleBtns[3].click();
  eq('sample toggles back to play state', sampleBtns[3].textContent, '▶');
  // Esc closes the panel
  p.documentStub.emit('keydown', { key: 'Escape' });
  ok('panel closes on Escape', panel.hidden === true);
}

/* ---- R6: resume integrity ---- */
{
  // Legacy record (no voice field): read against the DEFAULT track —
  // same chapter, same position (FR-006). Offset 240 = ch-02 at 140s in.
  const legacy = { slug: 'fixture-article', chapterIndex: 1, offsetSeconds: 240, updatedAt: Date.now() };
  const p = loadPlayer(multiVoiceData(), { 'le-resume:fixture-article': JSON.stringify(legacy) });
  eq('R6 legacy: restores in the default voice file', p.audio.getAttribute('src'), '/assets/audio/fixture-article/ch-02.mp3');
  eq('R6 legacy: same position in the default track (140s into ch-02)', p.audio.currentTime, 140);
  eq('R6 legacy: resume button offers the same position', p.resume.textContent, 'Resume from chapter 2 · 4:00');
  // Same-voice record restores exactly.
  const same = { slug: 'fixture-article', chapterIndex: 1, offsetSeconds: 250, voice: BRIAN, updatedAt: Date.now() };
  const q = loadPlayer(multiVoiceData(), { 'le-resume:fixture-article': JSON.stringify(same) });
  eq('R6 same-voice: exact restore (150s into ch-02)', q.audio.currentTime, 150);
  // Cross-voice: saved by Sarah at 25% of ch-02; device choice is Bill.
  const cross = { slug: 'fixture-article', chapterIndex: 1, offsetSeconds: 80 + 40, voice: SARAH, updatedAt: Date.now() };
  const r = loadPlayer(multiVoiceData(), { 'le-resume:fixture-article': JSON.stringify(cross), 'le-voice': BILL });
  eq('R6 cross-voice: restores in the device-chosen voice', r.audio.getAttribute('src'), `/assets/audio/fixture-article/${BILL}/ch-02.mp3`);
  eq('R6 cross-voice: 25% of Sarah ch-02 -> 25% of Bill ch-02 (45s in)', r.audio.currentTime, 45);
  // Stale record (8 days) is ignored.
  const stale = { slug: 'fixture-article', chapterIndex: 1, offsetSeconds: 250, voice: BRIAN, updatedAt: Date.now() - 8 * 24 * 3600 * 1000 };
  const s = loadPlayer(multiVoiceData(), { 'le-resume:fixture-article': JSON.stringify(stale) });
  eq('R6 stale record ignored: starts at ch-01', s.audio.getAttribute('src'), '/assets/audio/fixture-article/ch-01.mp3');
}

/* ---- R7: fallbacks ---- */
{
  const p = loadPlayer(multiVoiceData(), { 'le-voice': 'no-such-voice' });
  eq('R7 unknown saved voice: default plays', p.audio.getAttribute('src'), '/assets/audio/fixture-article/ch-01.mp3');
  eq('R7 unknown saved voice: button names the voice playing', p.controls.querySelector('[data-le-voice]').textContent, 'Voice: Brian');
  const partial = multiVoiceData();
  delete partial.chapters[1].voices[SARAH];   // Sarah is missing chapter 2
  const q = loadPlayer(partial, { 'le-voice': SARAH });
  q.chapterBtns[1].click();
  eq('R7 missing chapter file: that chapter falls back to the default track', q.audio.getAttribute('src'), '/assets/audio/fixture-article/ch-02.mp3');
}

/* ---- R8: mini-player reflects the choice, gains no controls ---- */
{
  const p = loadPlayer(multiVoiceData(), { 'le-voice': SARAH });
  const mini = p.documentStub.body.children.find(e => e.classList.contains('le-mini'));
  ok('R8 mini-player exists', !!mini);
  ok('R8 mini-player has no voice control', !mini.querySelector('[data-le-voice]') && !mini.querySelector('.le-voice-sample'));
  mini.querySelector('.le-mini-play').click();
  eq('R8 mini-player plays the selected voice', p.audio.getAttribute('src'), `/assets/audio/fixture-article/${SARAH}/ch-01.mp3`);
}

console.log(`player.test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
