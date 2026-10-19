import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
export const output = process.env.OPS_OUTPUT || 'ops-output';
export function save(name, data) {
  mkdirSync(output, { recursive: true });
  writeFileSync(`${output}/${name}`, typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n');
}
export function summary(text) {
  save('report.md', text);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + '\n');
  console.log(text);
}
export async function request(url, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(45000) });
}
