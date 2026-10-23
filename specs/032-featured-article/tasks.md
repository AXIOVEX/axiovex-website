# Tasks: Spec 032 — Featured Article Presentation

- [x] T001 Spec package opened (spec.md / plan.md / tasks.md /
  aee-claims.json) — this file.
- [x] T002 **GATE — owner approves the design (FR-001…FR-003).**
  Satisfied 2026-10-23: owner direction against the live blog
  index screenshot ("we need to make a top section for featured
  articles and perhaps show feature article section on the home
  page too"), then explicit approval of the presented design:
  "Build both: blog featured section + home page section."
  Wireframes drawn as WF-20 in `docs/wireframes/wireframes.md`.
- [x] T003 Generator: shared featured-card renderer; blog index
  split (hero + list without the featured post); home FEATURED
  marker injection from the same post data (FR-001…FR-004).
- [x] T004 Templates + styles: `{{FEATURED_SECTION}}` in
  blog-index.html, FEATURED markers in home.html, new versioned
  `featured.v1.css` linked from both templates; no existing
  stylesheet edited (FR-005).
- [x] T005 Local build + rendered screenshots (desktop 1280 +
  mobile 390, /blog/ and /) inspected — see the run record in the
  staging commit message / chat report of 2026-10-23.
- [x] T006 Staging deploy verified: Pages deployment for the
  exact commit succeeded; staging /blog/ and / serve the
  featured sections; guards unchanged; blog order otherwise
  unchanged (FR-006).
- [ ] T007 **GATE — owner approves the rendered staging
  screenshots.** Blocking: production promotion (merge
  `staging` → `main`, guards-checked) happens only after this
  gate, in a follow-up execution.
