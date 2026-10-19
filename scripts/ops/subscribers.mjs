import { request, save, summary } from './io.mjs';
const days = ({ daily: 1, weekly: 7, monthly: 30 })[process.argv[2]];
try {
  if (!days || !process.env.NEWSLETTER_SEND_SECRET) throw new Error('Subscriber metrics are not configured');
  const response = await request(`https://axiovexsystems.com/api/ops/subscribers?days=${days}`, { headers: { 'x-website-ops-secret': process.env.NEWSLETTER_SEND_SECRET } });
  const data = await response.json();
  save('subscribers.json', data);
  if (!response.ok || !data.ok) throw new Error('Production subscriber measurement unavailable');
  const { counts: c, baseline: b } = data;
  summary(`## Newsletter subscriptions\n\nProduction snapshot: ${data.measuredAt}.\n\n| Status | Subscribers now | Change since baseline |\n|---|---:|---:|\n${Object.entries(c).map(([k, v]) => `| ${{ active: 'Active', pending: 'Pending confirmation', unsubscribed: 'Unsubscribed', suppressed: 'Suppressed' }[k]} | ${v} | ${data.changesByStatus ? (data.changesByStatus[k] >= 0 ? '+' : '') + data.changesByStatus[k] : 'Unavailable'} |`).join('\n')}\n\nNet active change: ${b ? `${data.activeChange >= 0 ? '+' : ''}${data.activeChange} since ${b.captured_at} (${b.active} → ${c.active}).` : 'unavailable — first aggregate baseline established; no historical zero assumed.'}\n\n| Trailing window | New signup rows | Latest confirmations | Latest unsubscribes |\n|---|---:|---:|---:|\n${Object.entries(data.flows).map(([d, f]) => `| ${d === '1' ? '24 hours' : d + ' days'} | ${f.signups} | ${f.confirmations} | ${f.unsubscribes} |`).join('\n')}\n\nActive by signup source: ${data.activeBySource.map(s => `${s.source}: ${s.n}`).join('; ') || 'none'}.\n\nSender gauge: ${data.gauge.line}.\n\n${data.method}\n`);
} catch (error) {
  summary(`## Newsletter subscriptions\n\nUnavailable: ${error.message}. Subscriber change is unknown, never zero.\n`);
  process.exitCode = 2;
}
