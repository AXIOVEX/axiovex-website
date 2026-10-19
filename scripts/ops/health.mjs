import { request, save, summary } from './io.mjs';
import { pathToFileURL } from 'node:url';
export const BASE = 'https://axiovexsystems.com';
export function inspect(html, url) {
  const checks = {
    title: /<title>[^<]+<\/title>/i.test(html),
    description: /<meta\b(?=[^>]*name=["']description["'])(?=[^>]*content=["'][^"']+)[^>]*>/i.test(html),
    canonical: /<link\b(?=[^>]*rel=["']canonical["'])(?=[^>]*href=["']https:\/\/axiovexsystems\.com\/)/i.test(html),
    h1: (html.match(/<h1\b/gi) || []).length === 1,
    structuredData: /application\/ld\+json/i.test(html),
    // Specs 023/024 intentionally keep the research hub unlisted/noindex.
    indexingPolicy: /<meta\b[^>]*content=["'][^"']*noindex/i.test(html) === (new URL(url).pathname === '/research/'),
  };
  return { url, checks };
}
const paths = ['/', '/signals/', '/documents/', '/blog/', '/newsletter/', '/research/', '/contact/'];
async function main() {
const results = [];
for (const path of [...paths, '/robots.txt', '/sitemap.xml', '/llms.txt']) {
  try {
    const response = await request(BASE + path);
    const body = await response.text();
    const entry = paths.includes(path) ? inspect(body, BASE + path) : { url: BASE + path, checks: {} };
    entry.status = response.status;
    entry.checks.http = response.status === 200;
    entry.checks.edgeIndexable = !/noindex/i.test(response.headers.get('x-robots-tag') || '');
    if (path === '/robots.txt') entry.checks.productionCrawl = !/Disallow:\s*\/\s*(?:\r?\n|$)/i.test(body);
    if (path === '/sitemap.xml') entry.checks.sitemap = body.includes('<urlset') && body.includes(BASE);
    if (path === '/sitemap.xml' || path === '/llms.txt') entry.checks.researchUnlisted = !body.includes(BASE + '/research/');
    if (path === '/llms.txt') entry.checks.content = body.includes('Axiovex');
    save(`probe-${results.length}.json`, { ...entry, headers: Object.fromEntries(response.headers), body });
    results.push(entry);
  } catch (error) { results.push({ url: BASE + path, error: error.message, checks: { reachable: false } }); }
}
save('health.json', { checkedAt: new Date().toISOString(), results });
const failed = results.flatMap(r => Object.entries(r.checks).filter(([, ok]) => !ok).map(([name]) => `${r.url}: ${name}${r.error ? ' — ' + r.error : ''}`));
summary(`# Website technical health\n\n${results.length} live URLs checked; ${failed.length} failed checks.\n\n${failed.length ? failed.map(f => '- ' + f).join('\n') : 'All implemented technical checks passed.'}\n\nThese are local HTTP, metadata, crawler and structured-data presence checks. They are not official AEO or Seobility scores. External baselines remain AEO 100/100 and Seobility 90; fresh external readings and score history require the Muse runbook/access export. No content was edited.\n`);
if (failed.length) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { summary(`# Health check failed\n\n${error.message}\n`); process.exitCode = 1; });
}
