# Feature Specification: Newsletter Signup Placement Expansion

**Feature Branch**: implementation lands on `staging` per spec 010;
promotion is a separate owner-gated merge `staging` → `main`.

**Created**: 2026-10-10

**Status**: **IMPLEMENTED AND LIVE 2026-10-10** — implemented
on staging (commits `9951afb`, `0941851`, `059a837`, `1a66f12`;
harness 31/31; Playwright-verified against the approved frames
— tasks.md T009–T011), then promoted to production on the
owner's separate approval (tasks.md T012): merge `202a944`,
post-merge build `b43e0a9`, deployment `f40deb94`,
production-verified live.
The wireframes were approved by Tristen Pierson on 2026-10-10
with the header button label decided as **Subscribe** (tasks.md
T001).

**Correction 2026-10-10 (owner-directed, tasks.md T013)**: as
promoted, `/newsletter/` rendered two subscribe forms — the
WF-15 landing form and the sitewide WF-G4 footer strip.
Tristen directed one form on that page: the top (landing) one.
The footer strip is suppressed on `/newsletter/` only (WF-15
always specified one form per page); every other page,
including the newsletter issue pages, keeps its strip.

## Background

Spec 020 (The Axiovex Signal) shipped the WF-G8 signup block in
exactly two places: the foot of `/signals/` and the close of the
`/newsletter/` archive. A visitor who enters anywhere else never
meets it. Tristen directed a more obvious signup; a placement
research report (2026-10-10,
`~/workspace/research_notes/newsletter-signup-placement-research-20261010-1314/report.md`)
found no single winning placement and ranked a layered,
always-visible system: a persistent header CTA (highest reach),
an end-of-article block (highest intent), a true landing page
(highest per-visitor conversion), a homepage section, and a
sitewide footer form (the passive layer) — and no interruptive
formats (modal popups are the most-disliked format in NN/g's
research and a credibility risk for a trust-sold firm). The
wireframes drawing that system (`docs/wireframes/`, frames
WF-G1, WF-G4, WF-G8 + compact variant, WF-01, WF-04, WF-11,
WF-15, revised 2026-10-10) were approved as drawn; this spec
implements them. The proposal note
(`docs/wireframes/newsletter-signup-placement-proposal-2026-10-10.md`)
carries the ranked set and the approval record.

Every placement reuses the existing **WF-G8** block — same copy,
same email-only field, same Subscribe → button, same
confirmation-first pending state, same abuse posture (spec 020
FR-008/FR-010). Adaptations are positional only. Each placement
records its own signup *source* so placements can be compared
per 1,000 visitors.

## Functional requirements

- **FR-001 — Header CTA (WF-G1).** Every page carrying the
  standard header gains a **Subscribe** ghost button →
  `/newsletter/`, immediately left of the Contact CTA in the
  desktop row; Contact keeps its stronger bordered treatment
  and stays visually primary. The hamburger panel gains the
  matching Subscribe row directly above its full-width Contact
  CTA. The header bar itself (logo + hamburger) carries no
  button. On `/newsletter/` pages the button shows current
  (cyan, `aria-current="page"`), like any other nav item. The
  header carries no form, dropdown, or popup.
- **FR-002 — End-of-article block (WF-04).** The full WF-G8
  block renders at the end of every article page (the
  blog-article template — insights and workforce articles
  alike), centered at the article measure, after the body and
  before More analysis. Source: `article`. (WF-16 issue pages
  already close with the block under their own heading
  variant; unchanged.)
- **FR-003 — `/newsletter/` landing page (WF-15).** The page
  order becomes: page head (unchanged value promise) →
  landing lead → issue list → CTA band → footer. The lead
  carries the WF-G8 form **above the archive** with the
  cadence restated at the form ("Every Wednesday" — one email
  a week, 10:00 AM ET, free), the three factual content
  bullets drawn in the frame (Michigan workforce data, with
  vintages · Manufacturing & field signals · Industrial AI,
  checked against sources), the privacy/no-tracking line, and
  a "Read a sample issue ↓" anchor to the issue list. The
  v1 closing block is removed — **exactly one content form on
  the page**. The proof slot ships **empty**: no subscriber
  count or testimonial exists, so none is claimed. Source:
  `landing` (supersedes the closing block's `archive`).
  Normal navigation is retained.
- **FR-004 — Homepage section (WF-01).** The full WF-G8 block
  renders as a homepage section directly after the Signals +
  Michigan Pulse block and before About. The hero and the
  services grid — and their CTAs — are untouched and unmoved.
  Source: `home`. WF-02 (mobile) inherits the section in its
  stack.
- **FR-005 — Footer strip (WF-G4).** Every page carrying the
  standard footer gains a centered newsletter strip above the
  three-column grid: the WF-G8 compact variant with a working
  email field (not just a link). The grid, legal row, and
  bottom row are unchanged. Source: `footer`.
- **FR-006 — Signals page head (WF-11).** The compact variant
  renders directly under the `/signals/` page head (and its
  strata bar), ahead of Highlights. The approved full WF-G8
  block keeps its v1 slot at the page foot. The page carries
  both, deliberately. Sources: `signals-top` / `signals`.
- **FR-007 — One component.** All forms are rendered by the
  generator's single signup component (`newsletterBlock()`)
  in its full or compact variant; no page hand-writes a form.
  The compact variant is exactly as drawn at WF-G8: no
  eyebrow, a one-line heading carrying the cadence, the same
  email field and Subscribe → button, the fine print in its
  compact form, and an in-place swap to the same pending
  state ("Check your inbox." + the full block's confirmation
  line) after submit. (The footer strip's drawn heading +
  sub-line at WF-G4 is that frame's rendering of the same
  variant.) Each form instance carries unique element ids
  (keyed by its source) and a `data-nl-block` hook; behavior
  binds per instance, never by a page-global id.
- **FR-008 — Interaction-triggered Turnstile, per form.**
  Spec 020 FR-008's posture is unchanged and now applies per
  form instance: the Turnstile script is not loaded and no
  widget renders on page view on any page; the script loads
  lazily on the reader's first interaction with any email
  field, and each form's widget renders in that form's own
  container. Server-side Siteverify stays fail-closed. The
  `/signals/` behavior is identical to spec 020's shipped
  behavior.
- **FR-009 — Source integrity.** The subscribe endpoint
  accepts only the known source set — `signals`,
  `signals-top`, `article`, `landing`, `home`, `footer`,
  `archive`, `issue` — and stores exactly the submitted
  value. A missing or out-of-set source coerces to `signals`
  (the pre-021 default), so stored sources stay comparable.
  (Pre-021 the endpoint stored free text up to 40 chars; the
  constraint is new in this spec and is recorded in plan.md.)
- **FR-010 — llms.txt.** The link list gains the two approved
  lines beside the Signals line, in the file's existing
  style; the second names the then-latest issue's web
  edition (`/newsletter/2026-10-14/` at implementation).
- **FR-011 — Nothing else changes.** No copy beyond WF-G8's
  own words and the three factual landing bullets; no new
  claims, counts, testimonials, urgency, or scarcity; no
  popups, modals, slide-ins, or exit intent; no nav
  restructure (one button added; no link moves or is
  renamed). CSS changes ship as the new versioned stylesheet
  `styles.v36.css`; no versioned stylesheet is edited in
  place.
- **FR-012 — Verification bar.** The spec 020 endpoint
  harness stays green and gains placement/source checks;
  the build is idempotent (a second build produces zero
  diff); staging is verified with Playwright screenshots at
  desktop and mobile (390px) against the approved frames,
  including a network check that no
  `challenges.cloudflare.com` request fires on page view.
  Production is untouched by this spec.

## Claims (AEE — each carries its falsifier)

- **C-021-1: The header CTA is universal and singular.**
  Every page carrying the standard header renders exactly
  one Subscribe link to `/newsletter/` in the desktop row
  (immediately left of Contact) and exactly one in the
  mobile panel (immediately above Contact). *Falsifier:*
  any standard-header page in the built output missing the
  link, duplicating it, or placing it elsewhere.
- **C-021-2: Sources are truthful and constrained.** Each
  placement's form submits its own placement source, the
  endpoint stores exactly that value, and an out-of-set
  source is stored as `signals`. *Falsifier:* a built page
  whose hidden source differs from its placement, or a
  harness placement check storing an out-of-set value
  verbatim.
- **C-021-3: Form counts match the wireframes.** Content
  forms per page: `/newsletter/` exactly 1; `/signals/`
  exactly 2 (head compact + foot full); article pages
  exactly 1; issue pages exactly 1; all other pages 0 —
  plus exactly one footer-strip form on every page with
  the standard footer. *Falsifier:* a form-count audit of
  the built output disagreeing on any page.
- **C-021-4: No page view loads Turnstile.** A cold load of
  any page carrying a form makes no
  `challenges.cloudflare.com` request; the script loads
  only after a first interaction with an email field.
  *Falsifier:* a network log of a cold page load (no
  interaction) containing a challenges request.
- **C-021-5: One component, one copy.** The rendered
  blocks differ only where the frames themselves differ
  (variant, the WF-16 heading variant, the WF-15 lead's
  bullets/cadence/sample elements, the WF-G4 heading +
  sub-line). *Falsifier:* a per-page textual deviation in
  heading, lede, fine print, button, or pending state
  beyond those drawn differences.
- **C-021-6: The archive record is unmoved.** The
  `/newsletter/` issue list (rows, order, links) is
  identical to the pre-021 build; the restructure moves
  the form, not the record. *Falsifier:* a diff of the
  issue-list region against the pre-021 build output.

## Out of scope

- Production promotion (separate owner approval, spec 010
  flow).
- The scroll-triggered articles-only slide-in the research
  left as a possible later test — not proposed, not built.
- Any change to spec 020's sending, confirmation, or
  unsubscribe behavior; the WF-17 landing pages' reduced
  shell carries neither the standard header nor footer and
  is unchanged.
- Per-placement analytics reporting (the sources are stored
  from this spec forward; reporting is a later spec).
