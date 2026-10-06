# Feature Specification: Trends & Outlook on the Signals Page

**Feature Branch**: `011-signals-trends-outlook` (documentation only
until the approval gate passes — implementation lands through the
staging flow in spec 010)

**Created**: 2026-10-06

**Status**: **Proposed — PENDING OWNER APPROVAL.** The wireframes
(WF-11 revised with the Trends & outlook section) are drawn and
marked pending; nothing is implemented. Implementation starts
only when Tristen approves (tasks.md T001).

**Direction (Tristen, 2026-10-06)**: "also update the signals page
to include education analytics and workforce predictions - whats
on the rise, falling, etc. and everything should look like a stock
ticker kind of to show where things are currently trending and
came from. again, we want to show we understand not just the
current numbers, but predicted future."

## What exists today

`/signals/` (spec 004, live) carries the Michigan Pulse band — four
BLS series (manufacturing employment, unemployment rate, labor
force, total nonfarm employment) as tiles with a latest value, a
month-over-month delta where the fetcher computed one, and a
12-month sparkline — above five headline lanes and a sources &
method note. The Pulse snapshot (`data/signals.json`) already
carries everything a trend board needs: each tile holds a
12-point monthly trend array (`{ym, v}`, Sep 2025 → Aug 2026),
with missing months present as `null` (unemployment and labor
force both miss Oct 2025). Two of the four tiles carry no
precomputed delta at all (labor force, nonfarm) — deltas beyond
the fetcher's are the generator's to compute.

The page's restraint is deliberate and load-bearing (spec 004):
build-time ingestion only, headline/source/date only, no
auto-generated commentary, and a scrolling ticker was rejected
when the page was designed — as the *carrier* of content.

## What this adds

One new section on `/signals/`, **Trends & outlook**, between the
Pulse band and the lanes, in the market-board visual language the
owner asked for:

1. A **ticker strip** — the tape look, as a decorative echo of
   the board beneath it (accessibility mechanics in FR-001 are
   what make it acceptable under spec 004's rule).
2. A **trend board** — the four Pulse series as ticker-style
   rows: where each series is, how it moved this month, how it
   moved across the window, and the sparkline showing where it
   came from.
3. An **outlook board** — "On the rise" / "Falling" rows of
   **published agency projections** (U.S. BLS Employment
   Projections; Michigan DTMB long-term industry projections as
   its own labeled group). This is the "predicted future" the
   owner asked to show — published by the agencies whose job it
   is, attributed on the page, never generated here.
4. An **education analytics block** — Michigan education
   indicators (graduation rate, enrollment, postsecondary
   completions) in the same trend-row presentation, from a
   committed, vintaged dataset.

The Pulse band, the five lanes, the home page, and the floating
widget are unchanged.

## Design reference (wireframes, this proposal)

- **WF-11** (revised): the frame gains the Trends & outlook
  section between the Pulse band and the lanes — section head,
  ticker strip with its accessibility caption, trend board with
  the four real series rows drawn from the current snapshot,
  outlook board (national rise/fall groups + Michigan group,
  rows drawn as deliberate format placeholders), education
  analytics block, and a note that the sources & method note
  gains attribution sentences. Labeled "spec 011 — PENDING
  OWNER APPROVAL".
- No other frame changes. WF-01 and WF-12 draw the home block
  and the widget, which this spec does not touch.

## Functional requirements

- **FR-001 — Ticker strip (decorative echo).** At the top of
  the Trends & outlook section, a slowly scrolling tape in
  market style cycles the four Pulse series (short label,
  latest value, month-over-month delta with ▲/▼ glyph), e.g.
  "MI MFG EMPLOYMENT 586.7K ▲ +1.1K MO-MO · MI UNEMPLOYMENT
  5.0% ▲ +0.1 PTS · …". The tape **duplicates trend-board
  content only** — nothing appears on it that is not in the
  static board directly below. It is `aria-hidden`; its
  animation pauses on hover and on focus-within; under
  `prefers-reduced-motion` it does not animate (the sequence
  renders as a static row). Direction is carried by glyph +
  signed figure in the Pulse band's neutral treatment — no
  red/green coding. (Why this does not violate spec 004: that
  decision rejected a ticker as the *carrier* of headline
  content — motion as the only path to the information, no
  static equivalent, no pause. This strip is a styled echo
  with a full static equivalent beneath it; removing it loses
  nothing.)
- **FR-002 — Trend board (computed deltas).** A static,
  tabular board with one row per Pulse series: series name,
  latest value (verbatim from the snapshot, with the BLS
  reference month in the column head), month-over-month delta,
  trailing-window delta, and a mini sparkline — the "where it
  came from" for each row. Both deltas are **computed by the
  generator from the series' own trend history** (MoM = last
  two non-null points; window = first vs last non-null point
  across the snapshot's trend window, drawn from 12 monthly
  points, Sep 2025 → Aug 2026 in the current snapshot) and the
  board is labeled **"Computed from BLS series."** Sparklines
  reuse the snapshot trend arrays; a missing month **breaks
  the line** (the existing `sparkline()` already segments at
  nulls) — never interpolated, never smoothed over. On narrow
  screens each row stacks (label + latest, then deltas +
  sparkline beneath).
- **FR-003 — Outlook board (attributed projections).** Two
  groups under one board head:
  - **National**: "On the rise" and "Falling" occupation rows
    from the **U.S. BLS Employment Projections**, latest
    published vintage (10-year horizon; the current vintage —
    expected 2024–34 — is confirmed in the source-verification
    task before build). Each row: occupation, projected %
    change, and projected numeric change where the table
    provides it. Five rows per group, sorted by projected %
    change (fastest first). The board head carries the
    attribution and horizon: "BLS projection 2024–34" in the
    verified vintage's terms.
  - **Michigan**: industry rows from the **Michigan long-term
    industry projections** (Michigan DTMB / labor market
    information), drawn as **its own labeled group** with its
    own horizon as published — never merged into the national
    ranking, never re-based to the national horizon.
  Every row is attributed to its publishing agency. A standing
  caption on the board states: **projections are the
  publishing agency's modeled outlook, not Axiovex forecasts
  and not guarantees.**
- **FR-004 — Education analytics (committed dataset).**
  Michigan education indicators in the same trend-row
  presentation: four-year graduation rate (trend across recent
  classes), public school enrollment (trend across recent fall
  counts), and postsecondary completions by field group (fields
  rising / falling). Data lives in a **committed, vintaged
  dataset in the repo** (`data/outlook.json`, shared with
  FR-003's projections), sourced per indicator from Michigan
  CEPI / MISchoolData or IPEDS — the exact source per indicator
  is fixed by the source-verification task, not assumed here.
  The dataset is refreshed **manually, on each source's own
  release cycle** (annual for these series), by the documented
  procedure in plan.md — **never by the hourly signals
  fetch**. Every row carries its source and its vintage on the
  page; an aging vintage stays visible as its label.
- **FR-005 — Data integrity (non-negotiable).** (a) **No
  invented or model-generated predictions anywhere** — no
  figure on the page originates with Axiovex, an LLM, or an
  agent. (b) Every forward-looking figure is a **published
  projection attributed to its agency, with horizon +
  vintage**. (c) Trend arrows and deltas are **deterministic
  arithmetic on ingested data**, labeled computed (FR-002).
  (d) Missing months stay **gaps — never interpolated**
  (extends spec 004 FR-006). (e) **Last-good resilience**
  extends to the new boards (spec 004 FR-005): if the
  projections/education dataset is missing or a section is
  empty, that board renders absent — never fabricated, never
  zero-filled. (f) The page's existing restraint language —
  "signals, not forecasts," "inclusion is not endorsement,"
  no auto-generated commentary (spec 004 FR-008) — is
  **preserved verbatim in spirit and placement**, and the
  projections framing follows it: the page presents agencies'
  outlooks; it does not issue its own.
- **FR-006 — Generator + data changes.** `scripts/build-site.mjs`
  gains renderers for the four elements: the ticker and trend
  board compute from the **existing** `data/signals.json`
  snapshot (no new fetch path, no change to
  `scripts/fetch-signals.mjs` or the hourly cadence); the
  outlook board and education block render from the committed
  `data/outlook.json`, whose per-section metadata (agency,
  horizon, vintage, source URL, retrieval date) is part of the
  file and rendered on the page. Deterministic, byte-stable
  output like the rest of the build; a dataset section that is
  absent produces no board (FR-005e), never a build failure.
- **FR-007 — Page composition + sources note.** The section is
  emitted into `scripts/templates/signals.html` between
  `{{PULSE_HTML}}` and `{{LANES_HTML}}` via new placeholders.
  The existing sources & method note gains attribution
  sentences covering the projections and the education dataset
  (draft copy in plan.md; final copy reviewed at implementation
  against the claims rules). The page `<meta name="description">`
  may be extended to mention trends/projections only within the
  established length discipline (~198 characters) and with no
  new claims. Sitemap and `llms.txt` are unchanged (same URL).
  The SEO/AEO baseline (AEO 100 / Seobility 90) must hold after
  launch (spec 004 FR-009 pattern).
- **FR-008 — Gate, staging-first flow, verification.** No
  implementation before Tristen approves the revised
  wireframes (tasks.md T001). Implementation is built and
  verified on the **staging branch** at
  staging.axiovexsystems.com, then promoted by merging
  `staging` → `main` under spec 010's rules (a promotion diff
  containing staging-only `robots.txt`/`_headers` stops the
  promotion). New component styles ship as a **versioned
  stylesheet bump** (`styles.v26.css`, all references repointed)
  per the standing cache rule. Verification (constitution §V):
  served page contains all four elements; every value on the
  trend board byte-matches the snapshot or the labeled
  computation from it; every outlook/education figure
  byte-matches `data/outlook.json`, which byte-matches the
  verified source tables; ticker/board equivalence checked;
  keyboard + reduced-motion pass; no horizontal overflow at
  1440 / 834 / 390px.

## Claims discipline

This spec adds forward-looking content to a public page, so the
claims bar is the point of the design (constitution §I): the
page may *display* the future only as **published agency
projections with attribution, horizon, and vintage** (FR-003,
FR-005). It asserts no Axiovex forecast, no prediction of its
own, and no capability claim. The owner's framing — "we
understand the predicted future" — is carried by curation and
presentation of the agencies' published outlooks, never by
inventing numbers. Any copy that would blur that line (e.g.
"we predict", "our outlook") is out of bounds for
implementation; the standing caption in FR-003 is the approved
framing.

## Out of scope

- The home page Signals block (WF-01), the floating widget
  (WF-12 / WF-G6), and `/signals-widget.json` — unchanged.
- The five lanes, their sources, and the ingest pipeline —
  unchanged.
- Any Axiovex-authored forecast, model, or commentary on the
  projections (a human-reviewed digest remains future work,
  per spec 004 FR-008).
- Real-time or intraday data of any kind; the Pulse cadence
  (monthly BLS data, hourly ingest check) is unchanged.
