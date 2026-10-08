#!/usr/bin/env node
/*
 * news-check.mjs — GDELT drafting-time news / sentiment check (spec 019 FR-009).
 *
 * Drafting-time tool ONLY. It answers "what is news volume / tone doing
 * around Michigan manufacturing lately?" to support FR-012 cause-checking
 * when drafting reports (spec 007): when a number moves, this gives a
 * quick sentiment read on whether coverage spiked and which way it leaned,
 * plus a few recent headlines as pointers for where to look next.
 *
 * SENTIMENT SIGNAL ONLY — NOT A FACTUAL SOURCE. GDELT volume and tone
 * say nothing about whether any specific event happened or caused a
 * number to move. Never cite this tool as evidence of fact; verify any
 * cause against primary sources (WARN filings, BLS, company / agency
 * releases) before stating it. The tool is never a site source: it
 * writes no files and nothing it prints is rendered or published.
 *
 * Source: GDELT Doc API v2 (no key) —
 *   https://api.gdeltproject.org/api/v2/doc/doc
 *   mode=timelinevolinfo  per-day volume intensity (share of all
 *                         GDELT-monitored coverage matching the query, %)
 *   mode=timelinetone     per-day average tone (GDELT scale -100..+100;
 *                         real-world coverage usually sits within -10..+10,
 *                         negative = negative-leaning coverage)
 *   mode=artlist          up to 10 recent example articles (title, domain,
 *                         date) as drafting pointers — best-effort only
 *
 * GDELT rate limit: at most one request every 5 seconds. The three
 * calls are made sequentially with a pause between them; a 429 (or any
 * other failure of a timeline call) is a hard error — exit 1, no retry
 * loop. Wait a minute and run it again by hand.
 *
 * Usage: node scripts/news-check.mjs [--days N] [--query "terms"] [--json] [--no-articles]
 *   --days N       window length in days (default 14)
 *   --query terms  GDELT query (default: Michigan manufacturing —
 *                  "(Michigan manufacturing) OR (Michigan plant) OR
 *                  (Michigan factory)"; words inside a group are ANDed,
 *                  groups are ORed)
 *   --json         emit JSON (includes a "warning" field with the
 *                  sentiment-only label) instead of the text report
 *   --no-articles  skip the artlist call (volume + tone only)
 */
const WARNING = 'SENTIMENT SIGNAL ONLY — NOT A FACTUAL SOURCE. Verify any cause against primary sources (WARN, BLS, company/agency releases) before stating it.';
const UA = 'AxiovexNewsCheck/1.0 (+https://axiovexsystems.com/)';
const API = 'https://api.gdeltproject.org/api/v2/doc/doc';
const DEFAULT_QUERY = '(Michigan manufacturing) OR (Michigan plant) OR (Michigan factory)';
const GAP_MS = 6000; // GDELT: max one request every 5 seconds.

const args = process.argv.slice(2);
const argVal = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const asJson = args.includes('--json');

function fail(msg) {
  if (asJson) console.log(JSON.stringify({ tool: 'news-check', error: msg, warning: WARNING }, null, 2));
  console.error('news-check: error: ' + msg);
  process.exit(1);
}
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/news-check.mjs [--days N] [--query "terms"] [--json] [--no-articles]');
  console.log('  --days N       window length in days (default 14)');
  console.log('  --query terms  GDELT query (default: ' + DEFAULT_QUERY + ')');
  console.log('  --json         JSON output (includes the sentiment-only warning)');
  console.log('  --no-articles  skip the example-articles call');
  console.log(WARNING);
  process.exit(0);
}

const daysRaw = argVal('--days', '14');
const days = /^\d+$/.test(daysRaw) ? parseInt(daysRaw, 10) : NaN;
if (!Number.isInteger(days) || days < 1 || days > 365) {
  fail('--days must be a whole number of days between 1 and 365 (got "' + daysRaw + '")');
}
const query = argVal('--query', DEFAULT_QUERY);
const wantArticles = !args.includes('--no-articles');

/* ---------- fetch ---------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function getJson(params) {
  const url = API + '?' + new URLSearchParams(params).toString();
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 60000); // GDELT answers slowly (10-20s observed).
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctl.signal });
    const text = await r.text();
    if (!r.ok) {
      // GDELT errors (incl. the 429 rate limit) come back as plain text.
      const detail = text.replace(/\s+/g, ' ').trim().slice(0, 160);
      if (r.status === 429) {
        throw new Error('HTTP 429 from GDELT — rate limit (at most one request every 5 seconds). Wait a minute and run again.' + (detail ? ' API said: ' + detail : ''));
      }
      throw new Error('HTTP ' + r.status + ' from GDELT' + (detail ? ' — ' + detail : ''));
    }
    try { return JSON.parse(text); }
    catch { throw new Error('non-JSON response from GDELT: ' + text.replace(/\s+/g, ' ').trim().slice(0, 160)); }
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('GDELT request timed out after 60s');
    throw e;
  } finally { clearTimeout(t); }
}

/* ---------- GDELT shapes ----------
 * Timeline modes return:
 *   { query_details: {...}, timeline: [ { series: 'Volume Intensity',
 *     data: [ { date: '20261001T000000Z', value: 0.0464 }, ... ] } ] }
 * Points are per-day at this window size and the series can be sparse
 * (days with no returned point are NOT invented — they stay absent).
 * Artlist returns { articles: [ { title, domain, seendate, url, ... } ] }
 * with seendate like '20261002T123000Z'. */
const dayOf = raw => {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(String(raw || ''));
  return m ? m[1] + '-' + m[2] + '-' + m[3] : null;
};
function timelinePoints(j, seriesRe) {
  const tl = (j && j.timeline) || [];
  const s = tl.find(x => seriesRe.test(x.series || '')) || tl[0];
  if (!s || !Array.isArray(s.data)) return [];
  return s.data
    .map(p => ({ date: dayOf(p.date), value: typeof p.value === 'number' ? p.value : parseFloat(p.value) }))
    .filter(p => p.date && Number.isFinite(p.value))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/* ---------- run: volume, then tone, then (best-effort) articles ---------- */
let volJson, toneJson;
try {
  volJson = await getJson({ query, mode: 'timelinevolinfo', format: 'json', timespan: days + 'd' });
  await sleep(GAP_MS);
  toneJson = await getJson({ query, mode: 'timelinetone', format: 'json', timespan: days + 'd' });
} catch (e) {
  fail(e.message + ' (GDELT unreachable or unusable — no sentiment read this run; do not draft a cause from memory of coverage either.)');
}

let articles = [];
let articlesError = null;
if (wantArticles) {
  try {
    await sleep(GAP_MS);
    const j = await getJson({ query, mode: 'artlist', format: 'json', timespan: days + 'd', maxrecords: '10', sort: 'datedesc' });
    articles = ((j && j.articles) || []).slice(0, 10).map(a => ({
      title: String(a.title || '').replace(/\s+/g, ' ').trim(),
      domain: a.domain || null,
      date: dayOf(a.seendate),
      url: a.url || null,
    })).filter(a => a.title);
  } catch (e) {
    // Pointers are optional; the timeline read still stands on its own.
    articlesError = e.message;
  }
}

/* ---------- merge + summarize ---------- */
const vol = timelinePoints(volJson, /volume/i);
const tone = timelinePoints(toneJson, /tone/i);
if (!vol.length && !tone.length) {
  fail('GDELT returned no timeline data for this query and window — try a broader --query or a longer --days window.');
}
const toneByDate = new Map(tone.map(p => [p.date, p.value]));
const volByDate = new Map(vol.map(p => [p.date, p.value]));
const dates = [...new Set([...volByDate.keys(), ...toneByDate.keys()])].sort();
const series = dates.map(date => ({
  date,
  volumeIntensity: volByDate.has(date) ? volByDate.get(date) : null,
  avgTone: toneByDate.has(date) ? toneByDate.get(date) : null,
}));

const mean = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round = (v, n) => (v === null ? null : +v.toFixed(n));
function trendOf(points) {
  // First half vs second half of the RETURNED points, by count.
  if (points.length < 2) return { firstHalfMean: mean(points.map(p => p.value)), secondHalfMean: null, changePct: null, direction: 'insufficient data' };
  const mid = Math.floor(points.length / 2);
  const first = mean(points.slice(0, mid).map(p => p.value));
  const second = mean(points.slice(mid).map(p => p.value));
  const changePct = first ? ((second - first) / Math.abs(first)) * 100 : null;
  const direction = changePct === null ? 'insufficient data'
    : changePct > 10 ? 'rising' : changePct < -10 ? 'falling' : 'flat';
  return { firstHalfMean: first, secondHalfMean: second, changePct, direction };
}
const volTrend = trendOf(vol);
const toneVals = tone.map(p => p.value);
const toneMean = mean(toneVals);
const toneLean = toneMean === null ? 'unknown'
  : toneMean >= 1 ? 'positive-leaning' : toneMean <= -1 ? 'negative-leaning' : 'near-neutral / mixed';

const end = new Date();
const start = new Date(end.getTime() - days * 864e5);
const fmtDay = d => d.toISOString().slice(0, 10);
const read = 'Volume ' + volTrend.direction +
  (volTrend.changePct !== null
    ? ' (second-half mean ' + volTrend.secondHalfMean.toFixed(4) + '% vs first-half ' + volTrend.firstHalfMean.toFixed(4) + '%, ' + (volTrend.changePct >= 0 ? '+' : '') + volTrend.changePct.toFixed(0) + '%)'
    : '') +
  '; average tone ' + (toneMean === null ? 'n/a' : toneMean.toFixed(2)) + ' (' + toneLean + ') over ' + tone.length + ' day(s) with data.';

const result = {
  tool: 'news-check',
  source: 'GDELT Doc API',
  api: API,
  query,
  days,
  window: { start: fmtDay(start), end: fmtDay(end), timespan: days + 'd' },
  retrievedUtc: new Date().toISOString(),
  warning: WARNING,
  series,
  summary: {
    daysWithData: dates.length,
    volume: {
      firstHalfMean: round(volTrend.firstHalfMean, 4),
      secondHalfMean: round(volTrend.secondHalfMean, 4),
      changePct: round(volTrend.changePct, 1),
      direction: volTrend.direction,
    },
    tone: {
      mean: round(toneMean, 2),
      min: toneVals.length ? round(Math.min(...toneVals), 2) : null,
      max: toneVals.length ? round(Math.max(...toneVals), 2) : null,
      lean: toneLean,
    },
  },
  read,
  articles,
  ...(articlesError ? { articlesError } : {}),
};

/* ---------- output ---------- */
if (asJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('news-check — GDELT Doc API (drafting-time sentiment check, spec 019 FR-009)');
  console.log('Query:  ' + query);
  console.log('Window: last ' + days + ' days (' + result.window.start + ' to ' + result.window.end + ', UTC) · retrieved ' + result.retrievedUtc);
  console.log('');
  console.log('Day          Volume %   Avg tone');
  for (const p of series) {
    console.log(p.date +
      '  ' + (p.volumeIntensity === null ? '     n/a' : p.volumeIntensity.toFixed(4).padStart(8)) +
      '  ' + (p.avgTone === null ? '     n/a' : (p.avgTone >= 0 ? '+' : '') + p.avgTone.toFixed(2)));
  }
  console.log('');
  console.log('Read: ' + read);
  if (articles.length) {
    console.log('');
    console.log('Recent examples (drafting pointers only — open and verify before citing):');
    for (const a of articles) {
      console.log('  - ' + (a.date || 'date n/a') + ' · ' + (a.domain || 'domain n/a') + ' — ' + a.title);
      if (a.url) console.log('    ' + a.url);
    }
  } else if (wantArticles) {
    console.log('');
    console.log('Recent examples: unavailable' + (articlesError ? ' (' + articlesError + ')' : ' (none returned)') + ' — the volume/tone read above still stands.');
  }
  console.log('');
  console.log(WARNING);
}
