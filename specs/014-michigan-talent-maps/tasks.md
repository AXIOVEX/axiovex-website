# Tasks: Michigan Talent Geography Maps (spec 014)

Proposal package prepared 2026-10-06: wireframes revised
(`docs/wireframes/wireframes.html` — NEW WF-13 Michigan
talent map + the WF-11 integration note;
`docs/wireframes/wireframes.md` revision log) and this spec
package written. **APPROVED 2026-10-06 (T001 below) —
implementation under way on the staging branch.**

## Gate

- [x] T001 **GATE — Owner approval of the wireframes
  (Tristen).** **APPROVED 2026-10-06** — Tristen:
  "Approve spec 014 wireframes — implement it", including
  the adjusted PSEO pipeline design (statewide flows +
  labeled UMich spotlight). Sequencing recorded at the
  gate: spec 013 (incl. its Amendment 1) promoted to
  production first; spec 014 implements on staging on top
  of the promoted Detail region. Scope of the approval: WF-13 as drawn (the
  geography subsection inside spec 013's Detail region: the
  QCEW industry choropleth with its selector, the LAUS
  unemployment choropleth, the IPEDS institution map, and
  the PSEO pipeline view in its **adjusted, honestly-scoped
  form** — statewide flows + the University of Michigan
  spotlight with the coverage label on the view) and the
  integrity rules in spec.md — FR-003/FR-004 (suppressed
  cells and data holes shown as themselves), FR-006 (the
  pipeline scoping), FR-010 (no blending of actuals and
  projections; MCDA regional projections out of scope for
  v1). **Blocks every task below.** Also recorded at this
  gate: sequencing vs spec 013 (the subsection needs 013's
  Detail region on staging — bundle in one staging pass or
  sequence after 013; owner's call). Nothing is implemented,
  committed to the live pages, or deployed until Tristen
  approves; if he requests changes, the wireframes are
  revised and re-presented first (constitution §III).

## Data builds (start only after T001)

- [x] T002 **Geometry + QCEW extract (FR-002, FR-003,
  FR-007)**: extract the 83 Michigan county paths from
  us-atlas counties-10m into `data/geo/mi-county-paths.json`
  (FIPS + name per county); fetch the 2024 annual QCEW
  per-area CSV for all 83 counties, keep agglvl-74 /
  total-ownership / 2-digit-sector cells as
  `{emplvl, lq, disclosed}` (suppressed cells stored
  valueless), write `data/geo/qcew-county-industry.json`
  with full source metadata. Mechanical checks recorded in
  `specs/014-michigan-talent-maps/sources.md`: 83 counties,
  sector set matches the statewide file, Wayne cross-checks
  (manufacturing 89,659 private-ownership row; county total
  719,741), Keweenaw suppression present. A failed county
  read fails the refresh whole (last-good), never partial.
  **Done 2026-10-06** (commits `07f7ca2`, `4e76ac1`):
  geometry extracted (83 paths, viewBox 0 0 640 721; the
  projection constants are committed in the file — audit
  reproduced every path string from the source). QCEW
  extract via `scripts/fetch-geo.mjs qcew`: 83 counties ×
  20 sectors; **the sector grain is private ownership
  (own_code 5)** — total-ownership sector rows do not
  exist in QCEW (sources.md D1); 416 suppressed + 57
  absent cells stored valueless. Cross-check correction
  (sources.md D2): this task's "county total 719,741" is
  Wayne's **2023** total; the 2024 total is **725,504**
  (manufacturing 89,659 ✓ as written). Keweenaw
  suppression present (health care + 9 more sectors).
- [x] T003 **LAUS layer + fetcher step (FR-004, FR-007)**:
  batched BLS API read of the 83 `LAUCN26{ccc}000000003`
  series → `data/geo/laus-county.json` (latest month's rate
  per county, preliminary flag carried, hole months simply
  absent); the month-gated, last-good refresh step added to
  the build-time fetcher family. Checks: 83 series answered;
  Wayne 6.9 / Oakland 4.7 / Kent 4.3 for Aug 2026 (or the
  then-latest month's published values, read on the API at
  build time); Oct 2025 recorded as a hole, not a value.
  **Done 2026-10-06** (commit `07f7ca2`): fetcher
  `scripts/fetch-geo.mjs laus`, month-gated + last-good.
  Aug 2026 preliminary; Wayne 6.9 / Oakland 4.7 / Kent
  4.3 exact; Oct 2025 a hole in 83/83 series. Series-ID
  correction recorded (sources.md D3): the suffix is ten
  zeros (`0000000003`, 20-char ID).
- [x] T004 **IPEDS extract (FR-005, FR-007)**: HD2024 +
  C2024_A → `data/geo/ipeds-institutions.json` (160
  Michigan institutions: name, city, published lat/lon,
  total completions, completions by CIP 2-digit family).
  Checks: 160 institutions; 10,051 Michigan completions
  rows accounted for in the aggregation; any institution
  lacking published coordinates flagged `coords: null`
  (listed, never placed).
  **Done 2026-10-06** (commit `07f7ca2`): 160
  institutions, 10,051 Michigan rows accounted; **no
  institution lacks published coordinates** (all 160
  placed from source values). CIPCODE 99 grand-total
  rows excluded from aggregates (sources.md D5) —
  statewide completions 128,540.
- [x] T005 **PSEO extract (FR-006, FR-007)**: first confirm
  degree-level + status code labels against the PSEO
  Technical Documentation (record the confirmation — or the
  correction — in sources.md); then extract from
  `pseof_mi` / `pseoe_mi` (R2026Q2 or the then-current
  release): statewide bachelor's field → industry top flows
  (published rows only, top-10 ceiling) with year-1/year-5
  employed + year-1 median earnings, and the University of
  Michigan spotlight figures → `data/geo/pseo-pipelines.json`,
  with the partners file's coverage line stored as metadata
  (the on-page label is generated from it). Excluded
  (suppressed) row counts per view recorded in sources.md.
  **Done 2026-10-06** (commit `07f7ca2`): code labels
  confirmed against the LEHD schema V4.9.0 label CSVs
  (05 = Baccalaureate; status 1 = OK) — sources.md D6.
  Statewide top-10 flows (460 published rows; 40
  excluded, counted in the dataset); UMich spotlight
  medians $53,268 / $78,284 / $106,836 exact; retention
  shares computed (y1 41.0%). Coverage line stored from
  the partners file and rendered on the panel.

## Implementation (after T002–T005)

- [x] T006 **Generator + template + styles (FR-001,
  FR-002, FR-008)**: `geoHtml()` and its per-view renderers
  in `scripts/build-site.mjs` (geometry defs referenced by
  all layers; fixed bin rules generating both fills and
  legends; selector/filter as presentation-only button
  toggles; complete table/list alternative beside every
  view; coverage label on the pipeline view); the subsection
  composed as the Detail region's last data block (spec
  013's composition, extended); sources-note map sentences;
  styles in the next versioned stylesheet bump in sequence
  (existing tokens only; choropleth bins from the strata
  blues + the not-disclosed hatch/gray).
  **Done 2026-10-06** (commit `66431e9`): `geoSectionHtml()`
  + per-view renderers composed after Education, before
  Go Deeper; subtitle gains "talent geography";
  `{{GEO_NOTE}}` sentences appended to the sources note
  (existing sentences untouched); **styles.v31.css**
  (= v30 + appended block; v30 removed, all references
  repointed). Geometry defs emitted once (83 paths;
  5,063 `<use>` across 61 layer maps). Selectors are
  real buttons (aria-pressed); all layers + tables render
  in markup. Drop-out verified per dataset (each file
  removed in turn → only its view absent; all removed →
  section + subtitle part + note sentences absent, page
  intact). Build byte-deterministic across rebuilds.
- [x] T007 **Spec 007 amendment application (FR-009)**:
  FR-011 into `specs/007-michigan-workforce-monthly/spec.md`
  (Amendment 3, dated, quoting this spec); the §3B
  geographic-callout placement note into spec 007's
  `blog-format.md`; the map-refresh verification step into
  the cycle checklist of
  `~/workspace/skills/michigan-workforce-monthly/SKILL.md`.
  No article is drafted or published by this task.
  **Done 2026-10-06** (commit `b019a84` + the skill
  edit): FR-011 + Amendment 3 header in spec 007's
  spec.md; §3B in blog-format.md; map-refresh item in
  blog-format §6 checklist; map-refresh verification
  step in the SKILL.md Step 1 drafting list. No article
  drafted or published.

## Verification + promotion

- [ ] T008 **Staging verification (FR-011)**: figure audit
  (zero mismatches — sampled QCEW cells incl. Wayne +
  Keweenaw suppression, the three named LAUS counties, ten
  institutions across dot-size bands, every pipeline bar +
  spotlight figure, all byte-matching the committed geo
  files); completeness counts (83 counties per choropleth
  layer; sector layers = committed sectors; institution
  list = committed count); PSEO coverage label present in
  served HTML; selector switching network-silent; default
  layers render with scripts disabled; no overflow at
  1440 / 834 / 390; resilience builds (each geo file removed
  in turn → its view absent, page intact; stale LAUS file →
  vintage label shows the stale month).
- [ ] T009 **Promotion + closeout**: merge `staging` →
  `main` under spec 010 FR-004 (STOP if the diff carries
  staging-only `robots.txt`/`_headers` beyond the intended
  guard state), per the sequencing recorded at T001;
  production figure audit repeated live; next monitoring
  cycle confirms AEO 100 / Seobility 90 holds. WF-13 labels
  flipped to approved/implemented in `wireframes.html` +
  `wireframes.md`; review copy
  `~/workspace/your_files/axiovex-wireframes/wireframes.html`
  re-synced byte-identical; monitoring state
  `website_commit` advanced; spec.md status updated.
