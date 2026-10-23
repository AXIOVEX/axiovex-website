# Feature Specification: Featured Article Presentation — blog hero section + home page section

**Feature Branch**: `staging` per spec 010; promotion is a merge
`staging` → `main` after the owner's rendered-screenshot approval
(gate in tasks.md).

**Created**: 2026-10-23

**Status**: IMPLEMENTED ON STAGING 2026-10-23 — owner design
approval on record (below); production promotion awaits the
owner's approval of the rendered staging screenshots.

**Direction (owner, 2026-10-23)**: the blog already carries a
`featured: true` front-matter flag (added 2026-10-23 with the
"Measure space" explainer build); the featured post
("Endorsed by experts", 2026-10-22) sorts first on /blog/ but its
card looks identical to every other card, and the home page does
not surface it at all. Owner direction, given against a
screenshot of the live blog index: *"the top article/blog is
featured right? if so, we need to make a top section for featured
articles and perhaps show feature article section on the home
page too."* Presented with the design below, the owner approved:
**"Build both: blog featured section + home page section"**
(2026-10-23). Wireframes: WF-20 in `docs/wireframes/`.

## Requirements

- **FR-001 — Blog featured section.** /blog/ renders a distinct
  FEATURED section above the chronological list: a full-width
  hero card for the post flagged `featured: true` — "FEATURED"
  eyebrow label, date, larger headline, excerpt, tags, and a
  "Read article →" link — styled distinctly from the normal
  post cards within the existing dark/teal palette.
- **FR-002 — No duplication.** The featured post does NOT also
  appear in the chronological list below the hero. Every other
  post keeps its current newest-first order; the post count and
  search behaviour over the list are unchanged.
- **FR-003 — Home featured section.** The home page renders a
  Featured article section driven by the SAME featured flag and
  the SAME post data (title, date, excerpt, tags, article link),
  placed after the hero. The page's existing sections are
  unchanged and the section adds NO newsletter form (one form
  per page rule intact).
- **FR-004 — Data-driven, no hard-coding.** Both surfaces are
  produced by the generator from the post's front matter. Moving
  `featured: true` to another post updates both surfaces on the
  next build with no template or HTML edits. If no post is
  featured, both sections render nothing.
- **FR-005 — Stylesheet discipline.** New styles ship in a NEW
  versioned stylesheet (`featured.v1.css`); no existing
  stylesheet is edited in place; every affected template links
  the new sheet.
- **FR-006 — Guards + scope.** Staging-only until the owner
  approves the rendered screenshots. Staging guards untouched
  (robots Disallow blob, `_headers` guard line). No production
  change in this spec's execution.

## Acceptance

- Staging /blog/ source shows the FEATURED section carrying the
  "Endorsed by experts" post and a chronological list without it.
- Staging / source shows the Featured article section linking
  the same article.
- Rendered screenshots (desktop 1280 + mobile 390, both pages)
  inspected: hero reads as featured, no overlap or unstyled
  elements, mobile stacks cleanly.
- Newsletter loop verdict on the staging commit: PASS 10/10.
