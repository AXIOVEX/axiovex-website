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
 *     PROCESS CODE CONFIRMED 2026-10-08 (first keyed run): the route's
 *     own facet metadata (GET /v2/natural-gas/pri/sum/facet/process/,
 *     key required) lists PIN = "Industrial Price" — pinned below as
 *     NG_PROCESS. The earlier documented-pattern candidates (PIS, PDS,
 *     PDM) do not exist on this route; the sibling codes check out
 *     (PRS = "Price Delivered to Residential Consumers"). duoarea SMI
 *     verified live the same day (PRS + SMI returns Michigan rows).
 *     If the pinned code ever returns no rows the module throws, so a
 *     vocabulary change fails loudly instead of publishing an empty
 *     or wrong series.
 *
 * Probe (2026-10-08, placeholder key): both routes returned a
 * structured HTTP 403 { error: { code: 'API_KEY_INVALID' } } from
 * api.eia.gov — endpoints live, key required. Key registered and
 * verified end-to-end 2026-10-08.
 */
const LENGTH = 24;
const NG_PROCESS = 'PIN'; // "Industrial Price" per the route's facet metadata (confirmed 2026-10-08)

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

    // (b) Industrial natural gas price, Michigan (process code PIN,
    // confirmed against the route's facet metadata 2026-10-08).
    const gasJson = await ctx.get(eiaUrl('natural-gas/pri/sum', key, [
      ['frequency', 'monthly'],
      ['data[0]', 'value'],
      ['facets[duoarea][]', 'SMI'],
      ['facets[process][]', NG_PROCESS],
      ['sort[0][column]', 'period'],
      ['sort[0][direction]', 'desc'],
      ['length', String(LENGTH)],
    ]));
    const gasObs = toObservations(rowsOf(gasJson), 'value');
    if (!gasObs.length) {
      throw new Error('EIA natural-gas/pri/sum returned no Michigan rows for process ' +
        NG_PROCESS + ' (PIN, Industrial Price) — facet vocabulary may have changed, see module header');
    }

    const latest = obs => obs[obs.length - 1].period;
    return {
      vintage: 'EIA API v2 monthly series, latest ' + LENGTH + ' months per series',
      referencePeriod: [latest(elecObs), latest(gasObs)].sort().pop(),
      series: [
        { id: 'elec-industrial-mi', label: 'Average retail price of electricity, industrial sector, Michigan', unit: 'Cents per kilowatt-hour', observations: elecObs },
        { id: 'gas-industrial-mi', label: 'Price of natural gas delivered to industrial consumers, Michigan', unit: 'Dollars per thousand cubic feet', observations: gasObs },
      ],
      notes: 'Electricity route/facets per EIA v2 docs (stateid=MI, sectorid=IND, data=price, cents/kWh). Natural gas: duoarea=SMI (Michigan), process=PIN ("Industrial Price") — confirmed 2026-10-08 against the route\'s keyed facet metadata (GET /v2/natural-gas/pri/sum/facet/process/); duoarea verified live via PRS (residential) rows the same day. Key registered + verified end-to-end 2026-10-08.',
    };
  },
};
