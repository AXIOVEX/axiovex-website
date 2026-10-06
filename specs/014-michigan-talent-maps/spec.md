# Feature Specification: Michigan Talent Geography Maps

**Feature Branch**: `014-michigan-talent-maps`
(documentation only until the approval gate passes —
implementation lands through the staging flow in spec 010,
on top of spec 013's Detail region)

**Created**: 2026-10-06

**Status**: **Approved 2026-10-06** (Tristen, at the
tasks.md T001 gate — including the adjusted PSEO design).
Implementation in progress on the staging branch; the
wireframe (new frame WF-13, plus an integration note on
WF-11) remains the design of record.

**Direction (Tristen, 2026-10-06)**: "also create geographic
heap maps showing insite on education and employment related
things that can graphically show good insight to where talent
is for what industries and what schools pipelien to what
industries. and this should all be included in the monthly
jobs/employment insights report."

## What exists today

Spec 013 (proposed, pending the same owner's approval) adds
an expandable **Detail region** — "The full picture" — to
`/signals/`: the full tables behind the boards, server-
rendered into the DOM, collapsed by default. Everything in
this spec lives inside that region, as its **geography
subsection** — the last data block before the region's link
block. This spec adds no new page, no new region, and no
surface outside the Detail region.

Every dataset below was **verified by direct fetch on
2026-10-06** (sources report:
`~/workspace/goals/website-seo-aeo-health-monitoring/hidden_files/map-sources-verification.md`
— every value read from an actual API response or downloaded
file; nothing from secondary coverage). The feasible set:

- **BLS QCEW** (per-area CSV API, `data.bls.gov/cew`):
  Michigan county × NAICS sector employment
  (`annual_avg_emplvl`, location quotients, ownerships).
  Latest verified: **2024 annual averages, 2025 Q1**. All 83
  counties publish; **small-county sector cells are
  disclosure-suppressed** (`disclosure_code` = N, values
  zeroed in the source — verified in Keweenaw County).
- **BLS LAUS** (Public Data API v2): monthly unemployment
  rate for **all 83 Michigan counties** (`LAUCN26{ccc}
  000000003`). Latest read: August 2026 (preliminary) —
  Wayne 6.9%, Oakland 4.7%, Kent 4.3%. **October 2025 is a
  genuine hole** (federal lapse in appropriations, footnoted
  in the source) — it is missing data, not zero.
- **IPEDS** (NCES bulk files HD2024 + C2024_A, posted
  Sep 2025): **160 Michigan institutions** with published
  latitude/longitude; **10,051 Michigan completions rows
  across 1,060 CIPs** (2023-24 awards).
- **Census PSEO** (LEHD, release **R2026Q2**, cohorts
  2001–2021): institution × field (CIP) × industry (NAICS)
  employment flows and earnings percentiles at 1/5/10 years
  post-graduation, per state.
- **County geometry**: `us-atlas@3` counties-10m TopoJSON
  (Census TIGER-derived, public domain) — all **83 Michigan
  counties** with FIPS ids and names, extractable by the
  `26` prefix. Static build-time SVG is feasible with no
  runtime geometry fetch.

## The honest scoping (read this first)

The requested "what schools pipeline to what industries"
map is **not buildable as imagined, and this spec does not
pretend otherwise.** PSEO — the only published dataset that
tracks graduates into industries — covers exactly **one
Michigan institution**: the University of Michigan, the
state's sole PSEO partner institution, covering **~10% of
statewide graduates** (the Census partners file's own
figure, 2015 estimate). Michigan State and every Michigan
community college are absent as named institutions in the
current release. A school-by-school Michigan pipeline map
drawn today would be a map of one school wearing a statewide
costume.

What PSEO *does* publish, and what this spec builds
(map d): **statewide field → industry flows** (all Michigan
graduates in the dataset's state aggregate — e.g. Business
CIP 52 → Professional/Technical Services NAICS 54: 1,983
graduates employed at year 1) with median earnings, plus a
clearly labeled **University of Michigan spotlight** — the
one institution-level view the data honestly supports,
labeled on the page with the coverage limitation itself.
If more Michigan institutions join PSEO in a future release,
the spotlight generalizes to a per-institution view as a
data refresh, with no design change; the annual PSEO
refresh task re-checks the partner list every release.

## The map set (WF-13)

All four views live in the Detail region's geography
subsection, in this order. All are **static, build-generated
inline SVG** — no client-side map library, no tile service,
no runtime fetching (spec 004 architecture). Every view
carries its source + vintage label, and **every view ships
with its data as an adjacent table or list** — the map is
never the only carrier of its numbers.

- **(a) County choropleth — employment by industry (QCEW).**
  One Michigan map, 83 counties, shaded by **employment
  level** in the selected industry, with the county's
  **location quotient** (concentration vs the nation)
  carried in the table alternative. Industry selection is a
  row of real buttons (the NAICS 2-digit sectors present in
  the committed data; default layer: Manufacturing — the
  page's home industry); each sector's shading is a
  **committed, pre-rendered layer** in the DOM, and the
  control only switches which layer is visible — with
  JavaScript unavailable the default layer and every
  sector's table render, nothing is trapped. Counties whose
  cell the source suppresses render in the map's
  **"not disclosed" state** (hatched/gray, legend-labeled)
  — never zero-filled, never estimated, never quietly the
  lowest shade. Vintage at v1: 2024 annual averages.
- **(b) County choropleth — unemployment rate (LAUS).**
  The same geometry and legend language, one reference
  month at a time (latest published month; preliminary
  months labeled preliminary). A county with no published
  value for the shown month renders in the not-available
  state — the standing example is October 2025, absent
  statewide for the federal lapse — and the caption names
  the hole rather than smoothing over it. Refreshed
  monthly.
- **(c) Institution map (IPEDS).** The same Michigan
  outline, lightly drawn, carrying the **160 Michigan
  institutions** as dots at their published coordinates,
  **sized by completions**. A field filter (buttons, CIP
  2-digit families present in the Michigan data; default:
  all fields) re-sizes the dots from committed per-field
  layers, exactly as in (a). The adjacent list names every
  institution with its city and its completions for the
  selected layer — the dot is a locator, the list is the
  data. Institutions are plotted **only** at coordinates
  IPEDS itself publishes; none are geocoded or nudged.
- **(d) Field → industry pipelines (PSEO, adjusted design).**
  Not a map — a ranked view, in the region's existing
  bar/list language:
  1. **Statewide flows**: the top field → industry flows
     for Michigan graduates (state aggregate, bachelor's
     degree level at v1, labeled as such): field, industry,
     graduates employed at year 1 (year 5 alongside), and
     the field's median earnings at year 1. Rendered as
     ranked bars with the figures printed — bars are a
     display of the table, and the table values are the
     content.
  2. **University of Michigan spotlight**: a labeled panel
     with the institution-level figures PSEO publishes for
     its sole Michigan partner — bachelor's, all fields:
     year-1 median earnings **$53,268** (25th–75th:
     $32,885–$79,160), year-5 median **$78,284**, year-10
     median **$106,836**; **73,720** graduates employed at
     year 1, of whom **30,253 in-state**. The panel carries
     the coverage label verbatim in spirit: *PSEO tracks
     one Michigan institution today — the University of
     Michigan, about 10% of the state's graduates. No other
     Michigan school's outcomes are in this dataset.* The
     label sits **on the view**, not in a footnote.
  PSEO cells the source suppresses (status-coded in the
  files) are excluded from rankings — never zero, never
  interpolated.

## Data pipeline per view

All data is **committed files in the website repo**
(`data/geo/`), each carrying source, source URL, vintage,
and retrieval date metadata — the spec 011 provenance
conventions, applied unchanged. No figure is fetched at
page-view time; nothing enters a file from news coverage, a
search snippet, or memory.

| View | Committed file | Source | Refresh |
|---|---|---|---|
| Geometry | `data/geo/mi-county-paths.json` (FIPS → path + name, extracted once) | us-atlas counties-10m (TIGER-derived, public domain) | Static; re-extract only if a future TIGER/cartographic release changes a boundary |
| (a) Industry | `data/geo/qcew-county-industry.json` | BLS QCEW per-area CSV API, 83 county files, NAICS sectors, total ownership | **Quarterly committed refresh** (annual averages are the v1 layer; quarterly files as published) |
| (b) Unemployment | `data/geo/laus-county.json` | BLS LAUS API, 83 series in one batched read | **Monthly**, via the build-time fetcher pattern (month-gated: re-read only when a new reference month exists), last-good on failure |
| (c) Institutions | `data/geo/ipeds-institutions.json` | IPEDS HD (coordinates) joined to Completions (awards by CIP) on Michigan UNITIDs | **Annual committed refresh** on the new survey cycle |
| (d) Pipelines | `data/geo/pseo-pipelines.json` | Census PSEO per-state files (`pseof_mi`, `pseoe_mi`) | **Per PSEO release** (~annual, irregular): committed refresh, including a partner-list re-check for new Michigan institutions |

**Last-good resilience** (extends spec 011 FR-005e / spec
013 FR-007): a failed or missing refresh keeps the prior
committed file and its vintage label — the map shows its age,
never a fabricated current value. A missing geo file removes
exactly its own view; the rest of the subsection and the
region render unchanged.

## Monthly report integration — amendment to spec 007

Recorded here in full; **applied to spec 007 at
implementation** (tasks.md T007 — spec 007's spec.md gains
FR-011, its `blog-format.md` gains the §3B placement note,
and the series runbook skill gains the cycle-checklist step;
this package does not edit spec 007 or the skill itself).

**FR-011 (spec 007) — Geographic layer: the talent maps.**
- Each monthly article **links the live maps** — the
  geography subsection of the `/signals/` Detail region
  (spec 014) — with the maps' vintages stated at the link,
  so a reader lands on the same committed data the article
  cites.
- Each article cites **one or two computed geographic
  insights**: deterministic arithmetic on the committed map
  data, labeled in the article as computed. The named
  computations (use those whose inputs exist that cycle):
  the county with the highest location quotient for an
  industry the Outlook board shows rising; the spread
  between Michigan's highest and lowest county unemployment
  rates, naming the counties at each end; the in-state
  retention share of the PSEO spotlight cohort (in-state
  employed ÷ employed at year 1) when the education section
  discusses pipelines. A computation whose inputs are
  missing that cycle is omitted — never estimated.
- The **monthly cycle checklist gains a map-refresh
  verification step**: the LAUS county layer at the newest
  reference month; the QCEW layer at its current vintage;
  the IPEDS and PSEO layers checked against their
  annual/release cadence. A layer that failed to refresh is
  reported in the cycle report as **last-good with its
  vintage** — never silently treated as current.
- **Sourcing extension**: FR-002's source families are
  extended **for the geographic insights only** by the map
  datasets (BLS QCEW; BLS LAUS county series; IPEDS; Census
  PSEO), each cited at first use. All other FR-002 rules
  apply unchanged, and the maps' own labels (suppression,
  holes, PSEO coverage) are inherited by any article text
  that cites them — an article never states a pipeline fact
  more strongly than the map's label allows.

**blog-format.md §3B (placement)**: the geographic callout —
map link(s) plus the cycle's computed geographic insight
sentences — sits immediately after the Education analytics
section (§3A), before the decisions section. The article
**links** the live maps; it does not embed map images in v1.

## Design reference (wireframes, this proposal)

- **WF-13** (new): the geography subsection drawn at full
  width — both choropleths with legend (real Aug 2026
  values: Wayne 6.9%, Oakland 4.7%, Kent 4.3%; the
  not-disclosed state drawn and legend-labeled), the
  industry selector chips, the institution dots on the same
  outline, the pipeline ranked bars with the one verified
  statewide flow drawn real and the remaining rows in the
  set's placeholder style, and the UMich spotlight with its
  coverage label. Plus the 390px stacking.
- **WF-11** gains an **integration note** only: the Detail
  region's expanded drawing records the geography subsection
  as its last data block (before "Go deeper"). No WF-11
  block is redrawn by this spec.
- No other frame changes.

## Functional requirements

- **FR-001 — Placement + dependency.** The geography
  subsection renders inside spec 013's Detail region as its
  **last data block**, after the education-to-career block
  and before the link block. It inherits the region's
  mechanics wholesale (spec 013 FR-004: DOM-resident,
  collapsed with the region, crawlable, expanded when
  scripts are unavailable). **Dependency:** implementation
  requires spec 013's Detail region on the staging branch;
  if the owner approves both, the subsection may be built in
  the same staging pass as spec 013's T003/T004, or sequenced
  after — recorded at this spec's gate. Nothing else on the
  page changes; specs 011/013 spacing, regions, and lanes
  are untouched.
- **FR-002 — Static generation only.** Every map is inline
  SVG generated by `scripts/build-site.mjs` from committed
  data at build time. **No client-side map library, no tile
  service, no runtime fetch, no third-party script.** County
  geometry is stored once in the page (path definitions) and
  referenced by every layer — layers differ by fill, not by
  duplicated geometry (build-cost note in plan.md).
- **FR-003 — Industry choropleth (QCEW).** Grain: county ×
  NAICS 2-digit sector, total ownership, **annual-average
  employment level** as the shaded metric; **location
  quotient** shown per county in the table alternative (and
  named in the block's reading note: level shows *where the
  jobs are*, LQ shows *where the industry concentrates* —
  the map never silently conflates the two). The selector is
  a row of `<button>`s, one per sector present in the
  committed file, default **Manufacturing**; switching is
  presentation-only (no fetch, no state persisted). Cells
  the source marks disclosure-suppressed render in the
  **not-disclosed state** in both the map and the table —
  never as zero and never in a value shade. Source +
  vintage label on the block ("U.S. BLS QCEW · 2024 annual
  averages" at v1).
- **FR-004 — Unemployment choropleth (LAUS).** Grain:
  county × latest published reference month, NSA rate. Same
  geometry, same bin language as FR-003 so the two maps read
  as a pair. Preliminary months are labeled preliminary in
  the block head. A county-month with no published value
  renders not-available; the October 2025 statewide hole is
  named in the block caption as the standing example of the
  rule — **values are never interpolated across a hole**
  (extends spec 004 FR-006).
- **FR-005 — Institution map (IPEDS).** All Michigan
  institutions in the committed file (160 at the 2024
  cycle) plotted at their **IPEDS-published** latitude/
  longitude, projected onto the same outline as FR-003/004.
  Dot area scales with **completions** for the selected
  field layer (CIP 2-digit families present in the Michigan
  completions data; default: all fields = total
  completions). The adjacent list is the data of record:
  every institution, city, and its completions for the
  selected layer, in the region's table language. An
  institution whose record lacks published coordinates is
  listed with that fact stated — it is never placed by
  guess, by city centroid, or by hand.
- **FR-006 — Pipelines (PSEO), adjusted design.** (i)
  **Statewide flows**: ranked bars of the top field →
  industry flows from the PSEO **state aggregate**
  (bachelor's degree level at v1, labeled), each bar
  printing field, industry, graduates employed at year 1,
  graduates employed at year 5, and the field's year-1
  median earnings (from the earnings file, same aggregate).
  (ii) **UMich spotlight**: the verified institution-level
  figures for the University of Michigan with the coverage
  label **on the panel** (one Michigan institution in PSEO;
  ~10% of statewide graduates; no other Michigan school's
  outcomes are in the dataset). (iii) Suppressed PSEO cells
  (status-coded) are excluded from both views — absence is
  stated where a reader would expect a row, never smoothed.
  (iv) The view is labeled with release + cohorts (R2026Q2,
  cohorts 2001–2021 at v1): these are **outcomes of past
  cohorts**, not a promise to a future student, and the
  panel says so.
- **FR-007 — Data pipeline + refresh.** The five committed
  files of the pipeline table above, built by the data
  tasks (T002–T005) from the verified endpoints, each with
  `{source, sourceUrl, vintage, retrievedOn}` metadata.
  Refresh cadences as tabled: LAUS monthly (fetcher-pattern,
  month-gated, last-good), QCEW quarterly (committed),
  IPEDS annual (committed), PSEO per release (committed,
  incl. partner-list re-check), geometry static. Refreshes
  are **data-only commits** — a refresh that would change a
  label, a layer set, or a ranking rule is a spec change,
  not a refresh.
- **FR-008 — Accessibility + table alternatives.** Every
  view's full dataset is present adjacent to it as a table
  or list in the region (the choropleths' county tables are
  complete: all 83 counties, values or the not-disclosed /
  not-available state). Each SVG carries `role="img"` with a
  title naming the view, metric, and vintage; color is never
  the only carrier of a value (every shaded value exists as
  text in its table). Selector and filter controls are real
  buttons with pressed state exposed (`aria-pressed`);
  keyboard operation follows the page's existing patterns.
  At 390px the maps go full-width, chips wrap, bars and
  tables follow spec 013 FR-008's in-block scroll rule — the
  page never scrolls sideways.
- **FR-009 — Monthly report integration.** The spec 007
  amendment recorded above (FR-011 + blog-format §3B) is
  applied at implementation (T007): spec 007's spec.md and
  blog-format.md updated, and the series runbook skill
  (`~/workspace/skills/michigan-workforce-monthly/SKILL.md`)
  gains the map-refresh verification step in its cycle
  checklist. The first monthly edition produced after this
  spec lands exercises FR-011 through the normal FR-004
  approval gate — this spec publishes no article itself.
- **FR-010 — Integrity.** (a) **Committed data only** —
  every rendered value byte-traces to a committed geo file,
  which byte-traces to its named source (the spec 011
  FR-005/FR-006 rule, unchanged). (b) **Suppression and
  holes are shown as themselves** — not-disclosed,
  not-available, excluded-suppressed; zero is rendered only
  when the source publishes zero. (c) **The PSEO coverage
  limitation is labeled on the page**, on the pipeline view
  itself (FR-006ii) — not buried in the sources note, not
  softened. (d) **Actuals and projections are never
  blended**: QCEW/LAUS/IPEDS/PSEO are measurements of the
  past and present; MCDA's prosperity-region projections
  (10 regions, 2022–2032 — **no county-level projections
  exist**) are **out of scope for v1** and, if ever added,
  arrive as their own labeled region-grain layer under
  their own amendment — never shaded onto the county maps.
  (e) Every view carries its **vintage label**; a stale
  layer advertises its age rather than hiding it.
- **FR-011 — Gate, staging-first flow, verification.** No
  implementation before Tristen approves WF-13 (tasks.md
  T001). Built and verified on the **staging branch**, then
  promoted under spec 010's rules; new styles ride the next
  versioned stylesheet bump in sequence. Verification
  (constitution §V): **figure audit with a zero-mismatch
  bar** — sampled counties/institutions/flows byte-match the
  committed files; **completeness counts** — 83 counties
  drawn per choropleth layer, 160 institutions listed (or
  the committed count, variance explained in the audit);
  suppression states present where the source suppresses
  (Keweenaw spot-check); the PSEO coverage label present in
  the served HTML; default layers render with scripts
  disabled; no overflow at 1440 / 834 / 390px; resilience
  builds (each geo file removed in turn → its view absent,
  page intact).

## Claims discipline

The maps are the most persuasive surface the site has
built — a shaded county *looks* like knowledge. The claims
bar (constitution §I) therefore does the work in this spec:
every shade is a committed, sourced, vintaged number or an
honestly-labeled absence (FR-010); the pipeline view's
scoping label is on the view, because the gap between "one
university's outcomes" and "Michigan's schools" is exactly
the gap a reader would otherwise never see (FR-006); and
the monthly article inherits the maps' labels rather than
outrunning them (FR-009). No invented geography, no
estimated cells, no forecast in a choropleth.

## Out of scope

- A per-school Michigan pipeline map beyond the UMich
  spotlight — **not feasible from published data today**
  (PSEO coverage, above); it arrives by data refresh if
  coverage expands, not by substituting another source's
  marketing claims.
- MCDA prosperity-region projections as a map layer
  (possible later amendment; region grain, never county).
- County-level detail beyond the published grains (no
  sub-county, ZIP, or district maps; no institution-level
  QCEW).
- Interactive exploration beyond layer selection (no
  zoom/pan, no time scrubbers, no per-county drill-down
  pages) — v1 is a reading surface, not a GIS tool.
- Embedding map images in the monthly article (v1 links the
  live maps — blog-format §3B).
- Any change to specs 011/013 regions, the lanes, the
  widget, or the home page.
