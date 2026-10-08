/*
 * pack/eia.mjs — EIA Open Data API v2 (api.eia.gov), spec 019 FR-008.
 *
 * (a) Industrial electricity price, Michigan — route documented in the
 *     EIA v2 API documentation and used verbatim:
 *       GET /v2/electricity/retail-sales/data/
 *         ?api_key=<key>&frequency=monthly&data[0]=price
 *         &facets[stateid][]=MI&facets[sectorid][]=IND
 *         &sort[0][column]=period&sort[0][direction]=desc&length=24
 *     `price` is in cents per kilowatt-hour. Response rows arrive under
 *     response.data with { period: 'YYYY-MM', price, ... }.
 *
 * (b) Industrial natural gas price, Michigan:
 *       GET /v2/natural-gas/pri/sum/data/
 *         ?api_key=<key>&frequency=monthly&data[0]=value
 *         &facets[duoarea][]=SMI&facets[process][]=<process>
 *         &sort… desc&length=24
 *     duoarea: state areas are 'S' + postal code — SMI = Michigan
 *     (attested in EIA's own Michigan price pages / series naming).
 *     Values are dollars per thousand cubic feet ($/Mcf).
 *     PROCESS CODE UNCONFIRMED: EIA docs confirm the sibling code PRS =
 *     price of natural gas delivered to residential consumers on this
 *     route, but the industrial-sector code could not be confirmed
 *     from the documentation without a key (the route's facet listing
 *     itself requires a key). This module tries the documented-pattern
 *     candidates in order — PIS, PDS, PDM — and uses the first that
 *     returns rows, recording which code succeeded in `notes`. If none
 *     returns rows it throws, so a wrong guess fails loudly instead of
 *     publishing an empty or wrong series. Confirm the code on the
 *     first keyed run (GET /v2/natural-gas/pri/sum/ facet metadata)
 *     and pin it here.
 *
 * Probe (2026-10-08, placeholder key): both routes returned a
 * structured HTTP 403 { error: { code: 'API_KEY_INVALID' } } from
 * api.eia.gov — endpoints live, key required. KEY PENDING
 * (EIA_API_KEY not yet registered); not verified end-to-end.
 */
const LENGTH = 24;
const NG_PROCESS_CANDIDATES = ['PIS', 'PDS', 'PDM'];

function eiaUrl(route, key, params) {
  const qs = params.map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
  return 'https://api.eia.gov/v2/' + route + '/data/?api_key=' + encodeURIComponent(key) + '&' + qs;
}
function rowsOf(json) {
  return json && json.response && Array.isArray(json.response.data) ? json.response.data : [];
}
function toObservations(rows, field) {
  return rows
    .map(r => ({ period: r.period, value: Number(r[field]) }))
    .filter(o => o.period && Number.isFinite(o.value))
    .sort((a, b) => (a.period < b.period ? -1 : a.period > b.period ? 1 : 0));
}

export default {
  id: 'eia',
  name: 'EIA',
  publisher: 'U.S. Energy Information Administration',
  requiresKey: 'EIA_API_KEY',
  async fetch(ctx) {
    const key = ctx.env.EIA_API_KEY;

    // (a) Industrial electricity price, Michigan.
    const elecJson = await ctx.get(eiaUrl('electricity/retail-sales', key, [
      ['frequency', 'monthly'],
      ['data[0]', 'price'],
      ['facets[stateid][]', 'MI'],
      ['facets[sectorid][]', 'IND'],
      ['sort[0][column]', 'period'],
      ['sort[0][direction]', 'desc'],
      ['length', String(LENGTH)],
    ]));
    const elecObs = toObservations(rowsOf(elecJson), 'price');
    if (!elecObs.length) throw new Error('EIA electricity/retail-sales returned no Michigan industrial price rows');

    // (b) Industrial natural gas price, Michigan (process-code fallback chain).
    let gasObs = [];
    let gasProcess = null;
    for (const proc of NG_PROCESS_CANDIDATES) {
      const gasJson = await ctx.get(eiaUrl('natural-gas/pri/sum', key, [
        ['frequency', 'monthly'],
        ['data[0]', 'value'],
        ['facets[duoarea][]', 'SMI'],
        ['facets[process][]', proc],
        ['sort[0][column]', 'period'],
        ['sort[0][direction]', 'desc'],
        ['length', String(LENGTH)],
      ]));
      const obs = toObservations(rowsOf(gasJson), 'value');
      if (obs.length) { gasObs = obs; gasProcess = proc; break; }
    }
    if (!gasObs.length) {
      throw new Error('EIA natural-gas/pri/sum returned no Michigan rows for any candidate process code (' +
        NG_PROCESS_CANDIDATES.join(', ') + ') — process code unconfirmed, see module header');
    }

    const latest = obs => obs[obs.length - 1].period;
    return {
      vintage: 'EIA API v2 monthly series, latest ' + LENGTH + ' months per series',
      referencePeriod: [latest(elecObs), latest(gasObs)].sort().pop(),
      series: [
        { id: 'elec-industrial-mi', label: 'Average retail price of electricity, industrial sector, Michigan', unit: 'Cents per kilowatt-hour', observations: elecObs },
        { id: 'gas-industrial-mi', label: 'Price of natural gas delivered to industrial consumers, Michigan', unit: 'Dollars per thousand cubic feet', observations: gasObs },
      ],
      notes: 'Electricity route/facets per EIA v2 docs (stateid=MI, sectorid=IND, data=price, cents/kWh). Natural gas: duoarea=SMI (Michigan); industrial process code NOT confirmed from docs without a key — this pull used process="' + gasProcess + '" (first of the candidate chain ' + NG_PROCESS_CANDIDATES.join(' → ') + ' that returned rows); verify against the route facet metadata on the first keyed run and pin the confirmed code in scripts/pack/eia.mjs. KEY PENDING at first write (2026-10-08): both routes probed live (structured 403 API_KEY_INVALID for placeholder key).',
    };
  },
};
