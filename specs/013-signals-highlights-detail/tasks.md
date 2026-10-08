# Tasks: Signals Highlights + Expandable Detail (spec 013)

Proposal package prepared 2026-10-06: wireframes revised
(`docs/wireframes/wireframes.html` — WF-11 gains the
Highlights region and the Detail region in both states;
`wireframes.md` revision log) and this spec package written.
**APPROVED 2026-10-06 (T001), implemented on staging the
same day (T002–T005), promoted to production (T006,
merge `4497704`) and closed out (T007) 2026-10-06.**

## Gate

- [x] T001 **GATE — Owner approval of the wireframes
  (Tristen).** **Approved by Tristen, 2026-10-06 13:43 EDT:
  "Approve spec 013 wireframes — implement it"** (Axiovex
  website chat). Scope of the approval: WF-11 as revised by
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
  **Sequencing as it fell out:** specs 011/012 + Amendment 2
  + the Michigan/education restoration promoted to
  production first (merge `89c65c1`); spec 013 follows with
  its own staging cycle. One consequence is recorded as
  deviation 1 in sources.md: the restoration occupied the
  `michiganProjections` / `education` keys first, so the
  occupation dataset is committed as `michiganOccupations`
  and the figures as `education.figures`.

## Implementation (starts only after T001)

- [x] T002 **Data assembly (FR-005, FR-006)**: added
  `michiganOccupations` (36 rows, two labeled groups, full
  metadata incl. `viaStudy` + edition release tag) and
  `education.figures` (the verified set, per-figure
  publisher / vintage / URL, `estimate: true` on pupil
  membership) to `data/outlook.json`, transcribed from the
  September edition's `projections.json` and the FR-010
  verified set. (Key names per sources.md deviation 1 — the
  plan's `michiganProjections` / `education` keys were
  already occupied by the spec 011 restoration's industry
  dataset and indicators.) Mechanical transcription check
  **36/36 rows, every field — PASS**, recorded in
  `specs/013-signals-highlights-detail/sources.md`. No
  fetcher, source-config, or workflow changes.
- [x] T003 **Generator (FR-002, FR-003, FR-005, FR-007)**:
  `insightsHtml()` (fixed sentence templates; clause-level
  omission on missing inputs; fixture set pinning full /
  BLS-only / Michigan-only / no-education / empty-outlook
  outputs — all confirmed at T005), `highlightCardsHtml()`
  (FR-003 composition rule), `detailHtml()` (five blocks;
  nulls as gaps; groups never merged; link block resolved
  from the build's post list + dataset metadata) in
  `scripts/build-site.mjs`; `{{HIGHLIGHTS_HTML}}` +
  `{{DETAIL_HTML}}` placeholders and the FR-009
  sources-note sentences in `scripts/templates/signals.html`.
- [x] T004 **Styles + disclosure (FR-004, FR-008)**: region
  styles in **`styles.v30.css`** (v29 + the spec 013 block
  appended — pure additions in existing tokens; all
  references repointed, v29 removed), reusing existing
  card/table/strata tokens only; disclosure button behavior
  (aria-expanded/controls, keyboard, visible focus; region
  renders expanded with scripts disabled; no persisted
  state).
- [x] T005 **Staging verification (FR-010)**: figure audit
  **zero mismatches** vs `data/signals.json` +
  `data/outlook.json`; Michigan table **36/36** vs the
  edition's `projections.json`; insights clause audit
  (every clause traced to committed inputs — zero
  untraceable; fixture omission behavior confirmed);
  collapsed footprint = header row only; content present in
  served HTML with scripts disabled; no overflow at
  1440 / 834 / 390 (Playwright 71/71); resilience builds
  (outlook.json absent; education section absent). Full
  record: sources.md §3.
- [x] T006 **Promotion**: merge `staging` → `main` under
  spec 010 FR-004 (STOP if the diff carries staging-only
  `robots.txt`/`_headers` beyond the intended guard state),
  per the sequencing recorded at T001; production figure
  audit repeated live; next monitoring cycle confirms
  AEO 100 / Seobility 90 holds.
  **Done 2026-10-06:** promotion merge `4497704`
  (staging tip `fe6770a` → main). FR-004 guard proof:
  `git diff origin/main..HEAD -- robots.txt _headers`
  EMPTY — the merge auto-took staging's guard files;
  main's `robots.txt` was restored and `_headers`
  removed from the merge result before pushing, exactly
  the spec 011/012 pattern. Production keeps its Allow
  robots.txt and gained no `_headers`. Sync back to
  staging re-applied the guards (commit `b8a2956`);
  post-sync main..staging diff is exactly `_headers` +
  staging `robots.txt`.
  **Production verification (live, 2026-10-06):**
  /signals/ serves styles.v30.css and is byte-identical
  to the generated page at the merge. Highlights region
  present — generated insights summary + 9 highlight
  cards; figure spot-audit vs `data/signals.json` +
  `data/outlook.json` clean (manufacturing 586.7k,
  unemployment 5.0%, labor force −25.5k MoM and +12.3k
  above its January low, 12-month −151.6k / −3.0%,
  nonfarm +1.5k / +0.0%; nurse practitioners +41.5%
  MCDA / +41.0% BLS; data entry keyers −26.4% / −25.5%;
  graduation "just over 84%", up from 82.8%). Detail
  region in the DOM — 12-month Pulse table (Oct 2025
  gaps as "—"), 36/36 Michigan occupation rows in the
  two labeled groups (Michigan statewide 2024–34 /
  Detroit Metro 2022–32, never blended), all 10 BLS
  EP rows, education rows incl. dropout 7.1%,
  teacher-preparation 14,819 / 2,961, and the
  estimate-labeled pupil membership 1,371,800. Ticker
  still at the page top; sparkline % intact; lanes
  intact; BREAKING markers present with zero banner
  markup; `data/breaking.json` still `{"active":null}`.
  Home + article 200 on v30, widget intact; production
  robots = Allow version, no `x-robots-tag`; sitemap +
  feed 200; staging still 200 with
  `x-robots-tag: noindex, nofollow` and staging robots
  intact. AEO 100 / Seobility 90 confirmation rides the
  next scheduled monitoring cycle, as in T007 of specs
  011/012.
- [x] T007 **Closeout**: WF-11 spec 013 labels flipped to
  approved/implemented in `wireframes.html` + `wireframes.md`;
  review copy `~/workspace/your_files/axiovex-wireframes/
  wireframes.html` re-synced byte-identical; monitoring
  state `website_commit` advanced; spec.md status updated.
  **Done 2026-10-06:** WF-11 spec 013 labels (the frame
  note and the three region tags) flipped to APPROVED ·
  IMPLEMENTED + LIVE in `wireframes.html`; revision-log
  closeout recorded in `wireframes.md` (spec 014's
  WF-13 PENDING labels untouched, no drawing altered);
  review copy re-synced byte-identical (cmp verified);
  monitoring state `website_commit` advanced to
  `4497704`; spec.md status → implemented and live.
  The five deviations recorded in sources.md §4 —
  dataset key naming (`michiganOccupations` +
  `education.figures`), the computed +0.1 pts wording
  over the drawn "held", the education sentence in the
  template's source-published form, the gap caption
  without a templated cause, and lowercased occupation
  names mid-sentence — are noted here as recorded and
  accepted: each is a data-faithfulness call. (§4 also
  records the FR-009 meta-description revision: 194
  characters, claim-free.)

## Amendment 1 — owner direction 2026-10-06 (duplicate Pulse cards removed)

Owner direction (Tristen, 2026-10-06, with a screenshot
of the live page): "fix repeat cards. cannot do that."
The four Pulse cards in the Highlights region repeated
the Pulse band directly below (same values, same
deltas). Spec record: spec.md Amendment 1. Approval
basis: owner-directed = approved (the spec 011
Amendment 2 basis); wireframes revised first.

- [x] T008 **Docs package (wireframes-first)**: WF-11
  Highlights region revised to the 5-card set in
  `wireframes.html` (four Pulse cards removed; caption
  now states the Pulse statistics live in the band
  below and are not repeated as cards) + revision-log
  entry in `wireframes.md`; spec.md Amendment 1 added
  and FR-003 marked amended; review copy
  `~/workspace/your_files/axiovex-wireframes/
  wireframes.html` re-synced byte-identical. Committed
  on `main`.
- [x] T009 **Implement on staging**: merge `main` →
  `staging` (guards win — post-merge diff is exactly
  `_headers` + staging `robots.txt`);
  `highlightCardsHtml()` in `scripts/build-site.mjs`
  emits the 5-card set only (Michigan riser/faller,
  U.S. riser/faller, education headline; drop-out
  preserved); regenerate; stylesheet bumped only if
  the card-grid CSS must change.
  **Done 2026-10-06:** merge `c914f68` brought `main`
  (docs package `83c918e`) into staging; post-merge diff
  `main..staging` = exactly `_headers` + staging
  `robots.txt`. Implementation `95d2bb1`: the Pulse-card
  loop removed from `highlightCardsHtml()` (FR-003
  comment updated to the amended rule); regeneration
  changed only `signals/index.html` (−20 lines = the
  four cards) — the card grid needed **no CSS change**,
  so the stylesheet stays **styles.v30.css**; the home
  page is byte-identical.
- [x] T010 **Staging verification**: Highlights region
  carries exactly 5 cards and none of the four Pulse
  labels appear inside it; the insights summary text is
  byte-identical to the current production rendering;
  Pulse band intact (four tiles + sparklines); Detail
  region, ticker, boards, lanes intact; no horizontal
  overflow at 1440 / 834 / 390 (Playwright); drop-out
  scratch builds re-run with amended expectations
  (empty outlook → summary only, plus the education
  card as data allows; `outlook.json` absent → no
  cards); home byte-identical except any stylesheet
  repoint; staging serves the fix with
  `x-robots-tag: noindex, nofollow` intact.
  **Done 2026-10-06 — ALL PASS.** Source checks: the
  generated region holds exactly the five amended labels
  (Michigan riser/faller, U.S. riser/faller, education
  headline) and no `· MI` Pulse card label; the
  `.hl-summary` inner HTML is **byte-identical** to the
  pre-fix production capture (762 chars). Playwright at
  1440 / 834 / 390: 5 cards, 4 band tiles, 5 lanes,
  detail toggle present, summary text matches the
  production capture, **no horizontal overflow** at any
  width; screenshot of the region inspected (5 cards in
  the existing 4 + 1 grid rhythm). Drop-out scratch
  builds (never committed), 6/6: outlook absent →
  0 cards + summary + detail Pulse table, exit 0;
  empty outlook `{}` → same; BLS-only → 2 cards;
  Michigan-only → 2 cards; no-education → 4 cards;
  full data → 5 cards. Staging live: 5 `hl-card`s
  served, styles.v30.css, `x-robots-tag: noindex,
  nofollow` intact.
- [x] T011 **Promotion**: merge `staging` → `main`
  under spec 010 FR-004 (guard proof EMPTY before
  pushing — STOP if the diff carries staging-only
  `robots.txt`/`_headers` beyond the intended guard
  state); production verification repeated live
  (5 cards, no Pulse duplication, summary + band
  intact); sync back to staging with guards re-applied.
  **Done 2026-10-06:** `main` was a direct ancestor of
  the staging tip, so the promotion fast-forwarded
  `83c918e → 29d8edd` and the guard restoration landed
  as commit `462136e` before pushing (production tip =
  `462136e`). **FR-004 guard proof:
  `git diff 83c918e..HEAD -- robots.txt _headers` is
  EMPTY** — the fast-forward carried staging's guard
  files in the working result; main's `robots.txt` was
  restored and `_headers` removed before the push, and
  the full promotion diff is exactly
  `scripts/build-site.mjs`, `signals/index.html`, and
  this tasks file. **Production verification (live):**
  /signals/ serves **5 highlight cards** (Michigan
  riser/faller, U.S. riser/faller, education headline)
  with **zero Pulse-labelled cards** in the region; the
  insights summary is **byte-identical** to the pre-fix
  production capture; the Pulse band is intact (9
  `pulse-tile`s total = 5 cards + 4 band tiles);
  styles.v30.css; BREAKING markers present with zero
  banner markup and `data/breaking.json` still
  `{"active":null}`; production `robots.txt` = Allow
  version; **no `x-robots-tag`** on `/`. Sync back:
  commit `b639916` re-applied the guards on top of
  `main` in a single push (staging never carried an
  unguarded tree); post-sync diff `main..staging` is
  exactly `_headers` + staging `robots.txt`, and
  staging still serves `x-robots-tag: noindex,
  nofollow` with its staging robots.
- [x] T012 **Closeout**: amendment tasks checked with
  the production record; wireframe log notes the
  amendment as implemented + live (WF-11 labels stay
  APPROVED · IMPLEMENTED + LIVE); review copy re-synced
  if the wireframes changed; monitoring state
  `website_commit` advanced to the promotion merge.
  **Done 2026-10-06:** T008–T011 checked with their
  records; the `wireframes.md` Amendment 1 log entry
  carries an implemented + LIVE closeout and the WF-11
  Highlights tag records the amendment as implemented +
  live (the frame's APPROVED · IMPLEMENTED + LIVE
  labels stand; spec 014's WF-13 labels untouched, no
  drawing altered); review copy re-synced
  byte-identical (cmp verified); monitoring state
  `website_commit` advanced `4497704` → `462136e` (the
  production tip of this promotion: fast-forward to
  staging tip `29d8edd` + guard restoration `462136e`).

## Amendment 2 — owner direction 2026-10-08 (sources note as fine print)

- [x] T013 **Docs package (wireframes-first)**: WF-11
  Sources & method note revised to the fine-print
  presentation in `wireframes.html` (13px, full container
  width, left-aligned; drawn note block + frame note) +
  revision-log entry in `wireframes.md`; spec.md
  Amendment 2 added. Approval basis: Tristen's direction
  2026-10-08 with screenshot of the live page.
- [x] T014 **Implement on staging**: signals template
  note gains a scoped modifier class; one new rule in
  `styles.v33.css` (base `.cards-note` untouched — the
  Documents note renders as before); all templates'
  stylesheet links advance to v33; rebuild; Playwright
  screenshots at desktop + mobile against the locally
  built staging output, note block compared with WF-11
  as amended.
- [ ] T015 **Owner review on staging**: present the
  staging page + screenshots; promotion only on
  Tristen's approval.
- [ ] T016 **Promote + closeout**: merge `staging` →
  `main` under spec 010 FR-004 (guard diffs empty);
  production re-verification (rendered screenshots of
  the live page); amendment recorded implemented + live
  in spec.md / wireframes / tasks.
  **Done 2026-10-08:** implemented as drawn — note
  renders 13px / left / full container width. Measured
  on the locally built staging output (Playwright):
  desktop note height 734px → 270px (27 → 13 lines,
  width 605px → 1052px); mobile 1359px → 811px.
  Documents page note verified unchanged (16px,
  centered). Screenshots:
  ~/workspace/your_files/signals-note-fix/.
