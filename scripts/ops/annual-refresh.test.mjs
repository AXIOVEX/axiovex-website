import test from 'node:test';
import assert from 'node:assert/strict';
import { links, blsTable } from './annual-refresh.mjs';
test('official download links accept both quoting forms and decode query ampersands', () => {
  assert.deepEqual(links(`<a href='/file.xlsx?r=1&amp;x=2'>Current <b>table</b></a>`, 'https://www.michigan.gov/'), [{url:'https://www.michigan.gov/file.xlsx?r=1&x=2',text:'Current table'}]);
});
test('BLS projections preserve job units and reject ambiguous horizons', () => {
  const rows=Array.from({length:5},(_,i)=>`<tr><th>Occupation ${i}</th><td>29-117${i}</td><td>10</td><td>11.2</td><td>1.2</td><td>12</td></tr>`).join('');
  const html=`<caption>2025 and projected 2035 (Employment in thousands)</caption>${rows}`;
  assert.equal(blsTable(html).rows[0].jobsChange,1200);
  assert.equal(blsTable(html).horizon,'2025–35');
  assert.throws(()=>blsTable(html.replace('2035','2036')),/horizon/);
});
