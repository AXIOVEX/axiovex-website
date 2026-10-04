# Axiovex Systems blog — authoring guide

The blog is **statically built** by `scripts/build-site.mjs` (repo root). You write
markdown; a GitHub Action renders the pages and commits them; Cloudflare Pages
deploys. There is no `posts.json` and no client-side rendering anymore.

## Adding a new article

1. **Write the article** as markdown in `posts/`, named `YYYY-MM-DD-slug.md`
   (e.g. `posts/2026-10-15-ai-101-recap.md`), starting with front matter:

   ```markdown
   ---
   title: What manufacturing teams actually asked in AI 101
   date: 2026-10-15
   description: One or two sentences shown on the blog index and in search results.
   tags: training, manufacturing
   slug: ai-101-recap
   ---
   Body starts here — no title heading; the page adds it.
   ```

   - `slug`: short, URL-safe, unique. The article URL becomes
     `https://axiovexsystems.com/blog/<slug>/`.
   - `date`: `YYYY-MM-DD`; used for display order (newest first) and the sitemap.
   - `tags`: comma-separated; shown as pills and used by the index search.
   - Supported markdown: `#`–`####` headings, **bold**, *italic*, `code`,
     [links](https://example.com), images, `-`/`1.` lists (one nested level),
     `>` quotes, `---` rules, fenced code blocks, and simple `|` tables.

2. **Commit and push** to `main`. The `site-sync` Action rebuilds the blog
   (index, article page, sitemap) and commits the output; the bot's push
   triggers the Cloudflare Pages deploy. To build locally instead:
   `node scripts/build-site.mjs ~/workspace/shared-documents`.

3. Old `/blog/post?p=<slug>` links keep working — `post.html` is a redirect
   shim to the new `/blog/<slug>/` URLs.

## How it works

- `scripts/templates/blog-index.html` / `blog-article.html` — page shells.
  **Edit the templates, not the generated pages.**
- `blog/index.html` and `blog/<slug>/index.html` — generated output (committed
  by the Action; the generator is deterministic, so re-runs produce no diff
  when nothing changed).
- `blog.v4.js` — the only client script: mobile nav, index search/tag filter,
  and the article share buttons (copy link + native share).
- `blog.v8.css` — blog styling on top of the main site stylesheet.
- Images: put them in `posts/` next to the article and reference them by
  relative path, e.g. `![caption](my-image.png)`.
