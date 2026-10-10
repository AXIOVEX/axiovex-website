# Feature Specification: The Axiovex Signal — Weekly Newsletter

**Feature Branch**: implementation lands on `staging` per spec 010;
promotion is a separate owner-gated merge `staging` → `main`.

**Created**: 2026-10-09

**Status**: **IMPLEMENTED AND LIVE 2026-10-10.** The staging
build and allowlisted test loop passed, the T010 gate was
satisfied (postal address designated, factual wording review
completed, and promotion approved by Tristen Pierson), and
T011 promoted the newsletter to production with live
verification. The first production send has **not** been
run; every send remains subject to the per-issue FR-005
owner approval, with standing cycles governed by T012.

**Amendment 1 (owner direction, Tristen Pierson, 2026-10-09)**:
the sending lane changed before any build. **Resend was
considered and replaced by the Axiovex Microsoft 365 tenant** —
issues send through Microsoft Graph Mail.Send from a dedicated
tenant mailbox, per FR-014 as amended. FR-013, FR-016, and
claims C-020-4 / C-020-6 are amended to match; no other FR
changes. Two owner
decisions are flagged as blocking the first production send (not
the build): the CAN-SPAM postal address and the privacy/footer
wording review (FR-018).

**Amendment 3 (owner direction, Tristen Pierson, 2026-10-09)**:
the WF-G8 signup block's Turnstile is **interaction-triggered**.
The Turnstile script does not load and no widget renders on page
view — passive readers make no `challenges.cloudflare.com`
requests and run no Turnstile checks. The script loads lazily
and the widget renders on the reader's first interaction with
the email field (focus). FR-008 is amended to state this; the
endpoint's server-side verification is unchanged (fail-closed).
Implemented and verified on staging the same day (lazy-load
browser checks on `/signals/` desktop + mobile and `/newsletter/`
desktop; endpoint harness 24/24 unchanged).

**Amendment 4 (owner direction, Tristen Pierson, 2026-10-09)**:
the **privacy policy link is required on all three reader
surfaces** — (a) the WF-G8 signup form (fine print under the
form), (b) the double opt-in **confirmation email**, next to
the confirm action with one plain line restating what is
collected, and (c) **every issue footer** (HTML and plain-text
parts). Links resolve on the sending environment's own site
base. FR-016 is amended to state this. Verified on staging the
same day: the signup block and issue footer already carried
the link; the confirmation email gained it (with the data
line), and the issue footer's link moved onto the same
per-recipient base-URL personalization as its web-edition and
unsubscribe links; endpoint harness 24/24 unchanged.

**Amendment 5 (owner direction, Tristen Pierson, 2026-10-10)**:
the FR-018(a) CAN-SPAM postal address is **designated**: the
newsletter footer carries Axiovex Systems, LLC's registered
office address from the Michigan LARA record — **6633 18 Mile
Rd, Sterling Heights, MI 48314** (the Velocity registered
office used for the business registration). The address now
appears in **both** the email footer (HTML and plain-text
parts, from the issue source's `footerAddress`) **and** the
web edition's footer colophon (rendered from the same field;
the marked placeholder remains only as the fallback for an
issue with no address designated). Applied and verified on
staging the same day (issue 2026-10-14; endpoint harness
24/24; live desktop + mobile screenshots filed with the T010
evidence). FR-018(a) is satisfied; the production-mode send
guard now passes on this address.

**Origin (Tristen, 2026-10-09)**: add a recurring emailed report
to the Axiovex system — working name "AXIOVEX daily signal" —
with a website signup, reading versions subscribers can open on
their devices, a free database with full subscription management
including automatic unsubscribe, and a matching privacy-policy
update; built and tested on staging first, with a test newsletter
to Tristen's email and the subscribe/unsubscribe loop exercised
end to end. **Corrected by Tristen the same day**: the newsletter
is **weekly, not daily** — "Send out on best time of best day of
the week."

**Reference**: Joe's market report
(https://market-report-alpha.netlify.app/) — Tristen pointed to
its edition structure as the model: a short lede, **what
changed**, **why it matters**, a dated **watchlist**, and a public
**archive** of editions. This spec adopts that structure and
fills it from Axiovex's own systems — the spec 004 Signals lanes
and the spec 019 Michigan data pack — not from market data. The
reference site's later additions (a listening/audio edition) are
noted as this spec's phase 2 (FR-019), not copied into v1.

## The product

**The Axiovex Signal** — a weekly email edition of what the
Signals board already watches, for readers who will not visit a
dashboard every day. Brand-adjacent to Signals on purpose: same
sources, same restraint (headline + source + date; figures with
their vintages; causes checked or labeled unexplained), delivered
instead of fetched.

- **Send slot: Wednesdays, 10:00 AM ET.** Rationale in plan.md:
  Tue–Thu mid-morning is the B2B engagement peak; Wednesday
  clears the Tuesday workforce-article / LinkedIn rhythm
  (spec 007) and lets Tuesday data releases make the edition.
- **Issue structure** (fixed order, every issue):
  1. **Hook-first lede** — the week in one line (X→Y form, per
     the hook-first standard, spec 018; the Y is substantiated
     by the issue's own contents).
  2. **What changed** — the week's top Signals items by lane:
     headline + source + date only, linking out (spec 004
     display discipline; no copied article text, no summaries
     of ingested news — spec 004 FR-008 stands).
  3. **Michigan Pulse board** — the current pack figures
     (spec 019 snapshots in `data/pack/*.json` + the Pulse
     series), each with its vintage / reference-period label.
  4. **Why it matters** — 2–3 insight lines. Causes are
     CHECKED before they are stated (news, official notices
     such as WARN filings, releases), per the in-depth numbers
     rule (2026-10-08); a move with no verified cause is
     labeled **unexplained**, never inferred.
  5. **Latest article** — the newest blog / workforce piece,
     linked.
  6. **Watchlist** — dated upcoming releases (Michigan state
     employment ~the 20th, county/metro ~the 28th, CPI, FOMC),
     each with its date.
  Then the footer: manage/unsubscribe links, view-in-browser
  link, privacy link, and the CAN-SPAM postal address (FR-018).

## Functional requirements

- **FR-001 — Name and cadence.** The newsletter is **The
  Axiovex Signal**, sent **weekly on Wednesdays at 10:00 AM
  ET**. No daily edition exists in v1 (owner correction,
  2026-10-09).
- **FR-002 — Issue structure.** Every issue carries the six
  sections in the fixed order above, assembled from the
  committed data of record. A section whose inputs are absent
  is omitted, never approximated or padded (the spec 013
  drop-out rule, applied to email).
- **FR-003 — Sourcing discipline.** Assembly reads only
  committed snapshots — `data/signals.json` (spec 004) and
  `data/pack/*.json` (spec 019) — plus the site's own article
  index. No hand-typed figures, no invented items; every
  figure carries its vintage label; every news item is
  headline + source + date with a link out.
- **FR-004 — Why-it-matters discipline.** Insight lines follow
  the in-depth numbers rule: reasons checked against evidence
  (news sources, official notices/releases including WARN,
  context) before being stated; unverified causes are labeled
  unexplained. The newsletter introduces no forecast of
  Axiovex's own — forward-looking content is the watchlist's
  dated release calendar and, where cited, agencies'
  attributed projections, labeled as such.
- **FR-005 — Owner approval before every send (v1).** Each
  issue is assembled and presented to Tristen (email HTML,
  plain-text part, and web edition) before it sends. There is
  no auto-send path in v1: an issue sends only on his
  approval for that issue.
- **FR-006 — Reading versions.** Every issue exists as
  (a) a **responsive HTML email**, mobile-first; (b) a
  **plain-text part**, always sent alongside (multipart);
  and (c) a **web edition** at `/newsletter/<yyyy-mm-dd>/`
  (the send date), with an archive index at `/newsletter/`.
  The email's "view in browser" link targets the web edition.
  Email, text, and web are rendered from **one committed
  issue source**, so the three versions cannot drift
  (the C-020-3 mechanism). The generator
  (`scripts/build-site.mjs`) gains a newsletter pass that
  renders the index + issue pages in the WF-15 / WF-16
  patterns and adds them to `sitemap.xml`.
- **FR-007 — Signup surface (v1).** A signup block
  (**WF-G8**) on `/signals/` only: placed below the Sources
  & method note, above the CTA band. Email field + Subscribe
  button; on submit it tells the reader a confirmation email
  is on its way — it never claims "you're subscribed" before
  confirmation (double opt-in is the product truth, FR-010).
  Other placements are out of scope (FR-019).
- **FR-008 — Subscribe endpoint + abuse controls.**
  `POST /api/newsletter/subscribe`, a Pages Function mirroring
  spec 005's contact endpoint: Cloudflare Turnstile (Managed;
  action `newsletter_subscribe`; server-side Siteverify,
  fail-closed), honeypot + timing trap, an edge rate-limit
  rule on `/api/newsletter/*`, payload caps, non-POST
  rejected. It collects the **email address only** — no name,
  no company, no preferences in v1. Client behavior
  (Amendment 3): Turnstile is **interaction-triggered** —
  `newsletter-signup.v1.js` injects the Turnstile script and
  renders the widget only on the reader's first interaction
  with the email field (focus; first input covers autofill
  paths). Nothing Turnstile-related loads on page view. At
  submit, a widget that is rendered but tokenless or expired
  (tokens live 300 s) is refreshed and the reader is asked to
  submit again — never a silent failure; a tokenless post
  (no JS, or the script blocked) still reaches the endpoint,
  which rejects it fail-closed.
- **FR-009 — Subscriber store.** A **Cloudflare D1** database
  (free tier) in the Axiovex Cloudflare account. A
  `subscribers` table: email, status (`pending` / `active` /
  `unsubscribed` / `suppressed`), confirmation-token hash,
  unsubscribe-token hash, created / confirmed / unsubscribed
  timestamps, signup source. **Tokens are stored only as
  SHA-256 hashes** — the raw token exists only in the email
  that carries it. A `sends` log: issue date/id, assembled
  recipient count, sent count, bounce count, complaint count,
  provider batch/message identifiers in aggregate. No other
  per-subscriber data exists.
- **FR-010 — Double opt-in, enforced.** Subscribing creates a
  `pending` record and sends a confirmation email carrying a
  single-use token link with a **48-hour expiry**. Redeeming
  it flips the record to `active` and lands on the WF-17
  confirmed page; an expired or unknown token lands on an
  explanatory WF-17 state, never a stack trace or a silent
  success. The send assembly reads `status = 'active'` **at
  send time** — pending, unsubscribed, and suppressed
  addresses are not recipients, by query, not by convention
  (C-020-1).
- **FR-011 — One-click unsubscribe.** Every issue carries
  (a) a footer unsubscribe link (GET with the address's
  unsubscribe token → immediate effect → WF-17 unsubscribed
  page) and (b) `List-Unsubscribe` + `List-Unsubscribe-Post:
  List-Unsubscribe=One-Click` headers (RFC 8058) pointing at
  the one-click POST endpoint. Both paths flip the status to
  `unsubscribed` **immediately** — the flip is committed
  before any later send assembly can read the list. The row
  is retained as a suppression record: the email address is
  kept with its status, and its SHA-256 hash is the
  suppression key, so the address cannot be silently
  re-added (FR-012).
- **FR-012 — Resubscribe requires fresh confirmation.** An
  unsubscribed or suppressed address returns only through a
  fresh subscribe + a fresh double opt-in confirmation
  (FR-010). There is no admin reactivate path in v1, and a
  subscribe POST for a known-suppressed address creates a
  `pending` record — never an `active` one (C-020-2).
- **FR-013 — Bounce / complaint suppression.** The Graph
  lane has no provider webhook, so suppression consumes
  delivery-failure evidence instead: non-delivery reports
  (NDRs) delivered to the sending mailbox and the send job's
  per-recipient results are reviewed each cycle (T012); a
  hard bounce (mailbox not found / address rejected) or a
  spam complaint flips the address to `suppressed` when
  processed, and the sends log records the counts. No
  address in `suppressed` state is ever a recipient
  (FR-010's send-time query already excludes it).
- **FR-014 — Sending via the Microsoft 365 tenant
  (Microsoft Graph).** From: `The Axiovex Signal
  <newsletter@axiovexsystems.com>` — a dedicated shared
  mailbox in the Axiovex tenant; Reply-To is the same
  mailbox, which the founders monitor (shared-mailbox
  access, as with Start and Legal). Sending uses a
  **dedicated Entra app registration, "Axiovex Website
  Newsletter"**, holding the **Mail.Send application
  permission only**, sending as the newsletter mailbox via
  Graph `sendMail` — the same mechanism as spec 005's
  contact app, but a separate app for least-privilege
  separation, scoped to the newsletter mailbox alone by an
  **Exchange Application Access Policy** (the spec 005
  scope-lock pattern). Sends are **per-recipient**: every
  subscriber receives their own message carrying their own
  unsubscribe token — never a bulk BCC. The client secret
  lives only as Pages secrets + the ops store (presence
  recorded, value never printed), with its expiry on the
  renewal watch, as spec 005's secret is. **Exchange
  Online limits, stated plainly**: the send job paces to
  **at most 30 messages per minute** and the tenant ceiling
  is **10,000 recipients per day** — a 100-recipient send
  takes ~4 minutes at the pacing cap, and the daily ceiling
  sits far above any list this series can grow into;
  crossing a limit is an owner decision, never an
  automatic change (C-020-6). No DNS change is needed to
  send: the tenant's existing SPF / DKIM / DMARC posture
  already authenticates mail from this domain.
- **FR-015 — No per-subscriber tracking (v1).** Resend's
  open and click tracking are **disabled**; no tracking
  pixels, no per-recipient link rewriting. The only counts
  kept are the aggregate sends-log numbers (FR-009). This
  is a posture decision, stated on the signup block and in
  the privacy section, not a missing feature.
- **FR-016 — Privacy policy update.** `/privacy/` gains a
  newsletter section (WF-05 pattern; new section, the page's
  existing sections otherwise unaltered): what is collected
  (email address, subscription status, timestamps — nothing
  else), why (to send The Axiovex Signal), the processors
  named — **Microsoft** (Microsoft 365 — the tenant
  mailbox and Graph sending) and **Cloudflare** (the D1
  subscriber store and site hosting) — no sale of data and
  no sharing beyond those processors, the no-tracking
  posture (FR-015), and the unsubscribe behavior, including
  retention of the suppression record so an unsubscribed
  address cannot be silently re-added. Contact for privacy
  questions stays legal@axiovexsystems.com, as the page
  already routes. **Link presence (Amendment 4):** the
  privacy policy is linked from all three reader surfaces —
  the WF-G8 signup form's fine print (FR-007), the double
  opt-in confirmation email beside the confirm action with
  one plain line restating what is collected (email address
  only; weekly; no per-reader tracking; unsubscribe any
  time), and every issue footer in both parts (FR-002 /
  FR-006) — each resolving on the sending environment's own
  site base.
- **FR-017 — Staging-first build + end-to-end test.** All of
  it is built on `staging` per spec 010 (guards verified
  intact), with a staging D1 database and staging bindings,
  and the sender restricted in test mode to an allowlist
  containing **only Tristen's email**. Before production is
  proposed, the full loop runs with evidence: subscribe →
  confirmation received → confirm → test issue received
  (HTML and plain-text parts both inspected) → one-click
  unsubscribe exercised on **both** paths (header POST and
  footer link) → a second test send provably excludes the
  address → resubscribe requires fresh confirmation.
  Screenshots and logs are filed with the verification task
  (tasks.md T009).
- **FR-018 — OWNER DECISIONS (blocking).** (a) **CAN-SPAM
  postal address**: the email footer must carry a physical
  postal address; Axiovex publishes no street address, so
  **the owner designates one (e.g. a PO Box) before the
  first production send**. The agent never invents one.
  **Designated 2026-10-10 — see Amendment 5.**
  This blocks the first send, not the staging build or the
  allowlisted test loop (staging test sends carry no postal
  line beyond a clearly marked staging placeholder, and
  never leave the allowlist). (b) **Wording review**: the
  privacy section (FR-016) and the email footer wording are
  reviewed by the owner (legal@) before production.
  (c) **Promotion**: production is a separate owner approval
  after the staging loop passes (tasks.md T010), per
  spec 010.
- **FR-019 — Out of scope (v1).** An audio / listen edition
  (phase 2 — the existing TTS/podcast pipeline; a later
  amendment, mirroring the reference site's listening
  edition); per-subscriber analytics of any kind; signup
  placements beyond `/signals/`; preference centers,
  multiple lists, or segmentation; a daily edition;
  sending without per-issue owner approval.

- **FR-020 — Sender-migration gauge (planning tripwire).**
  The Microsoft lane is v1's sender; a dedicated sender
  (Resend, per the Amendment 1 record) is the named
  successor **when the list outgrows tenant sending** —
  and the move is planned on evidence, not improvised.
  The gauge is computed from the sends log (FR-009) and
  the active-subscriber count:
  - **PLAN threshold — 750 active subscribers.** When the
    active list reaches 750, or growth projects crossing
    750 within 60 days, planning for the migration begins
    (Axiovex-owned Resend account, domain verification,
    list migration, dual-run test) as a plan presented to
    the owner.
  - **MOVE threshold — 1,500 active subscribers.** The
    migration completes before the next scheduled send
    after the list crosses 1,500.
  - **Health overrides** — any one starts planning
    immediately, regardless of list size: a spam
    complaint rate of **0.1% or more** on any single
    issue; a hard-bounce rate of **2% or more** on any
    single issue; any **Microsoft throttling event**
    during a send (Graph throttling or a mailbox sending
    restriction); or a **send duration over 60 minutes**.
  - **Observability.** The sends log records, per issue:
    recipients attempted and sent, send duration, hard
    bounces, complaints, and throttling events. Every
    issue's approval request (FR-005) and its post-send
    summary to the owner carries the gauge line: active
    subscribers, distance to the PLAN threshold, and any
    health-override status. When the PLAN threshold or a
    health override trips, the summary flags it
    explicitly and a planning task is recorded in this
    spec's follow-ups (tasks.md). **Nothing auto-starts**:
    planning is presented to the owner, and the migration
    itself is a separate owner decision.

## Claims (AEE)

- C-020-1: **Double opt-in is enforced.** No issue can be
  sent to a pending or otherwise unconfirmed address: the
  recipient set is `status = 'active'` read at send time
  (FR-010). *Falsifier*: on staging, subscribe an address
  and do not confirm it, then run a send — the sends log
  and the mailbox show zero sends to that address.
- C-020-2: **One-click unsubscribe is immediate and
  durable.** After an unsubscribe (either path), the
  address's status is `unsubscribed` before any later send
  assembly reads the list, and a later subscribe attempt
  for the same address produces a `pending` record only —
  it cannot become a recipient without a fresh confirmation
  (FR-011, FR-012). *Falsifier*: unsubscribe, then
  subscribe again without confirming, then run a send —
  zero sends to the address.
- C-020-3: **The three reading versions agree in
  substance.** Email HTML, plain-text part, and web edition
  carry the same items, the same figures, and the same
  vintage labels, because all three render from one
  committed issue source (FR-006). *Falsifier*: a diff of
  the assembled issue's item set and Pulse figures across
  the three versions shows a substantive difference.
- C-020-4: **No per-subscriber tracking events are
  recorded in v1.** The D1 schema holds no open/click
  event data and the Graph send path attaches no tracking
  of any kind; only aggregate counts exist (FR-009,
  FR-015). *Falsifier*: schema inspection finds a
  per-subscriber event table or column, or the send code
  is found attaching tracking headers, pixels, or
  per-recipient link rewriting.
- C-020-5: **Every figure in an issue traces to a
  committed snapshot.** Each Pulse figure and each dated
  watchlist entry maps to `data/signals.json`,
  `data/pack/*.json`, or the cited release calendar — with
  its vintage label intact (FR-003). *Falsifier*: the
  pre-send figure audit finds a figure with no snapshot
  source, or a vintage label dropped between snapshot and
  issue.
- C-020-6: **The system adds no new paid service.**
  D1's free tier holds the subscriber store and the
  tenant's existing Microsoft 365 licensing carries the
  sending (FR-014's Exchange limits); crossing a stated
  limit stops at an owner decision — the system has no
  code path that buys, upgrades, or charges anything.
  (The planned exit from this lane, when the list grows,
  is measured by the FR-020 sender-migration gauge.)
  *Falsifier*: any invoice, paid-tier activation, or a
  send volume above the free-tier caps without a recorded
  owner decision.
