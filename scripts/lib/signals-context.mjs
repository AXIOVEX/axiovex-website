// Arithmetic only: no causal claims, forecasts or invented source periods.
export function signalsContext(fred, county) {
  const items = [];
  const series = fred?.series?.find(s => s.id === 'IPMAN');
  const rows = (series?.observations || []).filter(o => Number.isFinite(o.value) && /^\d{4}-\d{2}-\d{2}$/.test(o.period)).sort((a, b) => a.period.localeCompare(b.period));
  const latest = rows.at(-1), previous = rows.at(-2);
  if (latest && previous && previous.value > 0) {
    const month = new Date(latest.period + 'T00:00:00Z');
    month.setUTCMonth(month.getUTCMonth() - 1);
    if (month.toISOString().slice(0, 7) === previous.period.slice(0, 7)) {
      const change = (latest.value / previous.value - 1) * 100;
      items.push({ text: `U.S. manufacturing production ${change > 0 ? 'rose' : change < 0 ? 'fell' : 'was unchanged by'} ${Math.abs(change).toFixed(1)}% from ${previous.period.slice(0, 7)} to ${latest.period.slice(0, 7)} (FRED IPMAN, seasonally adjusted). This is national context, not a Michigan measure.`, url: 'https://fred.stlouisfed.org/series/IPMAN', source: 'FRED IPMAN' });
    }
  }
  const counties = county?.counties?.filter(c => Number.isFinite(c.rate));
  if (counties?.length === 83 && /^\d{4}-\d{2}$/.test(county.referenceMonth)) {
    const sorted = [...counties].sort((a, b) => a.rate - b.rate);
    const low = sorted[0].rate, high = sorted.at(-1).rate;
    const names = rate => sorted.filter(c => c.rate === rate).map(c => c.name).join(', ');
    items.push({ text: `Across all 83 Michigan counties in ${county.referenceMonth}, unemployment ranged from ${low.toFixed(1)}% (${names(low)}) to ${high.toFixed(1)}% (${names(high)}), a ${(high - low).toFixed(1)} percentage-point spread (BLS LAUS, not seasonally adjusted${county.preliminary ? ', preliminary' : ''}).`, url: 'https://www.bls.gov/lau/', source: 'BLS county data' });
  }
  return items;
}
