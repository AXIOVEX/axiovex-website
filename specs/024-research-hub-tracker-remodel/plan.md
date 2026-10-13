# Plan: Spec 024 — Research hub remodel: program-tracker anatomy

1. **Spec first.** This package (spec.md / plan.md / tasks.md /
   tracker-content.md) records the owner's 2026-10-13
   direction: remodel `/research/` after the BitConcepts
   research tracker page
   (bitconcepts.tech/research/indus-script/) — its anatomy
   (record strip, status box, numbers ledger, data-driven
   verdict board with filter chips and off-scale labels,
   registered predictions with dated notes, framework/audit
   section, collapsible dated articles, open fronts,
   archived releases, method section, ownership + snapshot
   footer) re-housing the Axiovex hub's own content. The
   model contributes structure and design language only; no
   content crosses over. Both programs stay; every spec 023
   content rule stays except the two deltas the gate decides
   (spec.md OQ-1, OQ-2).

2. **Wireframes first (UX change).** WF-18 is revised in
   `docs/wireframes/wireframes.html` + `wireframes.md` in
   this same package: the **WF-18 (revised)** frame is drawn
   alongside the approved WF-18 frame (which stays as the
   record of the live design until the remodel ships) and
   marked PROPOSED — PENDING OWNER APPROVAL. Shell elements
   are unchanged (WF-G1 nav with no Research item, strata
   WF-G2, reduced CTA band, WF-G4 footer with no Research
   link). Tracker sections are drawn at the site container
   measure (~1120px); prose sections keep the centered
   ~760px editorial column; mobile is the same order in one
   column with the ledger at 2×2 then 1-wide, the board
   single-column, the status halves stacked; tablet follows
   WF-09. The review copy at
   `~/workspace/your_files/axiovex-wireframes/` is re-synced
   byte-identically.

3. **Owner approval gate (tasks.md T001 — BLOCKING).**
   Tristen approves the WF-18 revised frame and the draft
   content in `tracker-content.md`, and decides OQ-1
   (ledger outcome split vs record-scale numbers only) and
   OQ-2 (public study numbers on board cards). Nothing is
   implemented before this gate; the content gaps G-1..G-6
   are resolved from the program records and the resolved
   text folded into `tracker-content.md` before or at the
   gate, so what is approved is the whole page text.

4. **Link and identifier verification (tasks.md T003).**
   Every DOI and outbound target in the content is fetched
   and confirmed: each release row's DOI resolves to the
   registration the row names; the three primary-material
   links re-verified (spec 023 registry precedent). An
   identifier that cannot be verified is dropped from the
   draft, never carried on trust.

5. **Stylesheet (tasks.md T004).** The tracker components
   need new CSS (record strip, status halves, ledger +
   stacked bar, board cards/pills/chips, prediction cards,
   stage strip, article blocks, release rows, step rows).
   It ships as the new versioned file **`styles.v38.css`**
   (the v37 rules carried forward + the new component
   rules), never an in-place edit of v37; the research page
   links v38. All other pages keep their current link —
   the bump is page-scoped for this spec. Rendering script
   for the board / predictions / releases stays page-local,
   fed by the single data arrays (spec FR-006/007/012),
   with the no-script note pointing to the OSF record.

6. **Implement on `staging` (tasks.md T005).** Sync `main`
   → `staging` per spec 010 FR-004 (guards verified after
   the merge), then rewrite `research/index.html` on the
   existing shell with the approved content transcribed
   into the data arrays and prose sections. No generator
   change (the page stays hand-authored; `writeSitemap()`
   untouched), no nav/footer/template edits, no other page
   touched. The 2026-10-13 one-form-per-page build change
   is unaffected — the page keeps exactly its WF-G4 strip.

7. **Verify on staging (tasks.md T006).** Playwright
   screenshots at desktop and mobile widths against the
   WF-18 revised frame (local serve of the staging tree,
   per the standing local-Playwright limitation; the
   deployed staging HTML confirmed identical by curl).
   Checks: every claim C-024-1..6 — chip counts vs the
   array, off-scale labels, one snapshot date, noindex meta
   in served HTML, staging `X-Robots-Tag` header present, a
   rebuild leaves `sitemap.xml` with zero `research` URLs
   and `llms.txt` byte-unchanged, nav + footer carry no
   Research link, all outbound links resolve from the
   rendered page, form count unchanged. Findings fixed on
   staging, re-shot.

8. **Owner staging review (tasks.md T007 — GATE).**
   Screenshots + staging URL presented; promotion only on
   Tristen's approval.

9. **Promote (tasks.md T008).** Merge `staging` → `main`
   per spec 010: `robots.txt` diff empty, `_headers` diff =
   production's file only, staging guards re-asserted on
   the sync back. Verify production live the same way as
   step 7, plus: no `X-Robots-Tag` header on production,
   production `robots.txt` is the Allow version.

10. **Close out (tasks.md T009).** Spec status + tasks
    updated; WF-18's revision marked with its approval
    state in wireframes.md and the approved frame becomes
    the frame of record for the page; the monitoring note
    from spec 023 T009 stands (the page is intentionally
    unlisted — the weekly run must not flag it). Content
    currency thereafter rides spec FR-016: statuses
    refreshed from program records, snapshot date moving
    with them, at every update.
