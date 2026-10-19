import { readFileSync, existsSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const duties = JSON.parse(readFileSync('data/operations-duties.json', 'utf8'));
const limits = { 'operations.yml': 48, 'signals-sync.yml': 2, 'data-pack-sync.yml': 36, 'site-sync.yml': 6, 'monthly-publication.yml': 36, 'annual-refresh.yml': 192, 'linkedin-publish.yml': 3, 'newsletter-browser.yml': 192 };
const repo = process.env.GITHUB_REPOSITORY || 'AXIOVEX/axiovex-website';
const api = route => JSON.parse(execFileSync('gh', ['api', `repos/${repo}/${route}`], { encoding: 'utf8' }));
const failures = [];
for (const d of duties) {
  if (!existsSync(`.github/workflows/${d.workflow}`)) failures.push(`${d.id}: missing workflow`);
  if (!existsSync(d.source)) failures.push(`${d.id}: missing source inventory reference ${d.source}`);
}
const workflows = [];
for (const [name, hours] of Object.entries(limits)) {
  try {
    const workflow = api(`actions/workflows/${name}`);
    const runs = api(`actions/workflows/${name}/runs?branch=main&per_page=30`).workflow_runs.filter(r => r.event !== 'pull_request');
    const success = runs.find(r => r.conclusion === 'success');
    const stale = !success || Date.now() - Date.parse(success.updated_at) > hours * 3600000;
    const broken = runs.find(r => r.status === 'completed')?.conclusion !== 'success';
    workflows.push({ name, state: workflow.state, latestRun: runs[0]?.html_url, lastSuccess: success?.updated_at, stale, broken });
    if (workflow.state !== 'active' || stale || broken) failures.push(`${name}: ${workflow.state}; stale=${stale}; last completed run failed=${broken}`);
  } catch (e) { failures.push(`${name}: workflow history unavailable`); workflows.push({ name, error: 'Workflow history unavailable' }); }
}
mkdirSync('ops-output/migration-audit', { recursive: true });
writeFileSync('ops-output/migration-audit/audit.json', JSON.stringify({ checkedUtc: new Date().toISOString(), duties, workflows, failures }, null, 2) + '\n');
const lines = ['# Meta Muse migration audit', '', 'Workflow success confirms execution, not full source coverage or completed editorial approval. Source failures are separately retained by each collector.', '', '| Duty | Handling | GitHub workflow |', '|---|---|---|', ...duties.map(d => `| ${d.id} | ${d.mode}: ${d.description} | ${d.workflow} |`), '', '## Execution checks', '', ...workflows.map(w => `- ${w.name}: ${w.state || 'unavailable'}, last success ${w.lastSuccess || 'unavailable'}, stale ${w.stale ?? 'unknown'}, latest completed failure ${w.broken ?? 'unknown'}`), '', '## Failures', '', ...(failures.length ? failures.map(f => '- ' + f) : ['No missing, disabled, overdue or failed workflows detected.']), '', 'Review/interactive rows are explicit remaining human duties, not completed automatic replacements. Historic Muse scores/state not exported cannot be reconstructed.'];
const text = lines.join('\n') + '\n';
writeFileSync('ops-output/migration-audit/report.md', text);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
console.log(text);
if (failures.length) process.exitCode = 1;
