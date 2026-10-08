# Spec 019 — External data sources (Tier 1 + Tier 2)

**Direction:** Tristen Pierson, 2026-10-08 — "Wire Tier 1 + Tier 2 now."
**Status:** In implementation, 2026-10-08. Per-source verified status is
reported at closeout; a source that could not be verified live is NOT
recorded as wired.

## Scope

DATA-ONLY. This spec adds data ingest and analysis inputs. It changes
no page layout, design, or copy, so the wireframe gate is not
triggered. The two surface-adjacent pieces follow existing discipline
exactly:

- Signals lane additions follow spec 004 discipline (source + headline
  + date only, link out, 45-day age cap, lane cap, last-good on
  failure) — precedent: Michigan WARN, spec 004 FR-011, commit
  `5d1d10e`.
- The analysis pack (`data/pack/*.json`) is an internal analysis
  input. Pack figures are never published verbatim as claims; any
  figure used in an article or report is cited to its publisher with
  its vintage/reference period, per the claims discipline in the
  constitution and the in-depth numbers rule (2026-10-08).

## The analysis pack

`scripts/fetch-pack.mjs` (dependency-free Node, same style as
`scripts/fetch-signals.mjs`) runs one module per source from
`scripts/pack/` and writes a committed snapshot per source to
`data/pack/<source>.json`. Every snapshot carries: source name,
publisher, `retrievedUtc`, vintage / reference-period labels, and the
series data. Per-source failure keeps the last-good file and is
logged; the run exits non-zero only if every attempted source fails.
A weekly GitHub workflow (`.github/workflows/data-pack-sync.yml`,
modeled on `signals-sync.yml`) runs it and commits changes. The
workforce drafting flow (spec 007) reads these files as evidence
inputs.

API keys live ONLY in `~/workspace/system/data-apis/.env` (mode 600)
on the operations machine, registered to tristen.pierson@gmail.com.
Keys are never committed, printed, or logged; they are referred to by
variable name and presence only. For CI parity the same values are
also stored as GitHub repository secrets under the same names; a
missing key makes the runner skip that source (logged), never fail
the pack.

## Functional requirements

- **FR-001 — JOLTS (BLS).** Michigan job openings and layoffs &
  discharges from the Job Openings and Labor Turnover Survey, via the
  BLS public API already used for Michigan Pulse (spec 004). No new
  key. Feeds the analysis pack. Series IDs must be verified against
  BLS directly; if BLS does not expose state JOLTS series through the
  public API, the FR is parked with that finding recorded rather than
  filled from an unofficial mirror.
- **FR-002 — FRED (Federal Reserve Bank of St. Louis).** Free API key
  (`FRED_API_KEY`). A small curated set only: national industrial
  production, national manufacturing industrial production, national
  manufacturing capacity utilization, plus a few Michigan series that
  BLS does not cover as well (e.g. state personal income, house price
  index, residential permits — each verified to exist before
  inclusion). Feeds the analysis pack.
- **FR-003 — DOL weekly UI claims (U.S. Department of Labor, ETA).**
  Free API key (`DOL_API_KEY`, api.dol.gov). Michigan initial claims
  and continued claims, weekly. Feeds the analysis pack. This
  systematizes the claims cross-check used in the August 2026
  labor-force analysis: announced layoffs (WARN) vs. filed claims.
- **FR-004 — Census API (U.S. Census Bureau).** Free API key
  (`CENSUS_API_KEY`); the API also answers limited queries without a
  key. Three datasets, latest available vintages, labeled: ACS
  5-year (educational attainment + demographics, Michigan counties),
  County Business Patterns (Michigan county × manufacturing
  establishments and employment), QWI (Michigan workforce flows by
  industry). Feeds the analysis pack.
- **FR-005 — BEA (U.S. Bureau of Economic Analysis).** Free API key
  (`BEA_API_KEY`). County GDP and county personal income, all
  Michigan counties, latest vintage. Feeds the analysis pack.
- **FR-006 — USAspending (U.S. Department of the Treasury).** No
  key. Federal awards to Michigan recipients in manufacturing- and
  defense-relevant NAICS/PSC codes feed as ITEMS into the existing
  Signals `funding-policy` lane via `data/signal-sources.json` +
  `scripts/fetch-signals.mjs`, mirroring the Michigan WARN
  implementation (spec 004 FR-011). Headlines carry facts only:
  awarding agency → recipient, amount, award (action) date. 45-day
  age cap and lane cap apply; last-good on failure.
- **FR-007 — College Scorecard (U.S. Department of Education).** Free
  key via api.data.gov (`DATAGOV_API_KEY`). Michigan institutions:
  field-of-study earnings and completion, latest vintage. Feeds the
  analysis pack (education-to-career pulse).
- **FR-008 — EIA (U.S. Energy Information Administration).** Free API
  key (`EIA_API_KEY`). Michigan industrial-sector electricity and
  natural gas prices, latest published periods. Feeds the analysis
  pack.
- **FR-009 — GDELT.** No key. A drafting-time tool only —
  `scripts/news-check.mjs` queries the GDELT Doc API for recent
  Michigan manufacturing news volume and tone to support FR-012
  cause-checking in spec 007 reporting. Its output is labeled
  "sentiment signal only — not a factual source." It is never a site
  source and never cited as evidence of fact.

## Source registry

| Source | Publisher | Endpoint base | Key env var | Signup |
|---|---|---|---|---|
| BLS JOLTS | U.S. Bureau of Labor Statistics | `https://api.bls.gov/publicAPI/v2/` | none | — |
| FRED | Federal Reserve Bank of St. Louis | `https://api.stlouisfed.org/fred/` | `FRED_API_KEY` | fredaccount / FRED API key request |
| DOL UI claims | U.S. Dept. of Labor (ETA) | `https://api.dol.gov/V1/` | `DOL_API_KEY` | developer.dol.gov |
| Census | U.S. Census Bureau | `https://api.census.gov/data/` | `CENSUS_API_KEY` | api.census.gov key signup |
| BEA | U.S. Bureau of Economic Analysis | `https://apps.bea.gov/api/data/` | `BEA_API_KEY` | apps.bea.gov API key signup |
| USAspending | U.S. Dept. of the Treasury | `https://api.usaspending.gov/api/v2/` | none | — |
| College Scorecard | U.S. Dept. of Education | `https://api.data.gov/ed/collegescorecard/v1/` | `DATAGOV_API_KEY` | api.data.gov signup |
| EIA | U.S. Energy Information Admin. | `https://api.eia.gov/v2/` | `EIA_API_KEY` | eia.gov/opendata registration |
| GDELT | The GDELT Project | `https://api.gdeltproject.org/api/v2/doc/doc` | none | — |

## Verification standard

A source is **wired + verified** only after: (1) its fetcher runs live
end-to-end, (2) 1–3 sample values with reference periods are captured,
and (3) at least one value is cross-checked against the publisher's
own public display or a second route. A source whose key is still
pending is reported as **key pending** with the single action needed
to unblock it — never as wired.
