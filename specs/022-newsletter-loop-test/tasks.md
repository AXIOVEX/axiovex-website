# Tasks: Spec 022 — Newsletter Full-Loop Deployment Test

- [x] T001 **GATE — owner directive.** Tristen Pierson,
  2026-10-10 (Axiovex chat): "Make sure the full newsletter
  loop works. Make automated test to signup, get test
  newsletter, unsubscribe, and verify. Must be executed after
  every deployment and hotfixed if problem." This directive
  is the approval for the build below AND the standing
  authorization for probe-only test sends (FR-022-3): the
  test-send mode is not an FR-005 issue approval and cannot
  send to the list (recipient hard-coded, server-enforced).
  Production promotion of the endpoint change is NOT covered
  by this gate (see T006).
- [ ] T002 (after T001) Endpoint: `mode: "test"` in
  `functions/api/newsletter/send.js` per FR-022-3 —
  secret gate unchanged; recipient must equal the hard-coded
  probe or 422 before any send; inactive probe →
  `sent: 0, probeActive: false`; FR-018 production address
  rule applies; sends logged with
  `provider_ref = 'loop-test'`; list path and FR-005
  untouched.
- [ ] T003 (after T002) Harness: spec 022 section LT1–LT4 in
  `scripts/newsletter/test-harness.mjs` (secret gate, wrong
  recipient refused with no mail, inactive probe sends 0,
  active probe + second active allowlisted subscriber →
  exactly one mail to the probe; list send control reaches
  both). Full harness green.
- [ ] T004 (after T003) Runner:
  `scripts/newsletter/loop-test.mjs` + browser-leg helper
  `scripts/newsletter/loop-subscribe-browser.py` per
  FR-022-1/2/4/5/7 (per-step PASS/FAIL/BLOCKED ledger with
  evidence; exit 0/1/2; self-normalizing; C-022-3
  before/after guard on non-probe rows; run records in the
  goal's `hidden_files/newsletter-loop-state.json`).
- [ ] T005 (after T004) Deployment wiring: hook
  `newsletter-loop-check` (script
  `~/hooks/scripts/newsletter-loop-check.sh`, 15-min poll,
  both branches, per-commit verdicts, silent PASS / HOTFIX
  FAIL / distinct BLOCKED), dry-run verified, then enabled.
- [ ] T006 (after T005) First real execution on staging +
  records. Expected result while spec 020's RAOP block
  stands: FAIL at step 3 (confirmation email) with the
  mail-leg evidence — the detection proof. The loop's first
  full green doubles as the RAOP heal proof for spec 020.
  **Follow-up (owner-gated, not done here):** promote the
  FR-022-3 test-send mode to production with the next
  staging → main promotion so the production loop can run
  its step 5; until then production step 5 reports BLOCKED
  (`test mode not deployed`) by design.
