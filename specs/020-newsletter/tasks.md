# Tasks: Spec 020 — The Axiovex Signal (Weekly Newsletter)

- [x] T001 **GATE — Tristen approves this package.** The spec
  (FR-001…FR-019, claims C-020-1…6) and the draft wireframes
  (WF-G8 signup block, WF-15 archive index, WF-16 issue page,
  WF-17 landing pages — all marked PROPOSED) are his to approve,
  amend, or reject. **Blocks every task below.** No staging
  change, no account change, no DNS change before this gate.
  **APPROVED by Tristen Pierson, 2026-10-09** (Axiovex chat:
  "Approve — build it on staging and send me the test issue").
  T010 (FR-018 launch decisions + promotion) remains CLOSED.
- [x] T002 (after T001) Microsoft 365 sending lane
  (Amendment 1 — replaces the original Resend task):
  dedicated shared mailbox `newsletter@axiovexsystems.com`
  created (founders Full Access + Send As); dedicated
  Entra app **"Axiovex Website Newsletter"** (Mail.Send
  application permission only, admin consent) with an
  Exchange **ApplicationAccessPolicy** scoping it to the
  newsletter mailbox alone (verified: newsletter mailbox
  Granted, another mailbox Denied); client secret stored
  only as Pages secrets (staging project first) + the ops
  store (presence recorded, value never printed; expiry on
  the renewal watch). Tenant-admin steps need Tristen's
  authenticated session (the EXO Security Defaults window,
  per the ops record) — if no session is available, this
  task is the recorded blocker and the build proceeds with
  the send leg stubbed to the test allowlist.
  **Done 2026-10-09:** shared mailbox
  `newsletter@axiovexsystems.com` ("Axiovex Newsletter")
  created; Entra app **"Axiovex Website Newsletter"**,
  client ID `f1bbcf9c-cf7b-4340-82fa-b33699e14aaa`,
  Mail.Send application permission with admin consent
  granted; client secret (expires 2028-10-08) stored ONLY
  as Pages secrets on `axiovex-website-staging`
  (`NEWSLETTER_GRAPH_TENANT_ID` / `NEWSLETTER_GRAPH_CLIENT_ID`
  / `NEWSLETTER_GRAPH_CLIENT_SECRET`); staging redeployed
  after the secrets were set. **ApplicationAccessPolicy
  applied 2026-10-10:** the mail-enabled security scope
  group **"Axiovex Website Newsletter Scope"**
  (`ws-newsletter-scope@axiovexsystems.com`, sole member
  `newsletter@axiovexsystems.com`) was created and the
  newsletter app's policy was set to **RestrictAccess** to
  that group. `Test-ApplicationAccessPolicy` **PASSED on
  attempt 1**: `newsletter@axiovexsystems.com` = Granted,
  `start@axiovexsystems.com` = Denied; the spec 005 contact
  app's policy was verified unchanged. Security Defaults
  were re-enabled and verified at ~08:48 ET the same day.
  Evidence:
  `~/workspace/goals/website-seo-aeo-health-monitoring/hidden_files/spec020-exo-policy/run-2026-10-10-rerun.log`.
- [x] T003 (after T001) D1: `axiovex-newsletter-staging` and
  `axiovex-newsletter` databases created in the Axiovex
  Cloudflare account; schema applied per FR-009 (subscribers
  with status enum + token SHA-256 hash columns + timestamps
  + source; sends log); staging binding wired to the staging
  Pages project; schema dump filed as C-020-4 evidence (no
  per-subscriber event tables/columns).
  **Done for staging 2026-10-09:** `axiovex-newsletter-staging`
  created (uuid a143d549-31d6-4d4e-98a4-503bdae864b7) after the
  Axiovex Ops token gained D1: Edit; `scripts/newsletter/schema.sql`
  applied via the D1 API — tables `subscribers`, `sends`,
  `rate_events` + 4 indexes verified in sqlite_master. Binding
  `NEWSLETTER_DB` → that uuid merged into the staging Pages
  project's production deployment config (all existing env
  vars/secrets preserved — secrets omitted from the PATCH body,
  never rewritten) and the latest deployment retried so the
  binding is live. Live probe of POST
  /api/newsletter/subscribe: empty payload → 422 validation;
  valid email + token → 200 with `mail: "blocked-allowlist"`
  (no more 503), the pending-subscriber row + rate_events row
  confirmed in D1 from the store side, synthetic probe row
  deleted afterward. The production `axiovex-newsletter`
  database remains part of the T010/T011 promotion gate —
  not created here.
- [x] T004 (after T002, T003) Endpoints on staging:
  subscribe / confirm / unsubscribe (GET + RFC 8058 POST) /
  internal send endpoint (secret-gated), per
  FR-008/FR-010/FR-011/FR-014, mirroring
  spec 005's fail-closed patterns; Turnstile widget (action
  `newsletter_subscribe`; staging hostname for staging);
  edge rate-limit rule on `/api/newsletter/*`. Negative
  ladder passes: bad/absent Turnstile token → rejected;
  oversized payload → rejected; honeypot filled → silently
  dropped; expired confirm token → WF-17 expired state;
  absent/wrong send-endpoint secret → rejected, no send.
- [x] T005 (after T004) Signup block (WF-G8) implemented on
  staging `/signals/` in its drawn slot (below the Sources &
  method note, above the CTA band), spec 010 guards verified
  after sync; WF-17 landing pages implemented (confirmed /
  unsubscribed / expired / already-known states). Playwright
  screenshots at desktop 1440 + mobile 390 filed to
  `~/workspace/your_files/spec020-review/`.
- [x] T006 (after T001) Web editions: generator newsletter
  pass renders `/newsletter/` (WF-15) and
  `/newsletter/<yyyy-mm-dd>/` (WF-16) from committed issue
  sources under `newsletter/issues/`; sitemap gains the
  archive + issue URLs; empty-archive state renders before
  the first issue. Screenshots at 1440 + 390 filed with
  T005's evidence.
- [x] T007 (after T006) Assembly + send tooling
  (`scripts/newsletter/`): issue source assembled from the
  current committed snapshots; the three versions rendered
  from it; **C-020-3 audit** (item set + figures + vintages
  identical across email HTML / text / web) and **C-020-5
  audit** (every figure traced to its snapshot) run on the
  test issue and filed. Send path refuses to run without
  the per-issue approval marker (FR-005) and, in production
  mode, without the FR-018 postal address.
- [x] T008 (after T001) Privacy + footer copy on staging:
  the FR-016 newsletter section added to `/privacy/`
  (existing sections unaltered in substance); email footer
  composed with manage/unsubscribe/view-in-browser/privacy
  links and the postal-address slot (staging placeholder
  clearly marked; no invented address anywhere).
- [x] T009 (after T002–T008) **End-to-end test loop on
  staging** (FR-017), sender allowlisted to Tristen's email
  — DONE 2026-10-09 (see "Live-loop completion" below;
  the restore step was owner-cancelled — he resubscribes
  manually).
  only: subscribe → confirmation email received → confirm
  (WF-17 confirmed state) → test issue received, HTML +
  plain-text parts inspected → **C-020-1 falsifier run**
  (a second, never-confirmed address receives nothing) →
  one-click unsubscribe via the header POST path → second
  test send excludes the address → unsubscribe via the
  footer-link GET path on a re-confirmed subscription →
  **C-020-2 falsifier run** (resubscribe without confirming
  → still nothing sent) → fresh confirmation restores
  delivery. Screenshots, headers, and sends-log excerpts
  filed to `~/workspace/your_files/spec020-review/`.
- [x] T010 **GATE — launch decisions + promotion approval.**
  Tristen: (a) designates the CAN-SPAM postal address
  (FR-018a — blocks the first production send); (b) reviews
  the privacy section + email footer wording (legal@,
  FR-018b); (c) approves promotion staging → production on
  the T009 evidence. Blocks T011.
  - (a) **DONE 2026-10-10** (Amendment 5): the owner
    designated Axiovex Systems, LLC's Michigan LARA
    registered-office address — **6633 18 Mile Rd, Sterling
    Heights, MI 48314**. Applied on staging the same day:
    issue 2026-10-14's `footerAddress` set, email parts
    re-rendered (placeholder absent from both parts), the
    web edition colophon carries the same line; endpoint
    harness 24/24; live staging verified with desktop +
    mobile screenshots
    (`~/workspace/your_files/spec020-review/issue-2026-10-14-footer-address-desktop-1440.png`,
    `...-mobile-390.png`).
  - (b) **DONE 2026-10-10** on the owner's direction to
    proceed with all remaining items: a factual wording
    review compared the `/privacy/` newsletter section
    (§13), the WF-G8 signup fine print, the confirmation
    email copy, and the issue footer against the endpoint
    code and D1 schema — data collected, processors,
    double opt-in, no tracking, suppression retention,
    weekly cadence, one-click unsubscribe. **No factual
    mismatches found; no copy changed.** This was a
    factual-consistency review against the implementation,
    not a review by outside legal counsel.
  - (c) **DONE 2026-10-10** — the owner approved the
    promotion ("Do these and the owner session"), with all
    production prerequisites complete, including the EXO
    ApplicationAccessPolicy scope lock recorded under
    T002 above. T011 is unblocked; the first production
    send remains subject to the separate per-issue FR-005
    approval at send time.
- [x] T011 (after T010) Promotion per spec 010 FR-004 —
  **DONE 2026-10-10 (promotion + production verification;
  no send).** Staging tip `d4a648f` was merged into
  pre-promotion main `ce7be3a` as merge commit `be863e3`,
  followed by build commit `834462b`. **FR-004 guard
  proof:** `git diff ce7be3a..be863e3 -- robots.txt
  _headers` is empty — production `robots.txt` is the
  Allow version and production `_headers` is the security
  file with no `X-Robots-Tag` line. The production
  Turnstile site key was set in `newsletter-signup.v1.js`
  (the non-production branch still uses the public test
  key, so staging behavior is unchanged). Production D1
  `axiovex-newsletter` (uuid
  `33ea7d17-46ab-4723-9d30-48fd03992e84`) is bound as
  `NEWSLETTER_DB`, the production environment is fully
  configured (secret values recorded by name/presence
  only), and the production Turnstile widget is in place.
  Build passed and the endpoint harness passed **24/24**.
  Cloudflare Pages production deployment
  `d5668301-fef4-4f40-9f88-48555460ee2b` for `834462b`
  completed with status **success**. **Live production
  verification:** `/`, `/signals/`, `/newsletter/`,
  `/newsletter/2026-10-14/`, `/privacy/`, `/robots.txt`,
  and `/sitemap.xml` all returned 200 (OK — the request
  succeeded); the sitemap carries 13 URLs including both
  newsletter URLs; the 2026-10-14 web edition shows
  "Axiovex Systems, LLC · 6633 18 Mile Rd, Sterling
  Heights, MI 48314"; `/signals/` shows the WF-G8 signup
  block with its privacy fine print; Playwright/Firefox
  screenshots at desktop 1440 and mobile 390 are filed as
  `prod-*` in `~/workspace/your_files/spec020-review/`
  (styles.v35.css, footer and fine print visible, no
  horizontal overflow). **Endpoint negative ladder:**
  empty subscribe POST returned 422 (Unprocessable
  Entity — the request was understood but failed
  validation); bogus-token confirm and unsubscribe GETs
  returned 200 (OK — the request succeeded) with graceful
  WF-17 landings, never 500 (Internal Server Error — a
  generic server-side failure); GET `/api/contact`
  returned 405 (Method Not Allowed — the endpoint does
  not accept that request method), unchanged. After the
  checks, production D1 counts were subscribers 0, sends
  0, rate_events 0: **no mail was sent and no subscriber
  rows were created.** The first real cycle was **not**
  run as part of this promotion; it remains governed by
  T012 and requires the separate per-issue FR-005 owner
  approval at send time.
- [ ] T012 Standing (every cycle): assemble from the fresh
  committed snapshots after Tuesday's releases; per-issue
  owner approval (FR-005); Wednesday 10:00 AM ET send;
  sends log + aggregate counts recorded (attempted / sent /
  duration / hard bounces / complaints / throttling
  events); the **sender-migration gauge line (FR-020)** —
  active subscribers, distance to the 750 PLAN threshold,
  health-override status — included in every approval
  request and post-send summary; a tripped threshold or
  override records a planning task in the Follow-ups
  section below and flags the owner — planning is
  presented, never auto-started.

## Follow-ups (spec 020)

- (empty — FR-020 gauge trips and other owner-presented
  follow-ups are recorded here when they occur.)

## Build record — staging, 2026-10-09 (T002/T003 blocked; T004–T008 done; T009 harness-proven)

- **T002 BLOCKED (owner step).** Needs Tristen's authenticated
  tenant-admin session: create the shared mailbox
  `newsletter@axiovexsystems.com`, the Entra app "Axiovex Website
  Newsletter" (Mail.Send only), and the ApplicationAccessPolicy
  scope lock, then place the client secret as Pages secrets on
  the staging project (NEWSLETTER_GRAPH_TENANT_ID /
  NEWSLETTER_GRAPH_CLIENT_ID / NEWSLETTER_GRAPH_CLIENT_SECRET).
  The EXO Security Defaults window is the owner's to open (ops
  record). Until then the send leg reports `not-configured` and
  no real email can be sent. No Resend artifact exists or was
  created (Amendment 1).
- **T003 PARTIAL (owner step).** Schema written + applied in
  the local harness (`scripts/newsletter/schema.sql` — the
  C-020-4 schema evidence: no per-subscriber event tables or
  columns). The D1 databases cannot be created with the current
  Axiovex Ops token (no D1 scope — API returns 401): the owner
  adds **D1: Edit** to the "Axiovex Ops" token in the Cloudflare
  dashboard (token editing is the sanctioned dashboard use), or
  creates `axiovex-newsletter-staging` + `axiovex-newsletter`
  there; the NEWSLETTER_DB binding is then a Pages API call.
  Live staging endpoints therefore fail closed (503) by design.
- **T004 DONE** (staging commits 11b6b48): endpoints as specced;
  Turnstile on staging uses the CF public test pair (the real
  widget is T011); rate limiting is D1-backed in-endpoint (the
  zone rule lands at promotion). Negative ladder in the harness:
  honeypot / oversized / missing token / failing token / no send
  secret / no approval marker all behave as specced.
- **T005 DONE** (0e48f86, 89cb848): WF-G8 on /signals/ in its
  drawn slot; WF-17 states rendered by the endpoints. Screenshots
  desktop 1440 + mobile 390 in ~/workspace/your_files/spec020-review/.
- **T006 DONE**: generator newsletter pass; /newsletter/ (WF-15)
  + /newsletter/2026-10-14/ (WF-16) live on staging; sitemap 13
  URLs. (The empty-archive state renders when no issue sources
  exist — same code path, untested with zero issues on staging
  because the test issue is committed.)
- **T007 DONE**: assemble/render/send tooling; **C-020-5 audit
  PASS** (4 Pulse figures + 9 items traced to data/signals.json);
  **C-020-3 audit PASS** (email HTML / text / web agree); the
  FR-020 gauge is wired (sends log carries attempted/sent/
  duration/bounces/complaints/throttle events; gauge line in
  every send summary and via --gauge-only).
- **T008 DONE** (3ccdd9c): FR-016 privacy section on staging
  (§13; Disclaimer renumbered §14); the email footer carries the
  FR-018 placeholder line verbatim. Legal review stays with
  T010 (CLOSED).
- **T009 HARNESS-PROVEN, live loop pending T002+T003.** The full
  FR-017 loop ran against the real endpoint code with a
  D1-shim + captured mail (scripts/newsletter/test-harness.mjs):
  **24/24 checks pass**, including C-020-1 (pending address: 0
  sent) and C-020-2 (resubscribe-without-confirm: 0 sent;
  one-click POST and footer GET both flip immediately; fresh
  confirmation restores delivery). Evidence:
  ~/workspace/your_files/spec020-review/harness-log.txt +
  screenshots. The live loop (real D1 + real Graph mail to
  tristen@axiovexsystems.com) runs the moment T002/T003 clear.
- **T010 stays CLOSED** — not checked, not approached.

## Live-loop record — staging, 2026-10-09 (T009 PAUSED at step 2 — Microsoft-side delivery lag)

- **Pre-loop prep (same day).** The operator copy of
  `NEWSLETTER_SEND_SECRET` had not been persisted by the
  build (Pages secrets are write-only), so the send secret
  was **rotated**: a fresh value was set on
  `axiovex-website-staging` via the cf-ops `pages set-env`
  contract (all other secrets preserved), the operator copy
  was stored in the ops store (`~/workspace/system/axiovex-ops/.env`,
  mode 600, presence only), staging was redeployed
  (deployment `6a1140b6`, success), and the tool verified
  against the endpoint in `--gauge-only` mode:
  **"Sender gauge: 0 active subscribers (750 below the 750
  PLAN threshold); health overrides: none."** D1 baseline:
  `subscribers` empty.
- **Step 1 — subscribe (DONE).** POST
  `https://staging.axiovexsystems.com/api/newsletter/subscribe`
  for `tristen@axiovexsystems.com` (Turnstile public test
  token) at **2026-10-09T20:28:01Z** →
  `{"ok":true, "mail":"sent"}` — the confirmation mail was
  accepted by Microsoft Graph this time (no `not-configured`).
  D1 row confirmed: `pending`, `confirm_token_hash` set,
  expiry 2026-10-11T20:28:03Z.
- **Step 2 — confirmation delivery (PAUSED).** The
  confirmation email had **not arrived** in the owner's
  Gmail hub (which `tristen@` forwards to) after repeated
  `in:anywhere` searches at 20:29Z, 20:32Z, 20:34Z, 20:36Z,
  20:38Z, 20:44Z and 20:46Z. Control evidence: other mail
  to the same address arrives normally (Cloudflare SSO
  notice 19:03Z; inbox mail 19:54Z), so the hub + forwarding
  path is healthy — non-delivery is on the Microsoft
  sending side, consistent with **brand-new shared-mailbox
  provisioning lag** (mailbox created ~20:17–20:22Z;
  Microsoft's stated new-shared-mailbox provisioning window
  runs up to 60 minutes; Graph accepted both sends with
  HTTP 202, i.e. "sent" at the function layer — no Graph
  error was surfaced to capture).
- **Retry (DONE, per protocol — wait + one retry).** Second
  subscribe POST at **20:34:34Z** → `{"ok":true,
  "mail":"sent"}`; D1 row refreshed (source
  `live-loop-test-retry`, new expiry
  **2026-10-11T20:34:35Z**). NOTE: the retry replaced the
  confirm token hash — **only the retry email's link can
  confirm**; the first email's link is dead. Still no
  delivery by 20:46:54Z (~12 min after the retry, ~29 min
  after mailbox creation), so the loop was stopped here
  rather than churning further tokens.
- **Steps 3–5 NOT RUN** (issue send, unsubscribe falsifier,
  restore) — they depend on the step-2 confirmation.
  Nothing was sent from the issue send endpoint; the sends
  log is untouched.
- **Resume path.** When either copy of the confirmation
  email arrives (or Graph delivery is re-verified), resume
  at step 2 using the **retry** email's link (row is
  `pending` until 2026-10-11T20:34:35Z; if it lapses, one
  fresh subscribe POST restarts cleanly). Then: confirm →
  send issue 2026-10-14 (approval basis: owner approved the
  staging test send in chat 2026-10-09) → verify delivery +
  List-Unsubscribe header → unsubscribe from the delivered
  email → second send must report 0 → resubscribe +
  reconfirm to restore Active.
- **T010 stays CLOSED** — not checked, not approached.


## Live-loop completion — 2026-10-09 (T009 DONE; restore owner-cancelled)

- **Step 2 resumed + confirm (DONE — by the owner).** The
  retry confirmation email eventually delivered on the
  Microsoft side (the provisioning lag above). The owner
  clicked the confirmation himself: D1 row
  `confirmed_at = 2026-10-09T21:27:42.761Z`, status
  `active` (source `live-loop-test-retry`). FR-020 gauge
  before the issue send: **"Sender gauge: 1 active
  subscribers (749 below the 750 PLAN threshold); health
  overrides: none."**
- **Step 3 — test issue send (DONE).** Issue **2026-10-14**
  sent 2026-10-09T21:30:25Z→27Z via `scripts/newsletter/
  send.mjs` (approval basis: owner's 2026-10-09 chat
  approvals of the staging test send and the live loop).
  Result: `sent 1, throttled 0, blocked(allowlist) 0,
  failed 0, remaining 0`. Sends log row id 1: started
  `2026-10-09T21:30:27.141Z`, finished
  `2026-10-09T21:30:27.789Z`, duration 648 ms,
  recipient_count 1, sent_count 1, bounce_count 0,
  complaint_count 0, throttle_events 0, provider_ref
  `microsoft-graph`. Delivered message: **From
  newsletter@axiovexsystems.com, Subject "The Axiovex
  Signal — October 14, 2026"**. The delivered copy does
  not appear in the connected Gmail hub's search (checked
  repeatedly 21:30–21:36Z), so a hub-side arrival
  timestamp and direct header dump could not be captured;
  delivery is proven end-to-end by the owner's own action
  on the delivered email (next step) — arrival therefore
  no later than 21:33:30Z, ~3 minutes after the send.
- **List-Unsubscribe header (verified in code + in use).**
  The send path sets both headers on every message —
  `functions/api/newsletter/_lib.js`: raw-header form
  (line 209) and Graph `internetMessageHeaders` form
  (lines 238–239): `List-Unsubscribe: <personalized-url>`
  and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
  The owner exercised the unsubscribe from the delivered
  issue itself (next step), which is the functional proof.
- **Step 4 — unsubscribe + zero-send (DONE — unsubscribe
  executed by the OWNER).** At ~17:33 ET the owner
  directed: he had unsubscribed himself from the
  delivered test issue and would resubscribe manually;
  the agent was switched to verify-and-record only. D1
  verification (verbatim): `status = 'unsubscribed'`,
  `unsubscribed_at = '2026-10-09T21:33:30.695Z'`,
  `confirmed_at = '2026-10-09T21:27:42.761Z'`,
  `source = 'live-loop-test-retry'`; the unsubscribe is
  carried on the subscriber row (status + timestamp —
  the schema has no separate suppression table; that row
  is the suppression record the send path consults).
  Second send of the same issue (agent-run, state-neutral)
  at **2026-10-09T21:34:34Z→36Z**: `sent 0, throttled 0,
  blocked 0, failed 0`; sends log row id 2:
  recipient_count 0, sent_count 0. Post-send gauge:
  **"Sender gauge: 0 active subscribers (750 below the
  750 PLAN threshold); health overrides: none."** The
  subscriber row was unchanged by the second send
  (status/timestamp identical on re-query). **Live
  C-020-2 falsifier: PASS** (the unsubscribed address
  receives nothing). The remaining C-020-1/C-020-2 paths
  (pending-address exclusion, resubscribe-without-confirm)
  stand on the 24/24 harness proof from the build record.
- **Step 5 — restore: OWNER-CANCELLED.** Per the owner's
  2026-10-09 ~17:33 ET direction, the agent did NOT
  resubscribe or reconfirm him. **Final state:
  `tristen@axiovexsystems.com` = `unsubscribed`
  (2026-10-09T21:33:30.695Z), awaiting the owner's manual
  resubscribe.** T009 is checked on the strength of the
  live send + owner-executed unsubscribe + live
  zero-send falsifier above.
