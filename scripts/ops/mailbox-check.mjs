import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const recipient='tristen@axiovexsystems.com',sender='newsletter@axiovexsystems.com';
export function inspectDelivery(message,{subject,sentAt}){
  const received=Date.parse(message.receivedDateTime),sent=Date.parse(sentAt);
  const html=message.body?.content||'';
  const tests={sender:message.from?.emailAddress?.address?.toLowerCase()===sender,recipient:message.toRecipients?.some(r=>r.emailAddress?.address?.toLowerCase()===recipient)===true,subject:message.subject===subject,fresh:Number.isFinite(received)&&Number.isFinite(sent)&&received>=sent-60000&&received<=Date.now()+60000,html:message.body?.contentType?.toLowerCase()==='html',tables:/<table\b/i.test(html),postal:/6633(?:\s|&nbsp;|<[^>]*>)+18 Mile Rd/i.test(html),reviewNotice:/REVIEW COPY|REVIEW ONLY/i.test(html)};
  return {pass:Object.values(tests).every(Boolean),tests,receivedAt:Number.isFinite(received)?new Date(received).toISOString():null,messageIdSHA256:createHash('sha256').update(message.id||'').digest('hex')};
}
export function verifyInboxReceipt(inbox,preview){
  const required=['sender','recipient','subject','fresh','html','tables','postal','reviewNotice'];
  if(!inbox?.pass||inbox.emailSHA256!==preview.emailSHA256||inbox.previewSentAt!==preview.sentAt||!required.every(k=>inbox.tests?.[k]===true))throw Error('Matching successful inbox delivery evidence is required before customer distribution');
}
async function token(){
  const client=process.env.NEWSLETTER_MAILBOX_CLIENT_ID,tenant=process.env.NEWSLETTER_MAILBOX_TENANT_ID,refresh=process.env.NEWSLETTER_MAILBOX_REFRESH_TOKEN;
  if(!/^[0-9a-f-]{36}$/.test(client||'')||tenant!=='7792b718-1c9e-4924-b52d-37b846119458'||!refresh)throw Error('Axiovex mailbox authorization is missing; run mailbox-authorize.mjs');
  const r=await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,{method:'POST',body:new URLSearchParams({client_id:client,grant_type:'refresh_token',refresh_token:refresh,scope:'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.Read offline_access'}),signal:AbortSignal.timeout(30000)});
  if(!r.ok)throw Error(`Microsoft mailbox token refresh HTTP ${r.status}; reauthorize if consent or session expired`);
  const body=await r.json();if(!body.access_token)throw Error('Microsoft did not return a mailbox access token');
  const age=Date.now()-Date.parse(process.env.NEWSLETTER_MAILBOX_AUTHORIZED_AT||'');
  if(age>75*86400000)console.log('::warning::Mailbox authorization is over 75 days old; renew the stored refresh token before its original session expires');
  return body.access_token;
}
async function main(){
  const access=await token();
  const headers={authorization:`Bearer ${access}`,Prefer:'outlook.body-content-type="html"'};
  const who=await fetch('https://graph.microsoft.com/v1.0/me?$select=userPrincipalName',{headers,signal:AbortSignal.timeout(20000)});
  if(!who.ok||(await who.json()).userPrincipalName?.toLowerCase()!==recipient)throw Error('Mailbox checker authorized account mismatch');
  if(process.argv[2]==='preflight'){
    const response=await fetch('https://graph.microsoft.com/v1.0/me/messages?$top=1&$select=id&$filter='+encodeURIComponent(`from/emailAddress/address eq '${sender}'`),{headers,signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw Error(`Microsoft mailbox read preflight HTTP ${response.status}`);
    mkdirSync('ops-output/email-review',{recursive:true});writeFileSync('ops-output/email-review/mailbox-preflight.json',JSON.stringify({authorized:true,mailbox:recipient,checkedUtc:new Date().toISOString(),permission:'Delegated read; no send/delete'},null,2)+'\n');
    console.log('Tristen mailbox identity and read permission verified; no email sent or changed.');return;
  }
  const receiptPath=process.argv[2]||'ops-output/email-review/newsletter-receipt.json';
  const preview=JSON.parse(readFileSync(receiptPath));
  const subject=preview.subject;
  if(preview.recipient!==recipient||preview.sent!==1||preview.httpStatus!==202||typeof subject!=='string'||!subject.startsWith('[REVIEW ONLY] ')||!Number.isFinite(Date.parse(preview.sentAt))||!preview.emailSHA256)throw Error('Expected the fixed-recipient preview send receipt');
  const filter=`receivedDateTime ge ${new Date(Date.parse(preview.sentAt)-60000).toISOString()} and from/emailAddress/address eq '${sender}' and subject eq '${subject.replaceAll("'","''")}'`;
  const query=new URLSearchParams({'$filter':filter,'$top':'25','$select':'id,subject,receivedDateTime,body,from,toRecipients'});
  const limit=Date.now()+120000;
  let last={pass:false,tests:{},receivedAt:null};
  while(Date.now()<limit){
    // /me/messages includes Inbox and Junk; no writes, moves or deletes.
    const r=await fetch('https://graph.microsoft.com/v1.0/me/messages?'+query,{headers,signal:AbortSignal.timeout(20000)});
    if(!r.ok)throw Error(`Microsoft mailbox search HTTP ${r.status}`);
    const data=await r.json();
    for(const message of data.value||[]){last=inspectDelivery(message,{subject,sentAt:preview.sentAt});if(last.pass)break;}
    if(last.pass)break;
    await new Promise(resolve=>setTimeout(resolve,10000));
  }
  const result={...last,checkedUtc:new Date().toISOString(),previewSentAt:preview.sentAt,emailSHA256:preview.emailSHA256,scope:'Tristen own mailbox; matching Axiovex review message only'};
  mkdirSync('ops-output/email-review',{recursive:true});writeFileSync('ops-output/email-review/inbox-receipt.json',JSON.stringify(result,null,2)+'\n');
  if(!last.pass)throw Error('Matching newsletter receipt/content not observed within two minutes; no inbox success claimed');
  console.log('Matching HTML newsletter received in Tristen mailbox; table, postal footer and review notice verified. No message content retained.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
