import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const dir = 'ops-output/annual-sources';
export const text = s => s.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#160;|&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
export function links(html, base) {
  return [...html.matchAll(/<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi)].map(m => ({ url: new URL(m[2].replaceAll('&amp;', '&'), base).href, text: text(m[3]) }));
}
export function blsTable(html) {
  const caption = text(html.match(/<caption\b[^>]*>([\s\S]*?)<\/caption>/i)?.[1] || '');
  const years = caption.match(/(20\d\d).*?(20\d\d)/);
  if (!years || +years[2] - +years[1] !== 10) throw Error('BLS ten-year table horizon missing');
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m => [...m[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c => text(c[1]))).filter(r => /^\d{2}-\d{4}$/.test(r[1]) && r[1] !== '00-0000');
  const selected = rows.slice(0, 5).map(r => ({ name: r[0].replace(/\(\d+\)/g, '').trim(), jobsChange: Math.round(Number(r[4].replaceAll(',', '')) * 1000), pctChange: Number(r[5].replaceAll(',', '')) }));
  if (selected.length !== 5 || selected.some(r => !r.name || !Number.isFinite(r.jobsChange) || !Number.isFinite(r.pctChange))) throw Error('BLS projection table schema changed');
  return { horizon: `${years[1]}–${years[2].slice(-2)}`, rows: selected };
}
async function main() {
  mkdirSync(dir, { recursive: true });
  const evidence = { checkedUtc: new Date().toISOString(), sources: [], failed: false };
  async function download(url, file, allow404 = false) {
    const r = await fetch(url, { signal: AbortSignal.timeout(90000) });
    if (allow404 && r.status === 404) { evidence.sources.push({ url, status: 404, state: 'not released' }); return null; }
    if (!r.ok) throw Error(`Annual source HTTP ${r.status}: ${url}`);
    const bytes = Buffer.from(await r.arrayBuffer());
    evidence.sources.push({ url, status: r.status, sha256: createHash('sha256').update(bytes).digest('hex') });
    if (file) writeFileSync(`${dir}/${file}`, bytes);
    return bytes;
  }
  const py = (...args) => execFileSync(process.env.PYTHON || 'python', ['scripts/ops/annual-tables.py', ...args], { stdio: 'inherit' });
  const save = (file, obj) => {
    const old = JSON.parse(readFileSync(file));
    if (JSON.stringify(old) !== JSON.stringify(obj)) writeFileSync(file, JSON.stringify(obj, null, 2) + '\n');
  };
  try {
    let outlook = JSON.parse(readFileSync('data/outlook.json'));
    const growing = blsTable((await download(outlook.blsProjections.sourceUrl, 'bls-growing.html')).toString());
    const declining = blsTable((await download(outlook.blsProjections.decliningTableUrl, 'bls-declining.html')).toString());
    if (growing.horizon !== declining.horizon) throw Error('BLS projection horizons differ');
    Object.assign(outlook.blsProjections, { rise: growing.rows, fall: declining.rows, horizon: growing.horizon, vintage: growing.horizon });
    const landingUrl = outlook.michiganProjections.sourceUrl;
    const mcdaLinks = links((await download(landingUrl, 'mcda.html')).toString(), landingUrl);
    for (const [i, s] of outlook.michiganOccupations.sourceFiles.entries()) {
      const suffix = i === 0 ? 'Michigan_Statewide' : 'Detroit_Metro_Prosperity_Region';
      const matches = mcdaLinks.filter(l => new RegExp(`LongTerm_OccupationProj_\\d{4}_${suffix}\\.xlsx`).test(l.url)).sort((a,b) => b.url.localeCompare(a.url));
      if (!matches.length) throw Error('MCDA current occupation workbook link absent');
      s.url = matches[0].url; s.file = new URL(s.url).pathname.split('/').at(-1);
      await download(s.url, `mcda-${i}.xlsx`);
    }
    const industry = mcdaLinks.find(l => /LongTerm_IndustryProj_\d{4}_Michigan_Statewide\.xlsx/.test(l.url));
    if (!industry) throw Error('MCDA current industry workbook absent');
    await download(industry.url, 'mcda-industry.xlsx');
    outlook.michiganProjections.sourceFileUrl = industry.url;
    save('data/outlook.json', outlook); py('mcda'); py('industry');

    const pseo = 'https://lehd.ces.census.gov/data/pseo/latest_release/mi/';
    for (const [remote, local] of [['version_pseo.txt','pseo-version.txt'],['pseo_mi_partners.txt','pseo-partners.txt'],['pseoe_mi.csv.gz','pseoe_mi.csv.gz'],['pseof_mi.csv.gz','pseof_mi.csv.gz']]) await download(pseo + remote, local);
    py('pseo');
    const ipeds = JSON.parse(readFileSync('data/geo/ipeds-institutions.json'));
    let year = Number(ipeds.source.match(/HD(20\d\d)/)?.[1]);
    if (!year) throw Error('IPEDS committed survey year absent');
    const next = year + 1;
    const hd = await download(`https://nces.ed.gov/ipeds/datacenter/data/HD${next}.zip`, null, true);
    const completions = await download(`https://nces.ed.gov/ipeds/datacenter/data/C${next}_A.zip`, null, true);
    if (hd && completions) { year = next; writeFileSync(`${dir}/ipeds-hd.zip`, hd); writeFileSync(`${dir}/ipeds-completions.zip`, completions); }
    else { await download(`https://nces.ed.gov/ipeds/datacenter/data/HD${year}.zip`, 'ipeds-hd.zip'); await download(`https://nces.ed.gov/ipeds/datacenter/data/C${year}_A.zip`, 'ipeds-completions.zip'); }
    py('ipeds', String(year));

    outlook = JSON.parse(readFileSync('data/outlook.json'));
    const teachers = outlook.education.figures.find(f => f.id === 'teacher-enrollees');
    const html = (await download(teachers.sourceUrl, 'teacher.html')).toString();
    const teacherRows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m => [...m[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c => text(c[1]))).filter(r => /^20\d\d[-–]\d{2}$/.test(r[0])).sort((a,b) => b[0].localeCompare(a[0]));
    const row = teacherRows[0];
    if (!row || row.length !== 4 || +row[1].replaceAll(',','') + +row[2].replaceAll(',','') !== +row[3].replaceAll(',','')) throw Error('MDE enrollment/completion table reconciliation failed');
    for (const [id,col] of [['teacher-enrollees',1],['teacher-completers',2]]) Object.assign(outlook.education.figures.find(f => f.id === id), { value: Number(row[col].replaceAll(',','')), valueText: row[col], period: row[0] });
    const treasury = 'https://www.michigan.gov/treasury/consensus-revenue-estimating-conference';
    const pupilLink = links((await download(treasury, 'treasury.html')).toString(), treasury).find(l => /^Pupil Count Estimates/i.test(l.text));
    if (!pupilLink) throw Error('Treasury current pupil estimate link missing');
    await download(pupilLink.url, 'pupils.pdf');
    writeFileSync(`${dir}/pupil-source.json`, JSON.stringify(pupilLink));
    save('data/outlook.json', outlook); py('pupils');
    const qcew = JSON.parse(readFileSync('data/geo/qcew-county-industry.json'));
    const candidate = new Date().getUTCFullYear() - 1;
    const probe = await download(`https://data.bls.gov/cew/data/api/${candidate}/a/area/26099.csv`, null, true);
    execFileSync(process.execPath, ['scripts/fetch-geo.mjs','qcew'], { stdio: 'inherit', env: { ...process.env, QCEW_YEAR: String(probe ? candidate : qcew.vintage.match(/20\d\d/)?.[0]), GEO_STATUS_FILE: `${dir}/qcew-status.json` } });
    if (JSON.parse(readFileSync(`${dir}/qcew-status.json`)).failed) throw Error('Annual QCEW collector retained last-good after a source failure');
  } catch (e) { evidence.failed = true; evidence.error = e.message; throw e; }
  finally { writeFileSync(`${dir}/status.json`, JSON.stringify(evidence, null, 2) + '\n'); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error(e.message); process.exitCode = 1; });
