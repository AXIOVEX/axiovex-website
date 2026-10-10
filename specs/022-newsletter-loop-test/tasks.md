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
- [x] T002 (after T001) Endpoint: `mode: "test"` in
  `functions/api/newsletter/send.js` per FR-022-3 —
  secret gate unchanged; recipient must equal the hard-coded
  probe or 422 before any send; inactive probe →
  `sent: 0, probeActive: false`; FR-018 production address
  rule applies; sends logged with
  `provider_ref = 'loop-test'`; list path and FR-005
  untouched. **Done 2026-10-10, commit 0996505 (staging).**
- [x] T003 (after T002) Harness: spec 022 section LT1–LT4 in
  `scripts/newsletter/test-harness.mjs` (secret gate, wrong
  recipient refused with no mail, inactive probe sends 0,
  active probe + second active allowlisted subscriber →
  exactly one mail to the probe; list send control reaches
  both). **Full harness green: 38/38, 2026-10-10.**
- [x] T004 (after T003) Runner:
  `scripts/newsletter/loop-test.mjs` + browser-leg helper
  `scripts/newsletter/loop-subscribe-browser.py` per
  FR-022-1/2/4/5/7 (per-step PASS/FAIL/BLOCKED ledger with
  evidence; exit 0/1/2; self-normalizing; C-022-3
  before/after guard on non-probe rows; run records in the
  goal's `hidden_files/newsletter-loop-state.json`).
  **Done 2026-10-10, commit 0996505.**
- [x] T005 (after T004) Deployment wiring: hook
  `newsletter-loop-check` (script
  `~/hooks/scripts/newsletter-loop-check.sh`, 15-min poll,
  both branches, per-commit verdicts, silent PASS / HOTFIX
  FAIL / distinct BLOCKED). **Done 2026-10-10:** hook
  registered + enabled (delivery: the Axiovex chat);
  dry-run against the seeded baseline → silent ("no
  untested commits"); dry-run with a stale staging sha →
  wake with the correct targets payload; state at
  `~/hooks/state/newsletter-loop-check/state.json`, seeded
  with the pre-hook tips (main 04f3929, staging 0996505) so
  the hook judges deployments from its creation forward —
  the staging tip's first verdict is T006's manual run.
- [x] T006 (after T005) First real execution on staging,
  2026-10-10 (~17:56Z), against staging deployment 0a9e51b4
  (commit 0996505): **verdict FAIL at step 3, as expected —
  the detection proof.** Ledger: step 0 PASS (probe starts
  'unsubscribed'); step 1 PASS (API subscribe, HTTP 200 —
  the staging test-secret Siteverify accepts the runner's
  token, so the staging loop is pure API; endpoint reported
  the mail leg: `failed`); step 2 PASS (D1 row 'pending');
  step 3 FAIL (no confirmation dated after run start within
  180s — Graph refuses the send tenant-side, spec 020's RAOP
  record); steps 4–7 not reached; step 8 PASS (C-022-3:
  every non-probe row identical before/after). Exit code 1.
  Run record:
  `hidden_files/newsletter-loop-state.json`. The loop's
  first full green doubles as the RAOP heal proof for
  spec 020.
  **Follow-up (owner-gated, not done here):** promote the
  FR-022-3 test-send mode to production with the next
  staging → main promotion so the production loop can run
  its step 5; until then production step 5 reports BLOCKED
  (`test mode not deployed`) by design.
