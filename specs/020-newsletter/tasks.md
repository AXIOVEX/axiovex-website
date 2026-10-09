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
- [ ] T002 (after T001) Microsoft 365 sending lane
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
- [ ] T009 (after T002–T008) **End-to-end test loop on
  staging** (FR-017), sender allowlisted to Tristen's email
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
- [ ] T010 **GATE — launch decisions + promotion approval.**
  Tristen: (a) designates the CAN-SPAM postal address
  (FR-018a — blocks the first production send); (b) reviews
  the privacy section + email footer wording (legal@,
  FR-018b); (c) approves promotion staging → production on
  the T009 evidence. Blocks T011.
- [ ] T011 (after T010) Promotion per spec 010 FR-004
  (guard proofs: production `robots.txt` / `_headers`
  diffs empty; staging guards re-asserted on sync-back),
  production bindings + production Turnstile widget,
  production verification (pages live, endpoints negative
  ladder, sitemap), then the first real cycle: assemble →
  owner approval → send Wednesday 10:00 AM ET → sends log
  recorded → cycle reported.
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

