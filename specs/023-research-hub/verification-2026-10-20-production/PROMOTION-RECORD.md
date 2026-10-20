# Spec 023 amendment 2026-10-20 (wording corrections) — production promotion record

**Date:** 2026-10-20. **Owner approval:** Tristen approved all four
corrections verbatim on 2026-10-20 ("Approve all four — publish
them"). Change definition: `../amendment-2026-10-20-wording-corrections.md`.
Staging verification: `../verification-2026-10-20-staging/`
(commit `8b3c77b` on `staging`).

## Promotion mechanics — API route (deviation from the 2026-10-12 pattern, recorded)

The 2026-10-12 promotion fast-forwarded `main` to the staging tip
locally and restored the production guard files. That route was
not available this time, for two recorded reasons:

1. **The VM's intermittent write gate** was denying local git
   object writes throughout the session (the same restriction
   documented in AGENTS.md on 2026-10-20; it also zeroed a working
   file during a retried `git checkout` — recovered byte-exact
   through the file tools). Local commits never landed; read
   operations were unaffected.
2. **The branches had diverged.** `staging` carried unrelated,
   not-yet-promoted work (specs 028/029 packages, two future-dated
   blog posts the build holds until their dates). A staging→main
   fast-forward or merge would have carried all of it into
   production.

The change was therefore committed through the **GitHub git-data
API** (blobs → tree on the branch tip's tree → commit → ref
fast-forward, every write read back), touching **exactly three
paths** on each branch: `research/index.html`,
`specs/023-research-hub/research-hub-copy.md`, and the amendment
note. Staging first (`307e5cd`, parent `7b84b15`), verified live,
then the identical blobs onto production.

- **Production commit:** `84d6ccb` on `main`, parent `bdbc08a`
  (the pre-promotion production tip). Its `research/index.html`
  blob `62ef8ffd` is byte-identical to the staging-verified blob.
- **Guards by construction:** the commit's tree changes no other
  path, so production `robots.txt` (blob `78acb8c`, the Allow
  version) and `_headers` (blob `7742d34`) are exactly their
  pre-promotion blobs — confirmed by API before the commit and by
  the live checks below. The staging guards were likewise never
  touched: `staging`'s `robots.txt` / `_headers` are not among the
  changed paths, and the live staging response still carries its
  `x-robots-tag: noindex, nofollow` guard.
- Local worktrees were left behind the origin tips by this route;
  re-syncing them is bookkeeping that does not affect either live
  site (pre-existing uncommitted state found in the staging
  worktree was preserved at `~/workspace/staging-wt-preserve-2026-10-20/`
  before any work began).

## Live production checks (curl, https://axiovexsystems.com, post-deploy)

- `/research/` → HTTP 200; the corrected page was served on the
  first poll after the push.
- **Served-identity check (the new text, verbatim, each matched
  exactly once in the served HTML):** "A pattern like that shows
  up in real physics in a famous place: the most a region of space
  can hold — measured as information, or disorder — grows with
  the area of its boundary, not with its volume. Black holes are
  where physics was first forced to face this, and nobody has ever
  fully explained why nature keeps its books by area." Also
  present once each: "no candidate has met the standard yet";
  "finding about what records can carry"; "Every claim is written
  down with the test that could kill it"; "One study's paperwork
  needs an honest footnote"; "with one documented paperwork
  repair"; "0.4637 to 0.3194". "Research notes updated … October
  20, 2026" present twice.
- **Replaced text, zero matches each in the served HTML:** "its
  strength at a boundary depends on area"; "can carry the feeling
  itself"; "theorem about records"; "ledger public and
  maintained"; "Every study in Program one, registered before it
  ran".
- **Unlisting intact, as designed:** the page keeps
  `<meta name="robots" content="noindex">`; production `_headers`
  carries its standing path rule `/research/* → X-Robots-Tag:
  noindex` (the hub's by-design unlisting — distinct from the
  staging site-wide guard, and unchanged by this promotion); live
  `/robots.txt` is the Allow version; live `sitemap.xml` contains
  0 research URLs.
- Homepage spot-check: HTTP 200, title rendering normally.

## Visual verification — evidence route (stated plainly)

Local Playwright cannot reach public sites from this VM (CONNECT
proxy tunnel failure — standing environment limit), so the
evidence is split, as in the original spec 023 promotion:

- **Live content truth:** the curl identity checks above, run
  against the live production URL.
- **Layout:** Playwright screenshots in this directory —
  `research-desktop-full.png`, `research-desktop-panel.png`,
  `research-mobile-full.png`, `research-mobile-panel.png` — of
  the page served locally. The locally served file is
  byte-identical to the production-served blob (`62ef8ffd`), and
  the stylesheet it references (`styles.v40.css`, blob
  `7528a1a`) is identical on `main`, `staging`, and the local
  tree, so the render is layout-faithful. The page was scrolled
  through before capture (reveal-on-scroll sections); rendered-DOM
  assertions passed at both widths (new texts present, old gravity
  text absent). Desktop: panel in position, corrected passages
  clean. Mobile: single column, clean stacking; the fixed Signals
  pill overlaps the mobile panel crop's bottom edge only (capture
  artifact documented since the 2026-10-12 verification).
