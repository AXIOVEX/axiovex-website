import { request, save, summary } from './io.mjs';
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
  for (const url of [...urls, ...['/robots.txt', '/sitemap.xml', '/llms.txt'].map(p => BASE + p)]) {
    try {
      const response = await request(url), body = await response.text(), pathname = new URL(url).pathname;
      const entry = urls.includes(url) ? inspect(body, url) : { url, checks: {} };
      entry.status = response.status;
      entry.checks.http = response.status === 200;
      entry.checks.edgeIndexingPolicy = !/noindex/i.test(response.headers.get('x-robots-tag') || '') || pathname === '/research/';
      if (pathname === '/robots.txt') entry.checks.productionCrawl = !/Disallow:\s*\/\s*(?:\r?\n|$)/i.test(body);
      if (pathname === '/sitemap.xml') entry.checks.sitemap = sitemapResponse.status === 200 && discovered.length > 0;
      if (pathname === '/sitemap.xml' || pathname === '/llms.txt') entry.checks.researchUnlisted = !body.includes(BASE + '/research/');
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
    try { const r = await request(url, { method: 'HEAD' }); results.push({ url, status: r.status, checks: { linkedResource: r.status === 200 } }); }
    catch (error) { results.push({ url, error: error.message, checks: { linkedResource: false } }); }
  }
  const failed = results.flatMap(r => Object.entries(r.checks).filter(([, ok]) => !ok).map(([name]) => `${r.url}: ${name}${r.error ? ' — ' + r.error : ''}`));
  let external = 'AEO checker unavailable: pinned aeo.js CLI not configured. No old score reused as current.';
  if (process.env.OPS_AEO_CLI) {
    const child = spawnSync(process.execPath, [process.env.OPS_AEO_CLI, 'check', BASE, '--json'], { encoding: 'utf8', timeout: 180000, maxBuffer: 10 * 1024 * 1024 });
    save('aeo-checker.log', child.stderr || '');
    try {
      const data = JSON.parse(child.stdout);
      if (child.status !== 0 || !Number.isFinite(data.audit?.score)) throw new Error('Invalid external report');
      save('aeo-external.json', data);
      external = `AEO readiness: ${data.audit.score}/100 from aeo.js 0.0.16, scanned ${data.scannedAt}, ${data.pages.length} pages. Change versus recorded baseline 100: ${data.audit.score - 100} points. Average citability: ${data.citability.averageScore}/100 (a separate metric).\n\n${data.audit.issues?.length ? data.audit.issues.map(i => '- ' + (typeof i === 'string' ? i : JSON.stringify(i))).join('\n') : 'No scored AEO readiness issues.'}\n\nRobots directives allow ${data.botAccess.filter(b => b.allowed).length}/${data.botAccess.length} tested bot names; this is a rules analysis, not proof that each service has crawled or cited the site. Heuristic scores do not measure actual search rankings or AI citations.`;
    } catch { external = 'AEO checker failed or timed out; no score substituted. Inspect aeo-checker.log.'; }
  }
  save('health.json', { checkedAt: new Date().toISOString(), results, failed, pagesChecked: urls.length, partial: true });
  summary(`## SEO / AEO audit\n\n${urls.length} live pages plus crawler files and linked local resources checked; ${failed.length} failed checks. Canonicals are matched to each exact URL; JSON-LD is parsed, not just detected. Titles, descriptions, H1, language, viewport, image alt attributes, indexability, sitemap and internal anchors/resources are checked. Cloudflare email-protection action URLs are excluded from static resource checks because the fragment and decoding script provide the actual email destination. Intentional research noindex and exclusion are preserved.\n\n${failed.length ? failed.map(f => '- ' + f).join('\n') : 'All implemented technical checks passed.'}\n\n### AEO readiness\n\n${external}\n\n### Seobility\n\nFresh Seobility score unavailable: no authenticated checker integration is configured. Its public checker reported no free checks remaining during the October 19 audit. Recorded baseline 90 is historical, not a current reading. This technical audit is not a substitute Seobility score.\n\n### Follow-up\n\n${failed.length ? 'Safe technical correction: investigate the explicit failed URLs/checks above and verify after deployment.' : 'No technical corrections indicated by these checks. Review content suggestions separately; do not add unsupported claims or change branding to improve a score.'}\n`);
  if (failed.length) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { summary(`## SEO / AEO audit failed\n\n${error.message}\n`); process.exitCode = 1; });
}
