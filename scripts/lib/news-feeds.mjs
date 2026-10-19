export function decode(s) {
  return String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'").replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, ' ').trim();
}
export function tagValue(block, names) {
  for (const n of names) {
    const m = new RegExp('<' + n + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + n + '>', 'i').exec(block);
    if (m) return decode(m[1]);
  }
  return '';
}
export function preciseTime(s) {
  // A calendar date alone must never masquerade as a publication time.
  if (!s || !/(?:\d{1,2}:\d{2})/.test(s) || !/(?:Z|[+-]\d{2}:?\d{2}|GMT|UTC)\s*$/i.test(s)) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}
export function parseFeed(xml) {
  return (xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || []).map(b => {
    const title = tagValue(b, ['title']);
    const link = tagValue(b, ['link']) || decode(/<link[^>]+href="([^"]+)"/i.exec(b)?.[1]);
    const raw = tagValue(b, ['pubDate', 'dc:date', 'published', 'updated']);
    const date = Number.isFinite(Date.parse(raw)) ? new Date(raw).toISOString().slice(0, 10) : null;
    return { title, link, date, publishedUtc: preciseTime(raw), _text: (title + ' ' + tagValue(b, ['description', 'summary'])).toLowerCase() };
  }).filter(i => i.title && i.link);
}
