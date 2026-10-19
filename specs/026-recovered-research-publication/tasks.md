# Tasks — Spec 026

- [x] T001 Recover and hash-check the exact report; retain the source inventory privately.
- [x] T002 Read current constitution, approved WF-18 and main/staging history.
- [x] T003 Specify the archival boundary and restricted publication paths.
- [x] T004 Implement the article, available downloads and tracker repair.
- [x] T005 Verify static preservation and desktop/mobile browser behavior.
- [x] T006 Record all four AEE phase evaluations with eight atomic claims.
- [x] T007 Freeze the reviewed publication manifest outside the published tree.
- [x] T008 Publish and verify actual initial staging (c9f88f0).
- [x] T009 Promote selected paths through PR #7 and verify production (f53c249).
- [x] T010 Append bounded fresh-runtime results to the same October 19 article.
- [x] T011 Verify the current followup downloads, CSP/browser rendering and AEE claims.
- [x] T012 Independently review and freeze the followup publication paths.
- [ ] T013 Publish and verify the runtime article update on actual staging.
- [ ] T014 Promote the runtime update to latest main and verify production live.

Current local verification: seven static assertion groups and desktop/mobile
Chromium141 checks passed under the unchanged production CSP. The original
inline-script negative control rendered zero cards; the repaired script renders
all20cards. Eight atomic claims pass all four AEE phases. Those initial local results were followed by successful live staging and
production checks recorded in verification/deployment-initial.json. They do
not verify the later runtime version of the article.

The private source inventory is excluded from the public record and downloads.
Historical report hashes establish byte preservation, not present-day
reproduction of the missing source or raw results. Deployment tasks close only
from current remote receipts and live evidence. This corrected public package supersedes an unpublished broader package.
Private inventory contents are neither attached nor embedded in its evidence.

## Runtime continuation

The fresh runtime outcome is 222 tests plus seven experiment/control/replay
checks on each supported Python version, 40 Lean build jobs and 27 baseline
governance commands. The eight focused public assets are already durable on
staging at 652a649. Their inclusion does not recover feature-035 source/raw
records or complete source integration and required current-head source CI.
The Python 3.12 stdout capture limitation remains visible.

Current followup verification: nine static groups, desktop 1440 / mobile 390
Chromium 141 rendering and all 13 public record downloads pass under unchanged
CSP. Four AEE phases pass all 17 atomic publication claims. The independent
runtime review is recorded in verification/runtime-review.json. The new
reviewed checkpoint is frozen; followup staging and production remain pending.
