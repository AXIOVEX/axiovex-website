import { createServer } from 'node:http';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const tenant='7792b718-1c9e-4924-b52d-37b846119458';
const clientId=process.argv[2];
if(!/^[0-9a-f-]{36}$/.test(clientId||'')) throw Error('Pass the verified delivery-verification app client ID');
const redirect='http://localhost:8768/callback';
const nonce=randomBytes(24).toString('hex'),state=randomBytes(32).toString('hex'),verifier=randomBytes(32).toString('base64url');
const scope='openid profile offline_access https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.Read';
let complete=false;
function gh(type,name,value){const args=type==='secret'?['secret','set',name,'--repo','AXIOVEX/axiovex-website']:['variable','set',name,'--repo','AXIOVEX/axiovex-website','--body',value];const r=spawnSync('gh',args,{input:type==='secret'?value:undefined,encoding:'utf8'});if(r.status!==0)throw Error('Could not save GitHub '+name);}
const server=createServer(async(req,res)=>{
  res.setHeader('cache-control','no-store');res.setHeader('referrer-policy','no-referrer');res.setHeader('content-security-policy',"default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  try{
    const url=new URL(req.url,redirect);
    if(req.method==='GET'&&url.pathname===`/start/${nonce}`){
      const params=new URLSearchParams({client_id:clientId,response_type:'code',redirect_uri:redirect,response_mode:'query',scope,state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256',login_hint:'tristen@axiovexsystems.com',prompt:'consent'});
      res.writeHead(303,{location:`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}`}).end();return;
    }
    if(req.method==='GET'&&url.pathname==='/callback'){
      const got=url.searchParams.get('state')||'';
      if(got.length!==state.length||!timingSafeEqual(Buffer.from(got),Buffer.from(state))||!url.searchParams.get('code'))throw Error('Microsoft OAuth was not authorized or state validation failed');
      const response=await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,{method:'POST',body:new URLSearchParams({client_id:clientId,grant_type:'authorization_code',code:url.searchParams.get('code'),redirect_uri:redirect,code_verifier:verifier,scope}),signal:AbortSignal.timeout(30000)});
      if(!response.ok)throw Error('Microsoft token exchange HTTP '+response.status);
      const token=await response.json();
      if(!token.refresh_token||!token.access_token||!String(token.scope).split(' ').some(s=>s.endsWith('Mail.Read')))throw Error('Microsoft did not return the authorized read scope and refresh token');
      const who=await fetch('https://graph.microsoft.com/v1.0/me?$select=id,userPrincipalName',{headers:{authorization:`Bearer ${token.access_token}`},signal:AbortSignal.timeout(20000)});
      if(!who.ok||(await who.json()).userPrincipalName?.toLowerCase()!=='tristen@axiovexsystems.com')throw Error('The authorized mailbox must be Tristen at Axiovex');
      gh('secret','NEWSLETTER_MAILBOX_REFRESH_TOKEN',token.refresh_token);
      gh('variable','NEWSLETTER_MAILBOX_CLIENT_ID',clientId);gh('variable','NEWSLETTER_MAILBOX_TENANT_ID',tenant);gh('variable','NEWSLETTER_MAILBOX_AUTHORIZED_AT',new Date().toISOString());
      complete=true;res.writeHead(303,{location:'/complete'}).end();console.log('Tristen mailbox read authorization saved to GitHub. No token printed.');return;
    }
    if(req.method==='GET'&&url.pathname==='/complete'&&complete){res.setHeader('content-type','text/html;charset=utf-8');res.end('<!doctype html><html lang="en"><title>Mailbox verification authorized</title><h1>Mailbox verification authorized</h1><p>The read-only credential was saved to GitHub Actions secrets. No email was sent or modified.</p></html>');server.close();return;}
    res.writeHead(404).end('Not found');
  }catch(e){console.error(e.message);res.writeHead(400).end('Authorization not completed. See the local non-secret status.');}
});
server.listen(8768,'127.0.0.1',()=>console.log(`Open http://localhost:8768/start/${nonce}`));
setTimeout(()=>server.close(),30*60000).unref();
