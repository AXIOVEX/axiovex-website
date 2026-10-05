# Tasks: Page-Head Spacing Rhythm

**Spec**: specs/003-page-head-spacing/spec.md · **Plan**: plan.md
Legend: [x] done · [ ] open · [OWNER] needs Tristen's decision

## Gate
- [x] T001 Current gaps measured on all five page types (spec.md table)
- [x] T002 Wireframes updated first: WF-G2 rhythm spec (36px above / 40px below), notes on WF-03/WF-05/WF-06, new WF-10 Documents frame
- [x] [OWNER] T003 Tristen approves the wireframe revision — approved 2026-10-05 ('Approve the rhythm (36px / 40px) — implement it')

## Implementation (after T003)

**Implemented in 6825c7b, verified live 2026-10-05.** Measured: documents 36/40, contact 36/40, privacy 36/40, blog index 36/40, article 36/22 (desktop + mobile); home layout identical (animations disabled for comparison). One reconciliation: spec 002's #post-list margin 44px became 40px — the search/filter tools live in the blog hero, so the rhythm governs the whole strata -> first-card gap.
- [x] T004 styles.v22.css with scoped head-rhythm overrides (+ blog.v11.css if the article gap needs it); links repointed
- [x] T005 Rebuild; measurement suite passes locally (all five page types, 1440px + 390px; home layout unchanged)
- [x] T006 Push + live measurement verification; AEO/SEO baseline confirmed
- [x] T007 Wireframe revision log marked approved; spec status → implemented
