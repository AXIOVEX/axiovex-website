# Sources: Signals Highlights + Expandable Detail (spec 013)

Created by T002 (data assembly), 2026-10-06. Every figure in the
two new regions traces to a committed file; this record is the
provenance for the datasets T002 added to `data/outlook.json`
and the verification evidence for T005.

## 1. Michigan occupation projections → `michiganOccupations`

Transcribed mechanically from the workforce study's September
edition: `AXIOVEX/michigan-workforce-intelligence`,
`reports/2026-09-26-graduation-horizons/projections.json`
(release tag `reports-2026.09.27.131143Z`, source commit
`d0fbc71`). 36 rows in two labeled groups, never blended:

- **Michigan (statewide), 2024–2034** — 18 rows, edition
  source S12: MCDA `LongTerm_OccupationProj_2034_Michigan_
  Statewide.xlsx`, retrieved by the study 2026-09-27
  (registry: `source-registry.json`, raw SHA-256 on file).
- **Detroit Metro Prosperity Region, 2022–2032** — 18 rows,
  edition source S13: MCDA `LongTerm_OccupationProj_2032_
  Detroit_Metro_Prosperity_Region.xlsx`, retrieved 2026-09-27.

Publisher: Michigan Center for Data and Analytics (MCDA),
Michigan DTMB. Provenance on the page is the via-study label —
"Michigan MCDA, via the Axiovex workforce study, September
edition" + the release tag + the direct-source caveat
(FR-005iii): the website flow has not yet read MCDA's tables
directly (spec 011 sources.md §2); the pending direct read
supersedes this transcription as a data-only update when it
lands.

**Mechanical transcription check (FR-006)** — an independent
checker re-read both files and compared every row on every
transcribed field (occupation, base employment, projected
employment, % change, annual openings, plus group
geography/period):

```
edition rows: 36 | committed rows: 36 | rows compared field-by-field: 36
TRANSCRIPTION CHECK: 36/36 rows match on every field — PASS
```

## 2. Education detail figures → `education.figures`

The spec 007 FR-010 verified set, assembled 2026-10-06, each
figure committed **in the form its source publishes it**
(`valueText`) — never sharpened beyond the source:

| Figure | Published form | Publisher / release | Source |
|---|---|---|---|
| Four-year graduation rate | "just over 84%", class of 2025; prior class 82.8%; release's own delta +1.2 pts | CEPI via MDE, 2026-02-20 | michigan.gov/mde press release 2026/02/20 |
| Four-year dropout rate | 7.1%, class of 2025; prior class 7.7% | CEPI via MDE, 2026-02-20 | same release |
| Teacher-preparation enrollees | 14,819 (2023–24); trough 6,859 (2016–17) | MDE, 2025-09-29 | michigan.gov/mde press release 2025/09/29 |
| Teacher-preparation completers | 2,961 (2023–24); 2,258 (2019–20) | MDE, 2025-09-29 | same release |
| Pupil membership | 1,371,800 (FY2025–26), **`estimate: true`** — budget-consensus estimate, not an audited count | House Fiscal Agency, Jan 2026 CREC consensus | house.mi.gov Pupil_Handout_Jan2026.pdf |

Postsecondary completions by field (IPEDS): **excluded** —
no Michigan by-field series could be verified from a
published source in citable form (plan inventory #5). The
Detail education block captions the row as deliberately
absent; it joins only on a future verified refresh.

## 3. Verification evidence (T005, 2026-10-06, staging build)

- **Figure audit — zero mismatches.** Scripted comparison of
  the rendered page against the datasets: the full Pulse
  detail table (12 rows × 4 series, every cell, gaps as "—");
  all 36 Michigan rows against the **edition file** on every
  rendered field, in group order (statewide sorted by %
  change, then Detroit Metro sorted by % change); all 10 BLS
  detail rows; all 5 education rows incl. the estimate label;
  all highlight-card values.
- **Insights clause audit — zero untraceable clauses.** Every
  number in the rendered summary traced: reference month +
  levels (snapshot tiles, verbatim), MoM deltas (computed
  from the trend arrays: manufacturing +1.1k; labor force
  −25.5k; unemployment +0.1 pts), the extremum clause
  (586.7 − 574.4 January 2026 minimum = 12.3k), window moves
  (labor force −151.6k / −3.0%; nonfarm +1.5k / +0.0% — the
  Amendment-2 computations), outlook tops (MCDA statewide
  +41.5 / BLS +41.0, names compared before the "both boards"
  phrasing; the shared faller — data entry keyers, −26.4 /
  −25.5 — likewise compared, not asserted), education
  headline (source wording + prior-class comparison).
- **Fixture set (drop-out behavior)** — scratch builds with
  datasets withheld (never committed): BLS-only → BLS-variant
  outlook sentence, 6 cards, BLS detail block only;
  Michigan-only → Michigan-variant sentence, 6 cards;
  no-education → education sentence, card, and block absent,
  everything else identical; empty `outlook.json` →
  Pulse-only summary (2 sentences), 4 cards, Pulse table +
  article link only; `outlook.json` absent entirely → same,
  build succeeds. FR-002c / FR-007 confirmed.
- **Mechanics (Playwright, 1440 / 834 / 390)** — 71/71 checks:
  region renders collapsed with JS (footprint = header row
  exactly: 109.4 / 135.0 / 186.2 px, header-only), click +
  Enter + Space toggle with correct `aria-expanded` and
  labels, subtitle present collapsed / absent expanded (as
  drawn in WF-11's two states); with scripts disabled the
  region renders expanded with truthful aria state and full
  content in the DOM; no horizontal overflow at any width.
- **Regressions** — home byte-identical after build (its only
  change is the v29→v30 repoint); `styles.v30.css` is
  `styles.v29.css` byte-for-byte plus the appended spec 013
  block (pure additions), so spec 015's bottom rhythm,
  Amendment 2's signals-top values, and spec 003's heads are
  undisturbed by construction; measured end stacks: Home 200,
  Blog index 224, Signals 200, Contact 88; ticker at page
  top, Pulse band, trend board with sparkline window %
  (+0.4 / +2.0 / −3.0 / +0.0), outlook boards, education
  board (84.01%), and all five lanes intact; build is
  byte-deterministic across repeated runs.

## 4. Deviations from the spec/plan text (with reasons)

1. **Dataset key naming.** FR-006 / plan Step 1 name the new
   sections `michiganProjections` and `education`. Both keys
   were occupied before implementation began: the spec 011
   restoration (landed on staging after the spec 013
   proposal) committed `michiganProjections` as the MCDA
   **industry** rise/fall dataset and `education` as the
   **indicators** dataset (`grad-rate` / `enrollment`
   histories) that the live education board renders from.
   Overwriting either would have broken the shipped boards.
   Resolution: the occupation dataset is committed as
   **`michiganOccupations`** (the name the plan's own data
   inventory uses for it, #3) and the education figures as
   **`education.figures`** alongside `education.indicators`.
   Every substantive requirement — content, grouping,
   metadata, provenance labels, the via-study flag, the
   estimate marker — is honored unchanged; only the key
   names differ, for collision avoidance.
2. **Sentence 1 unemployment wording.** WF-11 draws the
   example summary with "the unemployment rate held at
   5.0%". The plan's sentence-1 template governs: wording is
   chosen by the **computed** delta. The computed MoM delta
   is +0.1 pts (Jul 4.9% → Aug 5.0%), so the rendered
   sentence reads "rose 0.1 pts to 5.0%". The wireframe
   example is labeled a data example; FR-002's traceability
   rule outranks the drawn wording.
3. **Sentence 4 form.** WF-11 draws "...the highest
   four-year rate since the state adopted the federal
   formula." The plan's sentence-4 template governs: the
   figure in its source wording + its prior-class
   comparison — "Michigan's class of 2025 graduated at just
   over 84%, up from 82.8% for the class of 2024." The
   superlative form is not used: the template confines the
   sentence to the committed figure and its committed
   comparison.
4. **Gap caption.** WF-11's drawn caption names the cause
   of the Oct 2025 gap ("federal lapse in appropriations" —
   BLS's published footnote). The rendered caption states
   the gap fact only ("a month the published series does not
   contain... shown as a gap and captioned as missing in the
   source, never interpolated"): the caption is composed by
   the generator for whatever months are missing in a future
   snapshot, and a cause specific to one historical event
   cannot be templated honestly. The cause remains recorded
   in the study and the monthly report.
5. **Sentence case in the summary.** The edition data
   carries Title Case occupation names ("Nurse
   Practitioners"); mid-sentence the composer lowercases
   occupation names in full (the wireframe draws
   "nurse practitioners", "data entry keyers"). Cards and
   tables render the committed names verbatim, byte-matched
   by the figure audit.
6. **Meta description (FR-009).** Revised, inside the
   rule: 194 characters (≤198 discipline), claim-free —
   every element it names (Pulse, trends, outlooks,
   education indicators, highlights, full data tables) is
   on the page.
