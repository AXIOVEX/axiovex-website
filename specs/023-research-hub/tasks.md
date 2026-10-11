# Tasks: Spec 023 — Research hub page (`/research/`, unlisted)

- [x] T001 **GATE — Tristen approves the wireframe + copy.**
  **SATISFIED 2026-10-11** — Tristen approved WF-18 and the
  full page text in `research-hub-copy.md`, with one
  amendment: **remove the "deliberately quiet" small print**
  (the quiet-page note under the lede). The amendment is
  applied in `research-hub-copy.md` and in the WF-18 frame;
  everything else ships as drafted. Owner direction for the
  page itself ("publish the research hub quietly…",
  2026-10-11) is on record in spec.md.
- [x] T002 Spec package on branch `spec/023-research-hub`:
  spec.md (FR-001–FR-006, link registry verified 2026-10-11 —
  all three targets HTTP 200), plan.md, tasks.md, and the full
  copy draft `research-hub-copy.md`. Content-limit check run
  against the copy: no claim labels, no grades/scores, no
  internal study numbers, no staging identifiers, no internal
  jargon (spec.md FR-004).
- [x] T003 Wireframe WF-18 added to
  `docs/wireframes/wireframes.html`; inventory + revision-log
  entries in `docs/wireframes/wireframes.md` marked PROPOSED —
  PENDING OWNER APPROVAL; review copy re-synced byte-identically
  to `~/workspace/your_files/axiovex-wireframes/wireframes.html`.
- [ ] T004 (after T001) Sync `main` → `staging` per spec 010
  FR-004; staging guards verified after the merge (`robots.txt`
  Disallow; `_headers` = production file + exactly the noindex
  line).
- [ ] T005 (after T004) Implement on staging: hand-author
  `research/index.html` on the privacy-page shell with the
  approved copy verbatim; `<meta name="robots" content="noindex">`;
  page-local `<style>` only; no nav, footer, template, generator,
  or stylesheet-release changes; `writeSitemap()` untouched.
- [ ] T006 (after T005) Verify on staging: Playwright renders at
  desktop + mobile widths, screenshotted against WF-18; served
  HTML carries the noindex meta; a rebuild leaves `sitemap.xml`
  with zero `research` URLs and `llms.txt` byte-unchanged; nav +
  footer contain no Research link; the three outbound links
  resolve from the rendered page; FR-004 content-limit check
  re-run against the served page text.
- [ ] T007 **GATE — Tristen reviews the page on staging.**
  Screenshots + staging URL presented. Promotion proceeds only
  on his approval.
- [ ] T008 (after T007) Promote `staging` → `main` per spec 010:
  `robots.txt` diff empty; `_headers` diff = production's file
  only. Verify production live: HTTP 200 at `/research/`,
  rendering verified at desktop + mobile widths, noindex meta
  present in served HTML, sitemap clean.
- [ ] T009 (closeout) Spec status + these tasks updated; WF-18's
  approval state recorded in wireframes.md; the page recorded as
  intentionally unlisted for the monitoring runbook. Follow-ups
  noted, not done here: (a) back-link from
  AXIOVEX/epistemic-ledger to this page; (b) inbound link from
  the BitConcepts research page (parallel effort); (c) future
  status-count updates ride this spec as copy changes.
