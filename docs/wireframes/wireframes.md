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
- WF-12 Signals widget (added 2026-10-06, spec 008 — approved +
  implemented 2026-10-06)
- WF-07 Home — tablet (834px) · WF-08 Contact — tablet
- WF-09 Blog / article / privacy — tablet
- Global components: WF-G1 nav (Signals link added by spec 008 —
  approved + implemented 2026-10-06; Home as the home page's first
  nav item proposed by spec 009 — PENDING OWNER APPROVAL) · WF-G2 strata bar · WF-G3 CTA
  band · WF-G4 footer · WF-G5 service card · WF-G6 Signals floating
  widget (spec 008 — approved + implemented 2026-10-06)

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
- **2026-10-06** — REVISION PROPOSED (spec 009-home-nav-link) —
  **PENDING OWNER APPROVAL — NOT approved, NOT implemented**: WF-G1
  gains an explicit home-page variant (a): the home page's nav adds
  **Home** (`href="/"`, `aria-current="page"`) as the first item of
  both the desktop row and the hamburger panel, shown current —
  every subpage already starts with Home; the home page is the only
  page without it (only the logo links to `/` there). WF-01's drawn
  home nav updated to match. Variant (b), the subpage nav, is
  unchanged, as are all other links, the mobile header (logo +
  hamburger), and the stylesheet. From the home page, clicking Home
  is a plain navigation to `/` — reload at the top; no fragment, no
  JavaScript. Nothing on the live site changes until Tristen
  approves.
