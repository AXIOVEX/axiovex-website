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
import { esc, href, emailLayout, sectionHeading } from '../../functions/api/ops/_email-layout.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const POSTAL_PLACEHOLDER = '[Postal address pending — owner decision, spec 020 FR-018]';

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
  t.push('THE AXIOVEX SIGNAL — MONTHLY');
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

  // Inline styles and presentation tables survive classic Outlook's Word renderer.
  const section = (title, inner) => sectionHeading(title) + inner;
  let sections = '';
  if (issue.whatChanged?.length) {
    sections += section('WHAT CHANGED', issue.whatChanged.map((group) =>
      `<h3 style="color:#536979;font-size:12px;font-weight:bold;letter-spacing:1px;margin:22px 0 8px;">${esc(group.lane.toUpperCase())}</h3>` +
      group.items.map((i) =>
        `<p style="margin:0 0 16px;padding-bottom:14px;border-bottom:1px solid #e2e9ee;line-height:1.5;"><a href="${href(i.url)}" style="color:#0b536c;font-size:16px;font-weight:bold;text-decoration:underline;">${esc(i.title)}</a><br><span style="color:#607484;font-size:12px;">${esc(i.source)} · ${esc(fmtDate(i.date))}</span></p>`).join('')
    ).join(''));
  }
  if (issue.pulse?.length) {
    sections += section('MICHIGAN PULSE',
      `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">${issue.pulse.map((f) =>
        `<tr><td style="padding:13px 8px;border-bottom:1px solid #dce5eb;background-color:#f2f7f9;vertical-align:top;font-size:14px;line-height:1.5;"><strong>${esc(f.label)}</strong><br><span style="font-size:12px;color:#536979;">${esc(f.vintage)}</span>${f.delta ? `<br><span style="color:#35566b;font-size:12px;">${esc(f.delta)}</span>` : ''}</td><td align="right" style="padding:13px 8px;border-bottom:1px solid #dce5eb;background-color:#f2f7f9;vertical-align:top;color:#081F32;font-size:21px;font-weight:bold;white-space:nowrap;">${esc(f.display)}</td></tr>`).join('')}</table>` +
      (issue.pulseSource ? `<p style="color:#607484;font-size:12px;margin:9px 0 0;">Source: ${esc(issue.pulseSource)}.</p>` : ''));
  }
  if (issue.insights?.length) {
    sections += section('WHY IT MATTERS', issue.insights.map((line) =>
      `<p style="margin:0 0 16px;line-height:1.65;color:#294454;">${esc(line.text)}</p>`).join(''));
  }
  if (issue.article) {
    sections += section('FROM THE BLOG',
      `<p style="margin:0 0 5px;line-height:1.5;"><a href="${href(issue.article.url)}" style="color:#0b536c;font-size:18px;font-weight:bold;text-decoration:underline;">${esc(issue.article.title)}</a></p><p style="margin:0;color:#607484;font-size:12px;">${esc(fmtDate(issue.article.date))}</p>`);
  }
  if (issue.watchlist?.length) {
    sections += section('WATCHLIST', issue.watchlist.map((w) =>
      `<p style="margin:0 0 13px;line-height:1.5;"><strong style="color:#0b536c;font-size:13px;">${esc(fmtDate(w.date))}</strong><br>${esc(w.label)}</p>`).join(''));
  }
  const html = emailLayout({ title: 'The Axiovex Signal', eyebrow: `${dateLong} · Michigan, manufacturing and AI`, preheader: issue.lede,
    content: `<p style="margin:0 0 22px;color:#081F32;font-size:21px;line-height:1.45;font-weight:bold;">${esc(issue.lede)}</p>` + sections,
    footer: `<p style="margin:0 0 10px;">From published Signals and Michigan data sources, with vintages labeled above.</p><p style="margin:0 0 10px;"><a href="{{WEB_URL}}" style="color:#07647c;">Read this edition on the web</a><br><a href="{{PRIVACY_URL}}" style="color:#07647c;">Privacy policy</a> · <a href="{{UNSUBSCRIBE_URL}}" style="color:#07647c;">Unsubscribe in one click</a></p><p style="margin:0;">Axiovex Systems, LLC<br>${esc(address)}</p>` });

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
