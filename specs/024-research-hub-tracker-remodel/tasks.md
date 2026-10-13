# Tasks: Spec 024 — Research hub remodel: program-tracker anatomy (`/research/`)

- [x] T001 **GATE — Tristen approves the wireframe + content,
  and decides the two open questions.** The WF-18 (revised)
  frame in `docs/wireframes/`, the full draft page content
  in `tracker-content.md`, and: **OQ-1** — the ledger's
  outcome split as drawn, or record-scale numbers only (the
  spec 023 anti-tally amendment is the counterweight);
  **OQ-2** — public study numbers on board cards (the
  spec 023 FR-004 delta). **Blocks every task below.**
  Production promotion is NOT covered by this gate.
  **APPROVED 2026-10-13** — Tristen approved WF-18
  (revised) and both gate recommendations ("Go with both
  recommendations — approve and build"). The two decisions
  in effect: **(OQ-1)** the numbers ledger carries
  **RECORD COUNTS ONLY** (registered / closed /
  registrations / papers) — the outcome-split bar is
  REMOVED (anti-tally; the outcome distribution lives on
  the verdict board as per-study cards). **(OQ-2)** board
  cards MAY carry the public OSF registration id + DOI
  link as provenance (the evidence address), while
  FR-004's other limits stand (no effect-size headlines,
  no raw framework values; the meaning sentence leads).
- [x] T002 Spec package on `staging`:
  spec.md (FR-001–FR-016, claims C-024-1..6, OQ-1/OQ-2),
  plan.md, tasks.md, and the draft content
  `tracker-content.md`. Content-limit check run against
  the draft: plain language; results as meaning sentences;
  no external attribution; no internal claim labels,
  grades, or process jargon; placeholders marked, nothing
  invented. **Done at drafting except the gate:** content
  gaps G-1..G-6 (tracker-content.md) are resolved from
  the program records and folded into the draft before
  the gate closes. **Gaps resolved 2026-10-13** from the
  program records (per-study VERDICT.md / DIGESTION.md
  files and the 2026-10-12 realignment audit); the
  resolution also corrected several pre-filled draft
  labels and glosses that contradicted those records —
  every correction is listed at the head of
  `tracker-content.md`.
- [x] T003 (after T001) Verify the link + identifier
  registry: fetch every release-row DOI and confirm it
  resolves to the registration its row names (the Study
  026 row lists SR86P — the dead first submission WRP74
  is never listed; the Study 032 row lists Q8TMG, the
  registration of record); take the missing identifiers
  (Studies 011, 018, 028–031, 033) and the
  public-registration count from the OSF parent
  (osf.io/nerxz); re-verify the three primary-material
  links resolve. Drop any identifier that does not
  verify. Record the verified registry in this file.
  **Verified 2026-10-13** via the OSF API (each
  registration fetched individually: state + public +
  title) and doi.org (each DOI fetched; all resolve to
  the osf.io/<id> landing of the registration named).
  Verified registry — Study: id (all accepted + public):
  011 J6PF9 · 012 V8HCY · 018 GH27R · 019 GDN2R ·
  020 2C9YV · 021 4R9WK · 022 NGE74 · 023 DY7U6 ·
  024 67CR9 · 025 8UYJG · 026 SR86P · 027 PJE5M
  (registration of record — final version; earlier
  versions CA6KD and RA8T7 are also public) ·
  028 B8SKX · 029 YRCNX · 030 JRHUA · 031 R5Y2G ·
  032 Q8TMG (re-registration of record; the original
  4RGP7 is NOT public — state `initial` — and is never
  listed) · 033 C5RJM · 034 YWRE8 · 014 (open front /
  prediction) 7N42J. **Study 033 conflict resolved:**
  the identifier in hand from another record, EPHF7,
  resolves to a different program's registration
  ("Spec 033 (Phase-397) — SA-Free Language
  Comparison", the Indus program) — it is NOT this
  program's Study 033 and is not listed; C5RJM is,
  confirmed by title ("What carries the quantum
  Darwinism record texture's robustness…") and by the
  study's own verdict record. (The same cross-program
  collision explains a stray "Spec 032" DOI seen in a
  derived summary: 3HTN8 is that program's Phase-396
  registration, not this one.) Primary-material links
  re-verified 2026-10-13 (all HTTP 200 — success, no
  error): osf.io/nerxz, github.com/AXIOVEX/
  epistemic-ledger, bitconcepts.tech/research/.
  Public-registration count for the ledger: 20 rows
  (the parent project + the registration of record for
  each of the 19 studies).
- [x] T004 (after T001) Stylesheet: author
  `styles.v38.css` — v37 carried forward plus the tracker
  component rules (record strip, status halves, ledger,
  board cards/pills, filter chips, prediction cards,
  stage strip, collapsible articles, release rows, step
  rows) in the site's design tokens. v37 is not edited.
  The research page's stylesheet link moves to v38 at
  T005; no other page's link changes. DONE 2026-10-13.
  (The ledger's stacked bar was dropped at the gate with
  OQ-1 — record counts only — so no bar rules ship.)
- [x] T005 (after T003, T004) Implement on staging: sync
  `main` → `staging` per spec 010 FR-004 (guards verified
  after the merge: `robots.txt` Disallow; `_headers` diff
  vs `main` = exactly the one `X-Robots-Tag` line), then
  rewrite `research/index.html` on its existing shell
  with the approved content — board, predictions, and
  releases transcribed into their single data arrays;
  prose sections from the approved draft; page-local
  rendering script with the no-script note;
  `<meta name="robots" content="noindex">` retained;
  no nav, footer, template, generator, or sitemap
  changes; form count unchanged (WF-G4 strip only).
  DONE 2026-10-13. No sync merge was needed — staging
  already carried the current tree at the spec commit;
  guards verified directly instead (robots.txt = the
  Disallow version; `_headers` diff vs origin/main =
  exactly the one `X-Robots-Tag: noindex, nofollow`
  line). Shell fidelity verified against the shipped
  page: head identical except the v38 stylesheet link;
  the NLFOOTER strip byte-identical; the site build
  leaves the strip untouched.
- [x] T006 (after T005) Verify on staging: Playwright
  renders at desktop + mobile widths, screenshotted
  against the WF-18 revised frame (local serve of the
  staging tree per the standing local-Playwright
  limitation; deployed staging HTML confirmed identical
  by curl). Claim checks C-024-1..6: board/chip/ledger
  figures traced to the arrays; off-scale cards labelled
  and outside every verdict count; one snapshot date in
  all three places; noindex meta in served HTML; staging
  `X-Robots-Tag: noindex, nofollow` header present;
  scratch rebuild → `sitemap.xml` zero `research` URLs,
  `llms.txt` byte-unchanged; rendered nav + footer carry
  no Research link; every outbound link (record strip,
  cards, DOI rows) resolves from the rendered page.
  Fix findings on staging and re-shoot.
  DONE 2026-10-13 — run record:
  `verification/verify_tracker.py`, all assertions
  passed against the locally served staging tree: forms
  = 1, noindex meta = 1, board cards = 20, prediction
  cards = 2, release rows = 20; chip counts computed
  from the board array and click-verified (Confirmed 7,
  Rejected 7, No effect found 3, Inconclusive 1, Still
  running 1, Off the scale 2); the two off-scale cards
  carry dashed labels and sit outside every verdict
  count; the October 13, 2026 snapshot date appears in
  the record strip, the status/ledger block, and the
  closing snapshot line. Rebuild: sitemap 0 research
  URLs, llms.txt byte-unchanged. Rendered nav + footer
  carry no Research link (shell retained verbatim).
  Outbound links: all 19 study DOIs + the protocol DOI
  fetched and confirmed resolving to their registrations
  at T003; the three primary links confirmed 200 (OK —
  the page loaded successfully). One defect found and
  fixed during screenshot inspection: the record strip's
  links overflowed the mobile viewport (nowrap) — they
  now wrap under 640px; re-shot. Screenshots:
  verification/research-desktop.png, research-mobile.png,
  research-mobile-top.png,
  research-board-filtered-rejected.png. Deployed-staging
  check after the push (commit a1edde2): staging
  /research/ serves the new page — HTTP 200 (OK — the
  page loaded successfully), `X-Robots-Tag: noindex,
  nofollow` header present, v38 link + verdict-board
  marker + noindex meta in the served HTML; the only
  byte difference from the worktree file is Cloudflare's
  standard email-obfuscation rewrite of the CTA mailto
  link. styles.v38.css served byte-identical.
- [ ] T007 **GATE — Tristen reviews the remodeled page on
  staging.** Screenshots + staging URL presented.
  Promotion proceeds only on his approval.
- [ ] T008 (after T007) Promote `staging` → `main` per
  spec 010: `robots.txt` diff empty; `_headers` diff =
  production's file only; staging guards re-asserted on
  the sync back. Verify production live: HTTP 200 at
  `/research/`; rendering verified at desktop + mobile
  widths; noindex meta in served HTML; no `X-Robots-Tag`
  response header; production `robots.txt` is the Allow
  version; sitemap still clean; live form count on the
  page is one (the footer strip).
- [ ] T009 (closeout) Spec status + these tasks updated;
  WF-18's revision approval state recorded in
  wireframes.md (the revised frame becomes the frame of
  record); monitoring note carried forward from spec 023
  T009 — `/research/` is INTENTIONALLY UNLISTED (absent
  from nav, sitemap, and llms.txt by design, page-level
  noindex); the monitoring runbook must not flag or "fix"
  any of these. Follow-ups noted, not done here: future
  content updates ride spec FR-016 (statuses refreshed
  from program records, snapshot date moving with them).
