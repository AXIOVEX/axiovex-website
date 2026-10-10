# Feature Specification: Newsletter Full-Loop Deployment Test

**Feature Branch**: implementation lands on `staging` per spec 010;
promotion of the one `functions/` change (the probe-only test-send
mode) to production is a separate owner-gated merge
`staging` → `main`.

**Created**: 2026-10-10

**Status**: **DIRECTED, BUILT, AND WIRED 2026-10-10; first
staging execution FAILS at step 3 as expected (see T006).**
The owner directed this test in chat (see T001). The endpoint
mode, runner, harness proof (38/38), and the
`newsletter-loop-check` deployment hook are all live; the
hook judges every deployment from its creation forward. The
staging execution FAILS at the confirmation-email step for
the known tenant-side reason recorded in spec 020 (Graph 403
ErrorAccessDenied, RAOP replication lag) — that failure, at
that step, with that evidence, is the test detecting the real
block. The loop's first full green doubles as the mail-heal
proof for spec 020's open send block. Production step 5
awaits the owner-gated promotion of the FR-022-3 mode.

**Read-path correction (2026-10-10, T007)**: the step-3
evidence model above was itself wrong about WHERE probe
mail can be observed, and a later staging run exposed it:
the endpoint reported the mail leg `sent` (Graph accepted
the send, ~17:50Z) yet no confirmation ever appeared in the
mailbox the runner was polling. Ground truth, established by
mailbox inspection the same day: Graph sends deliver fine;
the `tristen@` mailbox forwards to
`pierson.finance.hub+axiovex@gmail.com` (keep-a-copy on) — a
different Gmail than the connected `tristen.pierson@gmail.com`
the runner searches — so probe mail to `tristen@` is simply
not observable via the Gmail connector. The correction
keeps the loop's steps, verdicts, and guardrails unchanged
and fixes only observability, per environment (FR-022-2 as
amended): staging's probe is now the owner's gmail (direct
delivery, Gmail-readable) with its starting status
snapshotted and restored after the loop; production's probe
stays `tristen@`, with delivery asserted via endpoint mail
status + the sends table + an all-folders M365 mailbox
search. The endpoint's hard-coded test recipient became
per-environment to match (guardrail unchanged: exactly one
hard-coded recipient per environment, anything else refused
before any send).

**Amendment to spec 020 (owner direction, Tristen Pierson,
2026-10-10)**: spec 020 FR-005 requires a per-issue owner
approval marker for every issue send. This spec records a
**standing, narrowly-scoped exception**: the internal send
endpoint gains a `mode: "test"` that sends the current issue
render to exactly one hard-coded probe address (FR-022-3).
It carries no approval marker because the owner authorized
probe-only test sends as a standing act when he directed this
test. It is **not** an issue-send approval and cannot be used
as one: the recipient is fixed in code, any other recipient
is refused, and the full-list path is untouched.

## Owner directive (approval of record)

Tristen Pierson, 2026-10-10 (Axiovex chat): "Make sure the
full newsletter loop works. Make automated test to signup,
get test newsletter, unsubscribe, and verify. Must be executed
after every deployment and hotfixed if problem."

## Functional requirements

- **FR-022-1 — The loop.** An automated runner exercises the
  real production-shaped path in one environment, in order:
  (1) subscribe the probe through the environment's real
  signup path; (2) verify a `pending` row in that
  environment's D1; (3) receive the confirmation email in the
  owner's mailbox, extract the confirm link, and follow it to
  the WF-17 success landing; (4) verify the row is `active`
  with `confirmed_at` set; (5) send the current issue to the
  probe only and verify the delivered email (List-Unsubscribe
  header + one-click path + FR-018 postal footer); (6)
  unsubscribe via the RFC 8058 one-click POST from the
  delivered issue; (7) verify the row is `unsubscribed` and a
  repeat probe send returns 0 recipients (suppression holds).
  The production probe's final state is always
  `unsubscribed`; the staging probe's final state is its
  starting state, restored by the separate restore step
  (FR-022-5) — restoration is state preservation, not a loop
  step.
- **FR-022-2 — The probe (as corrected 2026-10-10).** One
  probe per environment, chosen by where its delivery is
  observable. Staging: `tristen.pierson@gmail.com` — direct
  delivery into the Gmail the runner reads via the Gmail
  connector (proven <1 min). Production:
  `tristen@axiovexsystems.com` — its mail is NOT observable
  via that Gmail (the mailbox forwards to
  `pierson.finance.hub+axiovex@gmail.com`, keep-a-copy on),
  so production delivery is asserted by the evidence model
  in Environment mechanics, never by a Gmail poll. The
  owner's gmail production row is a REAL subscription and is
  never churned by the production loop. The runner may write
  D1 rows for its environment's probe address only; every
  other row is never modified. The runner aborts if its
  configured probe address is not the hard-coded probe.
- **FR-022-3 — Probe-only test send.** `POST
  /api/newsletter/send` with `mode: "test"` and
  `testRecipient` sends the supplied issue render to the
  single recipient named, under these guardrails, all
  enforced server-side: (a) the existing
  `NEWSLETTER_SEND_SECRET` gate applies unchanged; (b) the
  recipient must equal the environment's hard-coded probe
  address (one per environment, FR-022-2) or the request is
  refused (422) before any send; (c) no approval
  marker is required (the standing authorization above), and
  no other mode's behavior changes — the full-list path
  still requires the FR-005 marker; (d) the probe receives
  mail only while its row is `active`; an inactive probe
  returns `sent: 0, probeActive: false`, which is how the
  loop proves suppression; (e) FR-018's production postal
  address rule applies to test sends exactly as to issue
  sends; (f) the send is recorded in the `sends` log with
  `provider_ref = 'loop-test'` so it is distinguishable from
  real issue sends in the FR-020 gauge record.
- **FR-022-4 — Verdicts, not vibes.** The runner prints a
  per-step ledger — PASS / FAIL / BLOCKED — with evidence
  (timestamps, D1 statuses, message dates, endpoint
  responses). Exit codes: 0 = every step PASS; 1 = any FAIL;
  2 = no FAIL but at least one BLOCKED. BLOCKED is reserved
  for automation limits outside the deployed code's control
  (the production Managed Turnstile refusing a headless
  browser; the test-send mode not yet promoted to that
  environment) and always carries its evidence; a BLOCKED
  step is never reported as a pass.
- **FR-022-5 — Repeatable and self-normalizing.** A run may
  start with the probe in any state. The runner first returns
  the probe to `unsubscribed` using the public endpoints
  (the stored one-click URL from a prior run); only if no
  stored URL exists may it reset the probe's own row directly
  in D1, and that act is named in the ledger. Runs leave no
  state behind except the probe's `unsubscribed` row, the
  `sends` log's `loop-test` rows, and the run record
  (FR-022-7). Staging exception (read-path correction): the
  staging probe is the owner's gmail, a row with a life
  outside the test — the runner snapshots its starting
  status at normalize time and, after the loop, restores it
  (re-subscribe + confirm when it started `active`) as a
  final step labeled in the ledger as post-loop state
  preservation, distinct from the loop steps. A failed
  restore fails the run.
- **FR-022-6 — After every deployment.** A hook
  (`newsletter-loop-check`, poll 15 min, mirroring
  `website-push-check`) watches `origin/main` and
  `origin/staging`. On a new commit to either branch it wakes
  a worker that (a) waits for the corresponding Cloudflare
  Pages deployment of that exact commit to reach success,
  (b) runs that environment's loop, (c) records the tested
  commit + verdict in the hook state and the goal state file.
  A PASS is logged silently (state + goal timeline, no chat
  noise). A FAIL produces an owner-visible report marked
  **HOTFIX** naming the environment, the commit, the failing
  step, and its evidence — a failed loop means a broken
  deployment. A BLOCKED verdict is reported distinctly as
  BLOCKED with its reason. Each commit is tested once; a new
  commit re-arms the test.
- **FR-022-7 — Run records.** Every run (hook or manual)
  appends its ledger to
  `~/workspace/goals/website-seo-aeo-health-monitoring/hidden_files/newsletter-loop-state.json`
  (per environment: last verdict, last tested commit when
  known, run history). Manual runs:
  `node scripts/newsletter/loop-test.mjs --env staging` /
  `--env production` from the staging worktree.

## Environment mechanics

- **Staging** is API-level end to end: the staging Turnstile
  secret is a Cloudflare test key, under which Siteverify
  accepts any response token, so subscribe is a plain form
  POST; the staging subscribe response also reports the mail
  leg's status, which the ledger records as evidence. If the
  API path is ever refused on Turnstile grounds, the runner
  falls back to the browser path below and says so. The
  probe is the owner's gmail, so both mailbox legs (steps 3
  and 5) read delivery straight from the connected Gmail —
  the evidence source every staging delivery assertion
  names.
- **Production** signup/confirm/unsubscribe form legs run in
  a real browser (Playwright, workspace venv) because the
  production widget is the real Managed Turnstile; a headless
  refusal is BLOCKED (FR-022-4), never a silent pass. D1 legs
  are API-level, as on staging. **Delivery evidence model
  (read-path correction)**: the probe's mail cannot be read
  via Gmail, so steps 3 and 5 assert delivery from
  (a) endpoint/function mail-status evidence — the test-send
  endpoint's `mailStatus: 'sent'` (Graph 202) plus the
  `sends`-table `loop-test` row for the run — and
  (b) a browser-based mailbox check
  (`scripts/newsletter/loop-mailbox-browser.py`, Outlook on
  the web signed in as the probe) that searches ALL folders
  (Inbox, Archive, Junk Email, and the rest) for the run's
  confirmation and test-issue messages by subject; presence
  in any folder counts as delivered, and the opened message
  supplies the confirm/unsubscribe links and the body-level
  postal-footer check. (Raw List-Unsubscribe header
  assertions ride on staging's identical render/send path —
  headers are not readable in Outlook web.) If the mailbox
  check's browser session is unavailable (no signed-in
  session in the check's dedicated profile), the delivery
  legs report BLOCKED with that reason, per FR-022-4.
  Production's step 5 additionally requires the FR-022-3
  endpoint mode to be promoted there — until then it reports
  BLOCKED (`test mode not deployed`), and the unpatched
  endpoint fails closed (422, FR-005 refusal), so no
  accidental full-list send is possible from the runner.

## Claims (AEE)

- **C-022-1: A green loop proves the loop.** If every step
  passes in an environment, then signup → confirmation →
  confirm → issue delivery → unsubscribe → suppression all
  work end-to-end in that environment at that commit.
  *Falsifier*: any step's evidence is missing or stale
  (mailbox message dated before the run, a D1 status that did
  not transition during the run) — the runner checks dates
  and transitions, not just final states, so a green run
  cannot be assembled from leftovers of earlier runs.
- **C-022-2: The test-send mode cannot reach the list.**
  `mode: "test"` can only ever mail the hard-coded probe.
  *Falsifier*: a test-mode request naming any other recipient
  that is not refused, or a test-mode send while another
  active subscriber exists that delivers to anyone but the
  probe (harness checks LT2/LT3 test both against a second
  active, allowlisted address).
- **C-022-3: The loop test changes nothing it doesn't own.**
  A full run modifies only the probe's row (ending
  `unsubscribed` in production; restored to its starting
  status on staging), appends `loop-test` rows to `sends`, and
  consumes the probe's own mail. *Falsifier*: any other
  subscriber row differing before/after a run (the runner
  snapshots per-status counts and the owner's real rows'
  statuses around the run and fails itself if they move).
- **C-022-4: Every deployment gets its verdict.** For each
  commit that reaches `origin/main` or `origin/staging`, the
  hook state eventually records that environment's loop
  verdict for that commit, or an owner-visible HOTFIX/BLOCKED
  report explains why not. *Falsifier*: a deployed commit
  with no verdict recorded and no report.

## Out of scope

- Fixing the tenant-side mail block (spec 020's RAOP item;
  this loop detects it, and its first green is the heal
  evidence — it does not touch the tenant, policies, or
  secrets).
- Any change to the full-list send path, the FR-005 approval
  flow, or subscriber-facing copy.
- Promoting the FR-022-3 endpoint mode to production (a
  separate owner-gated merge, flagged in T006).
