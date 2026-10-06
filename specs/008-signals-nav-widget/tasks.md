# Tasks: Signals in Nav, Home Highlight + Floating Widget (spec 008)

Proposal package prepared 2026-10-06: wireframes revised
(`docs/wireframes/wireframes.html` + `wireframes.md` revision log)
and this spec package written. **Approved by Tristen 2026-10-06
and implemented the same day** (implementation commit `ab0e4e5`);
all tasks below are complete.

## Gate

- [x] T001 **GATE — Owner approval of the wireframes (Tristen).**
  Scope of the approval: WF-G1 revised (Signals in the nav),
  WF-01 revised (LIVE eyebrow + Pulse mini-strip), WF-G6 / WF-12
  new (floating widget). **Blocks every task below.** Nothing is
  implemented, committed to the live pages, or deployed until
  Tristen approves; if he requests changes, the wireframes are
  revised and re-presented first (constitution §III).
  **APPROVED — Tristen Pierson, 2026-10-06 08:55 EDT: "Approve
  spec 008 wireframes — implement it".**

## Implementation (starts only after T001)

- [x] T002 **Nav (FR-001)**: insert
  `<a href="/signals/">Signals</a>` after Blog in `.nav-links` and
  `.mobile-menu` across all seven page shells (`index.html`,
  `contact/index.html`, `privacy/index.html`,
  `scripts/templates/blog-index.html`, `blog-article.html`,
  `documents.html`, `signals.html`); `aria-current="page"` on the
  Signals template's link in both menus. Grep-verify all seven
  shells × both menus before push.
- [x] T003 **Home highlight (FR-002)**: revise the `buildSignals()`
  home-section string in `scripts/build-site.mjs` — LIVE eyebrow
  with live-dot; `.pulse-strip` under the `<h2>` built from
  `snap.pulse` (reference month + manufacturing employment,
  unemployment, labor-force tiles, `display` values verbatim).
  Bump the site stylesheet to `styles.v25.css` with the strip /
  live-dot styles and update every reference.
- [x] T004 **Widget data (FR-005)**: `buildSignals()` emits
  `signals-widget.json` from the parsed snapshot (updatedUtc,
  Pulse subset, lanes + items); absent snapshot → no file, no
  widget. Confirm the hourly `signals-sync` rebuild refreshes the
  JSON alongside the home block and `/signals/`.
- [x] T005 **Widget assets + mounts (FR-003, FR-004)**: create
  `signals-widget.v1.css` / `signals-widget.v1.js` (pill + panel
  per WF-12; real `<button>` toggle with `aria-expanded` /
  `aria-controls`; ESC collapse with focus return; session-only
  state; safe-area-aware pill; ≤660px capped, internally
  scrolling panel; fetch failure renders nothing). Add the mount +
  asset tags to every page shell **except** the Signals template.
- [x] T006 **Article relevance (FR-006)**: the blog-article
  template's widget mount carries the post's tags; the widget
  script boosts the matching lane (michigan|workforce →
  `michigan`; ai → `ai-standards`) ahead of freshness order;
  Pulse row always first. Test against the workforce article and
  the superintelligence (AI) article.
- [x] T007 **Accessibility + behavior pass (FR-004)**: keyboard
  walkthrough (tab order reaches the toggle; visible focus; ESC
  from inside the panel); `prefers-reduced-motion` honoured;
  z-index check against the sticky nav, the open mobile menu, and
  the article share row; 390px + 834px + desktop widths checked.
- [x] T008 **Rebuild, deploy, verify live (FR-008, FR-009)**:
  build via the normal flow (mind the `/tmp/shared-documents`
  local-build gotcha), push, and verify per plan.md: nav link on
  every page type, mini-strip values byte-equal to
  `data/signals.json`, widget present everywhere except
  `/signals/`, session behavior, HTTP 200s. Confirm the SEO/AEO
  baseline is re-read at the next scheduled monitoring cycle.
- [x] T009 **Close-out**: mark the `docs/wireframes/wireframes.md`
  revision-log entry APPROVED + implemented (with the
  implementation commit), sync the review copy at
  `~/workspace/your_files/axiovex-wireframes/`, and record the
  change in this spec's status line.
