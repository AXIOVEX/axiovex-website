import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { localParts, midnight, shift } from './calendar.mjs';
export const linkedinPolicy = JSON.parse(readFileSync(new URL('../../data/linkedin-policy.json', import.meta.url)));
export function companyDue(personalAt) {
  const p = localParts(new Date(personalAt));
  let date = `${p.year}-${p.month}-${p.day}`;
  for (let n = 1; n <= 7; n++) {
    date = shift(date, 1);
    if (localParts(new Date(date + 'T12:00:00Z')).weekday === 'Tue') return new Date(Date.parse(midnight(date)) + 9.5 * 3600000).toISOString();
  }
}
export function dueTarget(record, now = new Date()) {
  if (record.personal?.status !== 'published') {
    // Noon and 10:30 have the same ET offset, including transition Sundays.
    const noon = new Date(record.date + 'T16:00:00Z');
    const offset = Number(localParts(noon).hour) - 16;
    const releaseAt = Date.parse(record.date + 'T10:30:00Z') - offset * 3600000;
    return now.getTime() >= releaseAt ? 'personal' : null;
  }
  if (record.company?.status !== 'published' && now.getTime() >= Date.parse(companyDue(record.personal.publishedAt))) return 'company';
  return null;
}
export function postPayload(record, target, personUrn) {
  if (!/^urn:li:person:[A-Za-z0-9_-]+$/.test(personUrn || '')) throw new Error('Missing or invalid authorized LinkedIn member identity');
  if (!/^https:\/\/axiovexsystems\.com\/blog\/[a-z0-9-]+\/$/.test(record.articleUrl || '') || !record.authorization || !record.sourceSHA256 || !/^\d{4}-\d{2}$/.test(record.dataMonth)) throw new Error('Invalid source-bound publication record');
  if (!['personal', 'company'].includes(target)) throw new Error('Invalid publishing target');
  const commentary = record[target]?.commentary;
  if (typeof commentary !== 'string' || !commentary.trim() || commentary.length > 3000) throw new Error('Invalid LinkedIn commentary');
  const payload = { author: target === 'personal' ? personUrn : linkedinPolicy.organizationUrn, commentary, visibility: 'PUBLIC', distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] }, lifecycleState: 'PUBLISHED', isReshareDisabledByAuthor: false };
  if (target === 'company') {
    if (!/^urn:li:(share|ugcPost):\d+$/.test(record.personal?.postUrn || '')) throw new Error('Company reshare requires accepted personal post ID');
    payload.reshareContext = { parent: record.personal.postUrn };
  } else payload.content = { article: { source: record.articleUrl, title: record.title } };
  return payload;
}
function gh(route) { return JSON.parse(execFileSync('gh', ['api', `repos/${process.env.GITHUB_REPOSITORY || 'AXIOVEX/axiovex-website'}/${route}`], { encoding: 'utf8' })); }
async function main() {
  mkdirSync('ops-output/linkedin', { recursive: true });
  const mode = process.argv[2] || 'plan';
  if (!['plan', 'reserve', 'publish', 'preflight'].includes(mode)) throw new Error('Expected plan, reserve, publish or preflight');
  const entries = existsSync('data/publications') ? readdirSync('data/publications').filter(f => /^\d{4}-\d{2}\.json$/.test(f)).sort() : [];
  const due = entries.map(file => ({ file, record: JSON.parse(readFileSync(`data/publications/${file}`, 'utf8')) })).map(e => ({ ...e, target: dueTarget(e.record) })).find(e => e.target);
  if (mode === 'preflight') {
    const missing = ['LINKEDIN_ACCESS_TOKEN', 'LINKEDIN_PERSON_URN'].filter(k => !process.env[k]);
    const expiry = Date.parse(process.env.LINKEDIN_EXPIRES_AT || '');
    if (!Number.isFinite(expiry) || expiry <= Date.now()) missing.push('valid LINKEDIN_EXPIRES_AT');
    if (missing.length) throw new Error('LinkedIn authorization required: ' + missing.join(', '));
    const r = await fetch('https://api.linkedin.com/v2/userinfo', { headers: { authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}` }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error(`LinkedIn identity check HTTP ${r.status}`);
    const profile = await r.json();
    if (`urn:li:person:${profile.sub}` !== process.env.LINKEDIN_PERSON_URN || profile.name !== linkedinPolicy.expectedMemberName) throw new Error('LinkedIn authorized identity mismatch');
    const targets = due?.target === 'company' || process.env.LINKEDIN_COMPANY_ACCESS_TOKEN ? ['personal','company'] : ['personal'];
    for (const target of targets) {
      const prefix = target === 'company' ? 'LINKEDIN_COMPANY_' : 'LINKEDIN_';
      const token = process.env[prefix+'ACCESS_TOKEN'], clientSecret = process.env[prefix+'CLIENT_SECRET'];
      const clientId = target === 'company' ? linkedinPolicy.companyClientId : linkedinPolicy.clientId;
      if (!token || !clientSecret) throw Error(`LinkedIn ${target} credentials required before reserving any publication attempt`);
      const response = await fetch('https://www.linkedin.com/oauth/v2/introspectToken', { method:'POST', body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,token}),signal:AbortSignal.timeout(20000) });
      if (!response.ok) throw Error(`LinkedIn ${target} token inspection HTTP ${response.status}`);
      const info = await response.json();
      const required = target === 'company' ? 'w_organization_social' : 'w_member_social';
      if (!info.active || info.client_id !== clientId || !String(info.scope).split(/[ ,]+/).includes(required) || !Number.isFinite(Number(info.expires_at)) || info.expires_at*1000 <= Date.now()) throw Error(`LinkedIn ${target} token lacks active publishing scope`);
      if (info.expires_at*1000-Date.now()<14*86400000) console.log(`::warning::LinkedIn ${target} token expires within 14 days; reauthorize`);
    }
    const result = { authorized: true, member: profile.name, expiresAt: new Date(expiry).toISOString(), organizationUrn: linkedinPolicy.organizationUrn, companyProductApproval: 'Required separately; personal authorization is not proof of company posting permission' };
    writeFileSync('ops-output/linkedin/preflight.json', JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result));
    if (expiry - Date.now() < 14 * 86400000) console.log('::warning::LinkedIn token expires within 14 days; reauthorize before the next release');
    return;
  }
  if (mode === 'plan') {
    if (due?.record[due.target]?.attemptRun) throw Error('Prior LinkedIn attempt is unresolved; reconcile the stored record before retrying');
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `due=${Boolean(due)}\nreservation=${due ? `linkedin-attempt-${due.record.dataMonth}-${due.target}` : ''}\n`);
    console.log(JSON.stringify(due ? { dataMonth: due.record.dataMonth, target: due.target, articleUrl: due.record.articleUrl } : { due: false })); return;
  }
  if (!due) { console.log('No LinkedIn publication due.'); return; }
  const attemptRun = `${process.env.GITHUB_RUN_ID}:${process.env.GITHUB_RUN_ATTEMPT}`;
  if (mode === 'reserve') {
    if (!process.env.GITHUB_RUN_ID || !process.env.GITHUB_RUN_ATTEMPT || due.record[due.target].attemptRun) throw Error('Missing run identity or prior durable attempt exists');
    due.record[due.target].attemptRun = attemptRun;
    writeFileSync(`data/publications/${due.file}`, JSON.stringify(due.record,null,2)+'\n');
    return;
  }
  if (due.record[due.target].attemptRun !== attemptRun) throw Error('Durable publication reservation does not match this run attempt');
  const accessToken = due.target === 'company' ? process.env.LINKEDIN_COMPANY_ACCESS_TOKEN : process.env.LINKEDIN_ACCESS_TOKEN;
  const expires = due.target === 'company' ? process.env.LINKEDIN_COMPANY_EXPIRES_AT : process.env.LINKEDIN_EXPIRES_AT;
  if (!accessToken || !Number.isFinite(Date.parse(expires)) || Date.parse(expires) <= Date.now()) throw new Error('Valid LinkedIn ' + due.target + ' authorization is missing');
  const reservation = `linkedin-attempt-${due.record.dataMonth}-${due.target}`;
  const artifacts = gh(`actions/artifacts?name=${reservation}&per_page=100`).artifacts || [];
  const reservedHere = artifacts.some(a => String(a.workflow_run?.id) === process.env.GITHUB_RUN_ID);
  if (!reservedHere || artifacts.some(a => String(a.workflow_run?.id) !== process.env.GITHUB_RUN_ID)) throw new Error('Publication refused: missing reservation or a prior uncertain attempt exists');
  const r = await fetch(due.record.articleUrl, { signal: AbortSignal.timeout(20000) });
  if (!r.ok || !(await r.text()).includes(due.record.title)) throw new Error('Article must be live before social publication');
  const payload = postPayload(due.record, due.target, process.env.LINKEDIN_PERSON_URN);
  const response = await fetch('https://api.linkedin.com/rest/posts', { method: 'POST', headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json', 'LinkedIn-Version': linkedinPolicy.apiVersion, 'X-Restli-Protocol-Version': '2.0.0' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(30000) });
  const postUrn = response.headers.get('x-restli-id');
  // No automatic POST retry: a timeout or ambiguous response retains reservation.
  if (response.status !== 201 || !/^urn:li:(share|ugcPost):\d+$/.test(postUrn || '')) throw new Error(`LinkedIn did not confirm creation (HTTP ${response.status}); inspect reservation before any retry`);
  due.record[due.target] = { ...due.record[due.target], status: 'published', postUrn, publishedAt: new Date().toISOString(), url: `https://www.linkedin.com/feed/update/${postUrn}/` };
  writeFileSync(`data/publications/${due.file}`, JSON.stringify(due.record, null, 2) + '\n');
  writeFileSync('ops-output/linkedin/receipt.json', JSON.stringify({ target: due.target, dataMonth: due.record.dataMonth, httpStatus: 201, postUrn, url: due.record[due.target].url, reservedRun: process.env.GITHUB_RUN_ID }, null, 2) + '\n');
  console.log('LinkedIn accepted one post; receipt saved.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error(e.message); process.exitCode = 1; });
