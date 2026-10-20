# Plan: Spec 029 — Listening editions (pilot)

1. **Spec first.** This package scopes the pilot before
   any code: one article (robots), staging only, the
   script-discipline rules (FR-001/002), the player shape
   (FR-004), and the production gate (FR-006).

2. **Script from the published text.** The narration is
   written from `blog/posts/2026-10-10-robots-can-do-the-work.md`
   as published — seven chapters, ~1,050 spoken words.
   Chapter cards (kicker / headline / 3 points / takeaway)
   are written from the same chapter text, so script,
   cards, and audio cannot drift apart. The script is
   kept in the repo at
   `blog/listening/robots-can-do-the-work/script.md`.

3. **Audio per chapter.** Narration is synthesized with
   ElevenLabs (voice: Daniel — Steady Broadcaster), one
   MP3 per chapter under `assets/audio/robots-can-do-the-work/`.
   Each file's duration is measured (ffprobe) and recorded
   in the chapter data — the player's totals and progress
   math run on measured durations, never estimates.

4. **Chapter data as the gate.** `blog/listening/<slug>/chapters.json`
   holds, per chapter: kicker, headline, points, takeaway,
   audio path, measured duration. Its presence is the only
   switch (FR-005).

5. **Build hook.** `scripts/templates/blog-article.html`
   gains a `{{LISTENING_HTML}}` slot above the article
   body; `scripts/build-site.mjs` fills it from the
   chapter data when present (empty otherwise). The
   generated page for the pilot article is updated in the
   same commit so staging — which serves committed
   output — shows exactly what the build emits.

6. **Player assets.** `blog/listening.v1.css` and
   `blog/listening.v1.js` (versioned per FR-008): one
   `<audio>` element plays the chapter files in sequence;
   the card swaps on chapter change; the chapter list
   seeks; progress is edition-wide.

7. **Verification on staging.** Served-identity checks on
   the staging deployment: the Listening Edition section
   present in the served HTML; every chapter MP3 returns
   200 with an audio content type; exactly one newsletter
   form; held posts (Trinity 2026-10-21, Lansing
   2026-10-27) still 404 on staging; production article
   and homepage unchanged; guard blobs byte-identical.

8. **Owner gate.** Tristen listens on staging. Production
   promotion, further articles, and any recurring cast
   are decided from what he hears — none is pre-approved
   by this plan.
