# Sources — spec 011 source verification (tasks.md T002)

Verified 2026-10-06 by reading each source itself. Rule applied
(plan.md Step 0 / FR-005): a figure enters `data/outlook.json`
only if it was read on the publishing source. A source that
could not be verified in published form drops its board via the
spec amendment recorded at the end of this file — it is never
replaced with an estimate or a secondary-source figure.

## 1. U.S. BLS Employment Projections — VERIFIED

- **Publication**: Employment Projections, U.S. Bureau of Labor
  Statistics (bls.gov/emp/).
- **Vintage**: **2025–35** (released August 27, 2026). This is
  newer than the 2024–34 vintage the proposal expected;
  plan.md's rule "if BLS has published a newer vintage, the
  newer one wins" applies, and the board labels 2025–35.
- **Tables read on bls.gov** (HTML tables, last modified
  Aug 27, 2026):
  - Table 1.3, Fastest growing occupations, 2025–35 —
    https://www.bls.gov/emp/tables/fastest-growing-occupations.htm
  - Table 1.5, Fastest declining occupations, 2025–35 —
    https://www.bls.gov/emp/tables/fastest-declining-occupations.htm
- **Fields used**: occupation title; percent change 2025–35;
  numeric change (published in thousands; stored in
  `data/outlook.json` as jobs = thousands × 1000).
- **Figures transcribed** (top five per side, by % change):

  On the rise — Nurse practitioners +41.0% (+137.8k jobs);
  Solar photovoltaic installers +36.5% (+11.3k);
  Data scientists +34.6% (+95.4k);
  Wind turbine service technicians +29.5% (+3.5k);
  Medical and health services managers +24.2% (+155.1k).

  Falling — Word processors and typists −34.4% (−13.9k jobs);
  Telephone operators −27.6% (−1.0k);
  Switchboard operators, including answering service −26.0%
  (−9.2k); Data entry keyers −25.5% (−33.6k);
  Foundry mold and coremakers −23.0% (−2.9k).

  (Reference point, not board content: total, all occupations
  +3.5%, +5,917.6k jobs.)
- Note: the BLS Occupational Outlook Handbook "Fastest Growing
  Occupations" page rounds some figures differently (e.g.
  solar 37%); the EP tables govern, per plan.md.
- Retrieved: 2026-10-06.

## 2. Michigan long-term industry projections — NOT VERIFIED → group dropped

- **Publication**: Michigan long-term employment projections,
  Michigan Center for Data and Analytics (MCDA), within the
  Michigan Department of Technology, Management & Budget
  (DTMB) — formerly LMISI / milmi.org.
- **Existence + horizon verified**: DTMB's 2026-09-02 release
  (michigan.gov) announces the 2026 Michigan Career Outlook +
  2026 Michigan Hot 50, built on the long-term projections
  with horizon **2024–34** ("through 2034"); the horizon is
  corroborated by the workforce study's methodology record.
  The statewide long-term projections files live under
  MCDA's employment-projections page
  (https://www.michigan.gov/mcda/labor-market-information/employment-projections;
  the statewide occupation file for 2034 is recorded in the
  study repo's source registry).
- **Why no figures**: the industry projections table itself
  could not be read on the source through the channels
  available to this implementation — michigan.gov denied the
  projections-page fetch (HTTP 403), and the figures
  circulating in secondary coverage (a MIRS news article,
  2026-09-04) are not the source and were **not** used.
- **Disposition**: the Michigan group is **dropped for this
  implementation** and spec.md is amended (below). The
  generator renders a Michigan group automatically if a
  future refresh adds a verified `michiganProjections`
  section to `data/outlook.json` — no code change needed.
  Re-verification path: read the statewide long-term industry
  projections file on michigan.gov/mcda (a live-browser pass
  can do this; the text-fetch channel could not).

## 3. Education indicators — NOT VERIFIED at dataset precision → block dropped

Per indicator:

- **Four-year graduation rate (Michigan CEPI via MISchoolData)**:
  CEPI's figures are published through the MISchoolData
  interactive reports, which do not render their data tables
  to a readable form through the channels available here.
  The Michigan Department of Education release of 2026-02-20
  (read on michigan.gov) announces the class of 2025 rate in
  rounded form only ("just over 84%", up 1.2 points from
  82.8% for the class of 2024) — not the exact series the
  dataset requires, and a rounded announcement figure is not
  entered as data. **Dropped.**
- **Public school enrollment (Michigan CEPI fall counts)**:
  same channel problem — the MISchoolData Student Enrollment
  Counts report renders documentation only; the certified
  statewide fall counts could not be read on the source.
  (Legislative consensus *estimates* of pupil membership
  exist but are estimates, not CEPI counts — not used.)
  **Dropped.**
- **Postsecondary completions by field (IPEDS)**: IPEDS
  completions data are distributed as survey data files /
  interactive explorers; a Michigan by-field aggregation could
  not be read or reproduced from the source through the
  available channels. **Dropped** (no aggregation was
  substituted).

- **Disposition**: the education block is **dropped for this
  implementation** and spec.md is amended (below). The
  generator renders the block automatically if a future
  refresh adds a verified `education` section to
  `data/outlook.json`. Re-verification path: MISchoolData
  Graduation/Dropout + Student Enrollment Counts reports and
  the IPEDS completions files, read on the sources (a
  live-browser pass or the data-file downloads), then the
  plan.md refresh procedure.

## Amendment recorded (2026-10-06, per plan.md Step 0)

1. FR-003 ships with the **national (U.S. BLS) group only**,
   labeled with the verified vintage **2025–35** (not the
   2024–34 the proposal expected — newer vintage wins). The
   Michigan group is omitted until its table is read on the
   source.
2. FR-004's education block is **omitted** until its
   indicators are verified on their sources at dataset
   precision.
3. The sources & method note sentences are narrowed to match
   what actually ships (BLS projections + computed trend
   deltas only) — narrower than the plan.md draft, never
   broader.
4. The section framing line is narrowed the same way (the
   education clause is dropped).
