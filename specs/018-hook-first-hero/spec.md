# Feature Specification: Homepage Hero — Hook-First Copy

**Feature Branch**: implementation lands on `staging` per spec 010;
promotion is a separate owner-gated merge `staging` → `main`.

**Created**: 2026-10-07

**Status**: IMPLEMENTED AND LIVE 2026-10-07. Owner approved the
staging hero (tasks.md T006); promoted to production in merge
`be1d8e0` and verified live (see tasks.md T007). **Amendment 1
(2026-10-08)**: hook-first lead lines for the three service
sections — implemented on staging; promotion pending owner
review (see Amendment 1 below, tasks.md T008–T012).

**Origin (external feedback, 2026-10-07)**: feedback received on the
site's copy — open with a good hook on why Axiovex matters, in
X → Y form ("if you use us for X you will get Y output"), because
CEOs and decision makers skim: hook them quick, then reel them in
with detail. Tristen endorsed the feedback the same day and adopted
the **hook-first copy standard**: public surfaces open with the
outcome in X→Y form in the first line or two; the Y must stay a
deliverable already substantiated on the site — no invented results
or metrics for marketing.

**Direction (Tristen, 2026-10-07)**: drafts prepared
(`~/workspace/your_files/hook-drafts-2026-10-07.md` — three hero
options plus a re-hooked spec 017 LinkedIn pair). Tristen asked
which option best serves Michigan business — in particular defense
manufacturers, engineering firms, and new defense startups, and
startups in general — and decided, verbatim:

> "Go with the composite — Option 2 headline + Option 1 lede"

## Approved copy (verbatim)

- **Hero H1** becomes:
  "AI your team can actually use. Infrastructure on your floor.
  Evidence you can defend."
- **Hero lede** becomes:
  "Hand us the problem your team keeps routing around, and you get
  back a working system, and people who can run it without us."
- **Replaced**: H1 "Engineering clarity into difficult systems."
  and lede "We're an expert consulting team. We help manufacturers
  and organizations facing high-consequence problems put AI to
  work — practically, responsibly, and on their own terms.
  Michigan-rooted, shop-floor serious."

## Scope

- **FR-001 — Hero H1 replaced verbatim** in `index.html` with the
  approved text above. No other hero structure changes.
- **FR-002 — Hero lede replaced verbatim** in `index.html` with
  the approved text above.
- **FR-003 — Copy only.** No layout, CSS, or stylesheet change.
  The three-sentence H1 must wrap acceptably in the existing hero
  (verified by screenshot, tasks.md T005); if its length genuinely
  breaks the hero layout, stop and report rather than restyling.
- **FR-004 — The brand line stays.** "Engineering clarity into
  difficult systems." is NOT purged sitewide: it remains the site's
  slogan (JSON-LD `slogan`), the footer mission, and the
  OG/Twitter descriptions. Only the hero H1 instance changes.
- **FR-005 — Meta / OG / JSON-LD unchanged** (out of scope). Noted:
  `og:description` and `twitter:description` carry the brand line,
  which remains live in its slogan/footer roles per FR-004; the
  meta description does not quote the lede.
- **FR-006 — Wireframes updated in the same docs change**
  (wireframes-first rule): WF-01 hero copy in
  `docs/wireframes/wireframes.html` (plus the WF-02 mobile and
  WF-07 tablet hero frames, which render the same H1), a
  revision-log entry in `docs/wireframes/wireframes.md`, and the
  synced review copy at
  `~/workspace/your_files/axiovex-wireframes/wireframes.html`.
- **FR-007 — Staging-first verification.** Implemented on
  `staging` per spec 010 (guards preserved and verified), verified
  live on staging.axiovexsystems.com plus rendered screenshots at
  desktop (1440) and mobile (390) widths before review is
  requested; production is untouched until the owner gate passes.
- **FR-008 — Out of scope.** No LinkedIn changes (the re-hooked
  spec 017 LinkedIn wording awaits its own owner nod); no service
  section lead lines (a later package under the hook-first
  standard); no other copy anywhere on the site.

## Claims (AEE)

Every phrase of the approved copy maps to an existing
substantiated site claim. **No new claim is introduced.**

- C-018-1: "AI your team can actually use" ↔ the AI education &
  training practice as published (AI 101: "take your team past the
  demos to real, everyday capability with modern AI tools").
  Status: substantiated (published practice).
- C-018-2: "Infrastructure on your floor" ↔ the manufacturing AI
  infrastructure practice and the owner-confirmed data-locality
  FAQ ("your data stays on your floor, under your control,
  processed locally — not shipped to third-party clouds";
  owner-confirmed 2026-10-06, spec 001 R-1c).
  Status: substantiated (owner-confirmed practice).
- C-018-3: "Evidence you can defend" ↔ the evidence & decision
  systems practice as published. Status: substantiated
  (published practice).
- C-018-4: "people who can run it without us" ↔ the published
  positioning "on their own terms" — an independence-outcome
  framing of the training + infrastructure practices; it asserts
  no SLA, support term, or result. Status: substantiated
  (published positioning).
- C-018-5: No metrics, results, client outcomes, certifications,
  or partnerships are asserted anywhere in the new copy.

## Amendment 1 — owner direction 2026-10-08 (hook-first lead lines for the three service sections)

**Direction.** Tristen directed that the hook-first
standard adopted in this spec be applied to the three
homepage service sections under "Three services, one
method." — the later package this spec's FR-008 named
and held out of scope. Recorded here as the amendment's
approval basis, per the owner-directed amendment
precedent (spec 011 Amendment 2; spec 013 Amendments
1–2).

**Change (copy only).** Each service card in
`index.html` (§what-we-do) opens with ONE hook-first
lead line in X → Y form; the card's existing
substantiating copy follows, trimmed only where the
lead takes over its closing clause. No layout, CSS, or
stylesheet change; card order, numbering, and EXPLORE
anchors unchanged. The leads, verbatim:

- **01 AI education & training** — "Demos your team
  watches → AI they use in the work itself, every day."
  The body keeps the AI 101 course line and the openly
  shared deck + handout sentence (the relative clause
  "that take your team past the demos to real, everyday
  capability…" moves into the lead).
- **02 Manufacturing AI infrastructure** — "AI on your
  floor → your data stays on your floor, under your
  control." The body keeps the means list verbatim:
  "Private inference planning, GPU sizing, and local AI
  routing."
- **03 Evidence & decision systems** — "Uncertainty
  named, not hidden → decisions that rest on facts."
  The body keeps "Audited workforce intelligence and
  evidence-centered analysis that make knowledge,
  uncertainty, and assumptions explicit." (the trailing
  "— so decisions rest on facts" moves into the lead).

**Claims (AEE).** No new claim is introduced; every Y
is an outcome already substantiated on the site.

- C-018-6: "AI they use in the work itself, every day"
  ↔ the published training outcome "real, everyday
  capability with modern AI tools" (card + FAQ
  #faq-training); the openly shared materials are live
  on /documents/. Status: substantiated (published
  practice).
- C-018-7: "your data stays on your floor, under your
  control" ↔ the card's own published wording and the
  owner-confirmed data-locality FAQ (C-018-2 basis).
  Status: substantiated (owner-confirmed practice).
- C-018-8: "decisions that rest on facts" ↔ the card's
  published closing clause and FAQ #faq-evidence
  ("decide on facts instead of vibes"); the live
  Signals page and the published Michigan workforce
  research are the working products. Status:
  substantiated (published practice + live products).

**Flow.** Wireframes first (WF-01 services grid +
WF-G5 revised; revision-log entry; review copy
re-synced), implementation on the staging branch per
spec 010, Playwright screenshots at desktop and mobile
widths against the locally built staging output, owner
review on staging, then promotion `staging` → `main`
under spec 010 FR-004 with production re-verification.

**Status: implemented on staging 2026-10-08; promotion
pending owner review (tasks.md T011).**
