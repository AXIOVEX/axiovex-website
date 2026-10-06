# Plan: Trends & Outlook on the Signals Page (spec 011)

**Status: executing.** T001 gate passed 2026-10-06 (Tristen
approved the revised WF-11). T002 source verification is
complete — outcome recorded in `sources.md` and in the
Amendment section of spec.md: BLS Employment Projections
verified at the **2025–35** vintage; the Michigan industry
group and the education block are dropped for this
implementation (their tables could not be read on the source;
the renderers support both sections the moment verified data
is added to `data/outlook.json`).

## Step 0 — SOURCE VERIFICATION (tasks.md T002, blocking for T003+)

No build task starts until the exact publications are confirmed
and recorded in `specs/011-signals-trends-outlook/sources.md`
(created by T002). For each source, record: publication name,
publisher, exact URL, file format, vintage/horizon, the fields
used, and the retrieval date. The three verifications:

1. **U.S. BLS Employment Projections** (`bls.gov/emp/`).
   Confirm the latest published vintage (expected: the 2024–34
   projections, released August 2025) and the exact tables the
   board draws from: the fastest-growing and fastest-declining
   occupation tables (the "Occupations with the fastest growth /
   fastest decline" tables and their XLSX downloads). Fields:
   occupation title, projected percent change over the horizon,
   projected numeric employment change, base-year and
   projected-year employment. If BLS has published a newer
   vintage by implementation time, the newer one wins and
   sources.md says so.
2. **Michigan long-term industry projections** (Michigan DTMB,
   Labor Market Information — `milmi.org` / Michigan workforce
   data portal). Confirm the current long-term industry
   projections publication: its exact file, its horizon **as
   published** (state vintages lag the national one — the board
   labels Michigan's own horizon and never re-bases it), and
   its fields (industry title, projected percent change,
   numeric change if published).
3. **Education indicators.** Per indicator, confirm the exact
   export and its release cadence:
   - Four-year graduation rate — Michigan CEPI via MISchoolData
     (statewide rate, recent classes).
   - Public school enrollment — Michigan CEPI fall pupil
     membership / enrollment counts (statewide, recent falls).
   - Postsecondary completions by field — IPEDS completions for
     Michigan institutions, aggregated by field (CIP) group;
     identify the top rising and falling field groups by
     completions change across the vintages used.
   Each indicator's dataset entry names its source, its export,
   and its vintage (e.g. "class of 2025", "fall 2025 count").

If a source turns out not to exist in a usable published form,
that board/indicator is **dropped from the implementation and
the spec is amended** — it is never replaced with an estimate.

## Data file: `data/outlook.json` (new, committed)

One committed file holds FR-003 + FR-004 content. It is written
by a human/agent following the refresh procedure below, from
the verified sources — **never by `scripts/fetch-signals.mjs`**
and never by the hourly workflow. Shape (field names final at
implementation; the metadata requirements are fixed):

```jsonc
{
  "blsProjections": {
    "agency": "U.S. Bureau of Labor Statistics",
    "publication": "Employment Projections",
    "vintage": "2024–34",            // as verified in sources.md
    "horizon": "2024–34",
    "sourceUrl": "…", "retrievedOn": "YYYY-MM-DD",
    "rise": [ { "name": "…", "pctChange": 0.0, "jobsChange": 0 } ],
    "fall": [ { "name": "…", "pctChange": 0.0, "jobsChange": 0 } ]
  },
  "michiganProjections": {
    "agency": "Michigan DTMB — Labor Market Information",
    "publication": "Long-term industry projections",
    "vintage": "…", "horizon": "…",   // Michigan's own, as published
    "sourceUrl": "…", "retrievedOn": "YYYY-MM-DD",
    "rise": [ { "name": "…", "pctChange": 0.0 } ],
    "fall": [ { "name": "…", "pctChange": 0.0 } ]
  },
  "education": {
    "indicators": [
      { "id": "grad-rate", "label": "Four-year graduation rate",
        "source": "Michigan CEPI (MISchoolData)", "sourceUrl": "…",
        "vintage": "Class of 20XX",
        "history": [ { "period": "20XX", "v": 0.0 } ] },
      { "id": "enrollment", "label": "Public school enrollment",
        "source": "Michigan CEPI", "sourceUrl": "…",
        "vintage": "Fall 20XX count",
        "history": [ { "period": "20XX", "v": 0 } ] },
      { "id": "completions", "label": "Postsecondary completions, by field",
        "source": "IPEDS", "sourceUrl": "…", "vintage": "20XX",
        "rise": [ { "name": "Field group", "pctChange": 0.0 } ],
        "fall": [ { "name": "Field group", "pctChange": 0.0 } ] }
    ]
  }
}
```

Rules: figures are transcribed **verbatim** from the verified
tables (double-checked by a second read before commit — the
dataset commit message names the source files used); rise/fall
arrays are capped at 5 entries (national) / 5 (Michigan) /
the completions indicator's field groups at 3 per side;
education `history` carries enough points to compute the drawn
delta honestly (latest vs prior period), and the generator —
not the dataset — computes displayed deltas, exactly as for
Pulse (FR-002 pattern).

**Refresh procedure** (documented here; repeated in the commit
that updates the file): when a source publishes a new vintage —
BLS EP roughly annually, Michigan projections on DTMB's cycle,
CEPI/IPEDS annually — (1) re-run the T002 verification for that
source and update sources.md, (2) transcribe the new figures
into `data/outlook.json`, updating vintage/horizon/retrievedOn,
(3) commit on the staging branch, verify at staging, promote
per spec 010. There is no automation and no alarm: the vintage
labels on the page are the freshness signal (FR-004).

## Generator changes (`scripts/build-site.mjs`)

All inside the existing Signals build (`buildSignals()`); no
change to `scripts/fetch-signals.mjs`, `data/signal-sources.json`,
or either workflow.

- `trendDeltas(trend)` — from a tile's trend array: MoM = last
  two non-null points; window = first vs last non-null point;
  returns signed values + direction, formatted in the tile's own
  units (k / pts / raw count → the board reuses each tile's
  display conventions; labor force shows the same "4.85M" style
  latest with deltas in k). If fewer than two non-null points
  exist, the delta cell renders "—" (never a fabricated 0).
- `tickerHtml(pulse)` — the tape sequence built from the four
  tiles (label shortened to the tape forms drawn in WF-11:
  MI MFG EMPLOYMENT / MI UNEMPLOYMENT / MI LABOR FORCE /
  MI NONFARM), latest + MoM from `trendDeltas`, sequence emitted
  twice inside the track for the loop, wrapper `aria-hidden`.
- `trendBoardHtml(pulse)` — the four rows; reuses the existing
  `sparkline()` (verified: it already breaks the path at null
  points — `pen` resets and the next point starts a new segment
  — so gaps render as gaps with no new code); board head carries
  the reference month and the "Computed from BLS series" label.
- `outlookHtml(outlook)` / `educationHtml(outlook)` — render
  FR-003 / FR-004 from `data/outlook.json`; agency, horizon,
  and vintage strings come **from the file's metadata**, never
  hard-coded in the renderer; a missing file or missing section
  returns `''` (board absent, build succeeds — FR-005e).
- Template: `scripts/templates/signals.html` gains
  `{{TICKER_HTML}}`, `{{TREND_BOARD_HTML}}`, `{{OUTLOOK_HTML}}`,
  `{{EDUCATION_HTML}}` between `{{PULSE_HTML}}` and
  `{{LANES_HTML}}`, inside the existing section.

## Sources & method note — added copy (draft, FR-007)

Appended to the existing note in the template (existing text
untouched):

> "Outlook figures are employment projections published by the
> U.S. Bureau of Labor Statistics and the Michigan Department
> of Technology, Management & Budget, shown with their horizon
> and vintage; they are those agencies' modeled outlook, not
> Axiovex forecasts. Education figures are Michigan CEPI and
> IPEDS statistics, shown with their vintage. Trend deltas on
> this page are computed from the published series."

Final wording is reviewed at implementation against the claims
rules; it may get narrower, never broader.

## Stylesheet: versioned bump (standing rule)

New components (tape, boards, rows) need CSS, so the release
ships as **`styles.v26.css`**: v25 + the new component rules,
all pages/templates repointed, v25 file removed — the same
procedure as v24 → v25 (spec 008). The tape animation lives
entirely in CSS: keyframes translate the doubled track;
`@media (prefers-reduced-motion: reduce)` disables the
animation; `:hover` / `:focus-within` on the strip pause it.
No JavaScript is added for the tape or the boards. Board tables
use tabular figures and collapse to the stacked row at mobile
width (drawn in WF-11).

## Staging-first flow (spec 010)

1. Implementation lands on the **`staging`** branch (the
   staging branch's own `robots.txt`/`_headers` stay untouched
   by this work).
2. The staging Pages project deploys it; verification runs
   against **staging.axiovexsystems.com** (full checklist
   below).
3. Promotion = merge `staging` → `main` under spec 010's
   hazard rule (a diff touching staging-only `robots.txt` /
   `_headers` stops the promotion), then the production
   verification pass repeats against axiovexsystems.com.
4. The push-check monitoring re-reads the site on its normal
   cycle; the next scheduled SEO/AEO report confirms the
   baseline (AEO 100 / Seobility 90) held.

## Verification strategy (FR-008)

- **Figure audit** (the core check): script or by-hand diff of
  every number rendered on staging — trend-board values/deltas
  recomputed independently from `data/signals.json`;
  outlook/education figures matched cell-by-cell against
  `data/outlook.json`, and the dataset matched against the
  verified source tables recorded in sources.md. Zero
  mismatches is the bar.
- **Equivalence**: every tape item appears in the trend board
  with the same value and delta.
- **Accessibility**: tape is `aria-hidden` and absent from the
  accessibility tree's reading order; keyboard pass (nothing
  in the new section traps or requires focus); reduced-motion
  emulation shows a static tape; boards read as tables/lists
  in source order.
- **Widths**: 1440 / 834 / 390px — no horizontal overflow; the
  stacked row layout engages at mobile width.
- **Resilience**: build once with `data/outlook.json`
  temporarily renamed — build succeeds, boards absent, rest of
  the page intact (FR-005e).
- **Regression**: Pulse band, lanes, sources note (original
  sentences), home page, and widget output byte-identical to
  pre-change except the intended additions and the stylesheet
  version repoint.

## Risks / open points

- **Vintage drift**: BLS may publish the 2025–35 projections
  between proposal and implementation. T002 pins whatever is
  latest *at build time*; the board's vintage label makes the
  state honest either way.
- **Michigan projections availability**: DTMB's long-term
  industry file is the least certain of the three sources
  (format/cadence). If T002 cannot verify a current published
  file, the Michigan group waits for a spec amendment rather
  than shipping with a substitute source.
- **Education field-group aggregation** (IPEDS completions)
  involves an aggregation choice (which CIP groups, which
  window). T002 records the exact aggregation in sources.md so
  the figure is reproducible; the board labels the vintage,
  and the aggregation is never presented as an IPEDS-published
  ranking if IPEDS did not publish it as one — if the
  aggregation is ours, the row label says "completions change
  by field (IPEDS data)" rather than attributing a ranking to
  IPEDS.
- **Tape motion**: the accessibility mechanics in FR-001 are
  the design, not a polish item; if staging verification shows
  the pause/reduced-motion behavior failing in a target
  browser, the tape ships static (animation removed) rather
  than shipping broken mechanics.
