import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { output, save, summary } from './io.mjs';
const cadence = process.argv[2];
const analytics = spawnSync(process.execPath, ['scripts/ops/analytics.mjs', cadence], { stdio: 'inherit', timeout: 15 * 60000 });
let text = existsSync(`${output}/report.md`) ? readFileSync(`${output}/report.md`, 'utf8') : '# Analytics failed\n\nRunner produced no report.';
let failed = ![0, 2].includes(analytics.status);
const partial = analytics.status === 2;
if (cadence === 'weekly' || cadence === 'monthly') {
  const health = spawnSync(process.execPath, ['scripts/ops/health.mjs'], { stdio: 'inherit', timeout: 10 * 60000,
    env: { ...process.env, OPS_OUTPUT: `${output}/health` } });
  failed ||= health.status !== 0;
  text += '\n\n---\n\n' + (existsSync(`${output}/health/report.md`) ? readFileSync(`${output}/health/report.md`, 'utf8') : 'Technical health runner produced no report.');
}
save('report-status.json', { cadence, status: failed ? 'failed' : partial ? 'partial' : 'complete', checkedAt: new Date().toISOString() });
summary(`Report status: **${failed ? 'FAILED' : partial ? 'PARTIAL — source limitations disclosed below' : 'COMPLETE'}**\n\n` + text);
if (partial && !failed) console.log('::warning::Report generated with disclosed source limitations. Email delivery is checked separately.');
process.exitCode = failed ? 1 : 0;
