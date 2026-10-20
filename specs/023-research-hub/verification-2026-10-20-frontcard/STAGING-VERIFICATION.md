# Spec 023 addendum 2026-10-20 (front-card fix) — staging verification record

**Date:** 2026-10-20. **Change:** the Program two front-card fix —
the owner-approved follow-on to this morning's four wording
corrections (see `../amendment-2026-10-20-wording-corrections.md`,
addendum section). **Owner approval:** Tristen, 2026-10-20
("Approve the front-card fix — publish it").
**Staging commit:** `32d4815` on `staging` (parent `3bce23d`),
created through the GitHub git-data API (this VM's intermittent
write gate makes local git object writes unreliable; same route
as this morning's promotion). The commit's diff touches exactly
two files — `research/index.html` and the amendment note — verified
via the API after the push; both blobs were read back
byte-identical to the prepared files. The card text lives only in
the page source (the copy deck carries no Open fronts card copy),
so the deck is unchanged by this fix.

## The change (exactly one card, Open fronts block)

- Heading: "Program two — design phase" → "Program two — working
  software"
- Line: "The epistemic ledger's next stage is design work: the
  schema, the scoring, and a working prototype." → "The epistemic
  ledger is built and in use: a public prototype that stores every
  claim and re-grades the ones new evidence touches."

## Live staging checks (curl, https://staging.axiovexsystems.com/research/)

- HTTP 200; the corrected page was served on the fourth poll after
  the push.
- New text present, exactly once each: "Program two — working
  software"; "The epistemic ledger is built and in use".
- Replaced text, zero matches each in the served HTML: "design
  phase"; "next stage is design work" (each occurred exactly once
  in the pre-change page, in this card only).
- Guards intact: response headers carry the staging site-wide
  `x-robots-tag: noindex, nofollow`; the change never touched
  `robots.txt` or `_headers`.

## Visual verification — evidence route (stated plainly)

Local Playwright cannot reach public sites from this VM (CONNECT
proxy tunnel failure — standing environment limit), so, as in the
original spec 023 promotion and this morning's: live content truth
from the curl checks above; layout from Playwright screenshots of
the page served locally. The locally served `research/index.html`
is byte-identical to the committed staging blob (`d6cb1829`), and
the stylesheets it references (`styles.v40.css`,
`signals-widget.v1.css`) were fetched from the staging tip on
origin. The page was scrolled through before capture so
reveal-on-scroll sections render.

- `research-desktop-full.png`, `research-desktop-frontcard.png`,
  `research-desktop-frontsgrid.png` (1280 px): the Open fronts
  grid renders in position; the corrected card reads exactly as
  approved, styled identically to its three sibling cards.
- `research-mobile-full.png`, `research-mobile-frontcard.png`,
  `research-mobile-frontsgrid.png` (390 px): single column, clean
  stacking; the corrected card renders exactly as approved.
- Rendered-DOM assertions passed at both widths: new heading and
  line present; "design phase" and "next stage is design work"
  absent. No layout change was made or observed.
