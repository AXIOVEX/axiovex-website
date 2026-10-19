import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function localParts(now = new Date()) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(now).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
}
export function due(now = new Date()) {
  const p = localParts(now);
  const day = Number(p.day), hour = Number(p.hour), month = Number(p.month);
  const last = new Date(Date.UTC(Number(p.year), month, 0)).getUTCDate();
  const tasks = [];
  if (hour === 8 && p.minute === '39') tasks.push('daily');
  if (hour === 9 && p.minute === '39') {
    if (p.weekday === 'Mon') tasks.push('weekly', 'health');
    if (day === Math.min(30, last)) tasks.push('monthly');
    if (day === Math.min(29, last)) tasks.push('workforce');
    if (p.weekday === 'Tue') tasks.push('newsletter-draft');
  }
  if (hour === 10 && p.minute === '00' && p.weekday === 'Wed') tasks.push('newsletter-send');
  return tasks;
}
export function scheduledTime(cron, now = new Date()) {
  // GitHub can queue a run past its scheduled hour. Gate using the nominal
  // slot, not the eventual runner start minute, or jobs silently disappear.
  const match = /^(\d{1,2}) (\d{1,2}) \* \* (?:\*|3)$/.exec(cron || '');
  if (!match || +match[1] > 59 || +match[2] > 23) throw new Error('Unsupported operations schedule');
  const slot = new Date(now);
  slot.setUTCHours(+match[2], +match[1], 0, 0);
  if (slot > now) slot.setUTCDate(slot.getUTCDate() - 1);
  return slot;
}
export function shift(date, days) {
  return new Date(Date.parse(date + 'T12:00:00Z') + days * 86400000).toISOString().slice(0, 10);
}
// Resolve each local midnight independently: a reporting day can be 23/25 hours.
export function midnight(date) {
  let value = Date.parse(date + 'T00:00:00Z');
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit',
      minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value));
    const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
    const rendered = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    value += Date.parse(date + 'T00:00:00Z') - rendered;
  }
  return new Date(value).toISOString();
}
export function windows(cadence, now = new Date()) {
  const p = localParts(now), today = `${p.year}-${p.month}-${p.day}`;
  if (!['daily', 'weekly', 'monthly'].includes(cadence)) throw new Error('Invalid cadence');
  if (cadence === 'monthly') {
    const first = `${p.year}-${p.month}-01`;
    const end = new Date(first + 'T12:00:00Z');
    const start = new Date(end); start.setUTCMonth(start.getUTCMonth() - 1);
    const previous = new Date(start); previous.setUTCMonth(previous.getUTCMonth() - 1);
    return { start: start.toISOString().slice(0, 10), end: first, previous: previous.toISOString().slice(0, 10) };
  }
  const days = cadence === 'daily' ? 1 : 7;
  return { start: shift(today, -days), end: today, previous: shift(today, cadence === 'daily' ? -8 : -14) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const manual = process.env.REQUESTED_TASK;
  const tasks = manual ? [manual] : due(process.env.SCHEDULE_CRON ? scheduledTime(process.env.SCHEDULE_CRON) : new Date());
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `tasks=${JSON.stringify(tasks)}\nactive=${tasks.length > 0}\n`);
  console.log(JSON.stringify(tasks));
}
