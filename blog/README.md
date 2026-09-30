# Axiovex Systems blog — authoring guide

The blog lives entirely in this folder and needs **no build step**. Add a markdown
file, list it in `posts.json`, push — Cloudflare Pages serves it as-is.

## Adding a new article

1. **Write the article** as markdown in `posts/`, named `YYYY-MM-DD-slug.md`
   (e.g. `posts/2026-10-15-ai-101-recap.md`). Body only — no front matter needed.
   Supported markdown: `#`/`##`/`###` headings, **bold**, *italic*, `code`,
   [links](https://example.com), images, `-`/`1.` lists (one nested level),
   `>` quotes, `---` rules, fenced code blocks, and simple `|` tables.

2. **Register it** in `posts.json` (newest first). Copy this and fill it in:

   ```json
   {
     "slug": "ai-101-recap",
     "title": "What manufacturing teams actually asked in AI 101",
     "date": "2026-10-15",
     "description": "One or two sentences shown on the blog index and in search results.",
     "tags": ["training", "manufacturing"],
     "file": "posts/2026-10-15-ai-101-recap.md"
   }
   ```

   - `slug`: short, URL-safe, unique. The article URL becomes
     `https://axiovexsystems.com/blog/post.html?p=<slug>`.
   - `date`: `YYYY-MM-DD`, shown on the article and used for display order.
   - `tags`: shown as clickable pills; keep them short and reuse existing ones
     when they fit.

3. **Commit and push** to `main`. The article is live once Cloudflare Pages
   deploys (usually under a minute). No stylesheet or config changes needed.

## How it works

- `index.html` — blog home with instant search (title, description, tags).
- `post.html?p=<slug>` — renders one article from its markdown file.
- `blog.js` — zero-dependency markdown renderer, search filter, and share
  buttons (X, Facebook, LinkedIn, email, text message, copy link, plus the
  native share sheet on mobile).
- `blog.css` — blog styling on top of the main site stylesheet.

## Notes

- Keep `posts.json` valid JSON (no trailing commas). The blog home shows a
  friendly error if it can't be read.
- Images: put them in `posts/` next to the article and reference them by
  relative path, e.g. `![caption](my-image.png)`.
- The sitemap (`../sitemap.xml`) should gain the new article URL; update
  `lastmod` when you add posts.
