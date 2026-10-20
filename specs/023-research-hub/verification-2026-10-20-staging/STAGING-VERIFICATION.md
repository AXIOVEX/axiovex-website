# Spec 023 amendment 2026-10-20 — staging verification record

**Date:** 2026-10-20. **Change:** the four owner-approved wording
corrections (see `../amendment-2026-10-20-wording-corrections.md`).
**Staging commit:** `307e5cd` on `staging` (parent `7b84b15`),
created through the GitHub git-data API because this VM's
intermittent write gate was denying local git object writes; the
commit's diff touches exactly three files (research/index.html,
the copy deck, the amendment note) — verified via the API after
the push. The branch ref was read back at `307e5cd` before any
live check ran.

## Live staging checks (curl, https://staging.axiovexsystems.com/research/)

- HTTP 200; deploy detected on the second poll after the push.
- New text present, exactly once each: "keeps its books by area";
  "no candidate has met the standard yet"; "finding about what
  records can carry"; "Every claim is written down with the test
  that could kill it"; "One study's paperwork needs an honest
  footnote"; "with one documented paperwork repair";
  "0.4637 to 0.3194". "Research notes updated … October 20, 2026"
  present twice (record strip + snapshot line).
- Old text absent, zero matches each: "its strength at a boundary
  depends on area"; "can carry the feeling itself"; "theorem about
  records"; "ledger public and maintained"; "Every study in
  Program one, registered before it ran".
- Guards intact: page `<meta name="robots" content="noindex">`
  present; response headers carry `x-robots-tag: noindex` (the
  staging guard was not disturbed — the change never touched
  `robots.txt` or `_headers`).

## Visual verification — evidence route (stated plainly)

Local Playwright cannot reach public sites from this VM (CONNECT
proxy tunnel failure — standing environment limit), so, as in the
original spec 023 promotion: live content truth from the curl
checks above; layout from Playwright screenshots of the staging
tree served locally (the served `research/index.html` is
byte-identical to the committed staging blob; the stylesheet it
references, `styles.v40.css`, is blob-identical between the local
tree and the staging tip). The page was scrolled through before
capture so reveal-on-scroll sections render.

- `research-desktop-full.png`, `research-desktop-panel.png`
  (1280 px): panel in position, corrected gravity passage renders
  exactly as approved; the new intro parenthetical and the
  preserved finite-model sentence render directly above the panel.
- `research-mobile-full.png`, `research-mobile-panel.png`
  (390 px): single column, clean stacking; the fixed Signals pill
  overlaps the panel crop's bottom edge only (capture artifact,
  already documented in the 2026-10-12 verification; the full-page
  capture shows the panel unobstructed).
- Rendered-DOM assertions passed at both widths: new gravity,
  feeling, footnote, and Program two texts present; old gravity
  text absent. No layout change was made or observed.
