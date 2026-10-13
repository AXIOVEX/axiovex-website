# Tasks: Spec 024 — Research hub remodel: program-tracker anatomy (`/research/`)

- [ ] T001 **GATE — Tristen approves the wireframe + content,
  and decides the two open questions.** The WF-18 (revised)
  frame in `docs/wireframes/`, the full draft page content
  in `tracker-content.md`, and: **OQ-1** — the ledger's
  outcome split as drawn, or record-scale numbers only (the
  spec 023 anti-tally amendment is the counterweight);
  **OQ-2** — public study numbers on board cards (the
  spec 023 FR-004 delta). **Blocks every task below.**
  Production promotion is NOT covered by this gate.
- [ ] T002 Spec package on `staging`:
  spec.md (FR-001–FR-016, claims C-024-1..6, OQ-1/OQ-2),
  plan.md, tasks.md, and the draft content
  `tracker-content.md`. Content-limit check run against
  the draft: plain language; results as meaning sentences;
  no external attribution; no internal claim labels,
  grades, or process jargon; placeholders marked, nothing
  invented. **Done at drafting except the gate:** content
  gaps G-1..G-6 (tracker-content.md) are resolved from
  the program records and folded into the draft before
  the gate closes.
- [ ] T003 (after T001) Verify the link + identifier
  registry: fetch every release-row DOI and confirm it
  resolves to the registration its row names (the Study
  026 row lists SR86P — the dead first submission WRP74
  is never listed; the Study 032 row lists Q8TMG, the
  registration of record); take the missing identifiers
  (Studies 011, 018, 028–031, 033) and the
  public-registration count from the OSF parent
  (osf.io/nerxz); re-verify the three primary-material
  links resolve. Drop any identifier that does not
  verify. Record the verified registry in this file.
- [ ] T004 (after T001) Stylesheet: author
  `styles.v38.css` — v37 carried forward plus the tracker
  component rules (record strip, status halves, ledger +
  stacked bar, board cards/pills, filter chips,
  prediction cards, stage strip, collapsible articles,
  release rows, step rows) in the site's design tokens.
  v37 is not edited. The research page's stylesheet link
  moves to v38 at T005; no other page's link changes.
- [ ] T005 (after T003, T004) Implement on staging: sync
  `main` → `staging` per spec 010 FR-004 (guards verified
  after the merge: `robots.txt` Disallow; `_headers` diff
  vs `main` = exactly the one `X-Robots-Tag` line), then
  rewrite `research/index.html` on its existing shell
  with the approved content — board, predictions, and
  releases transcribed into their single data arrays;
  prose sections from the approved draft; page-local
  rendering script with the no-script note;
  `<meta name="robots" content="noindex">` retained;
  no nav, footer, template, generator, or sitemap
  changes; form count unchanged (WF-G4 strip only).
- [ ] T006 (after T005) Verify on staging: Playwright
  renders at desktop + mobile widths, screenshotted
  against the WF-18 revised frame (local serve of the
  staging tree per the standing local-Playwright
  limitation; deployed staging HTML confirmed identical
  by curl). Claim checks C-024-1..6: board/chip/ledger
  figures traced to the arrays; off-scale cards labelled
  and outside every verdict count; one snapshot date in
  all three places; noindex meta in served HTML; staging
  `X-Robots-Tag: noindex, nofollow` header present;
  scratch rebuild → `sitemap.xml` zero `research` URLs,
  `llms.txt` byte-unchanged; rendered nav + footer carry
  no Research link; every outbound link (record strip,
  cards, DOI rows) resolves from the rendered page.
  Fix findings on staging and re-shoot.
- [ ] T007 **GATE — Tristen reviews the remodeled page on
  staging.** Screenshots + staging URL presented.
  Promotion proceeds only on his approval.
- [ ] T008 (after T007) Promote `staging` → `main` per
  spec 010: `robots.txt` diff empty; `_headers` diff =
  production's file only; staging guards re-asserted on
  the sync back. Verify production live: HTTP 200 at
  `/research/`; rendering verified at desktop + mobile
  widths; noindex meta in served HTML; no `X-Robots-Tag`
  response header; production `robots.txt` is the Allow
  version; sitemap still clean; live form count on the
  page is one (the footer strip).
- [ ] T009 (closeout) Spec status + these tasks updated;
  WF-18's revision approval state recorded in
  wireframes.md (the revised frame becomes the frame of
  record); monitoring note carried forward from spec 023
  T009 — `/research/` is INTENTIONALLY UNLISTED (absent
  from nav, sitemap, and llms.txt by design, page-level
  noindex); the monitoring runbook must not flag or "fix"
  any of these. Follow-ups noted, not done here: future
  content updates ride spec FR-016 (statuses refreshed
  from program records, snapshot date moving with them).
