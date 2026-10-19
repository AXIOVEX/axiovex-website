import {createServer} from 'node:http';
import {randomBytes,timingSafeEqual,createPrivateKey} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const nonce=randomBytes(24).toString('hex'),state=randomBytes(32).toString('hex');
const manifest={name:'Axiovex Website CI Publisher',url:'https://axiovexsystems.com',description:'Publishes verified generated website data from trusted GitHub Actions workflows. Installed only on AXIOVEX/axiovex-website; normal main updates only.',redirect_url:'http://localhost:8769/callback',public:false,hook_attributes:{url:'https://axiovexsystems.com/',active:false},default_permissions:{contents:'write'},default_events:[],request_oauth_on_install:false};
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let saved;
function gh(type,name,value){const args=type==='secret'?['secret','set',name,'--repo','AXIOVEX/axiovex-website']:['variable','set',name,'--repo','AXIOVEX/axiovex-website','--body',value];const r=spawnSync('gh',args,{input:type==='secret'?value:undefined,encoding:'utf8'});if(r.status!==0)throw Error('Could not save GitHub '+name);}
const server=createServer(async(req,res)=>{
  res.setHeader('cache-control','no-store');res.setHeader('referrer-policy','no-referrer');res.setHeader('content-security-policy',"default-src 'none'; form-action https://github.com; frame-ancestors 'none'; base-uri 'none'");
  try{
    const url=new URL(req.url,'http://localhost:8769');
    if(req.method==='GET'&&url.pathname===`/setup/${nonce}`){res.setHeader('content-type','text/html;charset=utf-8');res.end(`<!doctype html><html lang="en"><title>Axiovex CI publisher setup</title><h1>Axiovex CI publisher</h1><p>Private, Axiovex-owned app. Repository contents: read/write; metadata: read. No workflow-administration, secret, organization, deletion or force-push bypass. No running local server is needed after setup.</p><pre>${esc(JSON.stringify(manifest,null,2))}</pre><form method="post" action="https://github.com/organizations/AXIOVEX/settings/apps/new?state=${state}"><input type="hidden" name="manifest" value="${esc(JSON.stringify(manifest))}"><button>Prepare GitHub App registration</button></form></html>`);return;}
    if(req.method==='GET'&&url.pathname==='/callback'){
      const received=url.searchParams.get('state')||'',code=url.searchParams.get('code');
      if(received.length!==state.length||!timingSafeEqual(Buffer.from(received),Buffer.from(state))||!code)throw Error('GitHub manifest state/code validation failed');
      const response=await fetch(`https://api.github.com/app-manifests/${encodeURIComponent(code)}/conversions`,{method:'POST',headers:{accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(30000)});
      if(!response.ok)throw Error('GitHub app conversion HTTP '+response.status);
      const app=await response.json();
      if(app.owner?.login?.toUpperCase()!=='AXIOVEX'||app.permissions?.contents!=='write'||Object.entries(app.permissions||{}).some(([k,v])=>!['contents','metadata'].includes(k)||k==='metadata'&&v!=='read')||!app.pem||!Number.isInteger(app.id)||!/^[a-z0-9-]+$/.test(app.slug||''))throw Error('GitHub app owner or permission validation failed');
      createPrivateKey(app.pem);
      gh('secret','AXIOVEX_PUBLISH_PRIVATE_KEY',app.pem);gh('variable','AXIOVEX_PUBLISH_APP_ID',String(app.id));gh('variable','AXIOVEX_PUBLISH_BOT_LOGIN',app.slug+'[bot]');
      saved={id:app.id,slug:app.slug,owner:app.owner.login,permissions:app.permissions,url:app.html_url,createdUtc:new Date().toISOString()};
      mkdirSync('ops-output',{recursive:true});writeFileSync('ops-output/publisher-registration.json',JSON.stringify(saved,null,2)+'\n');
      res.writeHead(303,{location:'/complete'}).end();console.log('Publisher app registered; private key saved directly to GitHub. '+app.html_url);return;
    }
    if(req.method==='GET'&&url.pathname==='/complete'&&saved){res.setHeader('content-type','text/html;charset=utf-8');res.end(`<!doctype html><html lang="en"><title>CI publisher registered</title><h1>CI publisher registered</h1><p>The private key is saved in Actions secrets. Install this app only on axiovex-website:</p><a href="https://github.com/apps/${saved.slug}/installations/new">Install on the website repository</a></html>`);server.close();return;}
    res.writeHead(404).end('Not found');
  }catch(e){console.error(e.message);res.writeHead(400).end('Registration not completed; check the local non-secret status.');}
});
server.listen(8769,'127.0.0.1',()=>console.log(`Open http://localhost:8769/setup/${nonce}`));setTimeout(()=>server.close(),30*60000).unref();
