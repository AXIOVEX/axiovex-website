# Tasks — Spec 026

- [x] T001 Recover and hash-check the exact report; retain the source inventory privately.
- [x] T002 Read current constitution, approved WF-18 and main/staging history.
- [x] T003 Specify the archival boundary and restricted publication paths.
- [x] T004 Implement the article, available downloads and tracker repair.
- [x] T005 Verify initial static preservation and desktop/mobile browser behavior.
- [x] T006 Record initial AEE phase evaluations with eight atomic claims.
- [x] T007 Freeze the initial reviewed publication manifest outside the public tree.
- [x] T008 Publish and verify actual initial staging (c9f88f0).
- [x] T009 Promote selected paths through PR #7 and verify production (f53c249).
- [x] T010 Append bounded fresh-runtime results to the same October 19 article.
- [x] T011 Verify the combined followup downloads, CSP/browser rendering and AEE claims.
- [x] T012 Independently verify the concurrent-main graft and freeze the followup paths.
- [ ] T013 Publish and verify the runtime article update on actual staging.
- [ ] T014 Promote the runtime update to latest main and verify production live.

## Initial publication

The exact recovered report, tracker repair, styles and available downloads
passed actual initial staging and production checks. Those deployments are
recorded in verification/deployment-initial.json. The original report is an
archival record; the private inventory and missing source/raw records are not
included. Initial deployment checks do not validate a later article revision.

## Runtime publication and concurrent update

The fresh runtime outcome is 222 tests plus seven experiment/control/replay
checks on each supported Python version, 40 Lean build jobs and 27 baseline
governance commands. The eight focused runtime assets were frozen and made
durable on staging at 652a649. The runtime article was then staged at 999ff5f;
all 16 served-asset HTTPS checks passed for that version, but its browser check
was not completed and no completed runtime deployment gate is claimed for it.

Before production promotion, main 48681df4 changed article-summary children to
spans and referenced stylesheet 40. The combined version preserves that exact
main markup and CSS while grafting only the reviewed October 19 basis and body.
The prior 026c checkpoint and original content-review receipt remain immutable.
Reconciliation evidence binds the unchanged article body and public assets to
the combined page. No scientific or runtime execution result is regenerated.

## Remaining scientific and engineering scope

Feature 035 source and raw records remain unavailable. The runtime package
validates the surviving feature 034 baseline plus the repair. Its publication
does not complete source integration or the source repository's current-head
CI. The separate Python 3.12 stdout limitation and completion receipt remain
visible. All 14 broader reconstruction targets remain open.

Combined-version verification: nine static groups, desktop 1440 / mobile 390
Chromium 141 rendering and all 13 public record downloads pass under unchanged
CSP. Four AEE phases pass all 17 atomic publication claims. The independent
runtime review is recorded in verification/runtime-review.json. The new
reviewed checkpoint is frozen; followup staging and production remain pending.
