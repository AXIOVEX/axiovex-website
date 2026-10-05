# Plan: Blog Article Share Layout — Top Only, More Air

**Spec**: specs/002-article-share-layout/spec.md

## Changes (after the approval gate)

1. `scripts/templates/blog-article.html` — remove the
   `<div class="post-footer">…{{SHARE_BOTTOM}}</div>` block.
2. `scripts/build-site.mjs` — drop the SHARE_BOTTOM render (keep the
   single-row builder for SHARE_TOP; the `withNative` variant stays the
   top row's form).
3. `blog/blog.v10.css` — copy of v9 with: `.share-row { margin: 22px 0 20px; }`,
   `#post-list { margin-top: 44px; }`, `.post-footer` rules removed;
   templates point at v10.
4. Rebuild via the generator; verify locally (one `.share-row` per
   article, no `.post-footer`, index margin), push, verify live.
5. Mark the wireframe revision approved (docs/wireframes/wireframes.md
   revision log) and close this spec's tasks.

## Verification

- `grep -c 'share-row'` on each generated article = 1; `post-footer` = 0.
- Live fetch of both articles + /blog/ after deploy; AEO/SEO re-check via
  the on-push hook (baseline 100/91).
