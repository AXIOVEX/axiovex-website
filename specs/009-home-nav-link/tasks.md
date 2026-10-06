# Tasks: Home Link in the Home Page Navigation (spec 009)

Proposal package prepared 2026-10-06: wireframes revised
(`docs/wireframes/wireframes.html` — WF-G1 draws both nav
variants, WF-01's nav mock aligned; `wireframes.md` revision log)
and this spec package written. **APPROVED by Tristen 2026-10-06
11:22 EDT and implemented the same day — all tasks below are
complete (implementation commit `11873b1`).**

## Gate

- [x] T001 **GATE — Owner approval of the wireframes (Tristen).**
  **APPROVED — Tristen, 2026-10-06 11:22 EDT: "Approve spec 009
  wireframes — implement it".** Scope of the approval: WF-G1
  revised (variant (a) — the home page nav gains Home as its
  first item, shown current, in the desktop row and the hamburger
  panel; variant (b) — the subpage nav, unchanged) and WF-01's
  nav mock aligned to variant (a).

## Implementation (starts only after T001)

- [x] T002 **Desktop nav (FR-001)**: in `index.html`, insert
  `<a href="/" aria-current="page">Home</a>` as the first child
  of `.nav-links`, before "What we do". No other item, label, or
  order changes.
- [x] T003 **Hamburger panel (FR-002)**: in `index.html`, insert
  the same item as the first child of `.mobile-menu`, before
  "What we do". Header (logo + toggle) untouched.
- [x] T004 **Scope check (FR-004)**: grep `index.html` — exactly
  two occurrences of the new item, each first in its block;
  `git diff` shows `index.html` as the only live-site file
  changed (templates, other shells, generated pages, and
  `styles.v25.css` all byte-unchanged). If the home item renders
  without the current-page treatment, stop and return to plan.md
  — do not fold in a stylesheet change silently.
- [x] T005 **Push + verify live (FR-003, FR-005)**: push to
  `main`, wait for the Pages deploy, then verify: served `/`
  carries Home first in both menus with `aria-current="page"`;
  a click from the home page performs a full reload of `/` and
  lands at the top (no fragment, no script); one subpage's
  served HTML is unchanged; no horizontal overflow at 1440 / 834
  / 390px, and the opened 390px panel lists Home first.
- [x] T006 **Close-out**: mark the `docs/wireframes/wireframes.md`
  revision-log entry APPROVED + implemented (with the
  implementation commit), sync the review copy at
  `~/workspace/your_files/axiovex-wireframes/`, and record the
  change in this spec's status line.

## Completion record (2026-10-06)

Implementation commit `11873b1` — exactly two inserted lines in
`index.html`, nothing else. Live-verified after deploy: served
`/` carries Home first in both `.nav-links` and `.mobile-menu`,
each with `aria-current="page"`; `/blog/` still serves 200 and
its HTML is untouched by the commit (git scope). The home nav is
now item-for-item identical to the subpage nav, which already
renders this exact item set under `styles.v25.css` at desktop,
834px, and 390px — no stylesheet change was needed and none was
made. Clicking Home from `/` is a plain navigation to `/`
(reload, top) by construction — no fragment, no script.
