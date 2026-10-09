// Spec 020 T007 — assemble an issue source from the committed
// snapshots (FR-003) plus a small editorial file (lede, insights,
// watchlist — the human-authored lines; insights follow FR-004:
// causes checked, unverified labeled "unexplained").
//
//   node scripts/newsletter/assemble.mjs <yyyy-mm-dd> <editorial.json>
//
// Reads ONLY data/signals.json + data/pack/*.json + blog/posts/.
// Runs the C-020-5 audit as it writes: every Pulse figure and
// every "what changed" item must trace verbatim to the snapshot,
// with its vintage label attached — the audit fails the assembly
// rather than letting an untraced figure through.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderEmail } from './render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = 'https://axiovexsystems.com';

const [date, editorialPath] = process.argv.slice(2);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !editorialPath) {
  console.error('usage: node scripts/newsletter/assemble.mjs <yyyy-mm-dd> <editorial.json>');
  process.exit(1);
}
const editorial = JSON.parse(readFileSync(editorialPath, 'utf8'));
const snap = JSON.parse(readFileSync(path.join(ROOT, 'data', 'signals.json'), 'utf8'));

// ---- What changed: freshest items per lane within 7 days of the send date
const weekAgo = new Date(new Date(date + 'T12:00:00Z').getTime() - 7 * 86400000).toISOString().slice(0, 10);
const whatChanged = [];
for (const [, lane] of Object.entries(snap.lanes || {})) {
  const fresh = (lane.items || []).filter((i) => i.date >= weekAgo && i.date <= date).slice(0, 2);
  if (fresh.length) {
    whatChanged.push({
      lane: lane.title,
      items: fresh.map((i) => ({ title: i.title, source: i.source, date: i.date, url: i.link })),
    });
  }
}

// ---- Michigan Pulse board: the snapshot tiles, verbatim + vintage
const pulseTiles = (snap.pulse?.tiles || []).map((t) => ({
  label: t.label,
  display: t.display,
  delta: t.delta?.text || null,
  vintage: `${snap.pulse.referenceMonth} · preliminary as published`,
}));
const pulse = pulseTiles.slice(0, 6);

// ---- Latest blog article
const postsDir = path.join(ROOT, 'blog', 'posts');
const posts = readdirSync(postsDir).filter((f) => f.endsWith('.md')).map((f) => {
  const raw = readFileSync(path.join(postsDir, f), 'utf8');
  const fm = {};
  const m = /^---\n([\s\S]*?)\n---/.exec(raw);
  if (m) for (const line of m[1].split('\n')) {
    const kv = /^([A-Za-z]+):\s*(.*)$/.exec(line);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  const slug = fm.slug || f.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
  return { title: fm.title, date: fm.date, url: `${SITE}/blog/${slug}/` };
}).filter((p) => p.title && p.date).sort((a, b) => (a.date < b.date ? 1 : -1));
const article = posts[0] || null;

const issue = {
  date,
  lede: editorial.lede,
  whatChanged,
  pulse,
  pulseSource: snap.pulse?.source || null,
  insights: editorial.insights || [],
  article,
  watchlist: editorial.watchlist || [],
  footerAddress: editorial.footerAddress, // staging: absent -> placeholder (FR-018)
};

// ---- C-020-5 audit: every figure traces to its snapshot
const auditProblems = [];
for (const f of issue.pulse) {
  const found = (snap.pulse?.tiles || []).some((t) => t.label === f.label && t.display === f.display);
  if (!found) auditProblems.push(`pulse figure not in snapshot: ${f.label} = ${f.display}`);
  if (!f.vintage) auditProblems.push(`pulse figure missing vintage: ${f.label}`);
}
for (const group of issue.whatChanged) {
  const lane = Object.values(snap.lanes || {}).find((l) => l.title === group.lane);
  for (const item of group.items) {
    const found = lane && (lane.items || []).some((i) => i.title === item.title && i.link === item.url);
    if (!found) auditProblems.push(`item not in snapshot lane ${group.lane}: ${item.title}`);
  }
}
if (auditProblems.length) {
  console.error('C-020-5 AUDIT FAILED:\n' + auditProblems.map((p) => ' - ' + p).join('\n'));
  process.exit(1);
}
console.log(`C-020-5 audit: PASS (${issue.pulse.length} pulse figures, ${issue.whatChanged.reduce((n, g) => n + g.items.length, 0)} items traced to data/signals.json @ ${snap.updatedUtc})`);

const issuesDir = path.join(ROOT, 'newsletter', 'issues');
if (!existsSync(issuesDir)) throw new Error('newsletter/issues/ missing');
writeFileSync(path.join(issuesDir, `${date}.json`), JSON.stringify(issue, null, 2) + '\n');
const email = renderEmail(issue);
writeFileSync(path.join(issuesDir, `${date}.email.json`), JSON.stringify(email, null, 2) + '\n');
console.log(`assembled newsletter/issues/${date}.json + .email.json (subject: ${email.subject})`);
