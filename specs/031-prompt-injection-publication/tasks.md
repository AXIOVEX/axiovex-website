# Tasks: Spec 031 — "Endorsed by Experts" Whitepaper Publication

- [x] T001 Spec package opened in the website repo from the
  approved outline (spec.md / plan.md / tasks.md / aee-claims.json)
  — this file. Scope + title confirmed by the owner 2026-10-22
  (FR-008: "Endorsed by Experts").
- [x] T002 **GATE — owner approves whitepaper text (FR-001).**
  Satisfied 2026-10-22: owner go ("ASAP") under the document
  pre-authorization, with one directed change — restore the
  "signed-out" detail the polish dropped (owner ruling: accurate
  by design; the deep-research agent runs isolated and signed-out
  — no accounts, no sign-in, no access to the user's data).
  Restoration recorded as Corrections item 9 with its basis.
- [x] T003 Final text: signed-out detail restored in §2 and §5 of
  `whitepaper-draft.md` (package of 2026-10-22); Corrections list
  updated (item 2 cross-reference + item 9 + bottom line).
- [x] T004 Branded PDF produced (FR-002) and visually verified
  against the AI 101 handout: 10 pages, Letter; title page +
  running header/footer in the branding system; every page
  rendered to an image and inspected (title, body, cases,
  checklist, sources pages all clean after one fix — title-page
  meta label column widened). Content markers present in the text
  layer: branded title page, the Exhibit A payload line, and the
  "© 2026 Axiovex Systems, LLC. All rights reserved." footer.
  Final build sha256 recorded in the run report.
- [x] T005 Filed in shared-documents (FR-003): PDF at
  `docs/endorsed-by-experts-prompt-injection.pdf`, sources at
  `src/whitepaper/`, `docs.json` entry (order 3), README +
  CHANGELOG updated. Commit `a2f0457`, pushed.
- [x] T006 Staging verification (FR-004) — COMPLETED 2026-10-22.
  Note: `site-sync.yml` dispatched against `staging` built the
  mirror but its publish step refuses non-main branches
  ("Automated publication is restricted to this repository main
  branch"), so the mirror was built locally in the staging
  worktree (generator output scoped to the documents files only)
  and committed as `20e2168`. Verified on
  staging.axiovexsystems.com: card on /documents/ with the
  approved title/description; PDF 200 + `application/pdf`; served
  bytes byte-identical to the final build (sha256 f8cbb9c9…)
  with the Exhibit A line and © footer in the text layer;
  /documents/ rendered at desktop (1440) + mobile (390) and
  inspected.
- [x] T007 Production publication (FR-005) — COMPLETED
  2026-10-22 under the pre-authorization. Promotion was
  file-level (the house pattern; a branch merge would have
  replayed unrelated staging history): one git-data-API commit
  on `main`, `722cb73`, carrying exactly documents/index.html
  (diff vs. previous main = the new card only), the PDF, and this
  spec package. Guards after the commit: `robots.txt` blob
  c6d05246…, `_headers` blob 7742d340… — both unchanged
  (spec-010 baselines). Served-identity checks on production:
  (1) card rendered on https://axiovexsystems.com/documents/
  with the approved title/description at desktop + mobile;
  (2) PDF 200 + `application/pdf` at
  /documents/files/endorsed-by-experts-prompt-injection.pdf;
  (3) served bytes byte-identical to the final branded build
  (sha256 f8cbb9c9…) — title page, Exhibit A line, and © footer
  markers all present in the served text layer; (4)
  discoverability parity: /documents/ is the indexed unit in
  sitemap.xml (lastmod advanced to 2026-10-22 by the site-sync
  bot's regeneration) and llms.txt routes readers to /documents/
  — the same treatment the AI 101 documents receive.
- [ ] T008 **GATE — blog article (FR-006).** Not in this
  execution. Owner approves the blog draft + staging render and
  sets the go-live date.
- [ ] T009 **GATE — LinkedIn sequence (FR-007).** Not in this
  execution. Copy owner-approved verbatim; personal post on the
  article's day ~10:30 ET (link in first comment); company-page
  re-share the following Tuesday ~09:30 ET; each verified live
  with its URL recorded.
- [x] T010 Close out: spec status + tasks updated with the
  staging/production evidence (this file); outcome reported to
  the owner 2026-10-22. Blog (T008) and LinkedIn (T009) remain
  open as separate owner gates.
