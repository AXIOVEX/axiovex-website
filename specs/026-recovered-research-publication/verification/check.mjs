// Run from the website root. Set PLAYWRIGHT_MODULE to an installed module
// directory and PLAYWRIGHT_BROWSERS_PATH to its matching browser store.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const base = 'a43d821a5166a97e60ef686eb9e520527c81e23b';
const out = path.join(root, 'specs/026-recovered-research-publication/verification');
const screenshotDir = process.env.QA_SCREENSHOT_DIR || path.join(out, 'screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const read = p => fs.readFileSync(path.join(root, p));
const old = p => execFileSync('git', ['show', `${base}:${p}`], { cwd: root });
const html = read('research/index.html').toString();
const original = old('research/index.html').toString();
const reportDir = 'research/records/2026-10-19-discriminating-studies';
const result = { schema_version: 1, checked_utc: new Date().toISOString(),
  source_base: base, scope: 'Website publication only; no current reproduction of missing035 source or raw results',
  static: {}, browser: {}, failures: [] };
const priorResults = path.join(out, 'results-current-scope.json');
if (fs.existsSync(priorResults)) {
  const prior = JSON.parse(fs.readFileSync(priorResults));
  result.prior_attempts = [...(prior.prior_attempts || []), {
    checked_utc: prior.checked_utc, status: prior.status,
    failures: (prior.failures || []).map(x=>x.message),
    note: 'Retained earlier local verification attempt; screenshot capture does not alter page content.'
  }];
}

function staticCheck(name, fn) {
  fn(); result.static[name] = true;
}
staticCheck('exact_report', () => assert.equal(sha(read(`${reportDir}/findings.md`)), 'c459d48a43dc65b8d233c566fdbf81bc1892ad29d1e82fe501accb8ecb477f0b'));
staticCheck('private_inventory_excluded', () => {
  assert.ok(!fs.existsSync(path.join(root, reportDir, 'source-manifest.json')));
  assert.ok(!html.includes('source-manifest.json'));
  const published = JSON.parse(read(`${reportDir}/release-manifest.json`));
  assert.deepEqual(published.files.map(x=>x.path), ['findings.md','README.txt']);
  assert.ok(!published.files.some(x=>x.path.includes('source-manifest')));
});
const baselineScript = [...original.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1].slice(1, -2);
staticCheck('exact_tracker_bytes', () => {
  assert.equal(read('research/tracker.v1.js').toString(), baselineScript);
  assert.equal(sha(read('research/tracker.v1.js')), '6c446f734049e1b6e8e8d6d762e0041191d05b7d6f1f0e29a2909d16e5a1ef53');
});
staticCheck('protected_files_unchanged', () => {
  for (const p of ['_headers', 'robots.txt', 'sitemap.xml', 'llms.txt', 'docs/wireframes/wireframes.md', 'docs/wireframes/wireframes.html', 'styles.v38.css']) assert.deepEqual(read(p), old(p), p);
});
staticCheck('approved_component_and_shell', () => {
  for (const pattern of [/<header class="nav">[\s\S]*?<\/header>/, /<footer[\s\S]*?<\/footer>/]) assert.equal(html.match(pattern)[0], original.match(pattern)[0]);
  assert.ok(html.includes('<meta name="robots" content="noindex">'));
  assert.ok(html.includes('<link rel="canonical" href="https://axiovexsystems.com/research/">'));
  assert.equal((html.match(/<details class="article"/g) || []).length, 4);
  assert.equal((html.match(/id="finite-model-records-2026-10-19"/g) || []).length, 1);
  assert.deepEqual([...html.matchAll(/class="ledger-num">(\d+)</g)].map(x => Number(x[1])), [19,18,20,5]);
  assert.ok(read('styles.v39.css').subarray(0, read('styles.v38.css').length).equals(read('styles.v38.css')));
});
const article = html.match(/<details class="article" id="finite-model-records-2026-10-19">[\s\S]*?<\/details>/)[0];
staticCheck('visible_recovery_boundary', () => {
  for (const text of ['Recovery status.', 'not a current independent reproduction', 'source changes and complete machine-readable results were not recovered', 'validation statements in the report remain historical']) assert.ok(article.includes(text), text);
  assert.ok(!article.includes('source-and-evidence.zip'));
  assert.ok(!article.includes('/studies.json'));
});
const downloadPaths = [...article.matchAll(/href="(\/research\/records\/[^"#]+)"/g)].map(x => x[1]);
staticCheck('available_downloads_and_checksums', () => {
  assert.equal(downloadPaths.length, 3);
  for (const p of downloadPaths) assert.ok(fs.statSync(path.join(root, p)).isFile());
  const m = JSON.parse(read(`${reportDir}/release-manifest.json`));
  for (const f of m.files) { const b = read(`${reportDir}/${f.path}`); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256); }
});
result.input_hashes = {};
for (const p of ['research/index.html','research/tracker.v1.js','styles.v39.css', ...downloadPaths.map(x=>x.slice(1))]) result.input_hashes[p] = sha(read(p));

const headerEntries = read('_headers').toString().split('\n').filter(x=>/^  [\w-]+:/.test(x)).map(x=> {
  const i=x.indexOf(':'); return [x.slice(0,i).trim(), x.slice(i+1).trim()];
});
const types = { '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon', '.txt':'text/plain; charset=utf-8', '.md':'text/plain; charset=utf-8' };
const server = http.createServer((req,res) => {
  for (const [k,v] of headerEntries) res.setHeader(k,v);
  const urlPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(urlPath==='/__baseline__/research/') {res.setHeader('Content-Type',types['.html']);res.end(original);return;}
  let target=path.resolve(root,'.'+urlPath);
  if(!target.startsWith(root+path.sep)&&target!==root){res.writeHead(403);res.end();return;}
  try {if(fs.statSync(target).isDirectory())target=path.join(target,'index.html');const b=fs.readFileSync(target);res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');res.end(b);}
  catch {res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const require = createRequire(import.meta.url);
const modulePath = process.env.PLAYWRIGHT_MODULE || 'playwright';
const { chromium } = require(modulePath);
let browser;
try {
  browser = await chromium.launch();
  result.browser.version = browser.version();
  result.browser.production_csp = Object.fromEntries(headerEntries)['Content-Security-Policy'];
  const before=await browser.newPage();
  await before.addInitScript(()=> { window.cspEvents=[]; document.addEventListener('securitypolicyviolation',e=>window.cspEvents.push({directive:e.effectiveDirective,blocked:e.blockedURI})); });
  await before.goto(origin+'/__baseline__/research/',{waitUntil:'networkidle'});
  result.browser.baseline_negative_control={cards:await before.locator('#board-grid .study-card').count(),csp:await before.evaluate(()=>window.cspEvents)};
  assert.equal(result.browser.baseline_negative_control.cards,0);
  assert.ok(result.browser.baseline_negative_control.csp.some(x=>x.blocked==='inline'&&x.directive.startsWith('script')));
  await before.close();
  for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]) {
    const page=await browser.newPage({viewport:{width,height}});
    const pageErrors=[],sameOriginErrors=[];
    page.on('pageerror',e=>pageErrors.push(e.message));
    page.on('response',r=> {if(r.url().startsWith(origin)&&r.status()>=400)sameOriginErrors.push({url:r.url(),status:r.status()});});
    await page.addInitScript(()=> {window.cspEvents=[];document.addEventListener('securitypolicyviolation',e=>window.cspEvents.push({directive:e.effectiveDirective,blocked:e.blockedURI}));});
    const response=await page.goto(origin+'/research/',{waitUntil:'networkidle'});
    assert.equal(response.status(),200);
    const row={forms:await page.locator('form').count(),noindex:await page.locator('meta[name="robots"][content="noindex"]').count(),cards:await page.locator('#board-grid .study-card').count(),predictions:await page.locator('#pred-grid .pred-card').count(),releases:await page.locator('#rel-list .rel-row').count(),articles:await page.locator('details.article').count(),filters:{}};
    assert.deepEqual([row.forms,row.noindex,row.cards,row.predictions,row.releases,row.articles],[1,1,20,2,20,4]);
    for (const [key,n] of Object.entries({confirmed:7,rejected:7,noeffect:3,inconclusive:1,running:1,offscale:2})) {await page.locator(`#board-chips .chip[data-filter="${key}"]`).click();row.filters[key]=await page.locator('#board-grid .study-card:not([hidden])').count();assert.equal(row.filters[key],n);}
    await page.locator('#board-chips .chip[data-filter="all"]').click();
    const block=page.locator('#finite-model-records-2026-10-19');
    await block.locator('summary').click();
    assert.equal(await block.evaluate(e=>e.open),true);
    row.article_text=await block.innerText();
    row.link_style=await block.locator('.article-body a').first().evaluate(e=>({color:getComputedStyle(e).color,decoration:getComputedStyle(e).textDecorationLine}));
    assert.equal(row.link_style.color,'rgb(0, 222, 246)');assert.ok(row.link_style.decoration.includes('underline'));
    row.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    assert.equal(row.overflow,false);
    row.downloads=[];
    for(const p of downloadPaths) {const r=await page.request.get(origin+p);const b=await r.body();assert.equal(r.status(),200);assert.equal(sha(b),sha(read(p.slice(1))));row.downloads.push({path:p,status:r.status(),bytes:b.length,sha256:sha(b)});}
    const shot=path.join(screenshotDir,`article-${name}.png`);
    // Capture at document coordinates with the sticky header outside the
    // article. Element auto-scrolling otherwise places that header over the
    // article title in the evidence screenshot without changing layout.
    await page.evaluate(()=>scrollTo(0,0));
    const clip=await block.evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height};});
    await page.screenshot({path:shot,fullPage:true,clip});
    row.screenshot={filename:path.basename(shot),sha256:sha(fs.readFileSync(shot)),bytes:fs.statSync(shot).size};
    row.csp=await page.evaluate(()=>window.cspEvents);row.page_errors=pageErrors;row.same_origin_errors=sameOriginErrors;
    assert.deepEqual(row.csp,[]);assert.deepEqual(pageErrors,[]);assert.deepEqual(sameOriginErrors,[]);
    result.browser[name]=row;await page.close();
  }
  result.status='pass';
} catch(e) {result.status='fail';result.failures.push({message:e.message,stack:e.stack});}
finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify({status:result.status,static_checks:Object.keys(result.static).length,browser:result.browser.version,failures:result.failures.map(x=>x.message)}));
if(result.status!=='pass')process.exitCode=1;
