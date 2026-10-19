import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectDelivery,verifyInboxReceipt} from './mailbox-check.mjs';
test('inbox evidence rejects stale, wrong-recipient and plaintext messages',()=>{
  const sentAt=new Date().toISOString(),subject='[REVIEW ONLY] Current newsletter';
  const message={id:'opaque',subject,receivedDateTime:sentAt,from:{emailAddress:{address:'newsletter@axiovexsystems.com'}},toRecipients:[{emailAddress:{address:'tristen@axiovexsystems.com'}}],body:{contentType:'html',content:'<table><tr><td>REVIEW COPY — 6633 18 Mile Rd</td></tr></table>'}};
  assert.equal(inspectDelivery(message,{subject,sentAt}).pass,true);
  assert.equal(inspectDelivery({...message,receivedDateTime:'2000-01-01T00:00:00Z'},{subject,sentAt}).pass,false);
  assert.equal(inspectDelivery({...message,toRecipients:[]},{subject,sentAt}).pass,false);
  assert.equal(inspectDelivery({...message,body:{contentType:'text',content:'Markdown newsletter'}},{subject,sentAt}).pass,false);
});
test('customer release requires evidence for this exact preview, not a prior edition',()=>{
  const preview={emailSHA256:'hash',sentAt:'today'};
  const inbox={pass:true,emailSHA256:'hash',previewSentAt:'today',tests:Object.fromEntries(['sender','recipient','subject','fresh','html','tables','postal','reviewNotice'].map(k=>[k,true]))};
  assert.doesNotThrow(()=>verifyInboxReceipt(inbox,preview));
  assert.throws(()=>verifyInboxReceipt({...inbox,emailSHA256:'old'},preview));
  assert.throws(()=>verifyInboxReceipt({...inbox,previewSentAt:'yesterday'},preview));
  assert.throws(()=>verifyInboxReceipt({...inbox,tests:{}},preview));
});
