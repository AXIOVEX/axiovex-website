import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { output, request, save, summary } from './io.mjs';
export function lighthouseFindings(lhr) {
  if (lhr.runtimeError || !Number.isFinite(lhr.categories?.seo?.score)) throw new Error('Lighthouse did not produce a valid SEO audit');
  return lhr.categories.seo.auditRefs.flatMap(({ id }) => {
    const audit = lhr.audits[id];
    return audit && (audit.scoreDisplayMode === 'error' || (audit.score !== null && audit.score < 1))
      ? [{ id, title: audit.title, explanation: audit.explanation || audit.displayValue || '', details: audit.details || null }] : [];
  });
}
async function main() {
  mkdirSync(output, { recursive: true });
  const root = process.env.OPS_SEO_MODULE_ROOT;
  if (!root) throw new Error('Pinned SEO audit tools are not configured');
  const { HtmlValidate } = await import(pathToFileURL(resolve(root, 'html-validate/dist/esm/index.js')).href);
  const validator = new HtmlValidate({ extends: ['html-validate:standard'] });
  const base = process.env.SEO_BASE || 'https://axiovexsystems.com';
  if (base !== 'https://axiovexsystems.com' && !/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) throw new Error('Unsupported audit origin');
  const response = await request(base + '/sitemap.xml');
  if (!response.ok) throw new Error('Cannot discover SEO audit pages');
  const sitemap = await response.text();
  const paths = [...new Set([...sitemap.matchAll(/<loc>https:\/\/axiovexsystems\.com([^<]+)<\/loc>/g)].map(m => m[1]))];
  if (!paths.length || paths.length > 100) throw new Error('Empty or oversized sitemap');
  const results = [];
  for (const [index, path] of [...paths, '/research/'].entries()) {
    const url = base + path;
    const entry = { url, html: { available: false }, lighthouse: { available: false } };
    try {
      const r = await request(url), html = await r.text();
      if (r.status !== 200) throw new Error(`HTML audit HTTP ${r.status}`);
      const validation = await validator.validateString(html, url);
      entry.html = { available: true, valid: validation.valid, errors: validation.errorCount,
        findings: validation.results.flatMap(r => r.messages.map(m => ({ ruleId: m.ruleId, severity: m.severity, message: m.message, line: m.line, column: m.column, selector: m.selector }))) };
    } catch (error) { entry.html.error = error.message; }
    if (path === '/research/') entry.lighthouse = { available: true, excluded: 'Intentional unlisted/noindex research page; indexing-policy checked separately' };
    else {
      const filename = resolve(output, `lighthouse-${index}.json`);
      const child = spawnSync(process.env.OPS_AUDIT_NODE || process.execPath, [resolve(root, 'lighthouse/cli/index.js'), url,
        '--only-categories=seo', '--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage',
        '--max-wait-for-load=15000', '--max-wait-for-fcp=15000', '--output=json', `--output-path=${filename}`, '--quiet'],
      { encoding: 'utf8', timeout: 60000, maxBuffer: 1024 * 1024 });
      save(`lighthouse-${index}.log`, child.stderr || '');
      try {
        if (child.status !== 0 || !existsSync(filename)) throw new Error('Lighthouse failed or timed out');
        const lhr = JSON.parse(readFileSync(filename, 'utf8'));
        const findings = lighthouseFindings(lhr);
        entry.lighthouse = { available: true, score: Math.round(lhr.categories.seo.score * 100), findings, version: lhr.lighthouseVersion, checkedAt: lhr.fetchTime };
      } catch (error) { entry.lighthouse.error = error.message; }
    }
    results.push(entry);
    console.log(`SEO audit: ${url} — HTML ${entry.html.available ? entry.html.errors + ' errors' : 'unavailable'}; Lighthouse ${entry.lighthouse.excluded ? 'intentionally excluded' : entry.lighthouse.available ? entry.lighthouse.score + '/100' : 'unavailable'}`);
  }
  const failed = results.some(r => r.html.available && !r.html.valid || r.lighthouse.findings?.length);
  const partial = results.some(r => !r.html.available || !r.lighthouse.available);
  save('independent-seo.json', { checkedAt: new Date().toISOString(), tools: { lighthouse: '13.5.0', htmlValidate: '10.5.0', htmlPreset: 'html-validate:standard' }, failed, partial, results });
  summary(`### Independent SEO checkers\n\nGoogle Lighthouse 13.5.0 checks mobile-rendered SEO on every sitemap page. HTML-Validate 10.5.0 checks HTML5 conformance on those pages plus the intentional noindex research page. Neither requires an API token or shared checker quota. These engines complement the live crawler and AEO checks; their scores are not Seobility scores or ranking measurements.\n\n| Page | Lighthouse SEO | HTML5 errors |\n|---|---:|---:|\n${results.map(r => `| ${new URL(r.url).pathname} | ${r.lighthouse.excluded ? 'Intentional noindex exclusion' : r.lighthouse.available ? r.lighthouse.score + '/100' : 'Unavailable'} | ${r.html.available ? r.html.errors : 'Unavailable'} |`).join('\n')}\n\n${results.flatMap(r => [...(r.lighthouse.findings || []).map(f => `- ${r.url}: ${f.id} — ${f.title}`), ...(r.html.findings || []).map(f => `- ${r.url}:${f.line}: ${f.ruleId} — ${f.message}`), ...(!r.html.available ? [`- ${r.url}: HTML checker unavailable (${r.html.error})`] : []), ...(!r.lighthouse.available ? [`- ${r.url}: Lighthouse unavailable (${r.lighthouse.error})`] : [])]).join('\n') || 'All implemented independent SEO checks passed.'}\n\nExact Lighthouse JSON, validator findings and execution logs are retained with this run.\n`);
  process.exitCode = failed ? 1 : partial ? 2 : 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => {
  save('independent-seo.json', { failed: false, partial: true, error: error.message, results: [] });
  summary(`### Independent SEO checkers\n\nUnavailable: ${error.message}. No score substituted.\n`); process.exitCode = 2;
});
