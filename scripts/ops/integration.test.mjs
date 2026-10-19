import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

function run(mode, { key = '', apiError = false } = {}) {
  const temp = mkdtempSync(path.join(tmpdir(), 'axiovex-ops-test-'));
  const hook = path.join(temp, 'mock.mjs');
  writeFileSync(hook, `
    globalThis.fetch = async (url, options = {}) => {
      if (String(url).includes('/zones?')) return Response.json({success:true,result:[{id:'a'.repeat(32)}]});
      if (${apiError}) return Response.json({errors:[{message:'permission denied'}]});
      const query = JSON.parse(options.body).query;
      let rows;
      if (query.includes('httpRequests1dGroups')) {
        const start = /date_geq:"([^"]+)"/.exec(query)[1], end = /date_lt:"([^"]+)"/.exec(query)[1];
        rows = [];
        for(let d = new Date(start + 'T00:00:00Z'); d.toISOString().slice(0,10) < end; d.setUTCDate(d.getUTCDate()+1)) {
          rows.push({dimensions:{date:d.toISOString().slice(0,10)},uniq:{uniques:3},sum:{requests:10,bytes:200,cachedBytes:50,responseStatusMap:[{edgeResponseStatus:200,requests:10}],countryMap:[{clientCountryName:'US',requests:10}]}});
        }
      } else rows = [{count:5,dimensions:{clientRequestHTTPHost:'axiovexsystems.com',clientRequestPath:'/signals/'}}];
      return Response.json({data:{viewer:{zones:[{rows}]}},errors:null});
    };
  `);
  const child = spawnSync(process.execPath, ['--import', pathToFileURL(hook).href, 'scripts/ops/analytics.mjs', mode], {
    encoding: 'utf8', env: { ...process.env, CLOUDFLARE_ANALYTICS_TOKEN: key, OPS_OUTPUT: temp, GITHUB_STEP_SUMMARY: '',
      NEWSLETTER_SEND_SECRET: '' },
  });
  return { ...child, temp, report: readFileSync(path.join(temp, 'report.md'), 'utf8') };
}
test('missing credentials produce a saved failed report', () => {
  const result = run('daily');
  assert.equal(result.status, 1);
  assert.match(result.report, /Missing CLOUDFLARE_ANALYTICS_TOKEN/);
});
test('API errors preserve raw evidence and fail closed', () => {
  const result = run('weekly', { key: 'test-only', apiError: true });
  assert.equal(result.status, 1);
  assert.match(result.report, /API rejected query/);
  assert.ok(existsSync(path.join(result.temp, 'current-utc.json')));

});
test('measured reports save normalized responses and disclose missing sections', () => {
  const result = run('weekly', { key: 'test-only' });
  assert.equal(result.status, 2);
  assert.match(result.report, /200 \(OK\): 70/);
  assert.match(result.report, /visitor-days/);
  assert.match(result.report, /Daily request trend/);
  assert.match(result.report, /Path movers/);
  const snapshot = JSON.parse(readFileSync(path.join(result.temp, 'window.json'), 'utf8'));
  assert.equal(snapshot.totals.current.requests, 70);
  assert.equal(snapshot.totals.current.cacheRatio, 0.25);
  assert.equal(snapshot.movers[0].change, 0);
  assert.ok(!result.report.includes('test-only'));
});
test('legacy sender fails rather than reporting recipient failures as complete', () => {
  const temp = mkdtempSync(path.join(tmpdir(), 'axiovex-send-test-'));
  const hook = path.join(temp, 'mock.mjs');
  writeFileSync(hook, `globalThis.fetch = async () => Response.json({ ok:true, offset:0, sent:0, throttled:0, blockedAllowlist:0, failed:1, remaining:0, batch:1, gauge:{line:'test gauge',healthOverrides:[]} });`);
  const child = spawnSync(process.execPath, ['--import', pathToFileURL(hook).href,
    'scripts/newsletter/send.mjs', '2026-10-14', '--approved-by', 'test-only', '--base', 'https://axiovexsystems.com'], {
    encoding: 'utf8', env: { ...process.env, NEWSLETTER_SEND_SECRET: 'test-only' },
  });
  assert.equal(child.status, 1);
  assert.match(child.stderr, /Newsletter delivery incomplete/);
  assert.ok(!child.stdout.includes('send complete'));
});
