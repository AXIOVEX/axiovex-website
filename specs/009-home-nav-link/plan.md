# Plan: Home Link in the Home Page Navigation (spec 009)

**Status: proposal only.** This plan executes only after the
tasks.md T001 gate (Tristen approves the revised wireframes).
Nothing here has been implemented.

## Where the change lives

```
index.html  (static, hand-maintained — the header sits OUTSIDE
             the generated SIGNALS markers, so the site-sync bot
             rebuild preserves it, as it did for spec 008's nav
             insert in the same two blocks)

  .nav-links   (~line 78)  → insert as FIRST child:
      <a href="/" aria-current="page">Home</a>
  .mobile-menu (same header) → insert as FIRST child:
      <a href="/" aria-current="page">Home</a>
```

That is the entire implementation surface: two one-line inserts
in one file.

## What must NOT be touched

- `scripts/templates/` (blog-index, blog-article, documents,
  signals) — their navs already start with
  `<a href="/">Home</a>`, with the page's own item carrying
  `aria-current="page"`. They are the reference implementation,
  not a work item.
- `contact/index.html`, `privacy/index.html` — static shells whose
  navs already start with Home.
- All generated output (blog pages, documents, signals) — never
  hand-edited (constitution §IV); it already renders Home.
- The logo link — unchanged; it stays a second path to `/`.

## Stylesheet: no change expected

Subpages render this exact item — same element, same
`aria-current="page"` attribute — under the current
`styles.v25.css`, including the current-page (cyan) treatment the
wireframes draw. The home item is therefore covered by rules
that already exist, and no version bump is anticipated. If the
verification pass shows the home item rendering without the
current-page treatment, STOP: that would mean a stylesheet
change is needed after all, which returns here for a versioned
bump (`styles.v26.css`) decision before anything ships — it is
not folded in silently.

## Behavior

The item is a plain anchor. From the home page, the browser
performs a full navigation to `/`, the document reloads, and
the viewport lands at the top (no fragment in the target, so
nothing anchors it mid-page). No script is added; the existing
mobile-menu script only opens/closes the panel and closes it on
any link tap, unchanged.

## Build + deploy flow (unchanged machinery)

One small commit on `main` after the gate; Cloudflare Pages
deploys `index.html` as-is (the file is static — no build step
transforms the header). No Action run is required for the header
itself, though the standing push-check monitoring will re-read
the site afterwards on its normal cycle.

## Verification strategy (FR-005)

- Source checks before push: `grep` `index.html` for
  `<a href="/" aria-current="page">Home</a>` — exactly two
  occurrences, each the first child of its nav block; `git diff`
  limited to `index.html` (implementation) — templates, shells,
  generated pages, and stylesheets all byte-unchanged.
- Live checks after deploy: fetch the served `/` and confirm
  Home is the first item of both `.nav-links` and `.mobile-menu`
  with `aria-current="page"`; click it from the home page
  (browser pass) and confirm a full reload landing at the top;
  spot-check one subpage's served HTML against its pre-change
  bytes (unchanged).
- Widths: 1440 / 834 / 390px — the desktop row fits (it is the
  subpages' row, verbatim), no horizontal overflow; at 390px the
  header is logo + hamburger, and the opened panel lists Home
  first.
- Monitoring: nothing new to watch; the next scheduled SEO/AEO
  cycle re-reads the baseline as usual.

## Risks / open points

- **Row width at 834px**: the one real question, and it is
  already answered — every subpage renders this identical
  eight-item row at 834px today (and the nav collapses to the
  hamburger below its breakpoint regardless). The verification
  pass still measures it.
- **Duplicate path to `/`** (logo + Home item): this is the
  subpages' existing, approved pattern — the change makes the
  home page consistent with it rather than inventing a new one.
