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
   listening:
     enabled: true
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

## Listening editions (spec 029 — every article ships with one)

Every blog article carries a spoken **listening edition** on its own page.
The front-matter flag above (`listening: enabled: true`) records that the
article ships with one; the assets live at:

- `blog/listening/<slug>/script.md` — the narration script of record, and
- `blog/listening/<slug>/chapters.json` — the chapter data the build reads,
- `assets/audio/<slug>/ch-01.mp3 …` — one MP3 per chapter.

The player appears when `chapters.json` exists and the flag is not
`enabled: false`. If the flag is on but the data file is missing, the build
logs a warning naming the post — a missing edition is loud, not silent.

To produce an edition for a new article:

1. **Draft the script** at `blog/listening/<slug>/script.md` in the format
   documented at the top of `scripts/build-listening.mjs` (the robots
   article's script is the worked example). Drafting is the human/agent
   step: hook first, plain language, chapters at the article's natural
   section breaks, every figure traceable to the article, ~130 words per
   minute, target 5–9 minutes. Tables become spoken summaries of their
   key rows — never cell-by-cell readings.
2. **Run the generator:** `node scripts/build-listening.mjs <slug> --all-voices`.
   It first runs the **number-fidelity gate** — every number in the
   script (digits or spelled out) must appear in the article text; on a
   mismatch it fails loudly, lists the figures, and synthesizes nothing.
   Fix the script, never the gate. On a pass it synthesizes the chapter
   MP3s in every narrator voice (ElevenLabs; spec 030 roster — Brian is
   the default voice at the flat `assets/audio/<slug>/` paths, the
   other voices live in `assets/audio/<slug>/<voice-id>/`), probes
   durations, and writes `chapters.json`. A plain invocation without
   `--all-voices` renders the default voice only — that is the daily
   Signals Briefing flow, which stays single-voice. `--check-only`
   runs the gate without audio.
3. **Commit** the script, `chapters.json`, and MP3s with the article.
   Promotion to production follows the normal owner gate (spec 029).

## How it works

- `scripts/templates/blog-index.html` / `blog-article.html` — page shells.
  **Edit the templates, not the generated pages.**
- `blog/index.html` and `blog/<slug>/index.html` — generated output (committed
  by the Action; the generator is deterministic, so re-runs produce no diff
  when nothing changed).
- `blog.v4.js` — the only client script: mobile nav, index search/tag filter,
  and the article share buttons (copy link + native share).
- `blog.v9.css` — blog styling on top of the main site stylesheet.
- Images: put them in `posts/` next to the article and reference them by
  relative path, e.g. `![caption](my-image.png)`.
