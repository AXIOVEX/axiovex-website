import {execFileSync,spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export const generatedFile=file=>/^(?:index\.html|404\.html|(?:blog|newsletter|signals|documents|research|privacy|contact|disclaimer)\/.*\.html|sitemap\.xml|feed\.xml|llms-full\.txt)$/.test(file);
export function publish(cwd=process.cwd()){
  if(process.env.GITHUB_ACTIONS==='true'&&(process.env.GITHUB_REF!=='refs/heads/main'||process.env.GITHUB_REPOSITORY!=='AXIOVEX/axiovex-website'))throw Error('Automated publication is restricted to this repository main branch');
  const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8',env:{...process.env,GIT_EDITOR:'true'}}).trim();
  const attempt=(...args)=>spawnSync('git',args,{cwd,encoding:'utf8',env:{...process.env,GIT_EDITOR:'true'}});
  for(let n=0;n<4;n++){
    git('fetch','origin','main');
    let rebase=attempt('rebase','origin/main');
    let resolutions=0;
    while(rebase.status!==0){
      const conflicts=git('diff','--name-only','--diff-filter=U').split('\n').filter(Boolean);
      if(!conflicts.length||conflicts.some(f=>!generatedFile(f))||++resolutions>8){attempt('rebase','--abort');throw Error('Publication rebase has a source conflict; retained source evidence requires reconciliation');}
      // During rebase, ours is the new upstream. Rebuild canonical pages afterward.
      git('checkout','--ours','--',...conflicts);git('add','--',...conflicts);
      const staged=attempt('diff','--cached','--quiet');
      rebase=staged.status===0?attempt('rebase','--skip'):attempt('rebase','--continue');
    }
    const shared=existsSync('/tmp/shared-documents')?['/tmp/shared-documents']:[];
    execFileSync(process.execPath,['scripts/build-site.mjs',...shared],{cwd,stdio:'inherit'});
    const changed=git('diff','--name-only').split('\n').filter(generatedFile);
    const added=git('ls-files','--others','--exclude-standard').split('\n').filter(generatedFile);
    if(changed.length||added.length)git('add','--',...new Set([...changed,...added]));
    if(attempt('diff','--cached','--quiet').status!==0)git('commit','-m','Rebuild generated output against current publication inputs');
    const pushed=attempt('push','origin','HEAD:main');
    if(pushed.status===0){process.stdout.write(pushed.stdout||'');process.stdout.write(pushed.stderr||'');console.log('Publication accepted against current main.');return;}
    const message=pushed.stdout+'\n'+pushed.stderr;
    if(!/cannot lock ref|non-fast-forward|fetch first|remote contains work|failed to update ref/i.test(message))throw Error('Publication push rejected; inspect branch rules or app authorization');
    console.log(`Main advanced during publication; rebuilding before retry ${n+1}/4.`);
  }
  throw Error('Main kept advancing; publication held after four bounded attempts');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)try{publish();}catch(e){console.error(e.message);process.exitCode=1;}
