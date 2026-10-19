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
const runtimeDir = 'research/records/2026-10-19-runtime-recovery';
const result = { schema_version: 1, checked_utc: new Date().toISOString(),
  source_base: base, scope: 'Website publication and fidelity to supplied fresh runtime evidence; no current reproduction of missing035 source or raw results',
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
const articleDownloadPaths = [...article.matchAll(/href="(\/research\/records\/[^"#]+)"/g)].map(x => x[1]);
const runtimeDownloads = JSON.parse(read(`${runtimeDir}/download-checksums.json`));
const downloadPaths = [...new Set([...articleDownloadPaths, ...runtimeDownloads.files.map(x=>`/${runtimeDir}/${x.path}`)])];
staticCheck('available_downloads_and_checksums', () => {
  assert.equal(articleDownloadPaths.length, 10);
  assert.equal(downloadPaths.length, 13);
  for (const p of downloadPaths) assert.ok(fs.statSync(path.join(root, p)).isFile());
  const m = JSON.parse(read(`${reportDir}/release-manifest.json`));
  for (const f of m.files) { const b = read(`${reportDir}/${f.path}`); assert.equal(b.length, f.bytes); assert.equal(sha(b), f.sha256); }
  assert.equal(runtimeDownloads.files.length, 9);
  for (const f of runtimeDownloads.files) {const b=read(`${runtimeDir}/${f.path}`);assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256);}
});
staticCheck('runtime_evidence_and_visible_limits', () => {
  const s=JSON.parse(read(`${runtimeDir}/runtime-validation-summary.json`));
  assert.equal(s.baseline.commit,'8409f6506bd7c96ab44e44770537e349f1fcfdd1');
  for(const [key,version] of [['311','3.11.17'],['312','3.12.15']]) {
    const p=s.python[key];assert.equal(p.version,version);assert.equal(p.distribution_count,31);
    assert.equal(p.pytest.tests,222);assert.deepEqual([p.pytest.failures,p.pytest.errors,p.pytest.skipped],[0,0,0]);
    assert.equal(p.experiments.passed,7);assert.equal(p.experiments.checks,7);
  }
  assert.equal(s.baseline_governance.passed,27);
  assert.equal(s.publication_boundaries.docker_image_build_executed,false);
  assert.equal(s.publication_boundaries.source_current_head_ci_executed,false);
  assert.equal(s.publication_boundaries.source_repository_merged,false);
  const c=JSON.parse(read(`${runtimeDir}/python312-test-completion.json`));
  assert.equal(c.pytest_returncode,0);assert.equal(c.completed_tests,222);assert.equal(c.retained_stdout_bytes,54);assert.equal(c.stdout_capture_complete,false);
  const convergence=read(`${runtimeDir}/convergence.md`).toString();
  assert.ok(convergence.includes('40-job build passes'));
  for(const text of ['222 tests','7 experiment, control and replay checks','40-job build','27 baseline governance commands','54 progress bytes','missing feature-035 source','no Docker image build or container execution is claimed',"required current-head CI remain open",'all 14 broader reconstruction targets open']) assert.ok(article.includes(text),text);
  assert.ok(!article.includes('Docker and CI installation order now copies'));
  const initial=JSON.parse(read('specs/026-recovered-research-publication/verification/deployment-initial.json'));
  assert.equal(initial.environments.length,2);assert.ok(initial.environments.every(x=>x.status==='pass'));
});

// Exact eight public assets accepted from the independent runtime handoff.
const frozenRuntimeAssets = [
  {
    "path": "runtime-repair-and-validation-036.zip",
    "bytes": 268828,
    "sha256": "4dfca5d28d5fc1655c4e987fcce41963cb269d68efb80478199d0079909f190f"
  },
  {
    "path": "runtime-validation-summary.json",
    "bytes": 11266,
    "sha256": "ce92fbb69bdeb44c8e973f48da90fd6b0d508001993eb334ca59d548960add5e"
  },
  {
    "path": "runtime-release-manifest.json",
    "bytes": 45327,
    "sha256": "318c1c17cb1275a9b1ab92b30f35a8c851cc03fef729def63fa174fdcffb8487"
  },
  {
    "path": "package-verification.json",
    "bytes": 791,
    "sha256": "04c3cd3f4fa3261b1ceeacfbf1d5d87ac8d160964e0bca22b35f508a5ca87c20"
  },
  {
    "path": "public-scope-audit.json",
    "bytes": 1896,
    "sha256": "a39afe72f5ea3b76e613fc9d6fde2b75e65bec604bb10874ffef7f19350dc3d2"
  },
  {
    "path": "python312-test-completion.json",
    "bytes": 1289,
    "sha256": "e2feecac5d60e3a9dfcf69717a6251df62f761db82bc6faba7ca4d6db7eeb252"
  },
  {
    "path": "convergence.md",
    "bytes": 5521,
    "sha256": "3fb00436448f810143b99a7fdb642ccf61050c9bd349684ef9e8ca914f91b56c"
  },
  {
    "path": "runtime-setup.md",
    "bytes": 10412,
    "sha256": "140d5e6b190c583c13f98a459de425ea91a920306c21bae5d3bd2db9259a784d"
  }
];
staticCheck('frozen_runtime_assets_unchanged', () => {
  for(const f of frozenRuntimeAssets){const b=read(`${runtimeDir}/${f.path}`);assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256);}
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
