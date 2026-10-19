import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {save} from './io.mjs';
export async function waitForDeployment(read, sleep, attempts=20) {
  for (let i=0;i<attempts;i++) {
    const checks=await read();
    const check=checks.filter(c=>c.name==='Cloudflare Pages: axiovex-website').sort((a,b)=>Date.parse(b.started_at)-Date.parse(a.started_at))[0];
    if (check?.status==='completed') {
      if (check.conclusion!=='success') throw Error('Production deployment failed; live audit held');
      return check;
    }
    if (i+1<attempts) await sleep(15000);
  }
  throw Error('Production deployment not confirmed within five minutes; live audit held');
}
if (process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  try {
    const check=await waitForDeployment(()=>JSON.parse(execFileSync('gh',['api',`repos/${process.env.GITHUB_REPOSITORY}/commits/${process.env.GITHUB_SHA}/check-runs?per_page=100`],{encoding:'utf8'})).check_runs,sleep);
    save('deployment-wait.json',{status:'success',commit:process.env.GITHUB_SHA,checkId:check.id,completedAt:check.completed_at});
    console.log('Production deployment confirmed; allowing 15 seconds for edge propagation.');
    await sleep(15000);
  } catch(e) {save('deployment-wait.json',{status:'failed',commit:process.env.GITHUB_SHA,error:e.message});console.error(e.message);process.exitCode=1;}
}
