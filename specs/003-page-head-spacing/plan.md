# Plan: Page-Head Spacing Rhythm

**Spec**: specs/003-page-head-spacing/spec.md

## Approach (after the approval gate)

The gaps are produced by shared constructions, so the fix is scoped
overrides in one new stylesheet — no markup restructuring:

1. `styles.v22.css` (copy of v21 + a page-head rhythm block):
   - Reduce the head sections' effective bottom spacing so the last
     head text → strata measures 36px on the `.section`-head pages
     (documents, contact, privacy) and on `.blog-hero` (blog index).
     Implementation detail: scope via the existing head structures
     (e.g., `.section-head`-adjacent selectors already present in the
     templates) — final selectors chosen against the templates at
     implementation time, verified by measurement, not by assumption.
   - Add top spacing to the first content section after the strata so
     strata → content measures 40px (documents cards grid, contact
     grid, privacy legal body 48px → 40px).
   - Article: `.post-tags` → strata gap to 36px (margin adjustment in
     the blog stylesheet if needed — blog.v11.css — keeping spec 002's
     share-row values untouched).
2. Repoint stylesheet links (static pages + templates), rebuild via
   `scripts/build-site.mjs`.
3. Verify by measurement (Playwright bounding boxes at 1440px and
   390px) against FR-001/FR-002 values on all five page types; visual
   spot-check of /documents/ against the owner's screenshot.
4. Push, live-verify by the same measurements on the deployed pages,
   mark the wireframe revision approved, close the spec.

## Risks

- `.section` is shared with home-page sections: overrides must be
  scoped to head contexts only. The measurement suite covers the home
  page (hero divider + section tops must be byte-identical in layout).
