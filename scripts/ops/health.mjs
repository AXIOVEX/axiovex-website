import { request, save, summary } from './io.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
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
  const page = new URL(url);
  const research = page.pathname.startsWith('/research/');
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(m => { try { return new URL(m[1], url); } catch { return null; } }).filter(Boolean);
  checks.bitConceptsLinkPolicy = research || links.every(link => !/(^|\.)bitconcepts\.tech$/i.test(link.hostname));
  checks.researchUnlistedLinks = research || links.every(link => link.origin !== page.origin || !/^\/research(?:\/|$)/.test(link.pathname));
  const canonical = (html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i) || [])[0] || '';
  checks.canonical = /href=["']([^"']+)["']/i.exec(canonical)?.[1] === url;
  const blocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  checks.validStructuredData = blocks.length > 0 && blocks.every(b => { try { const d = JSON.parse(b[1]); return d && typeof d === 'object'; } catch { return false; } });
  checks.language = /<html\b[^>]*lang=["'][^"']+/i.test(html);
  checks.viewport = /<meta\b[^>]*name=["']viewport["']/i.test(html);
  checks.imageAlt = [...html.matchAll(/<img\b[^>]*>/gi)].every(m => /\balt\s*=/i.test(m[0]));
  return { url, checks };
}
const paths = ['/', '/signals/', '/documents/', '/blog/', '/newsletter/', '/research/', '/contact/'];
async function main() {
  const results = [], documents = new Map();
  const sitemapResponse = await request(BASE + '/sitemap.xml');
  const sitemap = await sitemapResponse.text();
  const discovered = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).filter(u => u.startsWith(BASE + '/') && !u.includes('?'));
  const urls = [...new Set([...paths.map(p => BASE + p), ...discovered])];
  if (urls.length > 100) throw new Error('Sitemap exceeds bounded audit size; extend the audit explicitly');
  for (const url of [...urls, ...['/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt', '/__axiovex_missing_seo_probe__/'].map(p => BASE + p)]) {
    try {
      const response = await request(url), body = await response.text(), pathname = new URL(url).pathname;
      const entry = urls.includes(url) ? inspect(body, url) : { url, checks: {} };
      entry.status = response.status;
      entry.checks.http = response.status === (pathname === '/__axiovex_missing_seo_probe__/' ? 404 : 200);
      if (pathname === '/__axiovex_missing_seo_probe__/') entry.checks.missingPageNoindex = /name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(body);
      if (pathname === '/llms.txt' || pathname === '/llms-full.txt') entry.checks.machineText = /text\/plain/i.test(response.headers.get('content-type') || '') && !/<(?:!doctype|html)\b/i.test(body);
      entry.checks.edgeIndexingPolicy = !/noindex/i.test(response.headers.get('x-robots-tag') || '') || ['/research/', '/__axiovex_missing_seo_probe__/'].includes(pathname);
      if (pathname === '/research/') entry.checks.researchResponseNoindex = /noindex/i.test(response.headers.get('x-robots-tag') || '');
      if (pathname === '/robots.txt') entry.checks.researchOmittedFromRobots = !body.includes('/research');
      if (pathname === '/robots.txt') entry.checks.productionCrawl = !/Disallow:\s*\/\s*(?:\r?\n|$)/i.test(body);
      if (pathname === '/sitemap.xml') entry.checks.sitemap = sitemapResponse.status === 200 && discovered.length > 0;
      if (pathname === '/sitemap.xml' || pathname === '/llms.txt' || pathname === '/llms-full.txt') entry.checks.researchUnlisted = !body.includes(BASE + '/research/');
      if (pathname === '/llms.txt') entry.checks.content = body.includes('Axiovex');
      save(`probe-${results.length}.json`, { ...entry, headers: Object.fromEntries(response.headers), body });
      if (urls.includes(url)) documents.set(url, body);
      results.push(entry);
    } catch (error) { results.push({ url, error: error.message, checks: { reachable: false } }); }
  }
  // Check linked local resources without following any subscription actions.
  const linked = new Set();
  for (const [url, html] of documents) {
    for (const m of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
      try {
        const target = new URL(m[1].replaceAll('&amp;', '&'), url);
        if (target.origin !== BASE || target.search || target.pathname.startsWith('/api/') || target.pathname === '/cdn-cgi/l/email-protection' || /\/newsletter\/(confirm|unsubscribe)/.test(target.pathname)) continue;
        if (target.hash) {
          const targetBody = documents.get(target.origin + target.pathname);
          if (targetBody && !targetBody.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`) && !targetBody.includes(`id='${decodeURIComponent(target.hash.slice(1))}'`)) {
            results.push({ url: url + ' → ' + target.href, checks: { anchorTarget: false } });
          }
        }
        target.hash = '';
        if (!documents.has(target.href)) linked.add(target.href);
      } catch { /* non-http links such as mailto are not crawl targets */ }
    }
  }
  if (linked.size > 150) throw new Error('Local resource audit exceeds bounded size');
  for (const url of linked) {
    try { const r = await request(url, { method: 'HEAD' }); const checks = { linkedResource: r.status === 200 }; if (new URL(url).pathname.startsWith('/research/')) checks.researchAssetNoindex = /noindex/i.test(r.headers.get('x-robots-tag') || ''); results.push({ url, status: r.status, checks }); }
    catch (error) { results.push({ url, error: error.message, checks: { linkedResource: false } }); }
  }
  const failed = results.flatMap(r => Object.entries(r.checks).filter(([, ok]) => !ok).map(([name]) => `${r.url}: ${name}${r.error ? ' — ' + r.error : ''}`));
  let aeoAvailable = false;
  let external = 'AEO checker unavailable: pinned aeo.js CLI not configured. No old score reused as current.';
  if (process.env.OPS_AEO_CLI) {
    const child = spawnSync(process.execPath, [process.env.OPS_AEO_CLI, 'check', BASE, '--json'], { encoding: 'utf8', timeout: 180000, maxBuffer: 10 * 1024 * 1024 });
    save('aeo-checker.log', child.stderr || '');
    try {
      const data = JSON.parse(child.stdout);
      if (child.status !== 0 || !Number.isFinite(data.audit?.score)) throw new Error('Invalid external report');
      save('aeo-external.json', data);
      aeoAvailable = true;
      external = `AEO readiness: ${data.audit.score}/100 from aeo.js 0.0.16, scanned ${data.scannedAt}, ${data.pages.length} pages. Change versus recorded baseline 100: ${data.audit.score - 100} points. Average citability: ${data.citability.averageScore}/100 (a separate metric).\n\n${data.audit.issues?.length ? data.audit.issues.map(i => '- ' + (typeof i === 'string' ? i : JSON.stringify(i))).join('\n') : 'No scored AEO readiness issues.'}\n\nRobots directives allow ${data.botAccess.filter(b => b.allowed).length}/${data.botAccess.length} tested bot names; this is a rules analysis, not proof that each service has crawled or cited the site. Heuristic scores do not measure actual search rankings or AI citations.`;
    } catch { external = 'AEO checker failed or timed out; no score substituted. Inspect aeo-checker.log.'; }
  }
  const auditOutput = resolve(process.env.OPS_OUTPUT || 'ops-output', 'independent');
  const seo = spawnSync(process.execPath, ['scripts/ops/seo-audit.mjs'], { stdio: 'inherit', timeout: 8 * 60000, env: { ...process.env, OPS_OUTPUT: auditOutput } });
  const independent = existsSync(`${auditOutput}/independent-seo.json`) ? JSON.parse(readFileSync(`${auditOutput}/independent-seo.json`, 'utf8')) : { failed: false, partial: true };
  const independentReport = existsSync(`${auditOutput}/report.md`) ? readFileSync(`${auditOutput}/report.md`, 'utf8') : 'Independent SEO checkers failed to produce a report.';
  if (independent.failed || seo.status === 1) failed.push('Independent SEO engines found verified failures; see findings below.');
  const partial = !aeoAvailable || independent.partial || seo.status === null || ![0, 1].includes(seo.status);
  save('health.json', { checkedAt: new Date().toISOString(), results, failed, pagesChecked: urls.length, partial, independent });
  summary(`## SEO / AEO audit\n\n${urls.length} live pages plus crawler files, missing-page response and linked local resources checked; ${failed.length} failed checks. Exact canonicals, parsed JSON-LD, titles, descriptions, H1, language, viewport, image alt, indexability, sitemap, anchors and local resources are checked. Machine-readable endpoints must return actual plain text; nonexistent URLs must return HTTP404 and noindex. Intentional research noindex/exclusion and Cloudflare email-action URLs are handled separately.\n\n${failed.length ? failed.map(f => '- ' + f).join('\n') : 'All implemented technical checks passed.'}\n\n${independentReport}\n\n### AEO readiness\n\n${external}\n\n### Scope and findings review\n\nSeobility is optional historical context (baseline 90), not a required dependency. Current results above come from the named independent engines; no vendor scores are mixed or substituted. These checks do not measure rankings, backlinks or actual AI citations. AEO suggestions must be verified against source markup: the homepage already has Organization.sameAs profile links; a contact page does not need invented statistics; archive cards link to their source articles. Generic prose/list suggestions are not technical defects.\n`);
  if (failed.length) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { summary(`## SEO / AEO audit failed\n\n${error.message}\n`); process.exitCode = 1; });
}
