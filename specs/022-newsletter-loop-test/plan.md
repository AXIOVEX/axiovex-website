# Plan: Spec 022 — Newsletter Full-Loop Deployment Test

1. **Endpoint: probe-only test mode (T002).**
   `functions/api/newsletter/send.js` gains a `mode: "test"`
   branch inside the existing secret gate. The branch runs
   after the shared issue-field validation and the FR-018
   production address rule, and before the FR-005 approval
   check (which it does not weaken: the branch returns before
   the list path is reached). It refuses any `testRecipient`
   other than the hard-coded probe constant, checks the
   probe's D1 status (inactive → `sent: 0, probeActive:
   false`), personalizes the issue render with the probe's
   own unsubscribe URL exactly as the list path does, sends
   through the one outbound path (`sendNewsletterMail`, so
   the staging allowlist in FR-017 still applies), and logs
   the send with `provider_ref = 'loop-test'`. The operator
   tool `scripts/newsletter/send.mjs` is unchanged (it stays
   the FR-005 issue tool); the runner calls the endpoint
   directly.

2. **Harness proof first (T003).** The spec 020 local
   harness (`scripts/newsletter/test-harness.mjs`) gains a
   spec 022 section (LT1–LT4): test mode without the secret →
   403; wrong recipient → 422 and no mail; probe pending →
   `sent: 0`; probe active with a second active, allowlisted
   subscriber present → exactly one mail, addressed to the
   probe, and the control list send still reaches both
   (C-022-2's falsifier, exercised). Harness must be fully
   green before the endpoint change is pushed.

3. **The runner (T004).**
   `scripts/newsletter/loop-test.mjs` (Node, no new deps —
   Gmail and the Cloudflare API are reached through the
   existing operator tooling: `hatch_gws_cli gmail` raw calls
   and HTTPS calls with the Axiovex Ops token read in-process
   from `~/workspace/system/axiovex-ops/.env`, never
   printed). Steps 0–7 per FR-022-1/5: normalize (stored
   one-click URL first, probe-row D1 reset only as a named
   fallback), subscribe, verify pending, poll Gmail ≤3 min
   for a confirmation dated after run start, follow the
   link, verify active, test-send the newest committed issue
   render (`newsletter/issues/*.email.json`), verify the
   delivered issue (headers + postal footer + unsubscribe
   URL), one-click unsubscribe, verify unsubscribed +
   suppression re-send = 0. Safety rails: the probe address
   is a constant the run refuses to override; before/after
   snapshots of every other row's status (counts per status +
   the known real rows) make C-022-3 self-checking.
   Browser legs live in
   `scripts/newsletter/loop-subscribe-browser.py`
   (Playwright from `~/workspace/venvs/playwright`): opens
   the environment's `/signals/` page, drives the first
   WF-G8 form (focus arms the interaction-triggered widget),
   and reports `submitted` / `blocked` / `failed` as JSON
   with a screenshot path as evidence. Staging uses it only
   as a fallback; production uses it for the subscribe leg.

4. **Deployment wiring (T005).** Hook script
   `~/hooks/scripts/newsletter-loop-check.sh` +
   `hooks.add` registration `newsletter-loop-check`
   (15-min poll, delivery to the Axiovex chat), following
   `website-push-check`'s conventions: `git ls-remote` on
   both branches, per-branch tested-sha state under
   `~/hooks/state/newsletter-loop-check/`, a 45-minute
   in-flight wake guard (a verdict, pass or fail, is recorded
   per commit exactly once — no retry storms against a broken
   deployment), and a wake payload listing each changed
   branch with its environment. The woken worker waits for
   the Pages deployment of that commit to reach success
   (`cf.mjs pages deployments`, matching
   `deployment_trigger.metadata.commit_hash` +
   `latest_stage.status`), runs the loop, updates both state
   files, stays silent on PASS, and files the HOTFIX (FAIL)
   or BLOCKED report on anything else. Dry-run the hook
   before enabling it.

5. **First execution + records (T006).** After the endpoint
   change deploys to staging, run the staging loop for real.
   Expected today: steps 1–2 PASS, step 3 FAIL — the
   subscribe response reports the mail leg `failed` and no
   confirmation arrives, matching spec 020's RAOP record; the
   ledger is the detection proof and is quoted in tasks.md.
   Record what production still needs (the FR-022-3 promotion)
   as an owner-visible follow-up; do not promote in this
   spec's build.

6. **Read-path correction (T007, 2026-10-10).** A later
   staging run reported the endpoint mail leg `sent` while
   step 3 still failed — the send was fine, the READ was
   wrong: probe mail to `tristen@` forwards to a hub gmail
   the runner cannot read. Fix observability only; loop
   steps, verdicts, hook trigger, and the FR-022-3 guardrail
   are unchanged.
   - **Endpoint**: `LOOP_TEST_RECIPIENT` becomes a
     per-environment mapping (`loopTestRecipient(env)`):
     staging → `tristen.pierson@gmail.com`, anything else →
     `tristen@axiovexsystems.com`. Still exactly one
     hard-coded recipient per environment, refused otherwise
     before any send. Harness LT1–LT4 retarget to the staging
     probe (the harness simulates `ENVIRONMENT: 'staging'`)
     and re-prove 38/38.
   - **Runner — staging**: probe = the owner's gmail.
     `pollMail` gains a `notBefore` floor so the restore
     poll cannot match the loop's own earlier confirmation.
     New step 9 (staging only, after the C-022-3 guard):
     restore the probe to the status snapshotted at step 0 —
     `active` via re-subscribe + Gmail confirmation + D1
     verify, `pending` via re-subscribe, `unsubscribed` /
     absent by resting state (D1 reset of the probe row only
     if the loop left it elsewhere, named in the ledger).
     Stored unsubscribe URLs are honored only for the probe
     they were captured from (state records the probe).
   - **Runner — production**: probe stays `tristen@`.
     Steps 3 and 5 stop polling Gmail. Step 5 first checks
     evidence (a): endpoint `mailStatus === 'sent'` and a
     `sends` row with `provider_ref = 'loop-test'` for this
     issue started at/after run start with `sent_count = 1`.
     Steps 3 and 5 then check evidence (b) via the new
     `scripts/newsletter/loop-mailbox-browser.py` (Playwright,
     persistent profile at
     `~/workspace/tools/loop-test/browser-profile`): Outlook
     web all-folders search by sender + subject, newest match
     opened; confirmation mode extracts the confirm link,
     issue mode extracts the unsubscribe URL + postal-footer
     presence from the body. Helper outcomes map to the
     runner's semantics: found → assert, notfound → FAIL,
     blocked (no signed-in session / UI not drivable) →
     BLOCKED with the reason.
   - **Ledger wording**: every delivery assertion names its
     evidence source (Gmail — direct delivery to the probe /
     endpoint mailStatus + sends table / M365 mailbox search,
     Outlook web, all folders).
   - **Verification**: harness 38/38 locally; staging loop
     re-run end-to-end against the deployed fix expecting a
     FULL GREEN, with the probe verified back at its starting
     status (`active`) afterward; hook dry-run confirms the
     trigger is untouched (runner path/args unchanged).
