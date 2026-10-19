export function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
export function href(value) {
  if (['{{WEB_URL}}', '{{PRIVACY_URL}}', '{{UNSUBSCRIBE_URL}}'].includes(value)) return value;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? esc(url.href) : '#'; }
  catch { return '#'; }
}
export function emailLayout({ title, eyebrow, preheader = '', content, footer = '' }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background-color:#edf2f5;color:#162c3c;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;color:#edf2f5;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#edf2f5"><tr><td align="center" style="padding:24px 10px;">
<!--[if mso]><table role="presentation" width="680" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:680px;border:1px solid #dce5eb;border-collapse:separate;">
<tr><td bgcolor="#081F32" style="padding:24px 24px 22px;border-top:5px solid #00DEF6;">
<p style="margin:0 0 12px;color:#00DEF6;font-size:12px;font-weight:bold;letter-spacing:2px;">AXIOVEX SYSTEMS</p>
<h1 style="margin:0;color:#F7FCFF;font-size:27px;line-height:1.25;font-weight:700;">${esc(title)}</h1>
<p style="margin:10px 0 0;color:#c1d5e2;font-size:14px;line-height:1.5;">${esc(eyebrow)}</p></td></tr>
<tr><td style="padding:24px;color:#162c3c;font-size:16px;line-height:1.6;word-wrap:break-word;overflow-wrap:anywhere;">${content}</td></tr>
<tr><td bgcolor="#f4f7f9" style="padding:20px 24px;border-top:1px solid #dce5eb;color:#536979;font-size:12px;line-height:1.7;">${footer || 'Axiovex Systems · Website operations'}</td></tr>
</table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`;
}
export function sectionHeading(title) {
  return `<h2 style="margin:28px 0 12px;padding:0 0 9px;border-bottom:2px solid #dcebf0;color:#081F32;font-size:19px;line-height:1.35;">${esc(title)}</h2>`;
}
