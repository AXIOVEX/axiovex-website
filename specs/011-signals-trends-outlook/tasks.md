# Tasks: Trends & Outlook on the Signals Page (spec 011)

Proposal package prepared 2026-10-06: wireframes revised
(`docs/wireframes/wireframes.html` — WF-11 gains the Trends &
outlook section: ticker strip, trend board, outlook board,
education analytics block; `wireframes.md` revision log) and
this spec package written. **PENDING OWNER APPROVAL — nothing
below the gate is done, and nothing is implemented.**

## Gate

- [ ] T001 **GATE — Owner approval of the wireframes (Tristen).**
  Scope of the approval: WF-11 revised (Trends & outlook section
  between the Pulse band and the lanes — ticker strip with its
  accessibility mechanics, trend board, outlook board with the
  attributed-projections framing and standing caption,
  education analytics block) and the integrity rules in spec.md
  FR-005. **Blocks every task below.** Nothing is implemented,
  committed to the live pages, or deployed until Tristen
  approves; if he requests changes, the wireframes are revised
  and re-presented first (constitution §III).

## Source verification (starts only after T001)

- [ ] T002 **Verify the three sources (plan.md Step 0)**:
  confirm and record in
  `specs/011-signals-trends-outlook/sources.md` — (1) U.S. BLS
  Employment Projections: latest published vintage (expected
  2024–34), the fastest-growing / fastest-declining occupation
  tables, exact URLs + formats + fields; (2) Michigan DTMB
  long-term industry projections: exact publication/file,
  horizon as published, fields; (3) education exports per
  indicator: Michigan CEPI / MISchoolData graduation rate,
  CEPI enrollment counts, IPEDS completions by field for
  Michigan institutions (aggregation recorded exactly). Any
  source that cannot be verified in published form drops its
  board/indicator via a spec amendment — never a substitute
  estimate.

## Implementation (starts only after T001 + T002)

- [ ] T003 **Build `data/outlook.json` (FR-003, FR-004,
  FR-006)**: transcribe the verified figures verbatim (national
  rise/fall occupations, Michigan rise/fall industries,
  education indicator histories), with per-section agency /
  horizon / vintage / sourceUrl / retrievedOn metadata.
  Second-read check of every figure against the source tables
  before commit.
- [ ] T004 **Generator + template (FR-001, FR-002, FR-003,
  FR-004, FR-006, FR-007)**: in `scripts/build-site.mjs` —
  `trendDeltas()` (MoM + window from trend arrays, "—" when
  fewer than two non-null points), `tickerHtml()`,
  `trendBoardHtml()` (reusing `sparkline()`, "Computed from
  BLS series" label), `outlookHtml()` + `educationHtml()`
  (metadata rendered from the file; missing section → no
  board, build still succeeds). Wire the four placeholders
  into `scripts/templates/signals.html` between
  `{{PULSE_HTML}}` and `{{LANES_HTML}}`; append the sources-note
  attribution sentences (plan.md draft, narrowed if needed);
  meta description only within the ~198-char discipline.
- [ ] T005 **Stylesheet bump (FR-008)**: new component styles
  (tape animation + hover/focus pause + reduced-motion static
  state, boards, stacked mobile rows) in `styles.v26.css`;
  repoint every page/template; remove `styles.v25.css`.

## Verification + promotion

- [ ] T006 **Stage + verify (FR-008)**: merge the work to the
  `staging` branch; verify at staging.axiovexsystems.com —
  figure audit (every rendered number recomputed/matched
  against `data/signals.json`, `data/outlook.json`, and the
  sources.md tables; zero mismatches), tape/board equivalence,
  accessibility pass (aria-hidden tape, keyboard, reduced-motion
  static tape), no overflow at 1440 / 834 / 390px, resilience
  build with `data/outlook.json` renamed (boards absent, page
  intact), regression check (Pulse band, lanes, home, widget
  unchanged apart from the stylesheet repoint).
- [ ] T007 **Promote + production verification (FR-007,
  FR-008)**: merge `staging` → `main` under spec 010's hazard
  rule (stop if staging-only `robots.txt`/`_headers` appear in
  the diff); repeat the figure audit + spot checks against the
  served production page; confirm the SEO/AEO baseline holds
  on the next monitoring cycle (AEO 100 / Seobility 90).
- [ ] T008 **Close-out**: mark the `docs/wireframes/wireframes.md`
  revision-log entry APPROVED + implemented (with the
  implementation commit), sync the review copy at
  `~/workspace/your_files/axiovex-wireframes/`, record the
  change in this spec's status line, and check off these tasks
  with the completion record.

## Amendment 2 (owner-directed 2026-10-06 — see spec.md)

- [ ] T009 **Implement Amendment 2 on staging** (starts only
  after spec 012's build completes on the staging branch —
  shared generator/stylesheet chain): relocate `{{TICKER_HTML}}`
  ahead of the page-head section in
  `scripts/templates/signals.html` so the tape renders directly
  under the header (tape markup + accessibility mechanics
  unchanged; its margin becomes the 16px page-top offset);
  apply the A2-2 spacing values (44/36px head padding,
  24px head→strata, 28px strata→content, 10px kicker margin,
  14px tile padding, 40px trends-head margin) as
  /signals/-scoped rules in the next versioned stylesheet
  (the version after spec 012's; repoint all references per
  the standing cache rule); extend the trend-board renderer
  so each sparkline cell also carries the window % (glyph +
  signed %, one decimal, computed from the trend history;
  relative change for the rate series; "—" when fewer than
  two non-null points). Sources & method note unchanged.
  Regenerate and commit on `staging`.
- [ ] T010 **Verify Amendment 2 at the staging URL**
  (staging.axiovexsystems.com/signals/): the ticker renders
  directly under the header and nowhere else on the page;
  measured spacing matches the A2-2 table (page-head padding,
  head→strata, strata→content, kicker margin, tile padding,
  trends-head margin); every sparkline % equals an
  independently recomputed value from `data/signals.json`
  (zero mismatches); tape/board equivalence still holds;
  no horizontal overflow and no crowding at 1440 / 834 /
  390px; Pulse band, trend board, outlook board, lanes, and
  the widget are unchanged apart from the above.
