import test from 'node:test';
import assert from 'node:assert/strict';
import {waitForDeployment} from './wait-deployment.mjs';
const production={name:'Cloudflare Pages: axiovex-website',started_at:'2026-10-19T22:00:00Z',status:'completed',conclusion:'success'};
test('audit waits for the production check; staging success cannot authorize it',async()=>{
 let reads=0,waits=0;
 const result=await waitForDeployment(async()=>++reads===1?[{...production,name:'Cloudflare Pages: axiovex-website-staging'}]:[production],async()=>waits++);
 assert.equal(result,production);assert.equal(reads,2);assert.equal(waits,1);
});
test('failed deployment holds the audit without retrying it as success',async()=>{
 await assert.rejects(waitForDeployment(async()=>[{...production,conclusion:'failure'}],async()=>{}),/deployment failed/);
});
test('missing production receipt has a bounded wait',async()=>{
 let waits=0;
 await assert.rejects(waitForDeployment(async()=>[],async()=>waits++,3),/not confirmed/);assert.equal(waits,2);
});
