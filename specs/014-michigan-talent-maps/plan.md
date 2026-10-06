# Plan: Michigan Talent Geography Maps (spec 014)

**Status: proposal only.** This plan executes only after the
tasks.md T001 gate (Tristen approves WF-13) — and its
generator step additionally requires spec 013's Detail
region on the staging branch (spec.md FR-001 dependency).
Nothing here has been implemented. The data inventory below
is taken from the 2026-10-06 verification report, in which
every source was read by direct fetch
(`~/workspace/goals/website-seo-aeo-health-monitoring/hidden_files/map-sources-verification.md`).

## Data-provenance inventory (verified 2026-10-06)

| # | Dataset | Endpoint / file (as verified) | Contents (as read) | State |
|---|---|---|---|---|
| 1 | County geometry | `https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json` (842,143 bytes; TIGER-derived, public domain) | 3,231 county geometries; **83 with FIPS prefix `26`**, each with a county `name` | Verified by download + parse. Alternative: TIGER 2024 county shapefile (~84 MB national zip) if a non-CDN source is ever preferred |
| 2 | QCEW county × industry | `https://data.bls.gov/cew/data/api/{year}/{qtr}/area/{fips}.csv` (per-area CSV API; `{qtr}` = `a` annual, `1`–`4` quarterly) | 39-column CSV per county: `industry_code` (NAICS; `10` total, 2-digit sectors), `own_code` (0 total … 5 private), `agglvl_code` 74 = county × sector × ownership, `disclosure_code`, `annual_avg_emplvl`, LQ fields, wages. Wayne 2024 (private, agglvl 74): manufacturing 89,659 emp / $91,119 avg pay; health care 116,757; county total (own 0) 719,741. Keweenaw rows with `disclosure_code` = N carry zeroed values — suppression is in the data, not an inference | Verified live (Wayne + statewide files HTTP 200; 2024 annual + 2025 Q1 exist). Doc pages on www.bls.gov 403 to this client and first probes transiently 400'd — fetches retry, then last-good (FR-007) |
| 3 | LAUS county unemployment | BLS Public Data API v2, POST `{"seriesid":[...]}` to `https://api.bls.gov/publicAPI/v2/timeseries/data/` | Series `LAUCN26{ccc}000000003` for all 83 counties. Aug 2026 (preliminary): Wayne 6.9%, Oakland 4.7%, Kent 4.3%. Oct 2025 = `-`, footnote X (lapse in appropriations) | Verified live, no API key used. Monthly cadence |
| 4 | IPEDS institutions + completions | `https://nces.ed.gov/ipeds/datacenter/data/HD2024.zip` (1,088,372 bytes) + `C2024_A.zip` (4,680,679 bytes), posted 2025-09-21 | HD2024: `UNITID, INSTNM, CITY, STABBR, LATITUDE, LONGITUD` — **160 Michigan institutions** with coordinates. C2024_a: `UNITID, CIPCODE, MAJORNUM, AWLEVEL, CTOTALT…` — join on the 160 UNITIDs gives **10,051 MI rows / 1,060 CIPs** | Verified by download. Annual cycle (2024 survey = 2023-24 awards) |
| 5 | PSEO flows + earnings | `https://lehd.ces.census.gov/data/pseo/latest_release/mi/` → `pseof_mi.csv.gz` (228,481 rows), `pseoe_mi.csv.gz` (4,357 rows), `pseo_mi_institutions.csv`, `pseo_mi_partners.txt` | Vintage **R2026Q2** (`PSEOE MI 26 2001-2021 V4.14.1 2026Q2`), cohorts 2001–2021. Institutions file = **one row**: UMich (00232500). Partners file: "10% of statewide graduates covered". UMich bachelor's all-fields: y1 earnings p25/p50/p75 32,885/53,268/79,160; y5 p50 78,284; y10 p50 106,836; flows y1_grads_emp 73,720 (in-state 30,253). State aggregate example: CIP 52 → NAICS 54, y1 1,983 emp (475 in-state), published; fine CIP×industry cells exist as rows with empty values + status 5 (suppressed) | Verified by download + parse. **The coverage limitation is a property of the source, not of our reading** |
| 6 | MCDA regional projections | michigan.gov/mcda projections page: `Regional/LongTerm_{Industry,Occupation}Proj_2032_<Region>.xlsx` × 10 regions (2022–2032); statewide 2024–2034 | Same schema as the statewide workbook spec 011 already uses | Verified (page + one regional file read). **Out of scope for v1** (spec.md FR-010d) — recorded here so the exclusion is a decision, not an oversight |

## Step 0 — Geometry (tasks.md T002)

Extract Michigan from inventory #1 once: filter geometries
to FIPS prefix `26`, convert TopoJSON → one SVG path per
county, commit as `data/geo/mi-county-paths.json`
(`{fips, name, path}` × 83). The build inlines the paths
**once** as `<defs>` and every map layer references them
with `<use>` — see the build-cost note below. Boundary
simplification is whatever counties-10m already carries
(10m = the atlas's most detailed tier); no further
simplification at v1.

**Build-cost note — selector layers vs small multiples
(the WF-13 decision).** Two honest ways to draw map (a):

- **Committed layers + selector (CHOSEN).** Geometry is
  emitted once (~83 paths). Each sector layer is 83 `<use>`
  references carrying only a fill — the generator loops
  sectors × counties over the committed QCEW extract, so a
  layer costs references, not geometry. ~20 NAICS sectors ⇒
  page weight grows by fills and table rows, not by 20 maps.
  The interaction is one presentation toggle in the page's
  existing progressive-enhancement style (013's disclosure
  pattern): default layer visible with scripts off; every
  sector's data is in its table regardless.
- **Small multiples (REJECTED for v1).** A grid of ~20
  mini-choropleths shows all sectors at once with zero
  interaction — but each multiple still needs its 83 fills,
  the grid is unreadable at 390px (multiples shrink below
  county legibility), and the comparison a reader actually
  makes ("where does *this* industry concentrate?") is
  better served by one full-size map that changes shade.
  Recorded as considered-and-declined; revisiting it is a
  design change, not a refresh.

The same layer mechanism serves map (c)'s field filter
(dots re-sized per committed CIP layer) — one pattern, two
views.

## Step 1 — QCEW extract (tasks.md T002)

For each of the 83 county FIPS: fetch the **2024 annual**
per-area CSV (`2024/a/area/{fips}.csv`), keep rows at
`agglvl_code` 74 with `own_code` 0 (total ownership) and
2-digit NAICS sectors (+ `10` total), and record per cell
`{emplvl, lq, disclosed: disclosure_code === 'N'}`.
Suppressed cells are stored as `disclosed: false` with **no
value** — the zeroed source values are never transcribed.
Output: `data/geo/qcew-county-industry.json` with metadata
(source URL pattern, vintage "2024 annual averages",
retrievedOn). Mechanical checks before commit: 83 counties
present; sector set = the sectors in the statewide file
(`26000`); Wayne manufacturing = 89,659 (private-ownership
cross-check against the report's sample at its own
ownership row); Keweenaw suppression present. Fetch failures
retry (inventory #2's transient 400s); a county that cannot
be read drops the whole refresh (last-good), never a
partial map.

## Step 2 — LAUS layer (tasks.md T003)

One batched POST of the 83 series ids (pattern from
inventory #3) → `data/geo/laus-county.json`: per county
`{rate, ym}` for the latest published month + the series'
hole months recorded as absent (the file stores values, not
a filled grid). The refresh runs in the build-time fetcher
family (a `scripts/fetch-geo.mjs` sibling to
`fetch-signals.mjs`, or a step in it — implementer's call,
recorded at T003): **month-gated** (no re-read while the
committed reference month is BLS's latest), **last-good**
on any failure (exit 0 with the prior file, per the spec
004 resilience pattern). Preliminary flag carried from the
API response into the block label.

## Step 3 — IPEDS extract (tasks.md T004)

Download HD2024 + C2024_A (inventory #4); filter HD to
`STABBR = MI` (expect 160); join completions on UNITID;
aggregate completions to **CIP 2-digit families** per
institution + the all-fields total. Output:
`data/geo/ipeds-institutions.json` — `{unitid, name, city,
lat, lon, totalCompletions, byFamily: {cip2: n}}` × 160,
metadata (survey cycle 2024, posted 2025-09, retrievedOn).
Checks: 160 institutions; 10,051 source rows accounted for
in the aggregation; every institution has coordinates or
is explicitly flagged `coords: null` (listed, never
placed — FR-005).

## Step 4 — PSEO extract (tasks.md T005)

Download `pseof_mi.csv.gz` + `pseoe_mi.csv.gz` +
`pseo_mi_institutions.csv` + `pseo_mi_partners.txt`
(inventory #5). **Before extracting**, read the PSEO
Technical Documentation for the degree-level and status
code labels (the verification report located but did not
parse it; the observed mapping — degree_level 05 =
bachelor's — is confirmed against the documentation at this
step, and any correction is recorded in sources.md).
Extract:
- **Statewide flows**: rows at the state aggregate,
  degree_level bachelor's, published status only; rank
  field → industry pairs by `y1_grads_emp`; keep the top
  set (ranking rule fixed in code: top 10, ties at the cut
  kept and noted); join each field's `y1_p50_earnings` from
  the earnings file at the same aggregate.
- **UMich spotlight**: institution 00232500, bachelor's,
  all-fields/all-industries rows from both files (the
  verified figures in inventory #5) + its top industry
  flows where published.
- **Coverage metadata**: partner count + the partners
  file's coverage line, stored in the file so the on-page
  label is generated from the data, not hand-typed.
Output: `data/geo/pseo-pipelines.json`. Suppressed rows
(status-coded, empty values) are excluded and their
exclusion is the recorded rule — counts of excluded rows
per view go in `specs/014-michigan-talent-maps/sources.md`.

## Step 5 — Generator + template (tasks.md T006)

In `scripts/build-site.mjs`, in the spec 011/013 style
(deterministic; absent file → absent view; never a build
failure):

- `geoHtml(geo)` — the subsection: block head ("Michigan
  talent geography" + the reading note), then per view:
  map (a) `qcewMapHtml()` (defs + per-sector `<g>` layers +
  selector buttons + 83-row table), map (b) `lausMapHtml()`
  (one layer + 83-row table + hole caption), map (c)
  `ipedsMapHtml()` (outline + per-family dot layers +
  institution list), view (d) `pseoHtml()` (ranked bars +
  spotlight panel + coverage label). All fills computed from
  the committed values by fixed bin rules stated in code
  (the legend is generated from the same bins — legend and
  shading can never disagree).
- Template: the Detail region's content (spec 013's
  `detailHtml()` output / `{{DETAIL_HTML}}` composition)
  gains the subsection as its last block before the link
  block — the slot is spec 013's composition, extended, not
  a new placeholder region on the page.
- Styles ride the **next versioned stylesheet bump** in the
  staging sequence at implementation time (013 takes its
  bump first if bundled); map rules reuse the page's
  palette/tokens — choropleth bins are shades of the
  existing strata blues + the not-disclosed hatch/gray,
  **no new brand colors**; the spotlight panel reuses the
  card treatment.
- Sources & method note gains the map attribution sentences
  (QCEW, LAUS county series, IPEDS, PSEO — with the coverage
  line) under spec 013 FR-009's discipline (existing
  sentences untouched).

## Step 6 — Spec 007 amendment application (tasks.md T007)

Apply the amendment recorded in spec.md: FR-011 into
`specs/007-michigan-workforce-monthly/spec.md` (as
Amendment 3, dated, quoting this spec), the §3B placement
note into its `blog-format.md`, and the map-refresh
verification step into the series runbook skill's cycle
checklist (`~/workspace/skills/michigan-workforce-monthly/SKILL.md`).
No article is drafted or published by this step; the first
FR-011 exercise is the next monthly cycle under its own
FR-004 gate.

## Step 7 — Staging verification (tasks.md T008)

Per spec.md FR-011, on staging.axiovexsystems.com/signals/:

1. **Figure audit (zero mismatches):** sampled cells
   byte-match the committed geo files (Wayne manufacturing
   + total; Keweenaw suppressed cells; the three named LAUS
   counties; ten institutions incl. one per dot-size band;
   every pipeline bar + the spotlight figures).
2. **Completeness:** 83 county paths per choropleth layer;
   sector layer count = committed sector count; institution
   list count = committed count (160 at v1); coverage label
   present in served HTML.
3. **Mechanics:** selector/filter switching is
   presentation-only (network-silent); default layers render
   with scripts disabled; tables complete beside every view;
   no overflow at 1440 / 834 / 390.
4. **Resilience:** build with each geo file renamed away in
   turn → its view absent, subsection + page intact; build
   with a stale LAUS file → vintage label shows the stale
   month (label honesty, not an error).

## Step 8 — Promotion + closeout (tasks.md T009)

Promotion merges `staging` → `main` under spec 010 FR-004
(same stop rule), production figure audit repeated live,
next monitoring cycle confirms AEO 100 / Seobility 90.
Closeout flips the WF-13 labels to approved/implemented in
`wireframes.html` + `wireframes.md`, re-syncs the review
copy byte-identical, advances monitoring state
`website_commit`, and updates spec.md status. Sequencing
vs spec 013's promotion is the owner's call at the gates —
this plan supports bundling (one staging pass) or
sequencing (013 first, 014 rebased onto its Detail region).

## Risks / open points

- **QCEW fetch flakiness** (inventory #2): transient 400s
  observed on identical URLs. The refresh procedure retries
  and falls back to last-good; a refresh is never committed
  partial.
- **PSEO code labels**: degree/status code meanings are
  confirmed from the Technical Documentation at T005 before
  any extraction is trusted (the verification report flags
  this honestly). If the documentation contradicts the
  observed bachelor's mapping, the extract waits for the
  corrected reading — labels are claims too.
- **PSEO ranking depth**: published institution-level cells
  are mostly coarse; the statewide ranking's top-10 cut is
  drawn from *published* state-aggregate rows only. If fewer
  than 10 flows publish at the chosen grain, the view shows
  what publishes and says so — the cut is a ceiling, not a
  quota to fill.
- **Bin sensitivity**: choropleth bins are fixed in code
  and printed in the generated legend; a future bin change
  is a spec change (it re-colors the story without changing
  a single number).
