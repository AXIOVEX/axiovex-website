import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
export const transientSource = s => s.status === 'failed' && /HTTP 50[0-4]|aborted|timeout|ECONNRESET|fetch failed/i.test(s.reason || '');
export function mergeAttempts(first, retry) {
  const replacements = new Map((retry?.sources || []).map(s => [s.id, s]));
  return { checkedAt: new Date().toISOString(), sources: first.sources.map(s => replacements.get(s.id) || s), attempts: [first, ...(retry ? [retry] : [])] };
}
export const completeRefresh = status => status.sources.length > 0 && status.sources.every(s => s.status === 'success');
function main() {
  mkdirSync('ops-output', { recursive: true });
  const initialPath = 'ops-output/economic-initial-refresh.json';
  const retryPath = 'ops-output/economic-retry-refresh.json';
  const out = process.env.PACK_STATUS_FILE || 'ops-output/economic-refresh.json';
  const source = process.env.SOURCE_ID || 'all';
  const run = (file, sources) => spawnSync(process.execPath, ['scripts/fetch-pack.mjs', ...(sources === 'all' ? [] : ['--only', sources])], { stdio: 'inherit', timeout: 10 * 60000, env: { ...process.env, PACK_STATUS_FILE: file } });
  run(initialPath, source);
  if (!existsSync(initialPath)) throw new Error('Collector did not produce source status');
  const initial = JSON.parse(readFileSync(initialPath, 'utf8'));
  const retryIds = initial.sources.filter(transientSource).map(s => s.id);
  let retry = null;
  if (retryIds.length) {
    console.log(`One bounded retry for transient provider errors: ${retryIds.join(', ')}`);
    run(retryPath, retryIds.join(','));
    if (existsSync(retryPath)) retry = JSON.parse(readFileSync(retryPath, 'utf8'));
  }
  const final = mergeAttempts(initial, retry);
  writeFileSync(out, JSON.stringify(final, null, 2) + '\n');
  if (!completeRefresh(final)) {
    for (const s of final.sources.filter(s => s.status !== 'success')) console.error(`::error::Economic source ${s.id}: ${s.status}; retained data keeps its original vintage`);
    process.exitCode = 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
