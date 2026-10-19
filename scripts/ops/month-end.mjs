import { readFileSync, writeFileSync, mkdirSync, appendFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { localParts, shift, scheduledTime } from './calendar.mjs';
import { save, summary } from './io.mjs';
import { renderEmail } from '../newsletter/render.mjs';
export const policy = JSON.parse(readFileSync(new URL('../../data/publication-policy.json', import.meta.url), 'utf8'));
export function cycle(now = new Date()) {
  const p = localParts(now), day = +p.day;
  let release = new Date(Date.UTC(+p.year, +p.month - 1, 1));
  const lastDay = new Date(Date.UTC(+p.year, +p.month, 0)).getUTCDate();
  const releaseDay = Math.min(policy.releaseDay, lastDay);
  if (day < releaseDay) release.setUTCMonth(release.getUTCMonth() - 1);
  const releaseMonth = release.toISOString().slice(0, 7);
  const data = new Date(release); data.setUTCMonth(data.getUTCMonth() - 1);
  const dataMonth = data.toISOString().slice(0, 7);
  const active = dataMonth >= policy.firstDataMonth;
  return { active, releaseMonth, dataMonth, date: `${p.year}-${p.month}-${p.day}` };
}
export function publicationPlan(now = new Date(), cron = '') {
  const slot = cron.trim() ? scheduledTime(cron, now) : now;
  const plan = cycle(slot);
  return { ...plan, active: plan.active && (!cron.trim() || +localParts(slot).hour === policy.releaseHour) };
}
export function checkEconomicData(signals, geo, dataMonth) {
  const problems = [];
  for (const id of policy.requiredStateSeries) {
    const tile = signals.pulse?.tiles?.find(t => t.id === id);
    const latest = tile?.trend?.at(-1);
    if (!latest || latest.ym !== dataMonth || !Number.isFinite(latest.v)) problems.push(`${id}: ${dataMonth} state data not available as latest reading`);
  }
  const counties = geo.counties || [];
  if (geo.referenceMonth !== dataMonth) problems.push(`County LAUS: ${dataMonth} not published (snapshot ${geo.referenceMonth || 'missing'})`);
  if (counties.length !== policy.requiredCountyCount || new Set(counties.map(c => c.fips)).size !== policy.requiredCountyCount || counties.some(c => !Number.isFinite(c.rate))) {
    problems.push('County LAUS: 83 distinct numeric county readings required; missing data are not zero');
  }
  return problems;
}
function execute(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', timeout: 20 * 60000 });
  if (result.error || result.status !== 0) throw new Error(`${command} ${args[0]} failed`);
}
export function makeIssue(signals, geo, plan) {
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(plan.dataMonth + '-01T12:00:00Z'));
  const cutoff = shift(plan.date, -31);
  const context = ['fred', 'dol-claims', 'eia'].flatMap(id => {
    try {
      const pack = JSON.parse(readFileSync(`data/pack/${id}.json`, 'utf8'));
      const series = pack.series?.[0];
      const latest = series?.observations?.filter(o => Number.isFinite(o.value)).at(-1);
      return latest ? [{ text: `${pack.source}: ${series.label} — ${latest.value.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${series.unit || ''}, published reference period ${latest.period}. This source has its own release schedule; this is not relabeled as ${monthName} data.` }] : [];
    } catch { return []; }
  });
  const whatChanged = Object.values(signals.lanes || {}).map(lane => ({ lane: lane.title,
    items: (lane.items || []).filter(i => i.date >= cutoff && i.date <= plan.date).slice(0, 2).map(i => ({ title: i.title, source: i.source, date: i.date, url: i.link })) })).filter(g => g.items.length);
  return { date: plan.date, dataMonth: plan.dataMonth,
    lede: `${monthName} Michigan labor-market data are available. Here are Michigan's published numbers and the latest manufacturing and AI signals.`,
    whatChanged,
    pulse: signals.pulse.tiles.map(t => ({ label: t.label, display: t.display, delta: t.delta?.text || null,
      vintage: `${signals.pulse.referenceMonth} · as published` })), pulseSource: signals.pulse.source,
    insights: [{ text: `This edition includes ${monthName} readings in all four statewide series and all ${geo.counties.length} Michigan county unemployment readings. County unemployment is not seasonally adjusted; it should not be compared directly with the seasonally adjusted statewide rate. Changes alone do not establish their causes.` }, ...context],
    watchlist: [], footerAddress: policy.postalAddress };
}
async function main() {
  const mode = process.argv[2];
  const plan = cycle();
  if (mode === 'plan') {
    // Both UTC offsets are scheduled, but only 10:00 Eastern is eligible.
    const scheduled = publicationPlan(new Date(), process.env.SCHEDULE_CRON || '');
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `active=${scheduled.active}\ndataMonth=${scheduled.dataMonth}\n`);
    console.log(JSON.stringify(scheduled)); return;
  }
  if (!plan.active) throw new Error('Outside the month-end publication window');
  const signals = JSON.parse(readFileSync('data/signals.json', 'utf8'));
  const geo = JSON.parse(readFileSync('data/geo/laus-county.json', 'utf8'));
  const problems = checkEconomicData(signals, geo, plan.dataMonth);
  save('economic-inputs.json', { signals, geo, pack: Object.fromEntries(readdirSync('data/pack').filter(f => f.endsWith('.json')).map(f => [f, JSON.parse(readFileSync(`data/pack/${f}`, 'utf8'))])) });
  save('economic-release-gate.json', { ...plan, ready: !problems.length, problems, checkedAt: new Date().toISOString() });
  if (mode === 'check') {
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `ready=${!problems.length}\n`);
    summary(`# Month-end economic data gate\n\nData month: ${plan.dataMonth}.\n\n${problems.length ? problems.map(p => '- ' + p).join('\n') + '\n\nPublication held. No monthly report or newsletter released.' : 'Required state and county data verified. Publication may proceed.'}`);
    return;
  }
  if (problems.length) throw new Error('Economic data are not ready; publication refused');
  if (mode === 'publish') {
    const issue = makeIssue(signals, geo, plan);
    // Reuse the newest blog metadata without inventing an article or changing it.
    const posts = readdirSync('blog/posts').filter(f => f.endsWith('.md')).sort().reverse();
    if (posts[0]) {
      const source = readFileSync(`blog/posts/${posts[0]}`, 'utf8');
      const title = /^title:\s*(.+)$/m.exec(source)?.[1], slug = /^slug:\s*(.+)$/m.exec(source)?.[1], date = /^date:\s*(.+)$/m.exec(source)?.[1];
      if (title && slug && date) issue.article = { title, date, url: `https://axiovexsystems.com/blog/${slug}/` };
    }
    const email = renderEmail(issue);
    mkdirSync('newsletter/issues', { recursive: true });
    writeFileSync(`newsletter/issues/${plan.date}.json`, JSON.stringify(issue, null, 2) + '\n');
    writeFileSync(`newsletter/issues/${plan.date}.email.json`, JSON.stringify(email, null, 2) + '\n');
    save('issue.json', issue); save('newsletter.html', email.html); save('newsletter.txt', email.text);
    execute(process.execPath, ['scripts/build-site.mjs']);
    execute('git', ['config', 'user.name', 'github-actions[bot]']);
    execute('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
    execute('git', ['add', '-A']);
    execute('git', ['commit', '-m', `Publish ${plan.dataMonth} monthly newsletter (${policy.decisionId})`]);
    execute('git', ['pull', '--rebase', 'origin', 'main']);
    execute('git', ['push', 'origin', 'HEAD:main']);
    const url = `https://axiovexsystems.com/newsletter/${plan.date}/`;
    for (let attempt = 0; attempt < 24; attempt++) {
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
      if (response.status === 200 && (await response.text()).includes(issue.lede.replaceAll('&', '&amp;'))) { console.log('Published newsletter verified live.'); return; }
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    throw new Error('Newsletter deployment not verified; customer send refused');
  }
  if (mode === 'send') {
    const email = JSON.parse(readFileSync(`newsletter/issues/${plan.date}.email.json`, 'utf8'));
    const { createHash } = await import('node:crypto');
    const hash = createHash('sha256').update(JSON.stringify(email)).digest('hex');
    const preview = JSON.parse(readFileSync('ops-output/email-review/newsletter-receipt.json', 'utf8'));
    if (preview.httpStatus !== 202 || preview.sent !== 1 || preview.recipient !== 'tristen@axiovexsystems.com' || preview.date !== plan.date || preview.emailSHA256 !== hash) {
      throw new Error('Subscriber send refused: Tristen must receive the exact final edition first');
    }
    execute(process.execPath, ['scripts/newsletter/send.mjs', plan.date, '--base', 'https://axiovexsystems.com', '--approved-by', `${policy.authorization}; decision=${policy.decisionId}; dataMonth=${plan.dataMonth}; emailSHA256=${hash}`]);
    save('customer-send.json', { dataMonth: plan.dataMonth, date: plan.date, decisionId: policy.decisionId, sha256: hash, status: 'sender completed' }); return;
  }
  if (mode === 'preview') {
    execute(process.execPath, ['scripts/ops/preview-email.mjs', '--kind', 'newsletter', '--date', plan.date, '--send']); return;
  }
  throw new Error('Expected plan, check, publish, preview or send');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { summary(`# Month-end publication failed\n\n${error.message}`); process.exitCode = 1; });
