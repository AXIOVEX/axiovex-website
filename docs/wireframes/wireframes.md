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
- WF-07 Home — tablet (834px) · WF-08 Contact — tablet
- WF-09 Blog / article / privacy — tablet
- Global components: WF-G1 nav (Signals link added by spec 008 —
  approved + implemented 2026-10-06; Home as the home page's first
  nav item added by spec 009 — approved + implemented 2026-10-06) · WF-G2 strata bar · WF-G3 CTA
  band · WF-G4 footer · WF-G5 service card · WF-G6 Signals floating
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
  **PENDING OWNER APPROVAL — NOT approved, NOT implemented**: WF-11
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
- **2026-10-06** — REVISION PROPOSED (spec 012-breaking-news-banner) —
  **PENDING OWNER APPROVAL — NOT approved, NOT implemented**: NEW
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
- **2026-10-06** — REVISION PROPOSED (spec
  013-signals-highlights-detail) — **PENDING OWNER APPROVAL —
  NOT approved, NOT implemented**: WF-11 gains two regions.
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
