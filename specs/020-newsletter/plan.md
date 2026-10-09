# Plan: Spec 020 — The Axiovex Signal (Weekly Newsletter)

1. **Docs on `main`** (this package + wireframes): spec.md /
   plan.md / tasks.md; NEW wireframes in
   `docs/wireframes/wireframes.html` — **WF-G8** (signup block,
   global component; drawn placed on `/signals/`), **WF-15**
   (`/newsletter/` archive index), **WF-16** (issue page),
   **WF-17** (subscribe-confirm / unsubscribe landing states) —
   all marked **PROPOSED — PENDING OWNER APPROVAL**, plus a
   WF-11 integration note (the block's slot on the Signals
   page) and a revision-log entry in
   `docs/wireframes/wireframes.md`; review copy re-synced
   byte-identically to
   `~/workspace/your_files/axiovex-wireframes/wireframes.html`.
   **The approval gate (tasks.md T001) is the owner's review of
   this package** — unlike spec 018, no copy or design decision
   has been pre-approved; the frames are drafts for his review.
2. **Microsoft 365 sending lane (T002) — AMENDED
   2026-10-09 (owner direction).** Resend was considered
   and replaced by the Axiovex tenant before any build:
   (a) a dedicated shared mailbox
   `newsletter@axiovexsystems.com` (founders hold Full
   Access + Send As, as with Start/Legal; it is both the
   From and the Reply-To, and the NDR/suppression-evidence
   inbox per FR-013); (b) a dedicated Entra app
   registration **"Axiovex Website Newsletter"** —
   Mail.Send application permission only — scoped to the
   newsletter mailbox alone by an **Exchange Application
   Access Policy** (the spec 005 scope-lock pattern: a
   scope group whose sole member is the newsletter
   mailbox; verify another mailbox = Denied); (c) the
   client secret stored only as Pages secrets + the ops
   store, expiry on the renewal watch. Tenant-admin steps
   run through the established route (EXO admin with
   Tristen's authenticated session, per the ops record —
   the Security Defaults window is his to open, in the
   moment). **No DNS change**: the tenant already
   authenticates this domain's mail (SPF/DKIM/DMARC);
   no other project's account, domain, or credential is
   touched — the isolation rule cuts both ways.
3. **Data (T003)**: D1 databases `axiovex-newsletter`
   (production) and `axiovex-newsletter-staging`, schema per
   FR-009 (subscribers + sends log; token columns hold
   SHA-256 hashes only). Bindings added to the Pages projects
   (staging project first). D1 chosen over KV/DO: the send
   assembly is a status query (`status = 'active'`), the
   suppression check is a hash lookup, and SQL gives an
   auditable record — all inside the free tier at this scale.
4. **Endpoints (T004)**: `functions/api/newsletter/subscribe.js`,
   `confirm.js`, `unsubscribe.js` (GET landing path + POST
   one-click path), `webhooks/resend.js` — all mirroring
   `functions/api/contact.js` patterns from spec 005
   (method checks, payload caps, honeypot + timing trap,
   fail-closed verification, secrets only in Pages secrets).
   A second Turnstile widget (action `newsletter_subscribe`;
   staging hostname on the staging widget, per spec 010
   practice) and an edge rate-limit rule on
   `/api/newsletter/*`. Negative tests fail closed, as the
   spec 005 ladder did.
5. **Pages (T005, T006)**: the WF-G8 block joins the Signals
   page template (`scripts/templates/signals.html`) in its
   drawn slot; WF-17 landing pages are small static-pattern
   pages rendered by the endpoints' outcomes; the generator
   gains a newsletter pass — issue sources committed under
   `newsletter/issues/<yyyy-mm-dd>.json` (items, figures,
   insights, watchlist — the single source of FR-006) render
   the archive index (WF-15) and issue pages (WF-16) and join
   `sitemap.xml`. Any stylesheet change ships as a new
   versioned stylesheet file, per the standing cache rule.
6. **Assembly + send tooling (T007)**: `scripts/newsletter/`
   — `assemble` builds the issue source from
   `data/signals.json` + `data/pack/*.json` + the article
   index and renders the three versions (email HTML,
   plain text, web edition source) from it; `send` runs
   only against an owner-approved issue file, reads
   `status = 'active'` at send time, writes the sends log,
   and refuses to run if the approval marker or the
   FR-018 postal address is absent in production mode.
   **Exchange limits, stated plainly (Amendment 1)**:
   the send job paces to **at most 30 messages/minute**
   and Exchange Online's ceiling is **10,000
   recipients/day**. A 100-recipient send takes ~4
   minutes at the pacing cap; the list cannot approach
   the daily ceiling at this series' scale. There is no
   paid-tier question in this lane — the tenant licensing
   already in place carries it — and crossing a limit is
   an owner decision, never an automatic change
   (C-020-6). Per-recipient sends mean the send job runs
   in chunks under the pacing cap and records per-chunk
   results in the sends log.
7. **Send slot — Wednesday 10:00 AM ET (rationale)**.
   B2B email engagement peaks Tue–Thu, mid-morning local.
   Monday is consumed by the weekly analytics/SEO cycle and
   its inbox; Tuesday is the workforce series' publish +
   LinkedIn day (spec 007) and a common data-release day —
   a Wednesday send lets Tuesday's releases (state
   employment, CPI when it falls Tue) make the edition
   instead of racing them; Thursday/Friday compress the
   owner's per-issue approval turnaround (FR-005) against
   the weekend. 10:00 AM ET lands mid-morning for the
   Eastern/Michigan audience and morning for Central.
8. **Privacy + footer copy (T008)**: the FR-016 section is
   added to `/privacy/` on the WF-05 pattern (new section;
   existing sections unaltered except numbering of the
   closing cross-reference), and the email footer is
   composed with slots for the unsubscribe/manage links,
   the privacy link, and the owner-designated postal
   address (FR-018) — the staging build carries the slot,
   never an invented address.
9. **Staging test loop (T009)**: on staging, sender in test
   mode with the allowlist = Tristen's email only; the
   FR-017 loop runs end to end, including both unsubscribe
   paths and the C-020-1 / C-020-2 falsifier runs
   (unconfirmed address receives nothing; unsubscribed
   address stays out after a resubscribe attempt).
   Evidence (screenshots at desktop + mobile widths for the
   pages, inbox screenshots / headers for the emails, sends
   log excerpts) is filed to
   `~/workspace/your_files/spec020-review/`.
10. **Promotion (T010, T011)**: a **separate owner gate** —
    the FR-018 decisions (postal address designated;
    privacy/footer wording reviewed via legal@) plus
    promotion approval. Promotion follows spec 010 FR-004
    (guard proofs: production `robots.txt` / `_headers`
    diffs empty), then production re-verification and the
    first real cycle: assemble → owner approval → send
    Wednesday 10:00 AM ET → sends log recorded.
11. **Standing cycle (T012)**: weekly rhythm thereafter —
    assembly from the fresh snapshots, per-issue owner
    approval, Wednesday send; subscriber count vs. the
    FR-014 ceiling reported with the weekly analytics
    report so the paid-tier decision is never a surprise.

## Tradeoffs recorded

- **Sending lane — Resend considered, Graph chosen
  (owner direction, 2026-10-09).** The package originally
  specced Resend (a separate free-tier account). Tristen
  directed sending through the Axiovex Microsoft 365
  tenant instead: one processor fewer, mail from
  Axiovex's own tenant and domain, no second account to
  govern, and the spec 005 mechanism already proven on
  this site. The honest costs: no bounce/complaint
  webhooks (suppression consumes mailbox NDR evidence
  per FR-013, processed on the cycle), no provider
  List-Unsubscribe machinery (our endpoints carry the
  RFC 8058 headers and paths themselves — they did
  anyway), and Exchange's 30/minute pacing (immaterial
  at this cadence). Graph also offers no open/click
  tracking — which FR-015 declines on posture grounds
  regardless.
- **D1 vs. a managed newsletter platform.** A platform
  (Buttondown/Mailchimp class) would add a monthly cost, a
  second privacy surface, and per-subscriber tracking by
  default — against the $0 target and FR-015. D1 keeps the
  data in the Axiovex account, auditable in SQL.
- **Double opt-in vs. single opt-in.** Double opt-in costs
  some signups (unconfirmed pendings never receive
  anything). It is chosen anyway: it is what makes
  C-020-1/C-020-2 provable, keeps the list clean of typos
  and third-party signups, and matches the site's
  no-invented-claims posture — the list contains only people
  who demonstrably asked twice.
- **No tracking vs. engagement metrics.** v1 gives up open/
  click rates entirely (FR-015). The sends log's aggregate
  counts plus web-edition traffic in the existing analytics
  reports are the v1 measurement story; per-subscriber
  tracking would need its own owner decision and privacy
  revision.
