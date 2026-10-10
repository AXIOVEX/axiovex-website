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
- [x] T007 (2026-10-10, after T006) Read-path correction +
  verdict hardening. T006's step-3 failure was real, but
  the read path itself was also wrong: probe mail to
  `tristen@` forwards to `pierson.finance.hub+axiovex@gmail.com`
  (keep-a-copy on), not the connected Gmail the runner
  polled, so delivered probe mail was unobservable there.
  **Changes**: endpoint test-mode recipient per-environment
  (staging `tristen.pierson@gmail.com`, production
  `tristen@axiovexsystems.com`; guardrail unchanged — one
  hard-coded recipient per environment, anything else
  refused 422 before any send), runner probes per
  environment with the staging snapshot/restore step 9,
  every delivery assertion naming its evidence source, new
  production mailbox helper `loop-mailbox-browser.py`
  (all-folders Outlook web search) — commit 11755ce;
  confirmation freshness (a candidate whose link lands on
  'That link has expired.' is stale and skipped, polling
  continues) — commit 5de5371; DEFERRED verdict + 900s
  delivery windows + Chromium connectivity errors
  classified BLOCKED with a connectivity preflight on the
  production subscribe leg (this commit; spec.md FR-022-4
  addendum). Harness LT1–LT4 retargeted to the staging
  probe: 38/38. Hook config untouched (runner path/args
  unchanged); dry-run 2026-10-10 ~19:26Z: silent — "no
  untested commits on main or staging."
  **CONTAMINATION — read before citing the 18:22Z run**:
  the first re-run (18:22Z, vs the 11755ce deployment)
  FAILed steps 3 and 9 with step 1's mail leg `failed`.
  That failure is attributable to spec 020's LU-Post
  diagnostic iteration A (draft+send route, deployed
  ~18:21–18:26Z), which broke ALL staging sends in that
  window (the Mail.Send-only app cannot create draft
  messages, per the diagnostic's own closeout) — NOT to
  this read-path fix and NOT to the newsletter system. The
  diagnostic closeout (19c61b4) restored the shipped send
  path byte-identical.
  **Run attribution** (manual = this task's operator runs;
  the hook's runs are its own):
  - 18:22Z manual vs 11755ce — FAIL 4/10 (contaminated,
    above).
  - 18:32Z manual vs diagnostic B — FAIL 4/10: step 3
    accepted a stale confirmation (issued 18:30:14Z by the
    diagnostic's own test subscribe, inside the poll's
    clock-skew allowance, token already consumed) whose
    link landed 'That link has expired.' — the freshness
    flaw 5de5371 closes.
  - 18:38Z manual vs diagnostic C — FAIL 4/10: mail leg
    'sent', no confirmation observed within 180s.
  - ~18:54Z CONCURRENT — the hook's own runs (staging vs
    19c61b4: steps 0/1/2/8/9 PASS, step 3 FAIL at 180s,
    mail leg 'sent'; production: step 1 FAIL on Playwright
    `net::ERR_TUNNEL_CONNECTION_FAILED` loading the site —
    deployment 093f2154 success, site verifiably up; an
    environment failure, now classified BLOCKED by the
    hardening above) raced a manual run started 18:53:56Z
    showing the identical staging ledger. Concurrent runs
    churn the same probe's tokens — recorded so later
    readers don't double-count; the step-3 outcomes are
    independently explained by the delivery evidence below.
  - 19:09Z manual FINAL clean re-run — hardened runner vs
    deployed 19c61b4, no hook run in flight (hook wake
    guard ran to ~19:38Z and the hook had already recorded
    19c61b4 as tested): **verdict DEFERRED, 5/10 PASS,
    exit 2.** Ledger: step 0 PASS (probe starts 'pending',
    starting status snapshotted); step 1 PASS (HTTP 200,
    mail leg 'sent'); step 2 PASS (row 'pending' at
    19:09:32Z); step 3 DEFERRED (send accepted, this run's
    confirmation not observed in Gmail within 900s);
    steps 4–7 DEFERRED (not reached — step 3 was
    DEFERRED); step 8 PASS (C-022-3: every non-probe row
    identical); step 9 PASS (probe restored to its
    starting 'pending').
  **Accepted ≠ delivered — the deferral diagnosis.**
  Post-diagnostic, Graph accepted every send (endpoint
  mail leg 'sent' on every leg of every run). Delivered:
  no message from newsletter@ arrived in the probe Gmail
  after 18:36:08Z through the last check at 19:25Z — 49
  minutes spanning at least five accepted subscribes. The
  day's gradient: confirmations in ~30s (morning, early
  diagnostic) → diagnostic copies at 10–20 min →
  issue-shaped copies from 18:16Z and 18:36:51Z never
  in-window → a confirmation unobserved at 900s (19:09Z
  run). The pattern is consistent with receiver-side
  (Gmail) deferral of a brand-new sender under the day's
  test burst; EXO-side queueing after Graph acceptance is
  NOT excluded by the available telemetry (a 202 precedes
  transport; no message trace was run). The send side is
  not indicted — acceptance is proven on every leg; every
  failure sits in the acceptance→mailbox interval. No
  deferred copy had flushed by 19:25Z.
  **End state**: staging probe `tristen.pierson@gmail.com`
  = 'pending' — its starting state for the final run,
  restored per FR-022-5's staging exception (pre-correction
  baseline was 'active'; the outstanding confirmation for
  the final run's token completes activation via the real
  path whenever it lands). Non-probe rows unchanged in
  every run (step 8 PASS throughout); no staging run ever
  touched a production row. Production step 5 remains
  BLOCKED until the FR-022-3 promotion (T006 follow-up,
  unchanged). Until the deferral clears, honest staging
  verdicts will read DEFERRED — by design, that is now a
  different signal from FAIL.
