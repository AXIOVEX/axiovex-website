import test from 'node:test';
import assert from 'node:assert/strict';
import { links, blsTable, blsApiTable } from './annual-refresh.mjs';
test('official download links accept both quoting forms and decode query ampersands', () => {
  assert.deepEqual(links(`<a href='/file.xlsx?r=1&amp;x=2'>Current <b>table</b></a>`, 'https://www.michigan.gov/'), [{url:'https://www.michigan.gov/file.xlsx?r=1&x=2',text:'Current table'}]);
});
test('API fallback requires every occupation, named measures and the verified release year',()=>{
  const catalog={baseYear:2025,projectionYear:2035,rows:[{id:'EPU291171TE1000',name:'Nurse practitioners'}]};
  const series=[{seriesID:catalog.rows[0].id,data:[{year:'2025',period:'A01',value:'336.3',aspects:[{name:'Numerical employment change',value:'137.8'},{name:'Percent employment change',value:'41'},{name:'Projected employment',value:'474.1'}]}]}];
  assert.equal(blsApiTable(catalog,series).rise[0].jobsChange,137800);
  assert.throws(()=>blsApiTable(catalog,[]),/coverage/);
  const next=structuredClone(series);next[0].data[0].year='2026';assert.throws(()=>blsApiTable(catalog,next),/universe/);
  const missing=structuredClone(series);missing[0].data[0].aspects[0].value='';assert.throws(()=>blsApiTable(catalog,missing),/reconcile/);
});
test('BLS projections preserve job units and reject ambiguous horizons', () => {
  const rows=Array.from({length:5},(_,i)=>`<tr><th>Occupation ${i}</th><td>29-117${i}</td><td>10</td><td>11.2</td><td>1.2</td><td>12</td></tr>`).join('');
  const html=`<caption>2025 and projected 2035 (Employment in thousands)</caption>${rows}`;
  assert.equal(blsTable(html).rows[0].jobsChange,1200);
  assert.equal(blsTable(html).horizon,'2025–35');
  assert.throws(()=>blsTable(html.replace('2035','2036')),/horizon/);
});
