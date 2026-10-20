# Spec 023 amendment 2026-10-20 — wording corrections from external review

**Date:** 2026-10-20. **Type:** copy change under spec 023 (no layout
change; no wireframes impact). **Owner approval:** Tristen approved
all four corrections verbatim on 2026-10-20 ("Approve all four —
publish them"). Approved texts originate in the successor program's
record `hub-wording-corrections-2026-10-20-DRAFT.md`, prepared from
an external review of this page received 2026-10-20 and adjudicated
the same day (`external-review-2026-10-20-adjudication.md`).

## The four corrections (applied to the copy deck + research/index.html)

1. **Gravity passage.** The sentence claiming gravity's strength at
   a boundary "depends on area, not volume" is replaced: the area
   pattern is now claimed for what a region of space can hold —
   measured as information, or disorder — sharpest at black-hole
   boundaries. The following paragraph (the extra rule we could not
   derive, proved not to follow) is unchanged.
2. **Feeling side of seeing.** The universal wording ("no record, of
   any kind, in any experiment, can carry the feeling itself") is
   replaced with the survey's actual verdict: no candidate has met
   the program's stated standard yet — not a proof that none ever
   could. Companion edit in framework idea 3: "a theorem about
   records" → "a finding about what records can carry."
3. **Registration in advance.** (a) The Program one intro sentence
   now states the rule in its full form (claim + killing test,
   frozen, registered publicly before the test runs) and points to
   the new note; (b) a footnote paragraph is added under The studies
   (verdict board head): one study's protocol was frozen and first
   submitted before its test ran, but its public registration was
   completed the day after the study closed because the first
   submission's notification email never arrived; the stray first
   registration later went public on its own and has been withdrawn
   as a duplicate, leaving exactly one registration of record;
   (c) the OSF link-card text now carries the same qualification.
4. **Program two status line.** Replaced with the implemented state
   the public ledger repository itself reports: working software,
   public prototype version 0.11.1 (October 2026), append-only
   record, dependency-propagated re-grading, completed measured
   evaluations including the proof-package result (frozen downstream
   error 0.4637 → 0.3194 on identical prompts).

## Execution notes (deviations from the draft's assumptions, recorded)

- The draft was written against the copy deck; the live page's
  Program one intro had since been reworded (2026-10-19 notes
  update) to "The studies on the public register below state their
  claims and tests in advance…". The approved replacement (3a) was
  applied in that sentence's place. The finite-model sentence added
  2026-10-19 ("The separate finite-model report in Latest research
  records a protocol freeze…") is preserved untouched.
- The verdict-board head paragraph (the draft's anchor for note 3b)
  reads "Every study below was registered in advance…" on the live
  page; the approved footnote text was added after it verbatim.
- Bookkeeping: the page's two "Research notes updated" stamps move
  from October 19 to October 20, 2026 — the same currency
  adjustment the 2026-10-19 revision made for its own change. The
  registered-study snapshot date (October 13, 2026) is unchanged,
  as is the dated article layer (the October 19 article keeps its
  own date).
- **Not changed (outside the approved scope, flagged for the
  owner):** the snapshot-layer front card "Program two — design
  phase / The epistemic ledger's next stage is design work: the
  schema, the scoring, and a working prototype" still stands in the
  dated board layer. It is the text the external review originally
  flagged; correction 4 fixed the Program two section's status
  line, not this card. Retiring the card is a separate owner call.

## Flow

Staging first (verified live + Playwright screenshots at desktop
and mobile widths of the staging tree served locally — local
Playwright cannot reach public sites from this VM, standing
environment limit), then promotion to production with the served-
page identity check (new gravity sentence present, old sentence
absent) on https://axiovexsystems.com/research/. Verification
records: `verification-2026-10-20-staging/` and
`verification-2026-10-20-production/`.

## Addendum 2026-10-20 — front-card fix (owner-approved follow-on)

**Date:** 2026-10-20. **Owner approval:** Tristen, 2026-10-20
("Approve the front-card fix — publish it"), given after the four
corrections above were published, on the flag recorded at the end
of this note ("Not changed … flagged for the owner").

**The change (one card in the page's Open fronts block):**

- Heading: "Program two — design phase" → "Program two — working
  software"
- Line: "The epistemic ledger's next stage is design work: the
  schema, the scoring, and a working prototype." → "The epistemic
  ledger is built and in use: a public prototype that stores every
  claim and re-grades the ones new evidence touches."

The card text lives only in the page source — the copy deck
carries no Open fronts card copy — so this change touches
`research/index.html` and this note only; the deck is unchanged.
Same flow as the four corrections: staging first (verified live +
screenshots of the locally served, byte-identical page), then the
identical blob to production with the served-identity check (the
new card line present; "design phase" and "next stage is design
work" absent from the served HTML). Verification record:
`verification-2026-10-20-frontcard/`.
