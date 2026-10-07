# Plan: Spec 017 — Hosting Costs Article

1. Sync `main` → `staging` first (staging was behind on spec 006
   docs + signals refresh), preserving the staging guard files
   (`robots.txt` Disallow, `_headers` + noindex line). Done:
   merge `39dacee`, guards verified after merge.
2. Add this spec package (spec/plan/tasks) on staging.
3. Write the article markdown per blog/README.md authoring flow.
4. Build locally: `node scripts/build-site.mjs ~/workspace/shared-documents`;
   confirm the generated diff is exactly: new article page, blog
   index, sitemap (+1 URL). Commit source + generated output.
5. Push `staging`; wait for the Pages deploy; verify the article
   live on staging.axiovexsystems.com (200, correct title/meta,
   guards still noindex) and screenshot desktop (1440) + mobile
   (390) with Playwright against the live staging URL.
6. Present: staging link + screenshots + LinkedIn drafts (personal
   post + company share) to Tristen. **Stop. Owner gate.**
7. Only after approval: promotion merge per spec 010 (FR-004 guard
   proofs), production verification, then LinkedIn posting under
   Tristen's direction (article URL as first comment).
