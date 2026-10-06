# Tasks: Home Link in the Home Page Navigation (spec 009)

Proposal package prepared 2026-10-06: wireframes revised
(`docs/wireframes/wireframes.html` — WF-G1 draws both nav
variants, WF-01's nav mock aligned; `wireframes.md` revision log)
and this spec package written. **PENDING OWNER APPROVAL — nothing
below the gate is done, and nothing is implemented.**

## Gate

- [ ] T001 **GATE — Owner approval of the wireframes (Tristen).**
  Scope of the approval: WF-G1 revised (variant (a) — the home
  page nav gains Home as its first item, shown current, in the
  desktop row and the hamburger panel; variant (b) — the subpage
  nav, unchanged) and WF-01's nav mock aligned to variant (a).
  **Blocks every task below.** Nothing is implemented, committed
  to the live pages, or deployed until Tristen approves; if he
  requests changes, the wireframes are revised and re-presented
  first (constitution §III).

## Implementation (starts only after T001)

- [ ] T002 **Desktop nav (FR-001)**: in `index.html`, insert
  `<a href="/" aria-current="page">Home</a>` as the first child
  of `.nav-links`, before "What we do". No other item, label, or
  order changes.
- [ ] T003 **Hamburger panel (FR-002)**: in `index.html`, insert
  the same item as the first child of `.mobile-menu`, before
  "What we do". Header (logo + toggle) untouched.
- [ ] T004 **Scope check (FR-004)**: grep `index.html` — exactly
  two occurrences of the new item, each first in its block;
  `git diff` shows `index.html` as the only live-site file
  changed (templates, other shells, generated pages, and
  `styles.v25.css` all byte-unchanged). If the home item renders
  without the current-page treatment, stop and return to plan.md
  — do not fold in a stylesheet change silently.
- [ ] T005 **Push + verify live (FR-003, FR-005)**: push to
  `main`, wait for the Pages deploy, then verify: served `/`
  carries Home first in both menus with `aria-current="page"`;
  a click from the home page performs a full reload of `/` and
  lands at the top (no fragment, no script); one subpage's
  served HTML is unchanged; no horizontal overflow at 1440 / 834
  / 390px, and the opened 390px panel lists Home first.
- [ ] T006 **Close-out**: mark the `docs/wireframes/wireframes.md`
  revision-log entry APPROVED + implemented (with the
  implementation commit), sync the review copy at
  `~/workspace/your_files/axiovex-wireframes/`, and record the
  change in this spec's status line.
