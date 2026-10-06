# Feature Specification: Trends & Outlook on the Signals Page

**Feature Branch**: `011-signals-trends-outlook` (documentation only
until the approval gate passes — implementation lands through the
staging flow in spec 010)

**Created**: 2026-10-06

**Status**: **Implemented and live 2026-10-06.** Approved
2026-10-06 (T001); implemented on staging (T002–T006;
Amendment 2 as T009–T010; the Michigan + education sections
restored after browser verification — see the Restoration
section); promoted to production in merge `89c65c1` under
spec 010's FR-004 rule and production-verified the same day
(T007/T008): /signals/ serves styles.v28.css with the ticker
at the page top, the condensed page top, sparkline window-%
annotations, the BLS 2025–35 outlook board, the MCDA
Michigan industry group, and the CEPI education block —
figure audit against `data/signals.json` +
`data/outlook.json` clean.

**Direction (Tristen, 2026-10-06)**: "also update the signals page
to include education analytics and workforce predictions - whats
on the rise, falling, etc. and everything should look like a stock
ticker kind of to show where things are currently trending and
came from. again, we want to show we understand not just the
current numbers, but predicted future."

## Amendment — T002 source-verification outcome (2026-10-06)

Recorded in full in `sources.md`. Summary:

- **BLS Employment Projections verified** — and the latest
  vintage is **2025–35** (released August 27, 2026), not the
  2024–34 the proposal expected. Plan.md's "newer vintage
  wins" rule applies; FR-003's board head and rows carry
  2025–35.
- **FR-003 ships with the national group only.** The Michigan
  DTMB industry-projections table could not be read on the
  source through the available channels (publication and
  2024–34 horizon verified; the table itself not readable —
  see sources.md §2), so the Michigan group is **dropped for
  this implementation**, per plan.md Step 0. No secondary
  figures were substituted. The renderer supports the group
  the moment a verified `michiganProjections` section is
  added to `data/outlook.json`.
- **FR-004's education block is dropped for this
  implementation.** None of the three indicators could be
  verified on its source at dataset precision through the
  available channels (sources.md §3). The renderer supports
  the block the moment a verified `education` section is
  added to `data/outlook.json`.
- Consequential narrowing: the section framing line drops its
  education clause, and the FR-007 sources-note sentences
  cover only what ships (BLS projections + computed trend
  deltas). Narrower than the approved drafts, never broader.

## Restoration — browser verification (2026-10-06)

The two drops above were reversed the same day, when a
live-browser pass read both sources on their official pages
(full record in `sources.md` §§2–3):

- **FR-003's Michigan group is RESTORED.** MCDA Long-Term
  Industry Employment Projections, horizon **2024–2034** as
  published (statewide file read in full on michigan.gov;
  no release date is displayed on the page or file). Top
  five industries per side by percent change are in
  `data/outlook.json` (`michiganProjections`) and render as
  their own labeled group inside the outlook board — never
  blended with the national BLS ranking.
- **FR-004's education block is RESTORED with two of its
  three indicators.** MI School Data (CEPI), read on
  mischooldata.org: four-year graduation rate, class of
  2025 **84.01%** (class of 2024: 82.83%); student
  enrollment **1,419,859** for school year 2025-26
  (2024-25: 1,427,386) — unduplicated pupil **headcounts,
  not FTE**, labeled by school year in the dataset and on
  the page, never as fall counts. The third indicator,
  IPEDS postsecondary completions by field, **remains
  dropped**: still unverified on its source, and no figure
  was substituted.
- The consequential narrowing above is reversed: the
  section framing line again carries its education clause
  (WF-11 as approved), and the FR-007 sources-note sentences
  again cover the Michigan projections and the education
  figures (CEPI only — IPEDS is not shown and is not
  named).
- One minimal renderer change: education percent values
  render at the precision the source publishes (two
  decimals) — the one-decimal format could not carry
  CEPI's 84.01%. Recorded in `sources.md` item 7.

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

## Amendment 2 — owner direction 2026-10-06

Recorded 2026-10-06, after spec 011 was implemented on staging
(see the staging-branch status line and the Amendment — T002
outcome). Tristen, reviewing the staging page, directed
(13:03–13:04 EDT, verbatim):

> "can we put the ticker at the top of the page? Also the very
> top has a lot of wasted space especially vertically. condense
> this, dont have so much wasted space."
>
> "also make sure that the graphs have the up/down percentage
> thing that the ticker strip has too."

**Approval basis.** This is an owner-directed change: Tristen's
direction IS the approval for this amendment — there is no
separate gate. The constitution's wireframes-first rule is
satisfied by this package (WF-11 revised in
`docs/wireframes/wireframes.html` + the `wireframes.md`
revision log, committed before any implementation).
Implementation is gated only on sequencing: it runs on the
staging branch **after spec 012's in-flight build completes**,
because the two share the generator and the versioned
stylesheet chain — this amendment ships in the stylesheet
version after spec 012's, through the same staging →
verification → promotion flow (tasks T009–T010).

### A2-1 — Ticker relocates to the top of the page

FR-001's placement is superseded: the ticker strip renders
**directly under the site header, above the page head** — it is
no longer inside the Trends & outlook section (template:
`{{TICKER_HTML}}` moves ahead of the page-head section). The
section keeps its head, the trend board, and the outlook
board. Everything else in FR-001 stands: the tape remains a
decorative echo of the trend board (aria-hidden, pause on
hover/focus-within, static under prefers-reduced-motion, board
content only, neutral glyph + signed figure). The spec 012
breaking-news banner occupies the slot *above* the header when
active; the ticker's slot is *below* the header — no conflict,
no shared state.

### A2-2 — Condensed page top (/signals/ only)

The vertical spacing of the /signals/ top region is tightened
by roughly a third. Values measured from the shipped
`styles.v26.css` (staging) and `scripts/templates/signals.html`:

| Element | Source | Before | After |
|---|---|---:|---:|
| Page-head section top padding | `.section { padding: 76px 0 }` | 76px (60px at ≤820px) | **44px** (36px at ≤820px) |
| Head text → strata | `.section:has(+ .strata) .section-head { margin-bottom }` | 36px | **24px** |
| Strata → content (Pulse) section | template inline `padding-top` | 40px | **28px** |
| Pulse kicker → tiles | `.pulse-kicker { margin-bottom }` | 14px | **10px** |
| Pulse tile padding | `.pulse-tile { padding }` | 18px | **14px** |
| Ticker offset | `.tape { margin-top }` (inside section) | 26px | **16px** at page top |
| Trends & outlook head margin | `.trends-head { margin: 58px auto 0 }` | 58px | **40px** |

The six spacing values total **250px → 162px (−88px, ≈ one
third)**; the tile-padding cut also reduces the Pulse band's
height by 8px. **Scope: the /signals/ page top only.** The
WF-G2 36/40 rhythm (spec 003) on every other page is untouched
— this amendment records a deliberate signals-only exception
to it. No content is removed and no interactive element sits
in the condensed region, so tap targets are unaffected; at
390px the tightened stack must still read as separate blocks,
never crowded (verified in T010).

### A2-3 — Sparkline window-% annotations

FR-002 is extended: each trend-board sparkline gains, beside
the graph, its direction glyph + the **window percent change**
(▲ +0.4% style), computed by the generator from the same trend
history as the deltas — window % = (last non-null − first
non-null) ÷ first non-null across the snapshot's trend window,
one decimal. For the unemployment-rate series the % is the
**relative change of the rate** (4.9% → 5.0% = +2.0%); the
rate's absolute movement remains in the pts figures in the
delta columns — the two forms coexist, neither replaces the
other. Neutral treatment (glyph + signed figure, no red/green),
consistent with FR-001's tape. Drawn values, recomputed from
the current `data/signals.json` snapshot: manufacturing
**▲ +0.4%**, unemployment **▲ +2.0%**, labor force
**▼ −3.0%**, nonfarm **▲ +0.0%**. Like the deltas, the % is
computed, never hand-typed (FR-005c); a series with fewer than
two non-null points renders "—", matching the delta behavior.

The sources & method note is unchanged by this amendment.

**Ticker placement decision (owner, 2026-10-06 13:30 EDT):**
the ticker stays static at the top of /signals/ and
Signals-only — sticky-on-scroll and site-wide placements
were considered and declined; the floating widget remains
the site-wide carrier.

**Status (staging):** implemented on the staging branch
2026-10-06 (commit `cb00d9c`; tasks T009–T010, verification
record in tasks.md). The tape renders directly under the
header; the condensed spacing measures exactly per the A2-2
table; the four sparkline window % values render as drawn
(▲ +0.4% / ▲ +2.0% / ▼ −3.0% / ▲ +0.0%), each recomputed from
the snapshot with zero mismatches. Ships in `styles.v28.css`.
Promotion to production follows the spec 010 flow together
with spec 011's main body and spec 012.
