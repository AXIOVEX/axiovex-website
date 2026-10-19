import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {localParts} from './calendar.mjs';
import {makeIssue,checkEconomicData} from './month-end.mjs';
export function makeReviewIssue(signals,geo,date){
  const dataMonth=signals.pulse?.tiles?.[0]?.trend?.at(-1)?.ym;
  if(!/^\d{4}-\d{2}$/.test(dataMonth||''))throw Error('A numeric published source month is required for the review');
  const problems=checkEconomicData(signals,geo,dataMonth);
  if(problems.length)throw Error('Review sources are not coherent: '+problems.join('; '));
  const issue=makeIssue(signals,geo,{date,dataMonth});
  issue.lede='Review test prepared from today’s source snapshots. Each measure retains its actual reference period. '+issue.lede;
  return issue;
}
function main(){
const p=localParts(),date=`${p.year}-${p.month}-${p.day}`;
const signals=JSON.parse(readFileSync('data/signals.json')),geo=JSON.parse(readFileSync('data/geo/laus-county.json'));
const issue=makeReviewIssue(signals,geo,date);
const file=readdirSync('blog/posts').filter(f=>f.endsWith('.md')).sort().at(-1);
if(file){const source=readFileSync('blog/posts/'+file,'utf8');const field=name=>new RegExp('^'+name+':\\s*(.+)$','m').exec(source)?.[1];if(field('title')&&field('slug')&&field('date'))issue.article={title:field('title'),date:field('date'),url:`https://axiovexsystems.com/blog/${field('slug')}/`};}
mkdirSync('ops-output/email-review',{recursive:true});writeFileSync('ops-output/email-review/current-source.json',JSON.stringify(issue,null,2)+'\n');
execFileSync(process.execPath,['scripts/ops/preview-email.mjs','--kind','newsletter','--date',date,'--source','ops-output/email-review/current-source.json',...(process.argv.includes('--send')?['--send']:[])],{stdio:'inherit'});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main();
