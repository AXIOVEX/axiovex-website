# Plan: Spec 032 — Featured Article Presentation

## Approach

The generator (`scripts/build-site.mjs`) already parses
`featured: true` in `parsePost` and orders featured posts first.
This change adds presentation, not new data:

1. **Shared renderer.** One helper builds the featured hero card
   markup from a post object (eyebrow, date via `fmtDate`, title,
   description as excerpt, tag pills, read-more link). A second
   helper wraps it in the surface's `<section>` shell.
2. **Blog index.** `buildBlog()` splits the ordered posts into
   the featured post (first `featured: true`, if any) and the
   rest. The rest render as today's cards into `{{POST_CARDS}}`;
   the featured post renders into a new `{{FEATURED_SECTION}}`
   placeholder in `scripts/templates/blog-index.html`, placed
   between the strata divider and the list section. Empty string
   when nothing is featured.
3. **Home page.** `scripts/templates/home.html` gains
   `<!-- FEATURED:START -->` / `<!-- FEATURED:END -->` markers
   immediately after the hero (the same marker-injection pattern
   as SIGNALS / NLHOME). A `buildFeaturedHome(posts)` step in the
   generator fills them from the same featured post; empty when
   nothing is featured. Called after `buildBlog()` returns the
   ordered posts.
4. **Styles.** New `featured.v1.css` at the repo root (the
   signals-widget.v1.css precedent: a component sheet linked only
   where used). Self-contained `featured-*` classes so the same
   sheet serves both the home page (which does not load the blog
   sheet) and the blog index. Linked from `home.html` and
   `blog-index.html` templates only. No existing stylesheet is
   edited.
5. **Wireframes.** WF-19 added to `docs/wireframes/wireframes.md`
   (inventory + frame description + revision log entry recording
   the owner's 2026-10-23 approval).

## Verification

- Local build in the staging worktree; inspect the generated
  diff (scoped to the expected files).
- Serve the built output locally; Playwright screenshots of
  /blog/ and / at 1280 and 390 widths; inspect.
- Commit + push `staging`; confirm the Cloudflare Pages
  deployment for the exact commit succeeded; fetch the staging
  pages and confirm the featured sections serve, the guards are
  unchanged, and the blog order is otherwise intact.
- Record the newsletter loop verdict for the commit.

## Risks

- The site-sync workflow may rebuild after the push; the
  generator is deterministic, so its output must match the
  committed build byte-for-byte (any drift is a finding).
- `llms-full.txt` regenerates from page `<main>` text, so the
  featured sections' text joins it — expected, generated output.
