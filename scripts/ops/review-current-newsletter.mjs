import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {localParts} from './calendar.mjs';
import {makeIssue} from './month-end.mjs';
const p=localParts(),date=`${p.year}-${p.month}-${p.day}`;
const signals=JSON.parse(readFileSync('data/signals.json')),geo=JSON.parse(readFileSync('data/geo/laus-county.json'));
const issue=makeIssue(signals,geo,{date,dataMonth:signals.pulse.referenceMonth});
issue.lede='Review test prepared from today’s source snapshots. Each measure retains its actual reference period. '+issue.lede;
const file=readdirSync('blog/posts').filter(f=>f.endsWith('.md')).sort().at(-1);
if(file){const source=readFileSync('blog/posts/'+file,'utf8');const field=name=>new RegExp('^'+name+':\\s*(.+)$','m').exec(source)?.[1];if(field('title')&&field('slug')&&field('date'))issue.article={title:field('title'),date:field('date'),url:`https://axiovexsystems.com/blog/${field('slug')}/`};}
mkdirSync('ops-output/email-review',{recursive:true});writeFileSync('ops-output/email-review/current-source.json',JSON.stringify(issue,null,2)+'\n');
execFileSync(process.execPath,['scripts/ops/preview-email.mjs','--kind','newsletter','--date',date,'--source','ops-output/email-review/current-source.json','--send'],{stdio:'inherit'});
