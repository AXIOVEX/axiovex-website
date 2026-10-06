# Spec 014 — Sources, traceability audit, and deviations

Companion to spec.md / plan.md. Every figure on the geography
subsection traces to a committed dataset under `data/geo/`, and
every committed dataset traces to the source artifact named
here. Sources were verified live in the source-verification
report (`~/workspace/goals/website-seo-aeo-health-monitoring/hidden_files/map-sources-verification.md`,
2026-10-06) before the wireframes were drawn; this file records
what the implementation actually used and the audit that
re-checked it.

Retrieval date for every dataset below: **2026-10-06**.

## 1. Datasets

### `data/geo/mi-county-paths.json` — county geometry
- Source: us-atlas v3 `counties-10m.json` (842,143 bytes),
  Census TIGER-derived, public domain —
  `https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json`.
- Contents: 83 Michigan counties, one SVG path each,
  viewBox `0 0 640 721` (21,988-byte file; 14,796 path chars).
- The file also records the equirectangular fit constants
  (`projection`) so the build projects IPEDS coordinates onto
  the same map exactly. Emitted once per page as `<defs>`;
  layers are `<use>` references (page total: 5,063 `<use>`
  elements across 61 layer maps).

### `data/geo/laus-county.json` — county unemployment (map b)
- Source: BLS Public API v2, series
  `LAUCN{5-digit FIPS}0000000003` × 83 counties, unkeyed POST
  batches of 20.
- Reference month **2026-08, preliminary**. Range 3.5–8.6;
  Wayne 6.9, Oakland 4.7, Kent 4.3 (the verification samples,
  reproduced exactly). Hole months: **2025-10** (all 83 series
  carry the source's unavailable marker for Oct 2025 — the
  federal lapse in appropriations; recorded as holes in the
  file and named in the block caption).
- Refresh: `node scripts/fetch-geo.mjs laus` (month-gated;
  last-good semantics identical to fetch-signals).

### `data/geo/qcew-county-industry.json` — county × industry (map a)
- Source: BLS QCEW per-area CSV API,
  `https://data.bls.gov/cew/data/api/2024/a/area/{fips}.csv`
  × 83 counties, **2024 annual averages**.
- Grain: sector rows at `agglvl_code 74` / **`own_code 5`
  (private ownership)** — see Deviation D1. County totals:
  total-ownership (agglvl 70) + private (agglvl 71).
- Cells: 83 × 20 sectors = 1,660 — 1,187 published values
  ({emplvl, lq}), **416 disclosure-suppressed**
  (`disclosure_code 'N'`; stored valueless), **57 absent**
  (the source publishes no row; stored as `{absent: true}` —
  see D4).
- Verified samples reproduced exactly: Wayne manufacturing
  89,659 / LQ 1.50; Wayne health care 116,757 / LQ 1.12;
  Wayne county total (all ownerships) **725,504**; Keweenaw
  health care suppressed.
- Refresh: `node scripts/fetch-geo.mjs qcew`.

### `data/geo/ipeds-institutions.json` — institutions (map c)
- Sources: NCES IPEDS bulk files `HD2024.zip` (1,088,372
  bytes) + `C2024_A.zip` (4,680,679 bytes), 2024 survey cycle,
  posted 2025-09-21; completions are 2023-24 awards.
- Contents: **160 Michigan institutions** (STABBR = MI), all
  with IPEDS-published coordinates (none unlocated).
  10,051 Michigan completions rows accounted for; statewide
  completions 128,540; largest: University of
  Michigan–Ann Arbor 17,020, Michigan State 13,017, Wayne
  State 6,566. Completions by CIP 2-digit family (38 families
  present; largest: Health professions 20,965, Business
  19,506, Liberal arts 13,494).
- Reproduced byte-identically by the committed prep script
  from the source zips (see §3).

### `data/geo/pseo-pipelines.json` — graduate pipelines (map d)
- Source: U.S. Census Bureau PSEO (LEHD), Michigan release
  **R2026Q2** (`version_pseo.txt`: `PSEOE MI 26 2001-2021
  V4.14.1 2026Q2`, `pseopu_mi_20260715_1529`):
  `pseoe_mi.csv.gz` (77,336 bytes; 4,356 rows) +
  `pseof_mi.csv.gz` (1,078,778 bytes; 228,480 rows); labels
  from the LEHD Public Use Data Schema V4.9.0.
- Statewide flows: state aggregate (institution `26`),
  bachelor's (degree_level `05` = Baccalaureate per the
  schema's `label_degree_level.csv`), CIP 2-digit × NAICS
  sector, national outcomes, cohorts pooled. 460 published
  rows (status flag `1` = OK per `label_status.csv`), 40
  excluded (suppressed/non-published; counted in the file).
  Top row: Engineering → Manufacturing, 4,345 employed at
  year 1 (1,514 in Michigan); Business → Professional
  services 1,983 (475 in Michigan) — the verification sample,
  reproduced exactly.
- UMich spotlight (institution `00232500`, the ONLY Michigan
  institution in `pseo_mi_institutions.csv`): bachelor's,
  all fields — earnings medians y1 **$53,268** / y5
  **$78,284** / y10 **$106,836** (the verification samples,
  reproduced exactly); employed y1 73,720 with 30,253 in
  Michigan — computed in-state share **41.0%** (y5 33.0%,
  y10 30.1%). Coverage label on the panel quotes the partner
  file: the University of Michigan, "~10% of statewide
  graduates covered (2015 estimate)".

## 2. Deviations and corrections (recorded, never absorbed)

- **D1 — QCEW sector grain is private ownership, not "total
  ownership" (FR-003 amended by evidence).** QCEW does not
  publish county × sector × total-ownership rows at all:
  `agglvl_code 74` rows exist only split by ownership
  (own 1/2/3/5); the only own-0 county row is the county
  total (agglvl 70). Verified against (i) the per-area API
  files (Wayne + statewide), and (ii) the full 2024 annual
  single file (74,697,761-byte zip; Michigan slice 87,245
  rows): **zero** (74, own 0) rows exist. The map therefore
  uses the private-ownership rows — the only complete sector
  grain, and the grain of the package's own verified samples
  (89,659 / 116,757) — labeled "private ownership" on the
  page, in the block note, in the sources note, and in the
  dataset's `grain` field. The All-industries layer uses the
  published county total (all ownerships, agglvl 70).
- **D2 — The package's T002 cross-check mixed vintages.**
  tasks.md paired "Wayne manufacturing 89,659 (2024)" with
  "Wayne total 719,741" — 719,741 is Wayne's **2023** county
  total (verified in the 2023 per-area file); the 2024 total
  is **725,504**. The fetcher's sanity checks use the 2024
  pair (89,659 + 725,504). The tasks.md record is corrected
  in the T003 check-off note.
- **D3 — LAUS series suffix.** The series is `LAUCN` + FIPS +
  `0000000003` (ten zeros — a 20-character ID). A 9-zero
  variant returns empty series shells with REQUEST_SUCCEEDED;
  the fetcher hard-fails on any zero-data series so a bad ID
  can never read as a county full of holes.
- **D4 — Absent rows share the not-disclosed rendering.** A
  county × sector cell can be (a) published, (b)
  disclosure-suppressed, or (c) absent from the source file
  entirely (no row). The spec names (a) and (b). Absent rows
  (57) render in the same not-disclosed state (never zero,
  never shaded), are stored distinctly (`{absent: true}`),
  and the block note defines the state as "the source
  publishes no value (suppressed, or no establishments
  reported)".
- **D5 — IPEDS grand-total rows excluded.** `C2024_A`
  carries CIPCODE `99` grand-total rows (532 Michigan rows)
  that duplicate the detail rows exactly (verified per
  institution: ratio 1.0). They are excluded from every
  aggregate; counting them would double every total
  (257,080 instead of the correct 128,540).
- **D6 — PSEO code meanings confirmed from the schema.**
  The verification pass read degree/status codes from the
  data layout PDF; the implementation confirmed them against
  the authoritative LEHD schema V4.9.0 label CSVs
  (`label_degree_level.csv`: 05 = Baccalaureate;
  `label_status.csv`: 1 = OK, 5 = suppressed, 6/7 =
  calculated, 9 = distorted). Only flag-1 values are
  committed; every excluded row is counted in the file's
  `excludedRows`.
- **D7 — Rendering decision: per-layer shading scale.** Each
  QCEW layer shades on its own five-step scale (the
  wireframe's numeric legend bands were drawn for the
  Manufacturing layer's range). Rationale: with fixed bands,
  small industries would render as a single flat shade and
  carry no geographic signal; the legend states the rule
  ("Fewest ↔ Most jobs in this industry"), the tables carry
  every exact value, and cross-industry comparison is what
  the location-quotient column is for.

## 3. Traceability audit (2026-10-06, independent re-read)

An audit script written separately from the fetchers/preps
recomputed every dataset from its source (or a fresh API
read) and compared value-for-value. **Result: ALL PASS
(17/17)**:

| Check | Result |
|---|---|
| Geometry: all 83 path strings reproduced from counties-10m.json (independent TopoJSON decode, Python) | PASS |
| Geometry: viewBox + projection constants recomputed | PASS |
| LAUS: all 83 Aug 2026 rates match a fresh BLS API read | PASS |
| LAUS: Oct 2025 hole in 83/83 series; month/preliminary flags | PASS |
| QCEW: all 1,660 cells + both county totals reproduced from the bulk single file (independent artifact) | PASS |
| QCEW: suppressed 416 / absent 57 counts; Wayne + Keweenaw samples | PASS |
| IPEDS: all 160 institution totals reproduced; statewide 128,540; family totals; UMich coords/total | PASS |
| PSEO: all 10 flow rows traced to source rows; UMich medians + retention counts; single partner institution | PASS |

Plus: the committed IPEDS and PSEO prep scripts reproduce
their committed JSON files **byte-identically** from the
source artifacts.

Note on scratch: the original downloads lived in
`/tmp/spec014-prep/` and were lost when /tmp filled during
the QCEW single-file extraction; every source artifact was
re-fetched to persistent workspace scratch
(`~/workspace/spec014-scratch/sources/`) and re-verified by
byte size against the source-verification report before the
audit ran (all five sizes matched exactly). The committed
datasets were unaffected (already in git).

## 4. Refresh discipline

- LAUS: monthly, month-gated (`fetch-geo.mjs laus`); a new
  reference month replaces the file; a stale read keeps the
  last-good file and the live page keeps its vintage label.
- QCEW annual, IPEDS annually, PSEO per Census release:
  committed dataset updates only (FR-007) — re-run the
  fetcher/prep, re-run this audit, commit with the vintage
  change visible. The QCEW fetcher's sanity constants are
  vintage-pinned (see D2): a BLS revision of the 2024 file
  fails the build loudly rather than passing silently.
- The monthly workforce cycle's map-refresh step (spec 007
  FR-011) checks these vintages before each draft.
