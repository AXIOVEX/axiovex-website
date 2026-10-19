import { readFileSync, existsSync } from 'node:fs';
export function economicContext() {
  const sources = JSON.parse(readFileSync('data/report-sources.json', 'utf8'));
  const rows = [], readings = [];
  for (const source of sources.filter(s => s.output.startsWith('data/pack/'))) {
    if (!existsSync(source.output)) { rows.push(`| ${source.publisher} | Unavailable | No snapshot |`); continue; }
    const data = JSON.parse(readFileSync(source.output, 'utf8'));
    const configured = !!process.env[source.secret];
    rows.push(`| ${source.publisher} | ${data.referencePeriod || 'Mixed; see vintage'} | Retrieved ${data.retrievedUtc}; ${configured ? 'refresh configured' : 'API key absent; retained snapshot'} |`);
    // Scalar time-series values only: never silently aggregate counties, schools,
    // occupations or incompatible units into a made-up statewide statistic.
    for (const series of (data.series || []).slice(0, 2)) {
      const latest = series.observations?.filter(o => Number.isFinite(o.value)).at(-1);
      if (latest) readings.push(`- ${data.source}: ${series.label} — ${latest.value.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${series.unit || ''}, period ${latest.period}.`);
    }
  }
  return `## Economic source coverage\n\nThese are the economic analysis inputs, separate from Cloudflare traffic. Sources have different release calendars. Quarterly/annual data are context, not a missing current-month release; older values are never relabeled as the target month.\n\n| Publisher | Published reference period | Snapshot / configuration |\n|---|---|---|\n${rows.join('\n')}\n\n### Published context readings\n\n${readings.join('\n')}\n\nFull per-series vintages and raw snapshots are retained in the report artifact. No causal conclusions are inferred from these figures.\n`;
}
