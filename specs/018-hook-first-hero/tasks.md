# Tasks: Spec 018 — Hook-First Hero

- [x] T001 **GATE — Tristen approves the hero copy.** **SATISFIED
  2026-10-07**: Tristen reviewed the three drafted hero options
  and the composite recommendation, and directed verbatim: "Go
  with the composite — Option 2 headline + Option 1 lede." The
  approved copy is recorded verbatim in spec.md.
- [x] T002 Spec package (spec.md / plan.md / tasks.md) + wireframes
  on `main`: WF-01 hero copy updated in wireframes.html (WF-02 /
  WF-07 hero H1s updated to match), revision-log entry in
  wireframes.md, review copy re-synced byte-identically.
- [ ] T003 Sync main → staging (merge per spec 010 FR-004),
  staging guards preserved and verified after the merge
  (`robots.txt` Disallow; `_headers` = production file + exactly
  the noindex line).
- [ ] T004 Hero implemented on staging: `index.html` H1 + lede
  replaced verbatim with the approved copy; diff scoped to the
  hero; committed + pushed to `staging`.
- [ ] T005 Verification: live staging fetch (200, new H1 present,
  `x-robots-tag` noindex intact) + Playwright screenshots of the
  committed staging build at desktop 1440 and mobile 390 saved to
  `~/workspace/your_files/spec018-review/` — hero styled, H1 wraps
  cleanly, no horizontal overflow.
- [ ] T006 **GATE — Tristen reviews the hero on staging.** OPEN.
  Promotion does not proceed without his go.
- [ ] T007 (after T006) Promotion staging → main per spec 010
  FR-004 (guard proofs), production verification. Blocked on
  T006.
