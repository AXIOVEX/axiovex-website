# Feature Specification: Home Link in the Home Page Navigation

**Feature Branch**: `009-home-nav-link` (documentation only
until the approval gate passes — implementation lands on `main`
through the normal flow)

**Created**: 2026-10-06

**Status**: **Proposed — PENDING OWNER APPROVAL.** The wireframes
(WF-G1 revised, WF-01 nav mock aligned) are drawn and marked
pending; nothing is implemented. Implementation starts only when
Tristen approves (tasks.md T001).

**Direction (Tristen, 2026-10-06)**: "show home button on the main
page too, not just when leaving the page. clicking home from the
home page simply refreshes and scrolls to the top."

## The gap

Every subpage's navigation starts with **Home** (`<a href="/">`),
and the page being viewed carries the current-page treatment
(`aria-current="page"` — Blog on the blog pages, Signals on
`/signals/`, and so on). The home page is the one exception: its
desktop row (`.nav-links`) and hamburger panel (`.mobile-menu`)
in `index.html` start with "What we do", and the only way back to
`/` from the home page's chrome is the logo. A visitor who has
scrolled to the FAQ and opens the menu gets no Home item — the
nav is not the same object from page to page.

## What this adds

One link, on one page: **Home** as the first item of the home
page's navigation, in both menus, carrying the same current-page
treatment subpages give their own item. After the change the home
nav is item-for-item identical to the subpage nav.

## Design reference (wireframes, this proposal)

- **WF-G1** (revised): the frame now draws both variants
  explicitly — variant (a) the home page nav with Home first,
  shown current (cyan, `aria-current="page"`), in the desktop row
  and first in the hamburger panel list; variant (b) the subpage
  nav, unchanged. Labeled "spec 009 — PENDING OWNER APPROVAL".
- **WF-01** (nav mock aligned): the home frame's drawn nav gains
  Home first, matching variant (a). No other frame changes —
  WF-02 / WF-07 draw only the collapsed header (logo + hamburger),
  which is untouched.

## Functional requirements

- **FR-001 — Home first in the home desktop nav.** `index.html`'s
  `.nav-links` gains exactly one item as its first child:
  `<a href="/" aria-current="page">Home</a>`, before "What we do".
  Every other item, label, target, and order is unchanged, and the
  row then matches the subpage row item-for-item (Home · What we
  do · About · FAQ · Blog · Signals · Documents · Contact CTA).
- **FR-002 — Home first in the home hamburger panel.**
  `index.html`'s `.mobile-menu` gains the same item as its first
  child: `<a href="/" aria-current="page">Home</a>`, before
  "What we do". The panel's remaining order and the full-width
  Contact CTA at the bottom are unchanged. The mobile header
  itself — logo + hamburger toggle — is not touched.
- **FR-003 — Behavior from the home page.** The new item is a
  plain link to `/`. Clicking it from the home page performs a
  normal full navigation to `/`: the page reloads and lands at
  the top. No fragment (`/#…`), no JavaScript handler, no
  scroll script, no smooth-scroll interception is added or
  involved; the mobile menu's existing close-on-tap behavior
  applies to it exactly as to every other panel link.
- **FR-004 — Nothing else changes.** Subpages, templates, and
  generated pages already carry Home and are **not** modified.
  No stylesheet change: subpages render this exact item today
  under `styles.v25.css`, including the current-page styling, so
  the home item is covered by the rules that already exist. No
  visual or layout change beyond the one added item — the desktop
  row must still fit without overflow at desktop and tablet
  (834px) widths, which it already does on every subpage at those
  widths; below the nav-collapse breakpoint the header is logo +
  hamburger and is unaffected.
- **FR-005 — Gate + verification.** No implementation before
  Tristen approves the revised wireframes (tasks.md T001). After
  implementation, verification is live (constitution §V): the
  served `/` HTML contains Home as the first item of both menus
  with `aria-current="page"`; a click from the home page reloads
  `/` at the top; the other pages' served HTML is unchanged; no
  horizontal overflow at 1440 / 834 / 390px.

## Claims discipline

Not applicable beyond this statement: the change adds a
navigation label and nothing else. It asserts no capability,
certification, partnership, statistic, or other claim, and it
changes no copy anywhere on the site (constitution §I).

## Out of scope

- Any change to subpage navigation (it already has Home) or to
  the footer, breadcrumb, or logo link.
- A scroll-to-top control, fragment-based "home" behavior, or any
  JavaScript for this item (FR-003 is deliberately plain
  navigation).
- Any restyle of the nav, the current-page treatment, or the
  collapse breakpoint.
