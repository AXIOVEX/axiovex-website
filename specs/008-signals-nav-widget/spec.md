# Feature Specification: Signals in Nav, Home Highlight + Floating Widget

**Feature Branch**: `008-signals-nav-widget` (documentation only
until the approval gate passes — implementation lands on `main`
through the normal build)

**Created**: 2026-10-06

**Status**: **Proposed 2026-10-06 — PENDING OWNER APPROVAL.**
Wireframes were revised first, per constitution §III: WF-G1 (nav),
WF-01 (home Signals block), and the new WF-G6 / WF-12 (floating
widget) are drawn in `docs/wireframes/` and marked pending. **No
implementation task starts until Tristen approves the wireframes**
(tasks.md T001 is the blocking gate). Nothing on the live site has
changed for this spec.

**Direction (Tristen, 2026-10-06)**: make Axiovex Signals part of
the navigation (it currently lives only in the footer and a
home-page block); highlight Signals on the main page; and add a
collapsible floating widget carrying Signals highlights, so every
page has applicable live data to showcase, with links to relevant
things.

## What this adds

Three connected changes that make Signals a first-class surface of
the site instead of a page visitors have to already know about:

1. **Nav** — a **Signals** link in the primary navigation (desktop
   links + hamburger panel), between Blog and Documents.
2. **Home highlight** — the existing home Signals block gains a
   LIVE eyebrow and a Michigan Pulse mini-strip, so the block reads
   as a live surface, not a static section.
3. **Floating widget (WF-G6)** — a collapsible bottom-right widget
   on every page except `/signals/` itself: a quiet pill when
   collapsed; when expanded, the Michigan Pulse row plus the three
   most relevant fresh headlines, each linking out to its
   publisher, and the path to the full Signals page.

## Design reference (wireframes, this proposal)

- **WF-G1** (revised): Signals after Blog in both menus; all other
  links and order unchanged.
- **WF-01** (revised): Signals block keeps its position (between
  Evidence and About) and its lane preview cards; eyebrow becomes
  "AXIOVEX SIGNALS — LIVE" with a live-dot; a Pulse mini-strip sits
  directly under "What we're watching."; SEE ALL SIGNALS path
  unchanged; hero untouched.
- **WF-G6 / WF-12** (new): the widget component and its states —
  collapsed pill, expanded panel (~340px), mobile treatment, and
  the behavior notes summarized in FR-003 / FR-004 below.

## Functional requirements

- **FR-001 — Signals in the navigation.** Every page's primary
  navigation gains exactly one link: label **"Signals"**, target
  **`/signals/`**, placed **immediately after Blog and before
  Documents**, in **both** the desktop link row (`.nav-links`) and
  the mobile menu (`.mobile-menu`). No other link, label, or order
  changes. On `/signals/` the link carries the site's existing
  current-page treatment (`aria-current="page"`, as Blog and
  Documents already do in their templates).
- **FR-002 — Home Signals highlight.** The home Signals block
  (generated between the `SIGNALS:START/END` markers) is revised:
  1. Eyebrow reads **"AXIOVEX SIGNALS — LIVE"** preceded by a
     live-dot indicator.
  2. A **Michigan Pulse mini-strip** sits **directly under** the
     "What we're watching." heading: the three headline stats —
     MI manufacturing employment, MI unemployment, MI labor force —
     each as value + label, with the snapshot's reference period
     shown on the strip.
  3. Block position, lane preview cards, and the SEE ALL SIGNALS
     path are unchanged; the hero and all other home sections are
     unchanged. The full Pulse band stays on `/signals/` only.
- **FR-003 — Floating widget: presence and content.** A floating
  widget (WF-G6) renders on **every page except `/signals/`**:
  - **Collapsed (the default)**: a bottom-right pill — live dot +
    "Signals" + chevron. It never auto-opens and never animates in
    over content.
  - **Expanded**: a panel ~340px wide containing, in order: a
    header ("Axiovex Signals" + a collapse control); a **Michigan
    Pulse row** (the same three stats as FR-002, with reference
    period and BLS attribution); **three headlines** (lane label,
    headline, source + date, each linking to the publisher in a
    new tab with `rel="noopener"`, matching the site's existing
    signal links); a footer link **"All signals →"** to
    `/signals/`; and the snapshot's updated timestamp.
- **FR-004 — Widget behavior + accessibility.**
  - Starts **collapsed** on a first visit.
  - The toggle is a real **`<button>`** with `aria-expanded` and
    `aria-controls`; **ESC** collapses the panel and returns focus
    to the button; focus states are visible; motion honours
    `prefers-reduced-motion`.
  - Expanded/collapsed state is remembered for the **session only**
    (session storage). No cookie is set and nothing persists after
    the visit — consistent with the privacy policy's posture.
  - **Mobile (≤660px)**: the pill rests above the bottom
    safe-area inset; the expanded panel is capped at ~70% of
    viewport height with its own internal scroll; the panel never
    exceeds the screen width minus margins.
  - The widget stacks **below** the sticky nav and the open mobile
    menu, and must never cover the Contact CTA or the hamburger
    toggle at any breakpoint.
  - If the widget's data fails to load, it **renders nothing** —
    no empty shell, no error UI. Every page is complete without it.
- **FR-005 — Widget data: build-generated, first-party only.**
  The widget is fed by a **first-party JSON emitted by
  `scripts/build-site.mjs`** from the same `data/signals.json`
  snapshot the build already consumes (working name
  `/signals-widget.json`). It carries: the snapshot `updatedUtc`;
  the Pulse subset (reference month + the three stats' labels and
  display values, taken from the snapshot's `pulse.tiles`); and
  the lanes with their items (lane id + title; item source, title,
  link, date). The widget script fetches **only that same-origin
  file** — the spec 004 architecture stands: **no live third-party
  fetching, no new data sources, no runtime dependency on any
  publisher**. Refresh rides the existing hourly `signals-sync`
  build, exactly like the home block and `/signals/` today. If the
  snapshot is absent at build time, no JSON is emitted and the
  widget stays absent (FR-004's failure rule).
- **FR-006 — Page relevance of widget headlines.** Default order:
  the **three freshest headlines across all lanes** (by item date,
  newest first). On **blog article pages**, headlines from the lane
  matching the article's existing front-matter tags surface first
  — workforce / Michigan tags → the `michigan` lane; AI tags → the
  `ai-standards` lane — and remaining slots fill by freshness.
  Matching uses tags the articles already carry; no new tagging
  scheme is introduced. The Pulse row is shown on every page
  regardless of ordering.
- **FR-007 — Data integrity (no invented content).** Every number
  and headline the widget and the mini-strip display comes
  **verbatim from the verified build snapshot**: Pulse values are
  the BLS series as ingested by `scripts/fetch-signals.mjs`, shown
  with their reference period — never presented as real-time;
  headlines are headline/source/date with the outbound link, per
  spec 004 (no copied article text, no summaries, no commentary
  added). If a value is missing from the snapshot, the element
  omits it — nothing is estimated, interpolated, or hand-entered
  (constitution §I). The word "LIVE" refers to the automatically
  refreshed snapshot, and the snapshot's updated timestamp is
  displayed with the content (FR-003) so the freshness claim is
  checkable.
- **FR-008 — Generated-site integrity + cache-busting.** All
  changes land in sources, never in generated output (constitution
  §IV): the header markup in the templates and static pages, the
  Signals section string in `scripts/build-site.mjs`, and new
  widget assets. The widget ships as a **new versioned asset pair**
  (working names `signals-widget.v1.css` / `signals-widget.v1.js`);
  any change to shared styles bumps the site stylesheet version
  (`styles.v24.css` → `styles.v25.css`) and every reference to it.
- **FR-009 — Gate + verification.** No implementation before
  Tristen approves the revised wireframes (tasks.md T001). After
  implementation, verification is live, per constitution §V:
  the Signals link present in both menus on every page; the
  mini-strip values byte-equal to `data/signals.json`; the widget
  present on representative pages and **absent on `/signals/`**;
  expand / collapse / ESC / session-persistence exercised at
  desktop and mobile widths; SEO/AEO baseline re-checked (AEO
  100/100, Seobility 90) with any delta reported, not silently
  absorbed.

## Out of scope

- Any change to the `/signals/` page itself (WF-11) beyond its nav
  mock gaining the current-page link (FR-001).
- New lanes, new data sources, or changes to `fetch-signals.mjs`
  source configuration (spec 004 territory).
- A scrolling ticker, auto-opening panel, push-style badges, or
  any visitor tracking / personalization — all excluded by the
  spec 004 architecture and the privacy posture.
- Cross-session persistence of the widget state (FR-004 is
  session-only by design).
