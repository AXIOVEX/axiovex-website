# Feature Specification: Signals Highlights + Expandable Detail

**Feature Branch**: `013-signals-highlights-detail`
(documentation only until the approval gate passes —
implementation lands through the staging flow in spec 010)

**Created**: 2026-10-06

**Status**: **Implemented and live 2026-10-06** —
approved by Tristen 2026-10-06 13:43 EDT ("Approve spec 013
wireframes — implement it"); implemented on staging
(tasks T001–T005, verification record in this package's
`sources.md`), promoted to production with spec 015 in
merge `4497704` (T006 — FR-004 guard proof empty,
production figure audit repeated live) and closed out
(T007). Sequencing as it fell out: specs 011/012 +
Amendment 2 promoted first; spec 013 followed with its
own staging cycle.

**Direction (Tristen, 2026-10-06)**: "can we add more data to
the signals page? basically much of what we report for the
jobs/economy report. but keep the page clean and make an area
for overall highlights and the area that is collapsed that can
expand to show many more details. and at the top with the
highlights always have a generated insights summary."

## What exists today

`/signals/` (spec 004, live; spec 011 + Amendment 2 approved
and implemented on staging) carries, in order: the ticker
strip at the page top, the page head, the Michigan Pulse band
(four BLS series with 12-point trend arrays in
`data/signals.json`), the Trends & outlook section (trend
board, BLS outlook board, education block slot), the five
headline lanes, and the sources & method note.

Two verified data pools already exist behind the page:

- **`data/signals.json`** — the hourly-ingested snapshot. Its
  Pulse tiles carry every monthly point (Sep 2025 → Aug 2026)
  behind the sparklines; the page currently shows only the
  latest value, the deltas, and the line.
- **`data/outlook.json`** — the committed projections dataset.
  Today it carries only the U.S. BLS Employment Projections
  section (2025–35, verified 2026-10-06 per spec 011
  sources.md): five rise + five fall rows with % change and
  numeric change.

And one verified dataset sits outside the website repo: the
workforce study's **September edition**
(`AXIOVEX/michigan-workforce-intelligence`,
`reports/2026-09-26-graduation-horizons/`, release tag
`reports-2026.09.27.131143Z`) holds **36 verified Michigan
MCDA occupation projection rows** (`projections.json`: 18
statewide, horizon 2024–34, from MCDA's statewide workbook;
18 Detroit Metro Prosperity Region, horizon 2022–32, from
MCDA's regional workbook — each row with base/projected
employment, % change, and annual openings), captured and
ledger-verified by the study's reviewed-evidence process. The
monthly workforce report (spec 007, FR-010) already presents
these tables, plus a verified **education-to-career set**
(CEPI graduation/dropout via MDE's 2026-02-20 release; MDE
teacher-preparation figures, release 2025-09-29; House Fiscal
Agency pupil-membership consensus estimates, Jan 2026).

What the page does not have: a summary layer, and anywhere
for the depth behind the boards to live. The monthly report
carries the depth; the page shows only its headlines.

## What this adds

Two regions on `/signals/`, nothing else moved:

1. A **Highlights region** directly under the page head,
   ahead of the Pulse band: a **generated insights summary**
   (2–4 sentences the build composes deterministically from
   the same committed data the boards show) above a row of
   **highlight cards** (the four Pulse headline stats, the
   top rising + falling entry from each outlook board, and
   the education headline figure when verified data exists).
   *(Card set amended by Amendment 1, 2026-10-06 — the
   four Pulse cards are removed; see the amendment
   section below.)*
2. An **expandable Detail region** — "The full picture" —
   between Trends & outlook and the lanes: collapsed by
   default, opening to the deeper jobs/economy datasets:
   the full 12-month Pulse value tables, the full BLS
   projections tables, the full Michigan MCDA occupation
   table (36 rows, grouped by geography/vintage), the
   education-to-career figures (verified set), and a link
   block to the current monthly article + the study edition.

Page order after this spec: header → ticker strip → page
head → **Highlights** → Pulse band → Trends & outlook →
**Detail** → lanes → sources note. The Amendment-2 condensed
top, the Pulse band, Trends & outlook, and the lanes are
unchanged.

## Design reference (wireframes, this proposal)

- **WF-11** (revised): the frame gains the Highlights region
  (insights summary drawn with real current values as labeled
  data examples + nine highlight cards) and the Detail region
  drawn in **both states** — collapsed (header row only) and
  expanded (all five content blocks, real values). Labeled
  "spec 013 — PENDING OWNER APPROVAL".
- No other frame changes.

## Functional requirements

- **FR-001 — Page composition.** The two regions are emitted
  into `scripts/templates/signals.html` at fixed slots: the
  Highlights region between the page head/strata and
  `{{PULSE_HTML}}`; the Detail region between the Trends &
  outlook section and `{{LANES_HTML}}`. Nothing else on the
  page moves; the spec 011 Amendment-2 spacing values are
  preserved exactly (the Highlights region takes its rhythm
  from the existing section spacing, it does not reopen the
  condensed top).
- **FR-002 — Insights summary (generated, deterministic).**
  The build composes 2–4 sentences from fixed templates whose
  slots are filled only with values taken from, or computed
  by the generator's existing arithmetic on, the committed
  datasets rendered on the same page: Pulse latest levels +
  MoM deltas, window deltas/percentages, each outlook board's
  top riser + top faller, and the education headline figure.
  Rules: (a) **every clause traces to a committed data
  value** — the verification task audits clause-by-clause
  with a zero-untraceable-clause bar; (b) **observational
  language only** — no causal claims, no advice or
  recommendations, no forecast language beyond quoting the
  agencies' projections as projections with attribution;
  (c) a sentence whose inputs are missing from the committed
  data is **omitted, never approximated** — the summary
  shrinks, it does not stretch; (d) output is deterministic:
  the same committed data produces the same summary text,
  byte-for-byte, on every build; (e) the block carries a
  provenance line: "Generated at build time from the data on
  this page ·" plus the snapshot period and dataset vintages.
  **Reconciliation with spec 004 FR-008** (no auto-generated
  summaries, opinions, or "why it matters" text): FR-008
  governs the ingested **news items** — Axiovex displays their
  headlines verbatim and adds nothing. The insights summary
  is a different object: it contains **no news content**; it
  is templated arithmetic statements about Axiovex's own
  ingested **statistics** — the same computed deltas the
  boards already publish under the "Computed from BLS
  series" label — with no opinion, no causal claim, and no
  recommendation. This spec records that distinction as the
  standing reconciliation: FR-008 stands for news items; the
  summary is permitted for, and confined to, the statistics.
  Any future template clause that editorializes (why a move
  happened, what a reader should do) is out of bounds.
- **FR-003 — Highlight cards.** *(Amended by Amendment 1,
  2026-10-06 — the opening Pulse clause below is
  superseded; the card set is the outlook + education set
  only. See the amendment section.)* Composition rule: the four
  Pulse headline stats (latest verbatim + computed MoM delta,
  labeled with source + reference month); then, **per
  outlook dataset present** in the committed data, one top
  riser card and one top faller card (by projected % change;
  occupation + projected % + agency + horizon); then the
  **education headline figure** when a verified education
  dataset is present (figure + publisher + vintage). A card
  whose underlying data is absent **does not render** — no
  placeholder cards, no empty slots, no "coming soon". Card
  values are generated from the datasets, never hand-typed.
- **FR-004 — Detail region mechanics.** Collapsed by
  default; while collapsed the region's visible footprint is
  exactly its header row (title + toggle). The toggle is a
  native `<button>` with `aria-expanded` and
  `aria-controls`, keyboard-operable, with a visible focus
  state. The content is **server-rendered into the DOM at
  build time** — hidden by presentation while collapsed,
  never fetched or injected by script — so it remains
  crawlable (SEO/AEO), and with JavaScript unavailable the
  region renders expanded rather than trapping content
  behind a dead control. Expanding/collapsing is the only
  client behavior; it changes no data and fires no requests.
- **FR-005 — Detail contents.** Five blocks, each headed
  with its source + vintage label:
  (i) **Pulse value tables** — all monthly points from each
  tile's trend array (currently 12, Sep 2025 → Aug 2026) for
  the four series; a missing month renders as a gap marker
  captioned as missing in the source — never interpolated
  (extends spec 004 FR-006 / spec 011 FR-005d);
  (ii) **BLS projections tables** — **every row** the
  committed `data/outlook.json` carries, rise and fall, with
  projected % change **and** projected numeric change; the
  standing caption (projections are the agency's modeled
  outlook, not Axiovex forecasts, not guarantees) repeats
  here;
  (iii) **Michigan MCDA occupation table** — all 36 rows of
  the September edition's verified `projections.json`,
  rendered in **two labeled groups** (statewide 2024–34;
  Detroit Metro Prosperity Region 2022–32), each row with
  occupation, % change, base → projected employment, and
  annual openings (captioned: openings include replacement
  demand, not only growth); the groups are never blended
  into one ranking or one horizon (extends spec 011 FR-003).
  Provenance label: **"Michigan MCDA, via the Axiovex
  workforce study, September edition"** + the study's
  release tag, with the direct-source caveat stated in the
  block: these figures are a transcription of the study's
  verified capture of MCDA's published workbooks; a direct
  read of MCDA's tables (pending — spec 011 sources.md §2)
  supersedes the transcription when it lands, and the label
  changes to the direct source at that point;
  (iv) **Education-to-career figures** — only the verified
  set, each figure with publisher + vintage: four-year
  graduation rate and dropout rate (CEPI via MDE release
  2026-02-20), teacher-preparation enrollees and completers
  (MDE release 2025-09-29), pupil membership (House Fiscal
  Agency Jan 2026 consensus — labeled a **budget estimate**,
  as its source labels it, not an audited count). A figure
  that has not been verified from its source does not
  appear — postsecondary completions by field (IPEDS) is
  the standing example: absent until a Michigan by-field
  series is verified;
  (v) **Link block** — the current monthly workforce article
  (newest published post of the spec 007 series, resolved at
  build time from the site's own posts) and the study
  edition (the immutable release-tag URL recorded in the
  committed dataset metadata). Links advance with the series;
  they are never hand-maintained in the template.
- **FR-006 — Committed data only (provenance).** Every value
  in both new regions originates in a committed file: the
  existing `data/signals.json`; the existing
  `data/outlook.json` (BLS section as verified under spec
  011); and two sections added to `data/outlook.json` by the
  data task (tasks.md T002): `michiganProjections`
  (transcribed from the September edition's verified
  `projections.json`, with metadata: publisher MCDA, source
  files — statewide + regional workbooks — horizons,
  edition release tag, study retrieval dates, and the
  via-study caveat flag) and `education` (the FR-005(iv)
  verified set, each figure with publisher, vintage, source
  URL, retrieval date, and an `estimate: true` marker where
  the source labels the figure an estimate). No new fetch
  path is created; the hourly signals fetch does not touch
  these sections; refresh follows each source's release
  cycle by the documented manual procedure. No figure enters
  the file from news coverage, a search snippet, or memory —
  the spec 011 FR-005 rule, applied unchanged.
- **FR-007 — Last-good resilience.** A missing or empty
  dataset section removes exactly its dependent elements —
  the card, the detail block, and the summary sentences that
  cite it — and nothing else: no fabricated values, no
  zero-filling, no build failure (extends spec 011
  FR-005e). If the entire `data/outlook.json` is absent, the
  page renders as it does today plus the Pulse-only
  highlights and detail table. The insights summary never
  renders with fewer than its Pulse sentences; if the Pulse
  snapshot itself is missing, both new regions render
  absent (the page falls back to today's last-good behavior
  under spec 004 FR-005).
- **FR-008 — Clean page + responsive.** The Highlights
  region is compact by construction: one summary paragraph
  block + the card rows, in the page's existing card/strata
  language — **no new colors, no new type styles, no new
  component vocabulary**. The Detail region adds zero
  visible height while collapsed beyond its header row. At
  390px: cards stack in the existing card rhythm; detail
  tables scroll horizontally inside their own block (the
  page never scrolls sideways); the disclosure header wraps
  with the toggle reachable full-width. No horizontal
  overflow at 1440 / 834 / 390px.
- **FR-009 — Sources note + metadata.** The sources & method
  note gains attribution sentences for the detail datasets
  (Michigan MCDA via the workforce study's September edition,
  with the caveat; the education set with its publishers),
  its existing sentences untouched (extends spec 011 FR-007).
  The page meta description is unchanged unless a revision
  stays inside the ~198-character discipline and adds no
  claim not on the page. Sitemap and `llms.txt` are
  unchanged (same URL). The SEO/AEO baseline (AEO 100 /
  Seobility 90) must hold after launch — the detail content
  being in the DOM is expected to help, never to be traded
  against the baseline.
- **FR-010 — Gate, staging-first flow, verification.** No
  implementation before Tristen approves the revised
  wireframes (tasks.md T001). Implementation is built and
  verified on the **staging branch** at
  staging.axiovexsystems.com, then promoted by merging
  `staging` → `main` under spec 010's rules. New styles ship
  as the next **versioned stylesheet bump** after the
  in-flight staging chain (Amendment 2 shipped v28; this
  spec's bump is the next version in sequence at
  implementation time), all references repointed.
  Verification (constitution §V): **figure audit with a
  zero-mismatch bar** — every value in both regions
  byte-matches the committed datasets; every insights-summary
  clause traced to its inputs (FR-002a); the Michigan table
  byte-matches the September edition's `projections.json`
  (36/36 rows, grouped as labeled); collapsed-height check
  (region footprint = header row); disclosure keyboard +
  aria pass; content present in served HTML with scripts
  disabled; no overflow at 1440 / 834 / 390px.

## Relationship to the pending restorations + promotion

Spec 011 shipped with the Michigan outlook group and the
education block dropped as unverified (spec 011 sources.md
§§2–3) and restorations pending. **This spec's Detail region
is the natural home for those restorations**: the data task
(T002) performs them as data work — transcription from the
study's verified capture (Michigan) and from the verified
release set (education) — under the via-study / per-figure
provenance labels FR-005/FR-006 prescribe. The pending
*direct-source* verifications (a direct read of MCDA's tables
on michigan.gov; dataset-precision CEPI/IPEDS reads) remain
open and, when they land, supersede the transcriptions as
data-only updates — no design change. Whether specs 011/012
+ Amendment 2 promote to production first, or bundle with
this spec, is **the owner's decision at approval** — this
spec deliberately does not decide it; its implementation is
staging-first either way.

## Claims discipline

The page gains a generated text block, so the claims bar is
again the point (constitution §I): the summary may only
restate, in templated observational language, figures that
are themselves on the page with their provenance (FR-002).
It asserts no cause, no advice, and no Axiovex forecast; the
forward-looking content remains the agencies' published
projections under their standing caption. The Michigan
table's via-study label exists so the page never claims a
direct read that has not happened (FR-005iii) — the honest
label is a feature, not a hedge.

## Out of scope

- The home page Signals block (WF-01), the floating widget
  (WF-12 / WF-G6), and `/signals-widget.json` — unchanged
  (no highlights or summary surface there in this spec).
- The five lanes, their sources, and the ingest pipeline —
  unchanged. The summary never touches lane content (FR-002).
- A human-written editorial digest (remains future work per
  spec 004 FR-008); the generated summary does not substitute
  for one and does not imitate one.
- Extending the BLS transcription beyond the rows
  `data/outlook.json` already carries (a data-refresh option
  for a later cycle, not this spec).
- Any change to the monthly article format (spec 007) — this
  spec consumes its content families; it does not alter them.

## Amendment 1 — owner direction 2026-10-06 (duplicate Pulse cards removed)

**Direction (Tristen, 2026-10-06):** reviewing the live
page, with a screenshot of the Highlights region and the
Pulse band below it: "fix repeat cards. cannot do that."
**Approval basis:** owner-directed — approved (the same
basis as spec 011 Amendment 2). The wireframes were
revised first under the standing wireframes-first rule,
then implementation followed (tasks T008–T012).

**The defect.** FR-003's composition rule opened the
highlight cards with the four Pulse headline stats. The
Michigan Pulse band renders immediately below the
Highlights region carrying the same four values and the
same computed MoM deltas, in fuller form (with
sparklines). The cards were pure duplication — the same
numbers twice in adjacent regions.

**The change.** FR-003 is amended: the highlight cards
are exactly the outlook + education set — **per outlook
dataset present**, one top riser card and one top faller
card (by projected % change; occupation + projected % +
agency + horizon); then the **education headline figure**
when a verified education dataset is present. With the
current committed data that is **five cards** (Michigan
riser, Michigan faller, U.S. riser, U.S. faller,
education headline). The four Pulse cards are removed.
The Pulse statistics' single home on the page is the
Pulse band directly below the region; they are not
repeated as cards.

**Unchanged.** The generated insights summary (FR-002)
is **byte-for-byte unchanged** — it narrates the Pulse
data in prose; it does not duplicate a display element,
and nothing in this amendment touches its templates.
The Pulse band, the Detail region, and everything else
on the page are untouched.

**Resilience under the amendment (FR-007).** Card
drop-out is preserved exactly: a card whose underlying
data is absent does not render. Two original wordings
are superseded by this amendment: the card list in
"What this adds" item 1, and FR-007's "Pulse-only
highlights" fallback — under the amendment, if the
entire `data/outlook.json` is absent, the Highlights
region carries the insights summary alone (its Pulse
sentences still render per FR-002/FR-007) with **no
cards**, while the Detail region's Pulse table still
renders. If the Pulse snapshot itself is missing, both
regions still render absent, as before.

**Flow.** Docs package on `main` (T008); implementation
and verification on the staging branch (T009–T010);
promotion `staging` → `main` under spec 010 FR-004
(T011); closeout (T012).

**Status: implemented and LIVE 2026-10-06** — docs
package `83c918e` on main; staging implementation
`95d2bb1` (verification in tasks T010: 5 cards, summary
byte-identical to the pre-fix production rendering,
drop-out 6/6); promotion fast-forward + FR-004 guard
restoration `462136e`; production-verified (tasks
T011–T012).
