# Wireframes — Axiovex Systems website

Canonical set: `wireframes.html` in this folder (branded review document).
This file is the index, the gate rule, and the revision log.

## The gate (owner rule, Tristen Pierson)

- **Wireframes first.** Any change that impacts UX starts here: update the
  wireframes, get Tristen's approval, and only then change the website.
- **Always current.** The wireframes must match the approved design of the
  live site at all times. A website change that ships without a matching
  wireframe update is a process defect, not a shortcut.
- UX changes run through the spec-kit + AEE SDD flow (`specs/`): the spec
  references the wireframe revision it implements.

## Frame inventory (approved 2026-10-04)

- WF-01 Home — desktop · WF-02 Home — mobile (390px)
- WF-03 Blog index · WF-04 Blog article · WF-05 Privacy policy
- WF-06 Contact · WF-10 Documents (added 2026-10-05) · WF-11 Signals
  (Trends & outlook section proposed 2026-10-06 by spec 011 —
  PENDING OWNER APPROVAL; amended 2026-10-06 by the spec 011
  amendment — owner-directed: ticker to the top of the page,
  condensed page top, sparkline window-% annotations;
  Highlights region + expandable Detail region proposed
  2026-10-06 by spec 013 — PENDING OWNER APPROVAL)
- WF-12 Signals widget (added 2026-10-06, spec 008 — approved +
  implemented 2026-10-06)
- WF-13 Michigan talent map (added 2026-10-06, spec 014 —
  APPROVED + IMPLEMENTED + LIVE 2026-10-06, promotion
  merge `44ce7fc`): the geography subsection of
  WF-11's Detail region — QCEW employment-by-industry
  choropleth (committed-layer selector, not-disclosed
  state), LAUS unemployment choropleth, IPEDS institution
  map, PSEO pipeline view (adjusted scope: statewide
  flows + labeled University of Michigan spotlight)
- WF-14 Disclaimer (added 2026-10-06, spec 016 — owner
  decision 2026-10-06 (spec 001 T017): Disclaimer page
  adopted, Terms deferred; drawn on the WF-05 Privacy
  pattern; footer-reached via WF-G4; **APPROVED ·
  IMPLEMENTED + LIVE 2026-10-06** (promotion merge
  `9d7dbba`; copy approval given by Tristen 2026-10-06,
  spec 016 T005))
- WF-07 Home — tablet (834px) · WF-08 Contact — tablet
- WF-09 Blog / article / privacy — tablet
- Global components: WF-G1 nav (Signals link added by spec 008 —
  approved + implemented 2026-10-06; Home as the home page's first
  nav item added by spec 009 — approved + implemented 2026-10-06) · WF-G2 strata bar (+ page-head rhythm, spec 003; page-foot
  rhythm proposed by spec 015 — PENDING OWNER APPROVAL) · WF-G3 CTA
  band · WF-G4 footer (legal link row gains Disclaimer
  beside Privacy Policy, spec 016 — owner decision
  2026-10-06; IMPLEMENTED + LIVE 2026-10-06, merge
  `9d7dbba`) · WF-G5 service card · WF-G6 Signals floating
  widget (spec 008 — approved + implemented 2026-10-06) · WF-G7
  Breaking news banner (proposed 2026-10-06 by spec 012 —
  PENDING OWNER APPROVAL)

Framing decisions baked into the set (2026-10-04): centered axis (standing
symmetry rule); strata = 3 segments
(Axiovex's three service lines); contact form + email routes (form added
by spec 005, 2026-10-05; the set was email-routes-only before that); no
invented proof — evidence band carries real published material only; FAQ kept
as accordion rows.

## Revision log

- **2026-10-04** — Full set (14 frames incl. tablet set) approved by Tristen;
  redesign implemented the same day (commit 7102f67).
- **2026-10-05** — REVISION APPROVED by Tristen 2026-10-05 and
  IMPLEMENTED in 84939fd (spec 004-signals-pulse):
  NEW Signals + Michigan Pulse home block on WF-01 (between Evidence and
  About) and NEW WF-11 Signals page — Pulse band (BLS Michigan series) +
  five signal lanes fed at build time from primary-source RSS/APIs
  (NIST, NSF, DOE, Manufacturing Dive, Automation Alley, CISA ICS,
  Federal Register). Headline/source/date only; nav unchanged; footer
  gains a Signals link.
- **2026-10-05** — REVISION APPROVED by Tristen 2026-10-05 and
  IMPLEMENTED in 7d11b2a, live on production the same day (spec
  005-contact-form):
  WF-06 left column's primary route is now a contact form (name, email,
  optional company, topic, message) protected by Cloudflare Turnstile
  (Managed), delivered to the Start mailbox via a Pages Function with
  server-side Siteverify (fail-closed), honeypot + timing trap, and an
  edge rate-limit rule (5 req / 10s per IP). The Graph app is scoped by
  an ApplicationAccessPolicy to the Start mailbox only (verified:
  Start Granted, other mailboxes Denied). Email routes remain as
  fallback; legal stays email-only. The privacy policy's "no form, no
  tracking" wording was revised in the same release (exact copy in the
  spec, FR-005). Full test ladder passed on a Pages preview (test-key
  pass + real delivery, always-fail block, restore) and end-to-end on
  production.
- **2026-10-05** — REVISION APPROVED by Tristen 2026-10-05 and IMPLEMENTED in 6825c7b (spec 003-page-head-spacing):
  page-head rhythm defined at WF-G2 — last head text → strata 36px,
  strata → first content 40px, on Documents, Blog index, Contact, and
  Privacy (measured today: 132px above / ~8px below on Documents and
  Contact). WF-10 Documents frame added (the page previously had none).
- **2026-10-05** — REVISION APPROVED by Tristen 2026-10-05 and IMPLEMENTED the same day (spec 002-article-share-layout, commit d94719e):
  WF-04 — share row drawn at the TOP of the article only, directly under the
  strata divider, 22px clear above / 20px below; the end-of-article share
  block removed from the frame. WF-03 — article list starts lower under the
  divider (list top margin 32px → 44px). Not yet implemented on the live
  site; verified live (one share row per article, no post-footer).
- **2026-10-06** — REVISION APPROVED by Tristen 2026-10-06
  (08:55 EDT) and IMPLEMENTED the same day (spec
  008-signals-nav-widget, implementation commit ab0e4e5): (1) WF-G1 nav gains a **Signals** link
  (`/signals/`) immediately after Blog, in the desktop links and the
  hamburger panel; every page frame's nav mock updated to match, with
  Signals shown as the current page on WF-11. (2) WF-01 home Signals
  block highlighted: the eyebrow becomes "AXIOVEX SIGNALS — LIVE"
  with a live-dot, and a **Michigan Pulse mini-strip** — MI
  manufacturing employment · MI unemployment · MI labor force,
  period-labeled — sits directly under "What we're watching.",
  build-generated from the same verified snapshot as WF-11 (the
  full Pulse band stays on WF-11); lane previews and the
  SEE ALL SIGNALS path unchanged, hero untouched. (3) NEW **WF-12 /
  WF-G6** — a collapsible **Signals floating widget** on every page
  except `/signals/`: collapsed bottom-right pill (live dot +
  "Signals" + chevron); expanded ~340px panel with a Michigan Pulse
  row (same three stats), the three freshest headlines (lane label,
  headline, source + date, linking out; on blog articles the
  tag-matching lane surfaces first), and an "All signals →" footer
  link. Starts collapsed; real button with `aria-expanded`; ESC
  closes; state remembered for the session only; mobile panel
  height-capped with internal scroll and safe-area-aware pill;
  renders nothing if its data fails. Fed by a build-generated
  first-party JSON derived from `data/signals.json` (no third-party
  runtime fetching, per spec 004), refreshed by the hourly
  signals-sync build. Implemented as drawn — nav in all seven
  shells, LIVE eyebrow + mini-strip generated by `buildSignals()`,
  widget served from `/signals-widget.json` with
  `signals-widget.v1.css` / `signals-widget.v1.js`, site stylesheet
  bumped to `styles.v25.css` — and verified live (Playwright
  desktop/tablet/mobile + curl) on 2026-10-06.
- **2026-10-06** — REVISION (spec 009-home-nav-link) —
  **APPROVED 2026-10-06 · IMPLEMENTED + LIVE (commit 11873b1)**:
  WF-G1
  gains an explicit home-page variant (a): the home page's nav adds
  **Home** (`href="/"`, `aria-current="page"`) as the first item of
  both the desktop row and the hamburger panel, shown current —
  every subpage already starts with Home; the home page is the only
  page without it (only the logo links to `/` there). WF-01's drawn
  home nav updated to match. Variant (b), the subpage nav, is
  unchanged, as are all other links, the mobile header (logo +
  hamburger), and the stylesheet. From the home page, clicking Home
  is a plain navigation to `/` — reload at the top; no fragment, no
  JavaScript. Approved by Tristen 2026-10-06 (11:22 EDT) and
  implemented the same day — commit 11873b1; live-verified (served
  `/` carries Home first in both menus, with `aria-current`).
- **2026-10-06** — REVISION PROPOSED (spec 011-signals-trends-outlook) —
  **APPROVED 2026-10-06 · IMPLEMENTED + LIVE** (staging, then
  promotion merge `89c65c1`): WF-11
  gains a **Trends & outlook** section between the Michigan Pulse
  band and the five lanes: (1) a market-style **ticker strip** —
  decorative echo of the board (Pulse series, latest + MoM),
  aria-hidden, pausing on hover/focus, static under
  prefers-reduced-motion; it carries no content the static board
  doesn't (spec 004's no-ticker-as-carrier rule stands); (2) a
  **trend board** — the four Pulse series as ticker-style rows
  (latest verbatim, MoM + 12-month-window deltas computed by the
  generator from series history and labeled "Computed from BLS
  series", sparkline per row with missing months as breaks, never
  interpolated); (3) an **outlook board** — "On the rise" /
  "Falling" occupation rows from the **U.S. BLS Employment
  Projections** (latest vintage, 10-year horizon, labeled), plus a
  separately labeled **Michigan DTMB long-term industry
  projections** group; every row attributed, with the standing
  caption that projections are the publishing agency's modeled
  outlook — not Axiovex forecasts, not guarantees; (4) an
  **education analytics** block — Michigan graduation rate,
  enrollment, and postsecondary-completions trend rows from a
  committed, vintaged dataset (CEPI / MISchoolData, IPEDS),
  refreshed on the sources' release cycle, never hourly-fetched.
  No invented or model-generated predictions anywhere; the page's
  "signals, not forecasts" restraint is preserved. Nothing on the
  live site changes until Tristen approves.
  **Closeout 2026-10-06:** approved by Tristen (12:38 EDT);
  implemented on staging; the Michigan + education sections
  were restored after live-browser verification of the sources;
  promoted to production in merge `89c65c1` and
  production-verified (figure audit clean) — specs/011 tasks
  T007/T008.
- **2026-10-06** — REVISION PROPOSED (spec 012-breaking-news-banner) —
  **APPROVED 2026-10-06 · IMPLEMENTED + LIVE** (promotion merge
  `89c65c1`): NEW
  **WF-G7 Breaking news banner** (global). A full-width deep-red
  strip above the sticky nav on every page, present only while a
  curated entry is active in `data/breaking.json`. Curated, never
  auto-triggered: an entry is placed deliberately (Tristen, or an
  agent under the monitoring runbook) and committed — the commit
  is the audit trail — with its applicability reason recorded in
  the file. The strip shows the publisher's headline **verbatim**
  plus source name and published time (the Signals display rule,
  spec 004); Axiovex adds no summary, opinion, or rewording. The
  whole strip is one link to the source story; a real dismiss
  button beside the link hides it, remembered per entry id
  (localStorage) so a new entry shows again. Every entry expires
  at most 72 hours after its published time and the build drops
  expired entries; with no active entry the banner leaves zero
  layout trace. The deep red (#8C2B2B family) is deliberately the
  site's only off-palette element — an alert must read as an
  alert. Build-time injection only (one generator marker-region
  mechanism across all page shells/templates — no client-side
  fetching); `role="region"` labeled "Breaking news", first in
  reading order, visible focus states, no motion. Nothing on the
  live site changes until Tristen approves.
  **Closeout 2026-10-06:** approved by Tristen (12:55 EDT);
  implemented and verified on staging (83/83 checks);
  `data/breaking.json` promoted as `{ "active": null }`;
  production serves the mechanism with zero trace — specs/012
  tasks T007/T008. Amendment 1 (hourly detection check +
  retention policy) followed the same day; the
  `website-breaking-news-check` job is live.
- **2026-10-06** — AMENDMENT (spec 011-signals-trends-outlook,
  Amendment 2) — **OWNER-DIRECTED 2026-10-06 (13:03–13:04 EDT);
  wireframes revised before implementation**: reviewing spec 011
  on staging, Tristen directed: "can we put the ticker at the top
  of the page? Also the very top has a lot of wasted space
  especially vertically. condense this, dont have so much wasted
  space." and "also make sure that the graphs have the up/down
  percentage thing that the ticker strip has too." WF-11 revised
  accordingly: (1) the **ticker strip moves to the top of the
  page**, directly under the nav and above the page head — the
  Trends & outlook section keeps its head, trend board, and
  outlook board, and the tape leaves the section; the spec 012
  banner's slot above the nav is unaffected. (2) The **page top
  is condensed** (/signals/ only; measured from the shipped
  styles.v26.css): page-head top padding 76px → 44px (≤820px:
  60px → 36px), head text → strata 36px → 24px, strata → Pulse
  section 40px → 28px, Pulse kicker margin 14px → 10px, Pulse
  tile padding 18px → 14px (band height −8px), the ticker's
  offset at its new page-top slot 16px, Trends head margin 58px
  → 40px — the gap stack totals 250px → 162px (−88px, ≈ one
  third). WF-G2's 36/40 rhythm on every other page is unchanged;
  this is a deliberate signals-only exception, recorded as such.
  (3) Each trend-board **sparkline gains its window % change**
  beside the graph — glyph + signed percent in the tape's
  neutral style, computed by the generator from the same history
  ((last − first) ÷ first; for the unemployment rate the % is
  the rate's relative change — the pts figures stay in the delta
  columns). Drawn from the current snapshot: manufacturing
  ▲ +0.4%, unemployment ▲ +2.0%, labor force ▼ −3.0%, nonfarm
  ▲ +0.0%. Implementation is spec 011 tasks T009–T010, on staging
  after spec 012's in-flight build (shared generator/stylesheet
  chain), promoted under spec 010's rules.
  **Closeout 2026-10-06:** implemented on staging (tasks
  T009/T010 — spacing measured exactly per the A2-2 table,
  sparkline % audit clean) and promoted with spec 011 in merge
  `89c65c1`; production-verified. **Ticker placement decision
  (owner, 2026-10-06 13:30 EDT):** the ticker stays static at
  the top of /signals/ and Signals-only — sticky-on-scroll and
  site-wide placements were considered and declined; the
  floating widget remains the site-wide carrier.
- **2026-10-06** — REVISION PROPOSED (spec
  013-signals-highlights-detail) — **APPROVED 2026-10-06 ·
  IMPLEMENTED + LIVE** (staging, then promotion merge
  `4497704`): WF-11 gains two regions.
  (1) A **Highlights region** directly under the page head,
  ahead of the Pulse band: a **generated insights summary** —
  2–4 sentences composed by the build from fixed templates
  filled only with values computed from the same committed
  data the boards show (Pulse levels + deltas, window moves,
  each outlook board's top movers, the education headline),
  every clause traceable to a figure on the page, observational
  language only (no causes, no advice, no forecast language
  beyond the agencies' attributed projections), a sentence
  whose inputs are missing omitted rather than approximated,
  under a provenance line ("Generated at build time from the
  data on this page · …"). This is not a summary of the news
  lanes — spec 004 FR-008's bar on auto-generated summaries of
  ingested news items stands; the summary speaks only about
  Axiovex's own ingested statistics (reconciliation in spec
  013 FR-002). Below the summary, **highlight cards**: the
  four Pulse headline stats, one top-riser + one top-faller
  card per outlook dataset present, and the education headline
  figure when verified data exists — each card source- and
  vintage-labeled, and absent when its data is absent (no
  placeholders). (2) An expandable **Detail region** ("The
  full picture") between Trends & outlook and the lanes —
  collapsed by default (its whole visible footprint while
  closed is one header row with a real button, aria-expanded,
  keyboard-operable), its content server-rendered into the DOM
  so it stays crawlable and works without JavaScript. Inside:
  the full 12-month Pulse value tables (missing months shown
  as gaps); the full BLS Employment Projections tables (every
  committed row, % + numeric change); the **Michigan MCDA
  occupation projections** — all 36 verified rows from the
  workforce study's September edition, grouped statewide
  2024–34 / Detroit Metro 2022–32, never blended, labeled
  "via the Axiovex workforce study, September edition" with
  the direct-source caveat (the pending direct DTMB read
  supersedes the transcription when it lands); the
  **education-to-career figures** (graduation, dropout,
  teacher pipeline, pupil membership — the verified set only,
  estimates labeled as the source labels them; postsecondary
  completions by field absent until verified); and a link
  block to the current monthly workforce article + the study
  edition. Clean-page constraints: no new colors or type
  styles, the condensed Amendment-2 top is untouched, mobile
  390 stacking drawn. Spec 013's detail region is the natural
  home for the pending Michigan/education restorations;
  whether specs 011/012 + Amendment 2 promote first or bundle
  with 013 is the owner's call at approval. Nothing on the
  live site changes until Tristen approves.
  **Closeout 2026-10-06:** approved by Tristen (13:43 EDT);
  implemented on staging (specs/013 tasks T001–T005 — figure
  audit zero mismatches, insights clause audit clean,
  Michigan transcription 36/36); promoted to production in
  merge `4497704` and production-verified live (served page
  byte-identical to the generated build; summary and detail
  figures spot-audited) — specs/013 tasks T006/T007.
- **2026-10-06** — REVISION PROPOSED (spec
  015-page-bottom-spacing) — **APPROVED 2026-10-06 ·
  IMPLEMENTED + LIVE** (staging, then promotion merge
  `4497704`): WF-G2 gains a
  **page-foot rhythm**, the bottom counterpart to spec
  003's page-head rhythm, after Tristen reported "a lot
  of vertical empty space at the bottom of the pages
  too." Measured from the shipped styles.v28.css, every
  page ending is composed of three shared values — last
  section padding-bottom 76px, CTA band padding 76px
  top/bottom, footer padding-top 56px — totalling 284px
  of pure padding around the band on the six band pages
  and a single 132px void on Contact (the same void
  size spec 003 fixed at page heads; the article's own
  24px is already tight, its excess is the shared
  stack). Proposed rhythm: last section **48px**, band
  **56px / 56px**, footer top **40px** (≤820px:
  40 / 44 / 40) — band pages end at 200px of padding,
  Contact at 88px, roughly one third less air, with the
  band's and footer's internal spacing, all mid-page
  spacing, spec 003's head values, and spec 011
  Amendment 2's signals-top values explicitly
  unchanged. WF-G3 and WF-G4 carry the new values as
  captions; WF-01 (band ending) and WF-06 (no-band
  ending) bottoms are redrawn with before → after
  captions; the remaining page frames inherit through
  the global frames. Implementation is gated on
  Tristen's approval (spec 015 tasks.md T001), lands on
  staging as the next versioned stylesheet, and is
  verified by computed measurement on all seven page
  types. Nothing on the live site changes until
  Tristen approves.
  **Closeout 2026-10-06:** approved by Tristen (13:39 EDT);
  implemented on staging as styles.v29.css (specs/015 tasks
  T002–T004 — ending stacks measured exact on all seven page
  types); promoted with spec 013 in merge `4497704`
  (stylesheet chain reaching styles.v30.css) and
  production-verified (served values: final section 48px,
  band 56px, footer top 40px) — specs/015 tasks T005/T006.
- **2026-10-06** — NEW FRAME PROPOSED (spec
  014-michigan-talent-maps) — **PENDING OWNER APPROVAL —
  NOT approved, NOT implemented**: **WF-13 Michigan
  talent map** added, and WF-11 gains an integration
  note, after Tristen asked for "geographic heap maps
  showing insight on education and employment related
  things … where talent is for what industries and what
  schools pipeline to what industries," included in the
  monthly jobs/employment insights report. WF-13 is the
  **geography subsection of WF-11's Detail region**
  (expanded-state order: … education to career →
  **geography** → go deeper; it inherits spec 013's
  region mechanics — DOM-resident, crawlable, no new
  toggle). Contents, all **static build-generated SVG
  from committed data** (no map library, tiles, or
  runtime fetch), each view paired with its full table
  or list: **(a)** county choropleth — employment by
  industry (BLS QCEW per-area API, verified 2026-10-06;
  2024 annual / 2025 Q1): shading = employment level,
  location quotient in the table, **industry selector =
  committed pre-rendered layers over one shared county
  geometry** (small multiples considered and declined —
  layout cost, 390px legibility), default Manufacturing;
  disclosure-suppressed small-county cells drawn
  hatched and labeled **not disclosed**, never zeroed
  (Keweenaw is the verified example). **(b)** county
  choropleth — unemployment (BLS LAUS, all 83 counties,
  monthly fetcher-pattern refresh; drawn values are the
  verified Aug 2026 preliminary: Wayne 6.9%, Oakland
  4.7%, Kent 4.3%); a skipped month stays a hole — Oct
  2025 (federal lapse) is named in the caption, never
  interpolated. **(c)** institution map — 160 Michigan
  institutions at IPEDS-published coordinates (HD2024),
  dots sized by completions (C2024_A; 10,051 Michigan
  rows, 1,060 CIPs) with CIP-family layers; the adjacent
  list is the data of record; unlocated institutions are
  listed, never placed by guess. **(d)** field →
  industry pipelines (Census PSEO R2026Q2, cohorts
  2001–2021) **in adjusted, honest scope**: the only
  per-institution outcomes dataset covers **exactly one
  Michigan institution** — the University of Michigan,
  ~10% of statewide graduates (partners file) — so the
  view is drawn as **statewide CIP → industry ranked
  flows** (drawn real example: Business → Professional/
  technical, 1,983 employed at year 1, 475 in-state)
  plus a **UMich spotlight** carrying the coverage
  label on the panel (drawn figures: bachelor's median
  earnings $53,268 yr 1 / $78,284 yr 5 / $106,836 yr 10;
  73,720 employed yr 1, 30,253 in-state). **A multi-school
  Michigan pipeline map is not buildable from published
  data today; the spec states this plainly rather than
  implying coverage that does not exist**, and the
  spotlight generalizes automatically if more Michigan
  institutions join PSEO. Data pipeline per view is
  spec'd with cadences (LAUS monthly last-good; QCEW
  quarterly committed; IPEDS annual; PSEO per release —
  partner list re-checked), committed files under
  `data/geo/` with vintage labels on every view, and a
  zero-mismatch figure audit + completeness counts at
  staging verification. **Monthly integration**: spec
  007 gains **FR-011** + blog-format **§3B** (recorded
  in the spec 014 package, applied at implementation) —
  each monthly article links the live maps with
  vintages stated and cites 1–2 **computed geographic
  insights** from named computations (highest-LQ county
  for a rising industry; county unemployment spread;
  PSEO in-state retention share), and the cycle
  checklist gains a map-refresh verification step.
  **Out of scope for v1**: MCDA prosperity-region
  projections as a layer (region grain only — no
  county-level projections exist — and projections are
  never blended with measured actuals). The build
  generates true county geometry (us-atlas / TIGER,
  public domain); the frame's outlines are deliberately
  schematic. Sequencing vs spec 013 (whose Detail
  region must exist first) is decided at the approval
  gate (spec 014 tasks.md T001). Nothing on the live
  site changes until Tristen approves.
  **Closeout 2026-10-06:** approved by Tristen at the
  spec 014 T001 gate (including the adjusted PSEO
  design); implemented on staging as styles.v31.css —
  traceability audit ALL PASS (17/17, specs/014
  sources.md), Playwright 30/30 at 1440 / 834 / 390 —
  with the recorded deviations D1–D7 standing as
  implemented: **D1 — the QCEW sector grain is private
  ownership, labeled on the page itself, because QCEW
  publishes no total-ownership county × sector rows**;
  promoted staging → main in merge `44ce7fc` (spec 010
  FR-004 guard proof empty) and production-verified
  live: Wayne manufacturing row 89,659 / LQ 1.50; LAUS
  August 2026 preliminary (Wayne 6.9%); all 160 IPEDS
  institutions listed (159 dots + the zero-completions
  institution's "Listed without a dot" note); PSEO
  spotlight medians $53,268 / $78,284 / $106,836 with
  the coverage label on the panel; not-disclosed states
  present (Keweenaw, Utilities) — specs/014 tasks T009.
  Spec 007's FR-011 + blog-format §3B and the workforce
  runbook's map-refresh step shipped with the
  implementation (spec 014 T007).
- **2026-10-06** — AMENDMENT (spec 013 **Amendment 1** —
  owner-directed 2026-10-06, after Tristen reviewed the
  live page with a screenshot: "fix repeat cards. cannot
  do that."): WF-11's Highlights region loses its four
  Pulse cards. As shipped, the region opened with the
  four Pulse headline stats (manufacturing 586.7k,
  unemployment 5.0%, labor force 4.85M, nonfarm
  4,505.9k, with their computed MoM deltas) — and the
  Michigan Pulse band directly below the region carries
  the same four values and deltas in fuller form, with
  sparklines. Pure duplication, two adjacent regions
  saying the same numbers twice. The region now keeps
  the **generated insights summary, unchanged
  byte-for-byte** (it narrates the Pulse data; it does
  not duplicate a display element), plus exactly **five
  cards**: the Michigan outlook top riser + top faller,
  the U.S. outlook top riser + top faller, and the
  education headline. The Pulse statistics live in the
  band below and are not repeated as cards — the band
  is their single home on the page. Card drop-out
  behavior is preserved (a card whose dataset is absent
  still does not render; the full set is now five).
  Approval basis: owner direction is the approval (the
  spec 011 Amendment 2 basis); the wireframe was
  revised first under the standing wireframes-first
  rule. Spec record: specs/013-signals-highlights-detail
  spec.md Amendment 1 + tasks T008–T012.
  **Closeout 2026-10-06:** implemented on staging
  (tasks T009/T010 — exactly 5 cards in the region, the
  insights summary byte-identical to the pre-fix
  production rendering, drop-out scratch builds 6/6,
  Playwright clean at 1440 / 834 / 390; no CSS change,
  stylesheet stays styles.v30.css) and promoted to
  production the same day (fast-forward + FR-004 guard
  restoration `462136e`; guard proof empty;
  production-verified live: 5 cards, zero Pulse-labelled
  cards in the region, summary and Pulse band intact) —
  **IMPLEMENTED + LIVE**.
- **2026-10-06** — AMENDMENT (spec 011-signals-trends-outlook,
  **Amendment 3**) — **APPROVED 2026-10-06 · IMPLEMENTED +
  LIVE (owner direction 2026-10-06; approved by Tristen
  2026-10-06 ~15:21 EDT; staging `c5b561e`; promotion
  merge `6561851`)**: reviewing the live /signals/ page,
  Tristen directed the ticker moved: "also move the ticker
  on the signals page. it looks bad there. perhaps at the
  very top above the menu? … It's just that where it sits
  now looks funny and too busy." WF-11 revised accordingly:
  the **ticker strip moves to a slim pre-header strip
  above the nav** — the page sequence becomes: the spec 012
  breaking-news banner (when active; it renders **above
  everything**) → ticker tape → site header/nav → page
  head → Highlights → the rest, unchanged. The under-header
  slot stacked three competing horizontal bands (nav, tape,
  page head); a pre-header tape is the standard
  market-data strip pattern on finance/news pages — it
  reads as a data utility strip, not page content, and
  declutters the title area. **Carried decisions,
  unchanged**: the tape stays **static** (not sticky on
  scroll — the owner's 2026-10-06 13:30 EDT decision),
  **Signals page only**, and a decorative aria-hidden echo
  of the board (pause on hover/focus-within, static under
  prefers-reduced-motion). **Stacking rule**: an active
  breaking banner renders **above** the tape (urgency
  precedence); the tape remains below it, above the
  header. **Placement only** — Amendment 2's condensed
  top spacing (A2-2) and the sparkline window % are not
  changed; this supersedes Amendment 2's placement
  paragraph (A2-1) only. Implemented through spec 011
  tasks T011–T015: approval gate passed 2026-10-06,
  staging-verified (Playwright ALL PASS incl. the
  banner → tape → header stacking test; A2-2 spacing
  exact; no stylesheet change), promoted under the spec
  010 FR-004 guard proof and production-verified —
  **IMPLEMENTED + LIVE**.
- **2026-10-06** — NEW PAGE (spec 016-disclaimer-page) —
  **DECIDED 2026-10-06 (owner decision, spec 001 T017):
  a short Disclaimer page is adopted now; a Terms page
  is DEFERRED.** Tristen decided T017 on the basis of
  the options memo prepared the same day: the site's
  genuine exposure is reliance on republished statistics
  and projections, and one canonical disclaimer gives
  the existing point-of-use not-a-forecast language a
  durable home; a Terms page solves problems this site
  does not yet have (no accounts, no sales, no
  user content). **NEW WF-14 Disclaimer**, drawn on the
  WF-05 Privacy pattern exactly — same shell, centered
  page head ("Legal" eyebrow, "Last updated" line),
  strata, left-justified prose column, spec 015
  section-end bottom rhythm, reduced CTA band — with
  seven short sections whose scope the memo's §B fixes:
  general information; data republished from primary
  sources that revise it (source + vintage labels;
  check the source); projections are the publishing
  agencies' modeled outlook — not Axiovex forecasts,
  not advice, not guarantees; nothing on the site is
  professional advice; CMMC content is readiness
  information only — not assessment, certification, or
  a compliance determination; external links are
  references, not endorsements; and the Privacy Policy
  governs personal information — cross-referenced,
  never restated (the memo's standing rule: no new page
  re-broadens what spec 001 T013 narrowed today).
  **WF-G4 revised**: the footer Company column's legal
  link row gains **Disclaimer** beside Privacy Policy
  on every page; the page is footer-reached, like
  Privacy — WF-G1 nav unchanged. No new layout, no
  stylesheet change. Governance: implemented on
  staging only; the final page text returns to Tristen
  for a **pre-promotion copy approval** (spec 016
  T005), and spec 001 T017 closes only when the page is
  live — **IMPLEMENTED ON STAGING · PROMOTION PENDING
  OWNER COPY APPROVAL**.
- **2026-10-06** — CLOSEOUT (spec 016-disclaimer-page):
  the T005 copy gate was satisfied the same day —
  Tristen reviewed the full Disclaimer text exactly as
  built on staging and directed "Publish the Disclaimer
  page," electing to publish on his own review (the
  T017 memo's counsel-review recommendation was
  presented with the copy and stands on the record in
  spec 016). Promoted staging → main (merge `9d7dbba`;
  FR-004 guard proof clean — production `robots.txt`
  and `_headers` untouched by the promotion; staging
  guards re-applied in sync-back `aba9f58`). WF-14 and
  the WF-G4 legal-link revision are **APPROVED ·
  IMPLEMENTED + LIVE**: /disclaimer/ serves the
  approved copy on production, the footer Disclaimer
  link is on every page, and the sitemap lists 9 URLs.
  Spec 001 T017 is CLOSED (Disclaimer live; Terms
  deferred on the record).
