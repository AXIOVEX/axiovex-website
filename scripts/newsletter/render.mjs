// Spec 020 FR-006 — render an issue's email parts from its ONE
// committed source (newsletter/issues/<date>.json). The web edition
// renders from the same source in scripts/build-site.mjs, so the
// three versions cannot drift (claim C-020-3).
//
// Output: newsletter/issues/<date>.email.json
//   { subject, html, text, footerAddress }
// {{UNSUBSCRIBE_URL}}, {{WEB_URL}}, and {{PRIVACY_URL}} stay as
// placeholders in both parts — the send job personalizes them per
// recipient on the environment's site base (FR-011/14; the privacy
// link is required in every issue footer, owner direction 2026-10-09).

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const POSTAL_PLACEHOLDER = '[Postal address pending — owner decision, spec 020 FR-018]';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
export function fmtDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return iso || '';
  return MONTHS[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1];
}

export function renderEmail(issue) {
  const dateLong = fmtDate(issue.date);
  const address = issue.footerAddress || POSTAL_PLACEHOLDER;
  const subject = `The Axiovex Signal — ${dateLong}`;

  // ---------- plain text ----------
  const t = [];
  t.push('THE AXIOVEX SIGNAL — WEEKLY');
  t.push(dateLong);
  t.push('');
  t.push(issue.lede);
  if (issue.whatChanged?.length) {
    t.push('', 'WHAT CHANGED', '');
    for (const group of issue.whatChanged) {
      t.push(group.lane.toUpperCase());
      for (const i of group.items) t.push(`- ${i.title} (${i.source}, ${fmtDate(i.date)})`, `  ${i.url}`);
      t.push('');
    }
  }
  if (issue.pulse?.length) {
    t.push('MICHIGAN PULSE', '');
    for (const f of issue.pulse) {
      t.push(`- ${f.label}: ${f.display}${f.delta ? ' (' + f.delta + ')' : ''} — ${f.vintage}`);
    }
    if (issue.pulseSource) t.push(`Source: ${issue.pulseSource}.`);
    t.push('');
  }
  if (issue.insights?.length) {
    t.push('WHY IT MATTERS', '');
    for (const line of issue.insights) t.push(line.text, '');
  }
  if (issue.article) {
    t.push('FROM THE BLOG', '', `${issue.article.title} (${fmtDate(issue.article.date)})`, issue.article.url, '');
  }
  if (issue.watchlist?.length) {
    t.push('WATCHLIST', '');
    for (const w of issue.watchlist) t.push(`- ${w.label} — ${fmtDate(w.date)}`);
    t.push('');
  }
  t.push('—');
  t.push('Read this edition on the web: {{WEB_URL}}');
  t.push('Unsubscribe in one click: {{UNSUBSCRIBE_URL}}');
  t.push('Privacy policy: {{PRIVACY_URL}}');
  t.push('Axiovex Systems, LLC · ' + address);
  const text = t.join('\n');

  // ---------- HTML (responsive, mobile-first, no tracking) ----------
  const section = (title, inner) =>
    `<h2 style="color:#00DEF6;font-size:12.5px;letter-spacing:.14em;margin:30px 0 10px">${title}</h2>${inner}`;
  let sections = '';
  if (issue.whatChanged?.length) {
    sections += section('WHAT CHANGED', issue.whatChanged.map((group) =>
      `<p style="color:#7FD8E8;font-size:11.5px;font-weight:700;letter-spacing:.1em;margin:16px 0 6px">${esc(group.lane.toUpperCase())}</p>` +
      group.items.map((i) =>
        `<p style="margin:0 0 10px;line-height:1.55"><a href="${esc(i.url)}" style="color:#F7FCFF;font-weight:600;text-decoration:underline">${esc(i.title)}</a> <span style="color:rgba(247,252,255,.55);font-size:13px">· ${esc(i.source)} · ${esc(fmtDate(i.date))}</span></p>`).join('')
    ).join(''));
  }
  if (issue.pulse?.length) {
    sections += section('MICHIGAN PULSE',
      issue.pulse.map((f) =>
        `<p style="margin:0 0 8px;line-height:1.55">${esc(f.label)}: <strong>${esc(f.display)}</strong>${f.delta ? ` <span style="color:rgba(247,252,255,.7)">${esc(f.delta)}</span>` : ''} <span style="color:rgba(247,252,255,.55);font-size:13px">· ${esc(f.vintage)}</span></p>`).join('') +
      (issue.pulseSource ? `<p style="color:rgba(247,252,255,.55);font-size:13px;margin:4px 0 0">Source: ${esc(issue.pulseSource)}.</p>` : ''));
  }
  if (issue.insights?.length) {
    sections += section('WHY IT MATTERS', issue.insights.map((line) =>
      `<p style="margin:0 0 12px;line-height:1.65;color:rgba(247,252,255,.85)">${esc(line.text)}</p>`).join(''));
  }
  if (issue.article) {
    sections += section('FROM THE BLOG',
      `<p style="margin:0;line-height:1.55"><a href="${esc(issue.article.url)}" style="color:#F7FCFF;font-weight:600;text-decoration:underline">${esc(issue.article.title)}</a> <span style="color:rgba(247,252,255,.55);font-size:13px">· ${esc(fmtDate(issue.article.date))}</span></p>`);
  }
  if (issue.watchlist?.length) {
    sections += section('WATCHLIST', issue.watchlist.map((w) =>
      `<p style="margin:0 0 8px;line-height:1.55">${esc(w.label)} — <strong>${esc(fmtDate(w.date))}</strong></p>`).join(''));
  }
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#081F32;color:#F7FCFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Arial,sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:36px 24px">
    <p style="color:#00DEF6;font-size:12px;letter-spacing:.14em;font-weight:700;margin:0 0 8px">THE AXIOVEX SIGNAL · ${esc(dateLong.toUpperCase())}</p>
    <h1 style="font-size:25px;line-height:1.3;margin:0 0 6px">${esc(issue.lede)}</h1>
    ${sections}
    <div style="border-top:1px solid rgba(0,222,246,.25);margin-top:34px;padding-top:18px;color:rgba(247,252,255,.6);font-size:13px;line-height:1.7">
      <p style="margin:0 0 8px">Assembled from the committed Signals snapshot and the Michigan data pack, with vintages as labeled.</p>
      <p style="margin:0 0 8px"><a href="{{WEB_URL}}" style="color:#00DEF6">Read this edition on the web</a> · <a href="{{PRIVACY_URL}}" style="color:#00DEF6">Privacy policy</a> · <a href="{{UNSUBSCRIBE_URL}}" style="color:#00DEF6">Unsubscribe in one click</a></p>
      <p style="margin:0">Axiovex Systems, LLC · ${esc(address)}</p>
    </div>
  </div>
</body></html>`;

  return { subject, html, text, footerAddress: address };
}

if (process.argv[1] && process.argv[1].endsWith('render.mjs')) {
  const date = process.argv[2];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
    console.error('usage: node scripts/newsletter/render.mjs <yyyy-mm-dd>');
    process.exit(1);
  }
  const issue = JSON.parse(readFileSync(path.join(ROOT, 'newsletter', 'issues', `${date}.json`), 'utf8'));
  const out = renderEmail(issue);
  const outPath = path.join(ROOT, 'newsletter', 'issues', `${date}.email.json`);
  writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log(`rendered ${outPath} (subject: ${out.subject})`);
}
