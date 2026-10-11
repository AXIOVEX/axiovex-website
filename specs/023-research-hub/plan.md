# Plan: Spec 023 — Research hub page (`/research/`, unlisted)

1. **Spec first.** This package (spec.md / plan.md / tasks.md /
   research-hub-copy.md) records the owner's 2026-10-11 direction:
   a research hub at `/research/`, published *quietly* — unlisted
   (not in nav, not linked from anywhere on the site), noindex,
   excluded from the sitemap — with a plain-English summary of the
   projected-constraints program (RCPH, named on the page under the
   owner's approval), a substantial framework section, the
   epistemic-ledger program, and three verified outbound links
   (GitHub, OSF, BitConcepts research).
2. **Wireframes first (UX change).** WF-15 is added to
   `docs/wireframes/wireframes.html` + `wireframes.md` in this
   same package, drawn on the WF-05/WF-14 shell: WF-G1 nav
   (unchanged — no Research item), centered page head, strata
   (WF-G2, spec 003 rhythm), findings segments and framework
   segments in the centered ~760px editorial column, the status
   panel, a four-step method row, three link cards, the reduced
   CTA band, and WF-G4 footer (unchanged — no Research link).
   Mobile is the same order in one column; tablet follows WF-09.
   The review copy at `~/workspace/your_files/axiovex-wireframes/`
   is re-synced byte-identically.
3. **Owner approval gate (tasks.md T001 — BLOCKING).** Tristen
   approves WF-15 and the copy draft. Nothing is implemented
   before this gate. Copy approval is the whole gate: the approved
   text of research-hub-copy.md is what ships, verbatim.
4. **Implement on `staging`.** Merge `main` → staging per spec 010
   (guards verified), then branch the page from staging:
   hand-author `research/index.html` on the `privacy/index.html`
   shell — same head structure and versioned stylesheet links,
   with `<meta name="robots" content="noindex">` in place of the
   standard index meta, page-local `<style>` for the status panel
   and link cards (privacy precedent), JSON-LD WebPage schema.
   No generator change, no nav/footer/template edits, no
   stylesheet release. `writeSitemap()` is not touched.
5. **Verify on staging.** Playwright screenshots at desktop and
   mobile widths against WF-15; served-HTML checks: noindex meta
   present; a staging rebuild leaves `sitemap.xml` with no
   `research` URL and `llms.txt` byte-unchanged; nav and footer
   contain no Research link; all three outbound links resolve
   from the rendered page. Findings fixed on staging, re-shot.
6. **Owner staging review (tasks.md T007 — GATE).** Screenshots +
   staging URL presented; promotion only on Tristen's approval.
7. **Promote.** Merge `staging` → `main` per spec 010: `robots.txt`
   diff empty, `_headers` diff = production's file only. Verify
   production live (HTTP 200 at `/research/`, rendering desktop +
   mobile, noindex meta in the served HTML, sitemap still clean).
8. **Close out.** Spec status + tasks updated, wireframes brought
   current with what shipped (WF-15 approval state recorded in
   wireframes.md), monitoring note: the weekly SEO/AEO run should
   not flag the page's absence from nav/sitemap as a defect —
   record the page as intentionally unlisted in the spec so the
   runbook policy can see it.
9. **Follow-ups (outside this pass, recorded in tasks.md T009).**
   (a) The back-link from the AXIOVEX/epistemic-ledger repo to
   https://axiovexsystems.com/research/ (separate repo, separate
   change — not edited here). (b) The inbound link from the
   BitConcepts research page (parallel effort). (c) Status-count
   updates to the panel ride this spec as copy changes, through
   staging, whenever the owner supplies new figures.
