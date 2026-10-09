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
- [ ] T003 (after T001) D1: `axiovex-newsletter-staging` and
  `axiovex-newsletter` databases created in the Axiovex
  Cloudflare account; schema applied per FR-009 (subscribers
  with status enum + token SHA-256 hash columns + timestamps
  + source; sends log); staging binding wired to the staging
  Pages project; schema dump filed as C-020-4 evidence (no
  per-subscriber event tables/columns).
- [ ] T004 (after T002, T003) Endpoints on staging:
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
- [ ] T005 (after T004) Signup block (WF-G8) implemented on
  staging `/signals/` in its drawn slot (below the Sources &
  method note, above the CTA band), spec 010 guards verified
  after sync; WF-17 landing pages implemented (confirmed /
  unsubscribed / expired / already-known states). Playwright
  screenshots at desktop 1440 + mobile 390 filed to
  `~/workspace/your_files/spec020-review/`.
- [ ] T006 (after T001) Web editions: generator newsletter
  pass renders `/newsletter/` (WF-15) and
  `/newsletter/<yyyy-mm-dd>/` (WF-16) from committed issue
  sources under `newsletter/issues/`; sitemap gains the
  archive + issue URLs; empty-archive state renders before
  the first issue. Screenshots at 1440 + 390 filed with
  T005's evidence.
- [ ] T007 (after T006) Assembly + send tooling
  (`scripts/newsletter/`): issue source assembled from the
  current committed snapshots; the three versions rendered
  from it; **C-020-3 audit** (item set + figures + vintages
  identical across email HTML / text / web) and **C-020-5
  audit** (every figure traced to its snapshot) run on the
  test issue and filed. Send path refuses to run without
  the per-issue approval marker (FR-005) and, in production
  mode, without the FR-018 postal address.
- [ ] T008 (after T001) Privacy + footer copy on staging:
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
  sends log + aggregate counts recorded; subscriber count
  vs. the FR-014 ceiling surfaced in the weekly analytics
  report; any ceiling approach is an owner decision
  (C-020-6), never an automatic upgrade.
