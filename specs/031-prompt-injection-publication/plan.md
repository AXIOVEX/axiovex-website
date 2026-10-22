# Plan: Spec 031 — "Endorsed by Experts" Whitepaper Publication

Execution scope (owner go 2026-10-22, "ASAP"): the whitepaper
**document only** (FR-001…FR-005, FR-008, FR-009). Blog (FR-006)
and LinkedIn (FR-007) are separate owner gates and are not
executed here.

1. **Text final (FR-001).** Restore the "signed-out" detail per
   the owner's ruling — plainly, in the paper's voice — in §2
   (incident anatomy) and §5 (what stopped it); record the
   restoration + basis as item 9 of the draft's Corrections list.
   No other text changes.
2. **Build the PDF (FR-002).** Typeset in the Axiovex branding
   system verified from the AI 101 handout (navy #081F32, steel
   #405B70, cyan #00DEF6, near-white #F7FCFF; Noto Sans body,
   Noto Serif Bold display headings; © footer). Production route
   matches the handout's: styled HTML → Chromium print-to-PDF,
   merged with the running header/footer. Render every page to an
   image and visually inspect (title page, a body page, the
   checklist page at minimum); fix defects and re-render until
   clean.
3. **File in shared-documents (FR-003).** PDF under `docs/` as
   `endorsed-by-experts-prompt-injection.pdf`; build sources under
   `src/whitepaper/`; `docs.json` entry at order 3; README +
   CHANGELOG notes. Commit + push.
4. **Spec record (this package)** on the website repo's `staging`
   branch: spec.md / plan.md / tasks.md / aee-claims.json.
5. **Staging mirror + verification (FR-004).** Dispatch
   `site-sync.yml` against `staging` (the bot clones
   shared-documents HEAD, rebuilds, commits the mirror). Verify
   staging.axiovexsystems.com/documents/: card with the approved
   title/description; the PDF serves 200 + application/pdf; served
   bytes carry the title-page + © footer markers (text-extract and
   byte-compare against the final build). Screenshot /documents/
   at desktop (1440) + mobile (390).
6. **Promotion (FR-005).** Merge `staging` → `main` per spec 010;
   before pushing, prove the merge diff for `robots.txt` is empty
   and for `_headers` is exactly production's security file.
   Push; Pages deploys production.
7. **Production served-identity verification (§Authorization).**
   All four checks on https://axiovexsystems.com: (1) card on
   /documents/ with the right title/description (rendered check);
   (2) PDF 200 + application/pdf at its /documents/files/ URL;
   (3) served bytes proven to be the final branded build (content
   markers / byte-compare), not liveness; (4) discoverability
   parity with the AI 101 documents (sitemap + llms.txt
   treatment). Record results + commit shas in tasks.md.
