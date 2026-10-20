# Spec 023 addendum 2026-10-20 (front-card fix) — production promotion record

**Date:** 2026-10-20. **Owner approval:** Tristen, 2026-10-20
("Approve the front-card fix — publish it"), given on the flag
recorded in `../amendment-2026-10-20-wording-corrections.md` after
this morning's four corrections were published. Change definition:
the amendment note's addendum section. Staging verification:
`STAGING-VERIFICATION.md` in this directory (on `staging`, commits
`32d4815`, `c393bff`, `c3131fb`).

## Promotion mechanics — API route (same as this morning)

Committed through the GitHub git-data API (blobs → tree on the
branch tip's tree → commit → ref fast-forward, every write read
back), touching **exactly two paths**: `research/index.html` and
the amendment note. The card text lives only in the page source —
the copy deck carries no Open fronts card copy — so the deck is
unchanged.

- **Production commit:** `7afc28b` on `main`, parent `522a246`
  (the production tip at commit time; `main` had advanced past
  this morning's `8101978` with unrelated work in the interval —
  this commit's diff was verified to touch only the two paths
  above). Its `research/index.html` blob `d6cb1829` is
  byte-identical to the staging-verified blob.
- **Guards by construction:** the commit's tree changes no other
  path, so production `robots.txt` (the Allow version) and
  `_headers` are exactly their pre-promotion blobs; the live
  checks below confirm the unlisting state is unchanged.

## Live production checks (curl, https://axiovexsystems.com, post-deploy)

- `/research/` → HTTP 200; the corrected page was served on the
  second poll after the push (55,122 bytes served).
- **Served-identity check (the new text, verbatim, each matched
  exactly once in the served HTML):** "Program two — working
  software"; "The epistemic ledger is built and in use: a public
  prototype that stores every claim and re-grades the ones new
  evidence touches."
- **Replaced text, zero matches each in the served HTML:**
  "design phase"; "next stage is design work" (each occurred
  exactly once in the pre-change page, in this card only).
- This morning's corrections still served: "keeps its books by
  area" once; "working software, not a sketch" once.
- **Unlisting intact, as designed:** the page keeps
  `<meta name="robots" content="noindex">`; live `/robots.txt` is
  the Allow version; live `sitemap.xml` contains 0 research URLs.
- Homepage spot-check: HTTP 200.

## Visual verification — evidence route (stated plainly)

The production page is the byte-identical blob (`d6cb1829`) that
was screenshot-verified on staging: Playwright captures of the
locally served page at desktop (1280 px) and mobile (390 px)
widths, with rendered-DOM assertions and visual inspection of the
card and the full Open fronts grid, are committed on `staging` in
this same verification directory (`STAGING-VERIFICATION.md` +
six captures; the mobile full-page capture's commit trailed the
others in a closed write-gate window and was landed by the retry
driver noted there). A production-side capture pass was attempted
repeatedly after the promotion and could not run: since
mid-afternoon the VM's write gate has been denying the writes
Chromium needs at startup (crashpad/profile "Operation not
permitted"; the browser exits SIGTRAP before loading any page).
Because the served production bytes are identical to the
staging-verified bytes, the staging captures are the layout
evidence for production as well; the live identity checks above
are the production content truth. A detached retry driver
(`~/workspace/system/writegate/frontcard_retry/`) keeps retrying
the outstanding capture/upload items as the gate window flaps and
logs each landing.
