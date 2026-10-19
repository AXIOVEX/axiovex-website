import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('two independent collectors preserve both source updates and rebuild conflicting generated HTML',()=>{
  const root=mkdtempSync(join(tmpdir(),'axiovex-publish-'));
  const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']});
  try{
    const remote=join(root,'remote.git'),seed=join(root,'seed'),a=join(root,'a'),b=join(root,'b');
    git(root,'init','--bare','--initial-branch=main',remote);git(root,'clone',remote,seed);
    for(const d of ['scripts','data'])mkdirSync(join(seed,d));
    writeFileSync(join(seed,'scripts/build-site.mjs'),`import fs from 'node:fs';fs.writeFileSync('index.html',String(Number(fs.readFileSync('data/a'))+Number(fs.readFileSync('data/b'))));`);
    writeFileSync(join(seed,'data/a'),'0');writeFileSync(join(seed,'data/b'),'0');writeFileSync(join(seed,'index.html'),'0');
    for(const cwd of [seed]){git(cwd,'config','user.name','CI test');git(cwd,'config','user.email','ci-test@example.invalid');git(cwd,'add','.');git(cwd,'commit','-m','Initial');git(cwd,'push','origin','main');}
    git(root,'clone',remote,a);git(root,'clone',remote,b);
    for(const cwd of [a,b]){git(cwd,'config','user.name','CI test');git(cwd,'config','user.email','ci-test@example.invalid');}
    writeFileSync(join(a,'data/a'),'1');writeFileSync(join(a,'index.html'),'1');git(a,'add','.');git(a,'commit','-m','Collector A');
    writeFileSync(join(b,'data/b'),'2');writeFileSync(join(b,'index.html'),'2');git(b,'add','.');git(b,'commit','-m','Collector B');git(b,'push','origin','main');
    execFileSync(process.execPath,[fileURLToPath(new URL('./publish.mjs',import.meta.url))],{cwd:a,env:{...process.env,GITHUB_ACTIONS:'false'},stdio:['ignore','pipe','pipe']});
    git(b,'pull','--ff-only');assert.equal(readFileSync(join(b,'data/a'),'utf8'),'1');assert.equal(readFileSync(join(b,'data/b'),'utf8'),'2');assert.equal(readFileSync(join(b,'index.html'),'utf8'),'3');
    // A real source disagreement must stop without overwriting the remote or losing either local input.
    writeFileSync(join(a,'data/a'),'4');git(a,'add','.');git(a,'commit','-m','Source A');
    writeFileSync(join(b,'data/a'),'5');git(b,'add','.');git(b,'commit','-m','Source B');git(b,'push','origin','main');
    assert.throws(()=>execFileSync(process.execPath,[fileURLToPath(new URL('./publish.mjs',import.meta.url))],{cwd:a,env:{...process.env,GITHUB_ACTIONS:'false'},stdio:['ignore','pipe','pipe']}),/source conflict/);
    assert.equal(readFileSync(join(a,'data/a'),'utf8'),'4');assert.equal(readFileSync(join(b,'data/a'),'utf8'),'5');
    assert.equal(git(a,'status','--porcelain').trim(),'');

  }finally{
    const target=resolve(root),parent=resolve(tmpdir());assert.ok(target.startsWith(parent+((process.platform==='win32')?'\\':'/'))&&target.includes('axiovex-publish-'));rmSync(target,{recursive:true,force:true});
  }
});
