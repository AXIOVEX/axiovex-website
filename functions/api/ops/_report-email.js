import { esc, href, emailLayout, sectionHeading } from './_email-layout.js';
export function count(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: Number.isInteger(Number(value)) ? 0 : 1 }).format(Number(value));
}
export function bytes(value) {
  const n = Number(value);
  for (const [unit, scale] of [['GB', 1e9], ['MB', 1e6], ['KB', 1e3]]) {
    if (Math.abs(n) >= scale) return `${(n / scale).toFixed(1)} ${unit}`;
  }
  return `${count(n)} B`;
}
function inline(text) {
  text = text.replace(/\b(\d{4,}(?:\.\d+)?) (?=(?:sampled )?requests\b)/g, (_, n) => count(n) + ' ')
    .replace(/^(\d{4}-\d{2}-\d{2}: )(\d+)$/, (_, prefix, n) => prefix + count(n));
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  let html = '', cursor = 0;
  for (const match of text.matchAll(pattern)) {
    html += esc(text.slice(cursor, match.index));
    html += match[1] ? `<a href="${href(match[2])}" style="color:#07647c;text-decoration:underline;">${esc(match[1])}</a>`
      : match[3] ? `<strong>${esc(match[3])}</strong>` : `<code style="font-family:Consolas,monospace;font-size:13px;background-color:#f1f5f7;">${esc(match[4])}</code>`;
    cursor = match.index + match[0].length;
  }
  return html + esc(text.slice(cursor));
}
const names = { requests: 'Requests', bytes: 'Data transferred', cachedBytes: 'Served from cache' };
function tableCell(value, rowLabel, column) {
  if (column === 0) return names[value] || value;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return /bytes/i.test(rowLabel) ? bytes(value) : count(value);
  return value;
}
function table(lines, kind) {
  const rows = lines.map(line => line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())).filter(row => !row.every(c => /^:?-+:?$/.test(c)));
  const headers = rows.shift() || [];
  const header = headers.map((cell, i) => `<th scope="col" align="${i ? 'right' : 'left'}" style="padding:11px 7px;background-color:#eaf2f6;border-bottom:1px solid #cbdce5;color:#294454;font-size:12px;line-height:1.35;">${esc(cell === 'Comparison' && kind === 'daily' ? '7-day avg.' : cell === 'Computed change' ? 'Change' : cell)}</th>`).join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;border-collapse:collapse;margin:14px 0 18px;"><thead><tr>${header}</tr></thead><tbody>${rows.map((row, r) => `<tr>${row.map((cell, i) => `<td align="${i ? 'right' : 'left'}" style="padding:12px 7px;border-bottom:1px solid #e2e9ee;vertical-align:top;background-color:${r % 2 ? '#f6f9fb' : '#ffffff'};font-size:13px;line-height:1.4;${i ? 'font-variant-numeric:tabular-nums;' : 'font-weight:bold;color:#294454;'}">${inline(tableCell(cell, row[0], i))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
const sections = { 'Measured facts': 'Traffic overview', 'Adaptive detail': 'Sampled traffic detail', 'Insights': 'What changed', 'Suggestions': 'Recommended actions', 'Unavailable / migration gaps': 'Coverage and method', 'Daily request trend': 'Daily traffic', 'Path movers': 'Content movement' };
const subheads = { paths: 'Top pages', countries: 'Top countries', contact: 'Contact form', 'server-errors': 'Server errors', 'previous-paths': 'Prior-period top pages' };
export function markdownEmail(markdown, kind) {
  const lines = markdown.replace(/\r/g, '').split('\n');
  let html = '', paragraph = [], firstHeading = true;
  const flush = () => { if (paragraph.length) html += `<p style="margin:0 0 15px;">${inline(paragraph.join(' '))}</p>`; paragraph = []; };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || /^---+$/.test(line)) { flush(); continue; }
    if (/^Report status:/.test(line)) { flush(); continue; }
    if (/^# /.test(line)) { flush(); if (!firstHeading) html += sectionHeading(line.slice(2)); firstHeading = false; continue; }
    if (/^\|/.test(line)) {
      flush(); const group = [line];
      while (i + 1 < lines.length && /^\s*\|/.test(lines[i + 1])) group.push(lines[++i]);
      html += table(group, kind); continue;
    }
    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) { flush(); html += heading[1].length === 2 ? sectionHeading(sections[heading[2]] || heading[2]) : `<h3 style="margin:20px 0 8px;font-size:15px;color:#294454;">${inline(subheads[heading[2]] || heading[2])}</h3>`; continue; }
    if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
      flush(); const list = [];
      do {
        const item = lines[i].trim().replace(/^(?:[-*]|\d+\.)\s+/, '').replace(/(\d{3} \([^)]*\): )(\d+)$/, (_, prefix, n) => prefix + count(n));
        list.push(`<li style="margin:0 0 9px;padding-left:2px;">${inline(item)}</li>`);
        if (i + 1 >= lines.length || !/^(?:[-*] |\d+\. )/.test(lines[i + 1].trim())) break;
        i++;
      } while (true);
      html += `<ul style="padding-left:21px;margin:8px 0 18px;">${list.join('')}</ul>`; continue;
    }
    paragraph.push(line);
  }
  flush(); return html;
}
export function renderReportEmail({ report, kind = 'daily', runUrl }) {
  const status = /Report status:\s*\*\*(FAILED|PARTIAL|COMPLETE)/.exec(report)?.[1] || (/^# .*(?:failed|blocked)/im.test(report) ? 'FAILED' : 'COMPLETE');
  const label = status === 'PARTIAL' ? 'Partial data coverage' : status === 'FAILED' ? 'Action required' : 'Report complete';
  const title = `${kind === 'newsletter-draft' ? 'Newsletter preparation' : kind.charAt(0).toUpperCase() + kind.slice(1)} ${kind === 'newsletter-draft' ? '' : 'report'}`.trim();
  const period = /(\d{4}-\d{2}-\d{2}) through (\d{4}-\d{2}-\d{2})/.exec(report);
  const longDate = date => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
  const end = period ? new Date(Date.parse(period[2] + 'T12:00:00Z') - 86400000).toISOString().slice(0, 10) : null;
  const eyebrow = period ? `${longDate(period[1])}${end === period[1] ? '' : ' – ' + longDate(end)} · Eastern Time` : 'Website operations · Founder briefing';
  let cleaned = report.replace(/^\d{4}-\d{2}-\d{2} through .*?\n/m, '');
  const intro = status === 'PARTIAL' ? 'Available measurements are shown below. Source gaps and comparison limitations are listed under Coverage and method.' : status === 'FAILED' ? 'This run could not complete. The report below records what failed and any evidence that was retained.' : 'The latest website measurements and operational findings.';
  const content = `<p style="margin:0 0 14px;"><span style="background-color:${status === 'COMPLETE' ? '#e5f4ed' : '#fff1d8'};color:${status === 'COMPLETE' ? '#22543d' : '#805514'};padding:6px 9px;font-size:12px;font-weight:bold;">${esc(label)}</span></p><p style="margin:0 0 20px;color:#536979;font-size:14px;">${esc(intro)}</p>` + markdownEmail(cleaned, kind);
  const footer = `<strong>Axiovex Systems · Website operations</strong><br>Measurements and interpretations are distinguished in this report.${runUrl ? `<br><a href="${href(runUrl)}" style="color:#07647c;">Open CI evidence and source snapshots</a>` : ''}`;
  const html = emailLayout({ title, eyebrow, preheader: `${title}: ${label.toLowerCase()}. ${eyebrow}`, content, footer });
  const text = report.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/^#{1,3}\s+/gm, '');
  return { html, text, title };
}
