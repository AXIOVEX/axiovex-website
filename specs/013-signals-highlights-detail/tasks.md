# Tasks: Signals Highlights + Expandable Detail (spec 013)

Proposal package prepared 2026-10-06: wireframes revised
(`docs/wireframes/wireframes.html` — WF-11 gains the
Highlights region and the Detail region in both states;
`wireframes.md` revision log) and this spec package written.
**PENDING OWNER APPROVAL — nothing below the gate is done,
and nothing is implemented.**

## Gate

- [ ] T001 **GATE — Owner approval of the wireframes
  (Tristen).** Scope of the approval: WF-11 as revised by
  spec 013 (Highlights region with the generated insights
  summary + highlight cards under the page head; the
  expandable "The full picture" Detail region between
  Trends & outlook and the lanes, drawn collapsed and
  expanded) and the integrity rules in spec.md — FR-002
  (insights generation rules + the spec 004 FR-008
  reconciliation), FR-005/FR-006 (committed-data provenance,
  incl. the Michigan table's via-study label and caveat).
  **Blocks every task below.** Also recorded at this gate:
  the owner's sequencing call — whether specs 011/012 +
  Amendment 2 promote first or bundle with spec 013 (spec.md
  deliberately leaves this to the approval reply). Nothing
  is implemented, committed to the live pages, or deployed
  until Tristen approves; if he requests changes, the
  wireframes are revised and re-presented first
  (constitution §III).

## Implementation (starts only after T001)

- [ ] T002 **Data assembly (FR-005, FR-006)**: add
  `michiganProjections` (36 rows, two labeled groups, full
  metadata incl. `viaStudy` + edition release tag) and
  `education` (the verified set, per-figure publisher /
  vintage / URL, `estimate: true` on pupil membership) to
  `data/outlook.json`, transcribing from the September
  edition's `projections.json` and the FR-010 verified set.
  Mechanical transcription check (36/36 rows, every field)
  recorded in `specs/013-signals-highlights-detail/
  sources.md`. No fetcher, source-config, or workflow
  changes.
- [ ] T003 **Generator (FR-002, FR-003, FR-005, FR-007)**:
  `insightsHtml()` (fixed sentence templates; clause-level
  omission on missing inputs; fixture set pinning full /
  BLS-only / Michigan-only / no-education / empty-outlook
  outputs), `highlightCardsHtml()` (FR-003 composition
  rule), `detailHtml()` (five blocks; nulls as gaps; groups
  never merged; link block resolved from the build's post
  list + dataset metadata) in `scripts/build-site.mjs`;
  `{{HIGHLIGHTS_HTML}}` + `{{DETAIL_HTML}}` placeholders and
  the FR-009 sources-note sentences in
  `scripts/templates/signals.html`.
- [ ] T004 **Styles + disclosure (FR-004, FR-008)**: region
  styles in the next versioned stylesheet bump (sequence
  after Amendment 2's v28; all references repointed, prior
  file removed), reusing existing card/table/strata tokens
  only; disclosure button behavior (aria-expanded/controls,
  keyboard, visible focus; region renders expanded with
  scripts disabled; no persisted state).
- [ ] T005 **Staging verification (FR-010)**: figure audit
  (zero mismatches vs `data/signals.json` +
  `data/outlook.json`; Michigan table 36/36 vs the edition's
  `projections.json`); insights clause audit (every clause
  traced to committed inputs; fixture omission behavior
  confirmed); collapsed footprint = header row only;
  content present in served HTML with scripts disabled; no
  overflow at 1440 / 834 / 390; resilience builds
  (outlook.json absent; education section absent).
- [ ] T006 **Promotion**: merge `staging` → `main` under
  spec 010 FR-004 (STOP if the diff carries staging-only
  `robots.txt`/`_headers` beyond the intended guard state),
  per the sequencing recorded at T001; production figure
  audit repeated live; next monitoring cycle confirms
  AEO 100 / Seobility 90 holds.
- [ ] T007 **Closeout**: WF-11 spec 013 labels flipped to
  approved/implemented in `wireframes.html` + `wireframes.md`;
  review copy `~/workspace/your_files/axiovex-wireframes/
  wireframes.html` re-synced byte-identical; monitoring
  state `website_commit` advanced; spec.md status updated.
