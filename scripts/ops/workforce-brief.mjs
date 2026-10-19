import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { signalsContext } from '../lib/signals-context.mjs';
export function buildBrief(signals, geo, plan, fred) {
  if (!/^\d{4}-\d{2}$/.test(plan.dataMonth) || !/^\d{4}-\d{2}-\d{2}$/.test(plan.date)) throw new Error('Invalid brief date');
  const tiles = signals.pulse?.tiles || [];
  const ids = ['SMU26000003000000001', 'LASST260000000000003', 'LASST260000000000006', 'SMU26000000000000001'];
  if (ids.some(id => !tiles.find(t => t.id === id && t.trend?.at(-1)?.ym === plan.dataMonth && Number.isFinite(t.trend.at(-1).v))) || geo.referenceMonth !== plan.dataMonth || geo.counties?.length !== 83 || new Set(geo.counties.map(c => c.fips)).size !== 83 || geo.counties.some(c => !Number.isFinite(c.rate))) throw new Error('Brief requires complete target-month state and county data');
  const month = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(plan.dataMonth + '-01T12:00:00Z'));
  const title = `Michigan workforce: ${month} data brief`;
  const slug = `michigan-workforce-${plan.dataMonth}-data`;
  const rows = tiles.map(t => `| ${t.label} | ${t.display} | ${t.delta?.text || 'No month-over-month change supplied'} |`);
  const regional = geo.counties.filter(c => ['26099', '26125', '26163'].includes(c.fips));
  const context = signalsContext(fred, geo).map(i => `${i.text} [Source](${i.url})`);
  const text = `---\ntitle: ${title}\ndate: ${plan.date}\ndescription: Published Michigan workforce readings for ${month}, county unemployment comparisons and dated national context.\ntags: workforce, michigan, data\nslug: ${slug}\n---\nThis data brief uses the published ${month} readings in all four Michigan statewide series and all 83 county unemployment series. Figures retain their source units and adjustment basis.\n\n*Assembled ${plan.date} from published source snapshots. This is an automated data brief; it does not represent a new reviewed research edition.*\n\n## Michigan's published readings\n\n| Measure | Published reading | Published change |\n|---|---:|---|\n${rows.join('\n')}\n\n${tiles.map(t => `[${t.label}: BLS series ${t.id}](https://data.bls.gov/timeseries/${t.id})`).join(' · ')}\n\n## County differences and national context\n\n${context.join('\n\n')}\n\n| County | Unemployment rate | Reference month |\n|---|---:|---|\n${regional.map(c => `| ${c.name} | ${c.rate.toFixed(1)}% | ${geo.referenceMonth} |`).join('\n')}\n\nCounty readings are not seasonally adjusted${geo.preliminary ? ' and are preliminary' : ''}. They should not be compared directly with a seasonally adjusted statewide rate. The county spread describes differences in reported rates; it does not establish why they differ. [BLS LAUS methodology](https://www.bls.gov/lau/).\n\n## How to use this brief\n\nUse payrolls, unemployment and labor-force readings together when assessing the labor market. A change in an unemployment rate alone does not establish a change in hiring demand or its cause. County rates describe geographic conditions; they do not establish that any employer has vacancies or that training seats are available.\n\nPublished national context has its own release date and geography. Long-term occupational projections are modeled outlooks, not forecasts of next month's Michigan employment. Review actual employer requirements and current program availability before making a staffing or training decision.\n\n## Evidence and limits\n\nThe release checks target-month availability in each state series and 83 distinct numeric county readings. API failures retain last-good snapshots and remain visible in CI. Missing values are never converted to zero.\n\n[Explore the current Signals data](/signals/) or [read the workforce research repository](https://github.com/AXIOVEX/michigan-workforce-intelligence). The research repository's dated reviewed editions are distinct from this automated brief.\n`;
  const commentary = `${month} Michigan workforce data are available. Our data brief brings together statewide readings, all 83 county unemployment rates and separately dated national context. Source periods and measurement limits are included.\n\nhttps://axiovexsystems.com/blog/${slug}/`;
  return { title, slug, text, commentary, url: `https://axiovexsystems.com/blog/${slug}/` };
}
export function prepareBrief(signals, geo, plan) {
  const recordPath = `data/publications/${plan.dataMonth}.json`;
  if (existsSync(recordPath)) return JSON.parse(readFileSync(recordPath, 'utf8'));
  const fred = existsSync('data/pack/fred.json') ? JSON.parse(readFileSync('data/pack/fred.json', 'utf8')) : null;
  const brief = buildBrief(signals, geo, plan, fred);
  const file = `blog/posts/${plan.date}-${brief.slug}.md`;
  writeFileSync(file, brief.text);
  const record = { dataMonth: plan.dataMonth, date: plan.date, title: brief.title, articleUrl: brief.url, articleFile: file, sourceSHA256: createHash('sha256').update(JSON.stringify({ signals, geo, fred })).digest('hex'), personal: { commentary: brief.commentary, status: 'queued' }, company: { commentary: `Our ${plan.dataMonth} Michigan workforce data brief: published figures, source dates and measurement limits.`, status: 'queued' }, authorization: 'Owner direction 2026-10-19; deterministic source facts and checked arithmetic' };
  mkdirSync('data/publications', { recursive: true });
  writeFileSync(recordPath, JSON.stringify(record, null, 2) + '\n');
  return record;
}
