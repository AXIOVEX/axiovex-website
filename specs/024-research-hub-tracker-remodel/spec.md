# Spec 024 — Research hub remodel: program-tracker anatomy (`/research/`)

**Direction:** Tristen Pierson, 2026-10-13 (given in the
BitConcepts website chat; handed to this project the same day):
remodel the Axiovex research page — axiovexsystems.com/research/,
the unlisted noindex RCPH hub shipped under spec 023 — after the
BitConcepts research tracker page
(https://bitconcepts.tech/research/indus-script/). The model
page is a **design model only**: its anatomy, structure, and
design language transfer; none of its content does. No Indus
material of any kind appears on the Axiovex page.

**Status:** PROPOSED 2026-10-13 — spec package + WF-18 revised
frame drafted; **nothing implemented**. Implementation is
blocked on the T001 approval gate (tasks.md), which also
decides the two open questions recorded below (OQ-1, OQ-2).

## What the remodel is

The current page (WF-18, spec 023) is a prose page: findings
segments, a mechanism panel, a framework section, a program-two
segment, three link cards. The remodel keeps **both programs
and every current content rule** and re-houses the page in the
tracker anatomy the model page uses:

1. A **record strip** in the page head — "Program record as of
   <date>" plus the three primary-record links (registered
   studies · framing paper and ledger · the sister program).
2. A **status box** up top, in plain language, in two halves
   of equal size: what stands, and what does not stand.
3. A **program-numbers ledger strip** — the size of the public
   record, in numbers (see OQ-1).
4. A **verdict board** for Program one, rendered from **one
   data array**: one card per closed or running study, filter
   chips by outcome, and honest **off-scale labels** for the
   entries that are not verdicts (the positive control, the
   still-live unjudged claim, the running studies).
5. **Registered predictions** — cards with the test that could
   settle each one and **dated status notes**.
6. The **framework section**, retained and extended: the five
   working ideas, plus the **five stages** a claim passes
   through (created, checked, explained, accepted, digested),
   the **two lanes** (machine-speed checking vs human-paced
   acceptance), append-only corrections, and the 2026-10-12
   full-history audit.
7. **Latest research** — dated, collapsible articles, newest
   first.
8. **Open fronts** — what is actually in motion and what each
   line of work is waiting on.
9. **Program two** (the epistemic ledger), retained.
10. **Archived releases and study papers** — the public
    registrations, one row each with its DOI, rendered from
    one data array; the papers list beside it.
11. **How a claim earns its verdict** — the method section.
12. The retained primary-material link cards, the reduced CTA
    band, and a closing **snapshot line**: ownership + the
    date this page's record was taken.

## Relationship to spec 023 (read before approving)

- **Unchanged, carried over verbatim:** the unlisted mechanics
  (spec 023 FR-001 — not in nav, not linked from anywhere on
  this site, page-level noindex, never in the sitemap or
  llms.txt, production `robots.txt` untouched), the page shell
  (WF-G1 nav and WF-G4 footer unchanged, reduced CTA band),
  the three outbound primary-material links and no others,
  and the plain-language rule.
- **Superseded on approval of this spec:** WF-18's layout
  (replaced by the WF-18 revised frame in
  `docs/wireframes/`), and the status panel (its five
  mechanism statements move into the verdict board as card
  evidence text where a study maps, and into the framework
  section where the result is a framework result — no
  approved sentence is dropped).
- **Two deliberate deltas to spec 023 FR-004 are proposed,
  and only the owner's gate can make them** (OQ-1, OQ-2
  below): study numbers on board cards, and outcome counts
  in the ledger. FR-004's other limits stand unchanged: no
  internal claim labels, no grades or scores of claims, no
  internal process jargon, no staging or generator
  identifiers.

## Open questions for the T001 gate

- **OQ-1 — Ledger numbers vs the anti-tally amendment.**
  The 2026-10-12 amendment to spec 023 (owner-approved)
  removed verdict tallies from this page: counts never stand
  in for understanding. The model page's ledger is a numbers
  strip, and this draft draws it with the record's outcome
  split (confirmed / rejected / no effect / inconclusive)
  shown as a labelled stacked bar inside the ledger — every
  number on it is a count of the **public record**, and every
  board card below it carries its result as a meaning
  sentence, never as a bare tally. The gate decides:
  (a) approve the ledger as drawn, or (b) restrict the
  ledger to record-scale numbers only (studies registered,
  registrations public, papers) with no outcome split.
- **OQ-2 — Study numbers on the page.** Spec 023 FR-004
  barred internal study numbers. The remodel's board names
  each study by the number it carries on its **public OSF
  registration** ("Study 023 · registered study — OSF"),
  because the board is an index into that public record and
  the number is how a reader finds the registration. No
  internal codenames, claim labels, or machinery are added.
  The gate confirms or declines this delta.

## Functional requirements

- **FR-001 — Unlisted mechanics (unchanged).** Exactly spec
  023 FR-001/FR-006: no nav item, no internal link, no
  sitemap entry, no llms.txt entry, page-level
  `<meta name="robots" content="noindex">`, production
  `robots.txt` and `_headers` untouched. The remodel changes
  the page's interior only. The footer newsletter strip and
  the Signals floating widget follow the global rules, as
  today — the page gains and loses no form.
- **FR-002 — Page shell and measure.** `research/index.html`
  stays hand-authored on the WF-05/WF-14 shell pattern (same
  head structure, versioned stylesheet + widget stylesheet
  links, nav WF-G1, page head + strata WF-G2 with the spec
  003 rhythm, footer WF-G4, reduced CTA band). Tracker
  sections (ledger, board, predictions, fronts, releases)
  use the site's standard container measure (~1120px);
  prose sections (findings, framework, Program two, method)
  keep the centered ~760px editorial column. JSON-LD WebPage
  schema as today; canonical unchanged.
- **FR-003 — Record strip.** Directly under the page head:
  left, "Program record as of <Month D, YYYY>"; right, the
  three primary-record links — the same three targets as the
  link cards (OSF program parent, the epistemic-ledger
  GitHub repo, the BitConcepts research page), each verified
  resolving before listing (spec 023 FR-005 precedent). No
  other outbound links are added anywhere on the page.
  Desktop: one row. Mobile: the date line, then the links,
  stacked and centered.
- **FR-004 — Status box.** A bordered panel (the current
  status panel's form) in two equal halves: **What stands**
  and **What does not stand**, at the same size and weight —
  the model's honesty rule. Each half is plain sentences.
  The "does not stand" half names the rejected majority and
  the stage position honestly: claims sit at checked /
  explained; none is carried as accepted.
- **FR-005 — Numbers ledger.** One strip, four cells,
  rendered from the same program snapshot as the board:
  studies on the public register · studies closed with an
  outcome (with the outcome split as a labelled stacked bar,
  per OQ-1) · public registrations · papers and dated
  research articles. Every figure is a count of the public
  record as of the snapshot date; no figure is a grade, a
  score, or a rate of success.
- **FR-006 — Verdict board.** One data array in the page is
  the board's single source; the board and the filter chips
  render from it and from nothing else. One card per study:
  a plain-language claim title; the study line (public study
  number + link to its registration); an outcome pill in
  plain words — **Confirmed · Rejected · No effect found ·
  Inconclusive** — the card's **meaning sentence** (what the
  result means, in words a general reader owns; a technical
  value may follow once, in parentheses); and a boundary
  line (what the result does not show, or what it is waiting
  on). Filter chips: All findings · Confirmed · Rejected ·
  No effect found · Inconclusive · Still running · Off the
  scale — each with its count, computed from the array.
  **Off-scale honesty:** the positive control is labelled
  "Control — passed" and "a control, not a claim"; the
  surviving consciousness contrast is labelled "No verdict —
  still live"; running studies are labelled "Registered —
  running" / "Approved — running". None of these is drawn
  as, counted as, or filtered as a verdict.
- **FR-007 — Registered predictions.** Cards: the prediction
  in plain words; the test that could settle it, stated as
  its falsifier; a status pill (Pending — unplayed · Live —
  unjudged · Closed — unscored); and **dated status notes**
  appended under the cards, newest last, never rewritten.
  "Pending means unplayed — not lost, not won" is stated on
  the section, as the model states it.
- **FR-008 — Framework section.** The five working ideas,
  retained verbatim in substance from the current page.
  Added, in plain words and **without attribution**: the
  five stages a claim passes through — **created, checked,
  explained, accepted, digested** — drawn as a five-step
  strip with a one-line definition each, and the program's
  current position marked on it; the **two lanes** note
  (checking runs at machine speed; acceptance moves at
  human pace; the first is never displayed as the second);
  **corrections are append-only** (a changed assessment is
  a new dated record beside the old one, never a rewrite);
  and the audit paragraph: on 2026-10-12 the program
  re-examined its entire history under this discipline and
  published digestion records for it.
- **FR-009 — Latest research.** Dated articles in
  collapsible `<details>` blocks, newest first, each with
  date, title, a basis line naming its record, and the full
  text inside. Launch set (from `tracker-content.md`):
  2026-10-13 the phenomenal-observable study; 2026-10-13
  the consciousness-line reactivation report; 2026-10-12
  the framework realignment and full-history audit. New
  articles are added at most one per day, and only when a
  finding closes or a record is published.
- **FR-010 — Open fronts.** Cards for what is in motion:
  the consciousness line (its dataset pilot gate stated
  plainly — a pilot must first show the signal can be read
  at all, at a bar fixed in advance, before any claim test
  is frozen); Studies 032–034 (registered / approved,
  running); the study designed, registered, and waiting on
  a laboratory partner (carried from the current page);
  Program two's design phase (schema, scoring, prototype).
  Each card says what the work is waiting on.
- **FR-011 — Program two, retained.** The epistemic-ledger
  segment keeps its current substance and status line
  (framing paper published; ledger public and maintained;
  the method in active use across both programs).
- **FR-012 — Archived releases and study papers.** Release
  rows rendered from **one data array**: study number,
  DOI link (`10.17605/OSF.IO/<id>`), and a plain note of
  what the registration is. **Verify-before-listing rule:**
  every DOI is fetched and confirmed resolving to the right
  registration before the copy gate closes (tasks.md T003)
  — an unverified identifier never ships. Beside the rows,
  the papers list: the framing paper first; study papers
  as they exist on the public record.
- **FR-013 — Method.** "How a claim earns its verdict":
  four steps — state the claim and the test that could
  kill it · register both publicly, before any data is
  touched · run exactly what was registered · publish the
  verdict either way, then explain and digest it — plus the
  standing rules list (falsifier first; verdicts publish at
  the same prominence either way; corrections append-only;
  lane one never displays as lane two). The current page's
  method chip row is absorbed into this section.
- **FR-014 — Closing.** The three primary-material link
  cards (retained), the reduced CTA band (retained), then
  WF-G4 unchanged — and, as the content column's last line
  before the CTA band, the **snapshot line**: "Snapshot of
  the program record as of <date>." The record-strip date
  (FR-003), the snapshot-line date, and the ledger/board
  snapshot are one date, from one snapshot.
- **FR-015 — Stylesheet.** The tracker components (record
  strip, status halves, ledger, board cards and pills,
  filter chips, prediction cards, stage strip, article
  blocks, release rows, step rows) are new CSS. They ship
  as a **new versioned stylesheet, `styles.v38.css`** —
  a new filename, never an in-place edit of v37 (the site's
  cache-busting rule) — linked from the research page. The
  board/predictions/releases rendering script is page-local,
  fed by the arrays in FR-006/FR-007/FR-012; with scripting
  off, those regions show a plain note pointing to the OSF
  record rather than rendering empty.
- **FR-016 — Content and currency rule.** All copy is plain
  language: results stated as what they mean; a needed
  technical term defined in plain words at first use; a
  technical value at most once, in parentheses. No external
  attribution anywhere on the page. Page updates ride the
  standing papers/website currency rule: at every update,
  statuses are refreshed **from the program records**, the
  snapshot date moves with them, and a status is never
  carried forward on memory. The full draft content for
  this remodel is `tracker-content.md` in this package,
  approved or amended at the T001 gate; the approved text
  is what ships.

## Claims (AEE — each carries its falsifier)

- **C-024-1: One source per component.** The board, the
  ledger split, and the filter counts all derive from the
  board's single data array; the release rows from the
  releases array. *Falsifier:* any rendered figure or card
  on the page that cannot be traced to its array entry, or
  a chip count that disagrees with the array.
- **C-024-2: No bare verdicts.** Every board card carries a
  meaning sentence and a boundary line. *Falsifier:* a
  rendered card whose outcome appears without its meaning
  sentence.
- **C-024-3: Off-scale stays off-scale.** The control, the
  live unjudged claim, and the running studies are labelled
  as what they are and are excluded from every verdict
  count and verdict filter. *Falsifier:* any of them
  rendered with a verdict pill, or included in a verdict
  chip's count.
- **C-024-4: One snapshot date.** The record strip, the
  snapshot line, and the content snapshot agree on one
  date. *Falsifier:* two different "as of" dates anywhere
  on the rendered page.
- **C-024-5: The unlisted properties survive the remodel.**
  Served HTML carries the noindex meta; nav and footer
  contain no Research link; a rebuild leaves `sitemap.xml`
  with zero `research` URLs and `llms.txt` byte-unchanged;
  the page's form count is unchanged (the WF-G4 strip
  only). *Falsifier:* any of those checks failing on
  staging or production.
- **C-024-6: Every listed DOI resolves.** Each release
  row's DOI was fetched at T003 and resolves to the
  registration the row names. *Falsifier:* a listed DOI
  that fails to resolve, or resolves to a different study.

## Out of scope

- Production promotion (separate owner approval, spec 010
  flow, tasks.md T008).
- Any change to any other page, the nav, the footer, the
  sitemap, llms.txt, `robots.txt`, or `_headers`.
- Any change to the BitConcepts page (the model is read,
  never edited, from this project).
- New research content: the remodel re-houses the record
  as of its snapshot date; it commissions no study and
  changes no verdict.
