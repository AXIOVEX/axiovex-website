import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { economicContext } from './economic-context.mjs';
import { output, save, summary } from './io.mjs';
const cadence = process.argv[2];
const analytics = spawnSync(process.execPath, ['scripts/ops/analytics.mjs', cadence], { stdio: 'inherit', timeout: 15 * 60000 });
let text = existsSync(`${output}/report.md`) ? readFileSync(`${output}/report.md`, 'utf8') : '# Analytics failed\n\nRunner produced no report.';
let failed = ![0, 2].includes(analytics.status);
let partial = analytics.status === 2;
const subscribers = spawnSync(process.execPath, ['scripts/ops/subscribers.mjs', cadence], { stdio: 'inherit', timeout: 60000, env: { ...process.env, OPS_OUTPUT: `${output}/subscribers` } });
partial ||= subscribers.status !== 0;
const subscriptions = existsSync(`${output}/subscribers/report.md`) ? readFileSync(`${output}/subscribers/report.md`, 'utf8') : '## Newsletter subscriptions\n\nUnavailable: no subscriber report produced.';
text = text.includes('## Insights') ? text.replace('## Insights', subscriptions + '\n\n## Insights') : text + '\n\n' + subscriptions;
{
  const health = spawnSync(process.execPath, ['scripts/ops/health.mjs'], { stdio: 'inherit', timeout: 10 * 60000,
    env: { ...process.env, OPS_OUTPUT: `${output}/health` } });
  failed ||= health.status !== 0;
  if (existsSync(`${output}/health/health.json`)) partial ||= JSON.parse(readFileSync(`${output}/health/health.json`, 'utf8')).partial === true;
  text += '\n\n' + (existsSync(`${output}/health/report.md`) ? readFileSync(`${output}/health/report.md`, 'utf8') : 'Technical health runner produced no report.');
}
if (cadence === 'monthly') {
  text += '\n\n' + economicContext();
  if (process.env.PACK_STATUS_FILE && existsSync(process.env.PACK_STATUS_FILE)) partial ||= JSON.parse(readFileSync(process.env.PACK_STATUS_FILE, 'utf8')).sources.some(s => s.status !== 'success');
}
save('report-status.json', { cadence, status: failed ? 'failed' : partial ? 'partial' : 'complete', checkedAt: new Date().toISOString() });
summary(`Report status: **${failed ? 'FAILED' : partial ? 'PARTIAL — source limitations disclosed below' : 'COMPLETE'}**\n\n` + text);
if (partial && !failed) console.log('::warning::Report generated with disclosed source limitations. Email delivery is checked separately.');
process.exitCode = failed ? 1 : 0;
