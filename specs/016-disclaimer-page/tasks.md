# Tasks: Disclaimer Page (spec 016)

Docs package prepared 2026-10-06: owner decision
recorded (T001), wireframes revised (WF-14 new frame;
WF-G4 legal link row), spec + plan + claims written.
**Implementation proceeds on staging only (T002–T004);
promotion is blocked on the T005 copy gate.**

## Gate

- [x] T001 **GATE — Owner decision (spec 001 T017).**
  **DECIDED — Tristen Pierson (owner), 2026-10-06:
  adopt a short Disclaimer page now; defer a Terms
  page.** Basis: the T017 options memo (2026-10-06;
  monitoring-goal hidden_files/t017-terms-disclaimer-memo.md)
  — its §B scope and privacy-interaction rules are
  normative for the copy (FR-002). Recorded in
  specs/001-axiovex-website/tasks.md T017 the same day;
  **T017 stays open until this page is live.** This
  decision is the concept approval; it is NOT approval
  of the final page text — that is the separate T005
  gate below.

## Wireframes (constitution §III — before implementation)

- [x] T002 **Wireframes first**: `docs/wireframes/` —
  NEW **WF-14 Disclaimer** frame modeled on WF-05
  (Privacy pattern: shell, centered page head, strata,
  prose column, `section-end` bottom rhythm); **WF-G4
  revised**: the footer Company column's legal link row
  gains "Disclaimer" beside "Privacy Policy". Frame
  inventory + revision log updated in `wireframes.md`;
  review copy
  `~/workspace/your_files/axiovex-wireframes/wireframes.html`
  re-synced byte-identical. **Done 2026-10-06 with this
  docs package (main).**

## Implementation (staging branch, per spec 010)

- [ ] T003 **Page + footer + discovery (FR-001–FR-005)**:
  new source `disclaimer/index.html` modeled on
  `privacy/index.html` (head machinery + WebPage
  JSON-LD, `.legal-body` page styles carried over, no
  `styles.v31.css` change); copy = the seven memo-§B
  sections, Privacy voice, no new firm claims, Privacy
  Policy cross-referenced not restated; footer
  "Disclaimer" link after "Privacy Policy" in the
  Company column of all 8 sources/templates
  (`aria-current="page"` on the new page's own link);
  `writeSitemap` gains the /disclaimer/ entry (8 → 9
  URLs); `llms.txt` gains the factual Disclaimer line
  in both page lists. Rebuild via
  `scripts/build-site.mjs`; generated pages never
  hand-edited. **Stop rule (FR-005):** if any CSS
  change proves necessary, stop and flag it instead.
- [ ] T004 **Staging verification (FR-007)**: local
  build + Playwright (1440 / 834 / 390) — Privacy
  pattern, no overflow; heading order clean; axe-core
  on /disclaimer/ = zero violations; footer Disclaimer
  link present + correct on all 8 page types; staging
  sitemap serves 9 URLs; staging guards intact
  (`x-robots-tag: noindex` + Disallow robots); CSP
  header present on staging /disclaimer/; every other
  page's diff vs current production = footer link only
  (+ regenerated sitemap).

## Copy gate (blocks promotion)

- [ ] T005 **GATE — Pre-promotion copy approval
  (Tristen).** The final /disclaimer/ text, exactly as
  built on staging, is presented to Tristen; promotion
  (T006) does not start without his go-ahead on the
  text. The memo's counsel-review recommendation rides
  with the presentation. **This gate stays OPEN at the
  end of the staging pass by design.**

## Promotion (only after T005)

- [ ] T006 **Promotion + production verification (spec
  010)**: merge staging → main; FR-004 guard proof —
  promotion diff carries production `robots.txt` and
  the production `_headers` (staging's noindex guard
  line never reaches main); sync back with guards
  re-applied; production re-verified (page live, footer
  link everywhere, sitemap 9 URLs, headers intact);
  wireframe labels flipped to IMPLEMENTED + LIVE;
  review copy re-synced; monitoring state
  `website_commit` advanced; specs/001 T017 checked
  closed (Disclaimer live; Terms deferred on the
  record).
