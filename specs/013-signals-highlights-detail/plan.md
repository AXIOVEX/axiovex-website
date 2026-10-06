# Plan: Signals Highlights + Expandable Detail (spec 013)

**Status: proposal only.** This plan executes only after the
tasks.md T001 gate (Tristen approves the revised WF-11).
Nothing here has been implemented. The data inventory below
was verified by reading the datasets themselves on
2026-10-06 — provenance is established in this plan, not
deferred to a later verification task, because every dataset
this spec consumes already exists in verified form.

## Data-provenance inventory (verified 2026-10-06)

| # | Dataset | Where it lives | Contents (as read) | Provenance / verification state |
|---|---|---|---|---|
| 1 | Pulse snapshot | `data/signals.json` (website repo; written by the hourly `scripts/fetch-signals.mjs` ingest, spec 004) | `updatedUtc` 2026-10-06T14:11:26Z at read time; `pulse.referenceMonth` "August 2026"; 4 tiles (BLS series `SMU26000003000000001`, `LASST260000000000003`, `LASST260000000000006`, `SMU26000000000000001`), each with a 12-point `trend` array `{ym, v}` Sep 2025 → Aug 2026; `v: null` at 2025-10 for unemployment + labor force; fetcher `delta` present on 2 tiles, null on 2 (generator computes, per spec 011) | Live production data, verified under specs 004/011. Feeds: Highlights Pulse cards, insights Pulse sentences, Detail block (i) |
| 2 | BLS Employment Projections | `data/outlook.json` → `blsProjections` (website repo, committed under spec 011) | rise 5 rows + fall 5 rows, each `{name, pctChange, jobsChange}`; agency U.S. BLS; vintage/horizon 2025–35; `retrievedOn` 2026-10-06; table URLs recorded | Verified on bls.gov (Tables 1.3 + 1.5) per spec 011 sources.md §1; second-read check 10/10. Feeds: U.S. riser/faller cards, insights outlook sentence, Detail block (ii) |
| 3 | Michigan MCDA occupation projections | Research repo: `~/workspace/michigan-workforce-intelligence/reports/2026-09-26-graduation-horizons/projections.json` (release tag `reports-2026.09.27.131143Z`, source commit `d0fbc71`) | 36 rows `{occupation, soc, base_employment, projected_employment, change_percent, annual_openings, period, geography, source_id}`: 18 statewide 2024–34 (source S12 = MCDA statewide workbook `LongTerm_OccupationProj_2034_Michigan_Statewide.xlsx`) + 18 Detroit Metro Prosperity Region 2022–32 (source S13 = MCDA regional workbook); statewide top riser Nurse practitioners +41.5%, top faller Foundry mold and coremakers −29.3% | Captured + reviewed under the study's reviewed-evidence process (28 sources, 187 observations, ledger chain valid; release assets checksum-verified 2026-10-06). **Caveat:** not yet read directly on michigan.gov by the website flow (spec 011 sources.md §2 — the projections page fetch was denied; secondary coverage was refused). Ships labeled "via the Axiovex workforce study, September edition" (spec.md FR-005iii); a direct DTMB read supersedes. Feeds: Michigan riser/faller cards, insights outlook sentence, Detail block (iii) |
| 4 | Education-to-career verified set | Verified during spec 007 FR-010 work (sample article + SAMPLE-NOTES in the monitoring goal's `files/workforce-drafts/`); sources read on their publishers | Graduation rate just over 84% (class of 2025), prior 82.8% (class of 2024), dropout 7.1% vs 7.7% — CEPI via MDE release 2026-02-20; teacher-prep enrollees 14,819 (2023–24) vs trough 6,859 (2016–17), completers 2,961 (2023–24) vs 2,258 (2019–20) — MDE release 2025-09-29; pupil membership 1,371,800 FY2025–26, −12,534 YoY — House Fiscal Agency Jan 2026 CREC consensus, **labeled budget estimates by the source** | Each figure read on its publishing source during the FR-010 verification. **Precision note:** spec 011's dataset bar dropped the rounded graduation figure ("just over 84%") from `outlook.json`; spec 013 commits each figure **in the form its source publishes it** (the release's own wording for the rate) with publisher + vintage + URL — the figure is never sharpened beyond its source. Postsecondary completions by field (IPEDS): **not verified — excluded** (dataset #5 below). Feeds: education headline card, insights education sentence, Detail block (iv) |
| 5 | Postsecondary completions by field (IPEDS) | — | — | **Does not exist in verified form.** No Michigan by-field series could be read/reproduced from the source (spec 011 sources.md §3; FR-010 sample, disclosed omission). Excluded from both regions; joins only via a future verified data refresh |

## Step 1 — Data assembly (tasks.md T002)

Add two sections to `data/outlook.json`, transcribing — never
re-deriving — from inventory #3 and #4:

- `michiganProjections`: metadata (publisher "Michigan
  Center for Data and Analytics (MCDA), Michigan DTMB";
  `viaStudy: true`; edition folder + release tag
  `reports-2026.09.27.131143Z`; source files S12/S13 with
  their workbook names; study retrieval date 2026-09-27) +
  `groups: [{geography: "Michigan", horizon: "2024–34",
  rows: [18]}, {geography: "Detroit Metro Prosperity
  Region", horizon: "2022–32", rows: [18]}]`, rows carrying
  occupation, soc, baseEmployment, projectedEmployment,
  pctChange, annualOpenings. Transcription is checked
  mechanically against the edition file (36/36 rows, every
  field) before commit; the checker output is recorded in
  `specs/013-signals-highlights-detail/sources.md` (created
  by T002).
- `education`: metadata (assembled 2026-10-06 from the FR-010
  verified set) + `figures: [...]`, each `{label, value,
  valueText?, period, priorText?, publisher, sourceUrl,
  retrievedOn, estimate?: true}`. `valueText` carries the
  source's own wording where the source publishes rounded
  text ("just over 84%") so the renderer never invents
  precision. The pupil-membership figure carries
  `estimate: true`.

No other data changes. `scripts/fetch-signals.mjs`,
`data/signal-sources.json`, and both workflows are untouched.

## Step 2 — Generator (tasks.md T003)

`scripts/build-site.mjs` gains, in the spec 011 style
(deterministic, absent-section → absent output, never a
build failure):

- `insightsHtml(snapshot, outlook)` — the summary composer.
  Sentence templates, in fixed order, each independently
  gated on its inputs existing:
  1. **Pulse month sentence** — latest reference month;
     manufacturing level + signed MoM delta (+ a computed
     "above/below its <month> low/high" clause only when the
     extremum is a trend-array fact); labor force level +
     signed MoM delta; unemployment level + "held at" /
     signed pts delta wording chosen by the computed delta.
  2. **Window sentence** — window span from the trend arrays;
     labor force window delta + window %; nonfarm window
     delta + window % (the Amendment-2 percentages, reused —
     one computation, two surfaces).
  3. **Outlook sentence** — only when at least one outlook
     dataset is present: top riser named per dataset present
     ("on both boards" phrasing only when both are present
     and the fact holds — the composer compares, it does not
     assert a template's hope); faller clause likewise.
  4. **Education sentence** — only when the education
     headline figure is present: the graduation figure in
     its source wording + its prior-class comparison.
  The composer emits plain text values through the same
  escaping as the boards; a clause with a missing input is
  dropped at the clause level, a sentence at the sentence
  level (FR-002c). A unit test fixture set (full data /
  BLS-only / Michigan-only / no-education / empty outlook)
  pins the expected sentence sets.
- `highlightCardsHtml(snapshot, outlook)` — FR-003's
  composition rule, reusing `trendDeltas()` from spec 011
  for the Pulse cards and the datasets' own maxima for the
  outlook cards.
- `detailHtml(snapshot, outlook)` — the five FR-005 blocks;
  Pulse tables iterate the trend arrays directly (null →
  gap cell + the block's missing-month caption); Michigan
  groups iterate `groups[]` as labeled, never merged;
  the link block resolves the newest spec 007-series post
  from the build's own post list and the edition URL from
  `michiganProjections` metadata.
- Template: `scripts/templates/signals.html` gains
  `{{HIGHLIGHTS_HTML}}` (between the strata and
  `{{PULSE_HTML}}`) and `{{DETAIL_HTML}}` (between the
  Trends & outlook block and `{{LANES_HTML}}`), plus the
  FR-009 sources-note sentences (drafted from the inventory
  labels; final copy reviewed against the claims rules at
  implementation).

## Step 3 — Styles + disclosure behavior (tasks.md T004)

- Styles ride the **next versioned stylesheet bump** in the
  staging chain sequence (Amendment 2 shipped v28; this spec
  takes the next number at implementation time), all
  references repointed, prior file removed — per the
  standing cache rule. New rules reuse existing card/table/
  strata tokens; no new colors or type styles (FR-008).
- The disclosure is a small progressive-enhancement script
  in the page's existing style (no framework): button toggles
  `aria-expanded` + the region's hidden presentation; with
  scripts disabled the region renders expanded (the hidden
  state is applied by the script's presence, not by markup
  alone). State is not persisted — the region always loads
  collapsed (with JS) so the page's clean top is invariant.

## Step 4 — Staging verification (tasks.md T005)

On staging.axiovexsystems.com/signals/, per FR-010:

1. **Figure audit (zero mismatches):** scripted comparison
   of every rendered value in both regions against
   `data/signals.json` + `data/outlook.json`; the Michigan
   table additionally against the edition's
   `projections.json` (36/36 rows, all fields).
2. **Clause audit:** every insights sentence decomposed to
   its input values; each input located in the committed
   data; fixture builds (Step 2) re-run to confirm omission
   behavior.
3. **Mechanics:** collapsed footprint = header row only;
   keyboard-only open/close; aria state correct; served
   HTML contains the full detail content with scripts
   disabled; no horizontal overflow at 1440 / 834 / 390.
4. **Resilience:** build with `data/outlook.json` renamed
   away → page intact, Pulse-only regions; build with the
   `education` section removed → card + sentence + block
   absent, everything else identical.

## Step 5 — Promotion + closeout (tasks.md T006–T007)

Promotion merges `staging` → `main` under spec 010 FR-004
(stop if the diff carries staging-only `robots.txt` /
`_headers` beyond the intended guard state), then the
production figure audit repeats against the live page, and
the next monitoring cycle confirms the AEO 100 / Seobility
90 baseline. Closeout flips the WF-11 spec 013 labels to
approved/implemented, re-syncs the review copy, advances
the monitoring state commit, and records whether the owner
bundled this promotion with specs 011/012 + Amendment 2 or
sequenced it after them (owner's call at the T001 gate —
this plan supports either: spec 013's generator work builds
on spec 011's renderers and touches no spec 012 surface).

## Risks / open points

- **Rounded-source figures** (inventory #4): the graduation
  rate renders in the MDE release's own words. If a
  dataset-precision CEPI figure is later read directly, it
  replaces the wording as a data-only refresh — the
  templates already carry `valueText` for exactly this.
- **Two-vintage Michigan table**: the grouping is the
  integrity mechanism; any design pressure to merge the
  groups into one ranked table is refused by FR-005(iii).
- **Summary drift**: templates are fixed in code and
  fixture-tested; a data refresh can change values but never
  wording patterns — wording changes are spec changes.
