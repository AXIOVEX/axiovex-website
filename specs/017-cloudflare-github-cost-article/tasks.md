# Tasks: Spec 017 — Hosting Costs Article

- [x] T001 Sync main → staging, guards preserved (merge `39dacee`, pushed).
- [x] T002 Spec package (spec.md / plan.md / tasks.md) — this file.
  No wireframes: content-only article on the existing blog template
  (no UI/UX change; constitution wireframe gate not triggered).
- [x] T003 Article written (`blog/posts/2026-10-07-cloudflare-github-website-costs.md`),
  site built (3 articles, sitemap 10 URLs, feed updated), generated diff
  scoped to the article (new page + blog index/feed/sitemap + the other
  articles' "more analysis" links), committed + pushed to staging.
- [x] T004 **GATE — Tristen reviews the article on staging** (plus the two
  LinkedIn drafts). **SATISFIED 2026-10-07: Tristen reviewed and directed
  "Approve — promote to production, then post both LinkedIn items."**
- [x] T005 (after T004) Promotion staging → main per spec 010, production
  verification, then LinkedIn: personal post first, Axiovex Systems
  share of it, article URL as first comment — each under Tristen's
  direction at the time.
  **COMPLETED 2026-10-07.** Promotion: main fast-forwarded to staging;
  guard restoration commit `566513c` put production `robots.txt` +
  `_headers` back (spec 010 FR-004 proof: `git diff fed5a56..HEAD --
  robots.txt _headers` = 0 lines). Production verified live
  (https://axiovexsystems.com/blog/cloudflare-github-website-costs/ —
  200, correct title, no `x-robots-tag`, production sitemap contains the
  article) and screenshot-verified at desktop + mobile against the
  staging captures (identical build).
  LinkedIn (posted 2026-10-07 under Tristen's T004 direction, verified
  live with exact approved text):
  - Personal post (Tristen Pierson), article link as first comment:
    https://www.linkedin.com/feed/update/urn:li:share:7513588651642064897/
  - Axiovex Systems share ("Repost with thoughts"), article link added
    as the share's first comment (the original's comment does not
    surface in share view):
    https://www.linkedin.com/feed/update/urn:li:activity:7513589109395714048/
  Note: LinkedIn automatically rendered a small preview card wherever
  the axiovexsystems.com domain appears in the approved text — its own
  rendering, not an added attachment.
- [x] T006 **Amendment (Tristen direction 2026-10-07, after publication):**
  expand the article with GoDaddy + Namecheap comparisons and database
  + video-streaming options for all stacks. Built and verified on
  STAGING (commit `e9b28ee`); staging presentation made 2026-10-07;
  **PROMOTED 2026-10-07 on Tristen's approval** — main fast-forwarded
  to staging tip `55060e5`, guard restoration commit `c5e4e0a`
  (FR-004 proof: `git diff bb3095a..HEAD -- robots.txt _headers`
  = 0 lines). Production verified live: amended article serves the
  GoDaddy/Namecheap + database/video sections, no `x-robots-tag`,
  production robots `Allow: /`; post-promotion screenshots of the
  production build at desktop + mobile match the staging captures
  exactly (page heights 7,495 / 15,431 px, no overflow).

- [x] T007 **Restructure (Tristen direction 2026-10-07, after T006):**
  fold all hosting comparisons into ONE unified table (all five
  options × cost / domain / bandwidth / firewall / "the honest
  catch"), keep the database and video tables as the adders, and add
  a **pricing disclaimer**: all prices as published on October 7,
  2026, the article's publication date; modeled figures labeled
  modeled. Built + screenshot-verified on STAGING (commit `98c6d4c`,
  no overflow desktop/mobile). **PROMOTED 2026-10-07 on Tristen's
  approval** — guard restoration commit `557437a` (FR-004 proof:
  `git diff c208b29..HEAD -- robots.txt _headers` = 0 lines).
  Production verified live (disclaimer serving, no `x-robots-tag`,
  production robots `Allow: /`); production-build screenshots match
  the staging captures exactly (page heights 8,153 / 15,168 px).

- [x] T008 **Toolkit link (Tristen direction 2026-10-07):** new section
  "Want to do it yourself? Take the toolkit — it's free." linking
  https://github.com/AXIOVEX/website-forge as the AI head start,
  placed before the startup-package offer. Staging `2ae153f`,
  screenshot-verified. **PROMOTED 2026-10-07 on Tristen's direction**
  — guard restoration `19d568a` (FR-004 proof vs `dddf624`: 0 lines).
  Production verified live (GitHub link serving).
