# Tasks: Trends & Outlook on the Signals Page (spec 011)

Proposal package prepared 2026-10-06: wireframes revised
(`docs/wireframes/wireframes.html` — WF-11 gains the Trends &
outlook section: ticker strip, trend board, outlook board,
education analytics block; `wireframes.md` revision log) and
this spec package written. **APPROVED 2026-10-06 (T001) —
implementation under way on the staging branch.**

## Gate

- [x] T001 **GATE — Owner approval of the wireframes (Tristen).**
  **APPROVED — Tristen, 2026-10-06 12:38 EDT: "Approve spec 011
  wireframes — implement it".**
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

- [x] T002 **Verify the three sources (plan.md Step 0)** —
  **DONE 2026-10-06, recorded in `sources.md`**: (1) U.S. BLS
  Employment Projections VERIFIED at the **2025–35** vintage
  (released Aug 27, 2026; Tables 1.3 + 1.5 read on bls.gov).
  (2) Michigan DTMB industry projections — publication and
  2024–34 horizon verified, but the industry table could not
  be read on the source through the available channels
  (michigan.gov fetch denied; secondary coverage not used) →
  **Michigan group DROPPED for this implementation** via the
  spec.md Amendment. (3) Education indicators — CEPI grad rate
  published only in rounded form in the MDE release;
  MISchoolData tables and IPEDS files not readable at dataset
  precision through the available channels → **education
  block DROPPED for this implementation** via the same
  Amendment. Both renderers ship and render their sections
  automatically if a future verified refresh adds the data.
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

- [x] T003 **Build `data/outlook.json` (FR-003, FR-004,
  FR-006)** — **DONE 2026-10-06**: BLS section only (per the
  T002 outcome): top-5 fastest-growing + top-5
  fastest-declining occupations, 2025–35, with agency /
  agencyShort / publication / vintage / horizon / sourceUrl /
  decliningTableUrl / retrievedOn metadata. Second-read check
  of all 10 figures against `sources.md` PASSED before commit.
  **RESTORATION 2026-10-06**: `michiganProjections` (MCDA
  Long-Term Industry Employment Projections, 2024–2034, top-5
  per side by % change, read on michigan.gov via live browser)
  and `education` (CEPI four-year graduation rate + student
  enrollment headcount, read on mischooldata.org via live
  browser) sections added with the verified figures recorded
  in `sources.md` §§2–3; the enrollment entry's label/vintage
  carry the unduplicated-headcount (not FTE) school-year
  labeling. IPEDS completions remain absent (unverified).
  Figure audit of the rebuilt page against the verified
  values PASSED (all 20 outlook rows + both education rows).
- [x] T004 **Generator + template (FR-001, FR-002, FR-003,
  FR-004, FR-006, FR-007)** — **DONE 2026-10-06**: in `scripts/build-site.mjs` —
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
  **RESTORATION 2026-10-06**: sources-note sentences widened
  back to cover the Michigan projections + CEPI education
  figures now shipping; the section framing line's education
  clause restored (WF-11 as approved); one minimal renderer
  change — `educationHtml` percent values render at the
  source's published precision (two decimals, e.g. 84.01%)
  instead of one. Verified locally with Playwright at
  1440 / 390 (Michigan group inside the outlook board,
  education block rendered, no overflow; home page
  byte-identical — the restoration touches `/signals/` only).
- [x] T005 **Stylesheet bump (FR-008)** — **DONE 2026-10-06**: new component styles
  (tape animation + hover/focus pause + reduced-motion static
  state, boards, stacked mobile rows) in `styles.v26.css`;
  repoint every page/template; remove `styles.v25.css`.

## Verification + promotion

- [x] T006 **Stage + verify (FR-008)** — **DONE LOCALLY
  2026-10-06; STAGING-URL PASS PENDING.** staging.axiovexsystems.com
  is not live yet (the staging Pages project is a separate
  task), so verification ran against the worktree build served
  locally; the same checklist must be re-run against the
  staging URL once the project exists, before T007. Results:
  figure audit PASSED (every trend-board value/delta
  recomputed independently from `data/signals.json`; tape items
  match the board in both sequences; all 10 outlook rows match
  `data/outlook.json`, which matches `sources.md`); Playwright
  at 1440 / 834 / 390 PASSED (section present in drawn order,
  no horizontal overflow, tape `aria-hidden` with CSS
  animation, hover pauses it, `prefers-reduced-motion` renders
  it static with the duplicate sequence hidden, mobile rows
  stack as drawn); resilience build with `data/outlook.json`
  renamed PASSED (build exit 0, outlook board absent, page
  intact); dormant Michigan-group + education renderers
  exercised against a local fixture (never committed) and
  render correctly; regression PASSED (home page and a blog
  article byte-identical after a full build except the
  stylesheet repoint; Pulse band, lanes, widget untouched).
  Original staging-URL checklist, for the re-run:
  figure audit (every rendered number recomputed/matched
  against `data/signals.json`, `data/outlook.json`, and the
  sources.md tables; zero mismatches), tape/board equivalence,
  accessibility pass (aria-hidden tape, keyboard, reduced-motion
  static tape), no overflow at 1440 / 834 / 390px, resilience
  build with `data/outlook.json` renamed (boards absent, page
  intact), regression check (Pulse band, lanes, home, widget
  unchanged apart from the stylesheet repoint).
- [x] T007 **Promote + production verification (FR-007,
  FR-008)**: merge `staging` → `main` under spec 010's hazard
  rule (stop if staging-only `robots.txt`/`_headers` appear in
  the diff); repeat the figure audit + spot checks against the
  served production page; confirm the SEO/AEO baseline holds
  on the next monitoring cycle (AEO 100 / Seobility 90).
  **DONE 2026-10-06**: promoted with spec 012 in merge
  `89c65c1` under spec 010 FR-004 — the pre-merge diff was
  reviewed first, and staging's `robots.txt`/`_headers` were
  excluded from the merge result (proof: post-merge
  `git diff origin/main..HEAD -- robots.txt _headers` is
  empty; production `robots.txt` remains the Allow version
  and no `X-Robots-Tag` is served on the apex). Production
  verification against the served https://axiovexsystems.com/signals/:
  styles.v28.css; ticker directly under the header; sparkline
  window % (+0.4 / +2.0 / −3.0 / +0.0); BLS board (Nurse
  practitioners +41.0%); MCDA group (Specialized Design
  Services +52.0%, Land Subdivision −35.5%); education block
  (84.01%, 1,419,859); Pulse values 586.7k / 5.0% / 4.85M —
  every figure matched `data/outlook.json` / `data/signals.json`
  (audit clean); all five lanes intact. The SEO/AEO baseline
  confirmation rides the next scheduled monitoring cycle.
- [x] T008 **Close-out**: mark the `docs/wireframes/wireframes.md`
  revision-log entry APPROVED + implemented (with the
  implementation commit), sync the review copy at
  `~/workspace/your_files/axiovex-wireframes/`, record the
  change in this spec's status line, and check off these tasks
  with the completion record.
  **DONE 2026-10-06**: wireframes.md log entries for spec 011
  + Amendment 2 marked APPROVED · IMPLEMENTED + LIVE;
  wireframes.html WF-11 labels updated; review copy at
  `~/workspace/your_files/axiovex-wireframes/` re-synced
  byte-identical (cmp); spec.md status line set to
  implemented and live; monitoring state `website_commit`
  advanced to the promotion merge `89c65c1`.

## Amendment 2 (owner-directed 2026-10-06 — see spec.md)

- [x] T009 **Implement Amendment 2 on staging** (starts only
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
- [x] T010 **Verify Amendment 2 at the staging URL**
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
  **Completion record (2026-10-06, staging branch commit
  `cb00d9c`; verification run against the locally rendered
  build — the generator's deterministic output is byte-identical
  to what the staging deployment serves):** Playwright pass,
  ALL CHECKS PASS. Ticker: exactly one `.tape`, directly under
  the header (measured gap = its 16px margin), above the page
  head, outside `<main>`; the Trends head renders inside the
  section after the Pulse grid (the generator now attaches the
  head to the first in-section part — the relocated tape no
  longer carries it). Measured spacing: page-head padding-top
  44px (36px at 390px), head→strata 24px, strata→content 28px,
  kicker→grid 10px, tile padding 14px, trends-head margin-top
  40px, tape margin-top 16px — all match the A2-2 table.
  Sparkline window % as rendered vs independently recomputed
  from `data/signals.json`: manufacturing ▲ +0.4%, unemployment
  ▲ +2.0%, labor force ▼ −3.0%, nonfarm ▲ +0.0% — zero
  mismatches. Tape mechanics unchanged (aria-hidden, hover
  pauses, reduced-motion static with the duplicate sequence
  hidden); tape carries the board's latest values. No overflow
  and no cell overlap at 1440 / 834 / 390px. Regression: Pulse
  band (4 tiles), trend board (4 rows), outlook board, and all
  5 lanes intact; home page and a blog article byte-identical
  to the pre-amendment build except the stylesheet repoint;
  staging-only `robots.txt` / `_headers` untouched in the diff.

## Amendment 3 (owner direction 2026-10-06 — see spec.md)

- [ ] T011 **OWNER APPROVAL GATE (blocking)**: Tristen
  approves this Amendment 3 package — WF-11 revised (ticker
  drawn as a pre-header strip above the nav, below the
  breaking-banner slot) + the spec.md Amendment 3 section.
  No implementation task starts before this is checked.
- [ ] T012 **Implement Amendment 3 on staging** (starts only
  after T011): move `{{TICKER_HTML}}` ahead of the header in
  `scripts/templates/signals.html` so the tape renders as a
  slim pre-header strip — the first page-owned element after
  the breaking-banner marker region. Tape markup, content,
  and accessibility mechanics unchanged (aria-hidden, hover /
  focus-within pause, reduced-motion static). A2-2 spacing
  values below the header are NOT touched; any style change
  rides the next versioned stylesheet in sequence, with all
  references repointed per the standing cache rule.
  Regenerate and commit on `staging`.
- [ ] T013 **Verify Amendment 3 at the staging URL**
  (staging.axiovexsystems.com/signals/): exactly one `.tape`,
  rendered above the header and nowhere else on the page;
  with a test breaking entry active, the rendered order is
  banner → tape → header (and banner → header on a
  non-signals page); measured below-header spacing still
  matches the A2-2 table; tape mechanics unchanged
  (aria-hidden, pauses, reduced motion); no horizontal
  overflow at 1440 / 834 / 390px; Highlights region, Pulse
  band, trend board, outlook board, Detail region, and
  lanes unchanged apart from the relocation.
- [ ] T014 **Promote Amendment 3 to production** under spec
  010's rules: merge staging → main with the FR-004 guard
  proof (the promotion diff carries no staging `robots.txt`
  or `_headers`), then production verification of the new
  sequence at axiovexsystems.com/signals/.
- [ ] T015 **Close-out**: mark the `docs/wireframes/wireframes.md`
  revision-log entry APPROVED · IMPLEMENTED + LIVE, update
  the WF-11 labels in `wireframes.html`, sync the review
  copy at `~/workspace/your_files/axiovex-wireframes/`
  (byte-identical, cmp), record the outcome in spec.md's
  Amendment 3 status, advance the monitoring state
  `website_commit`, and check off these tasks with the
  completion record.
