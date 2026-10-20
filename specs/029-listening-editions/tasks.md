# Tasks: Spec 029 — Listening editions (pilot: the robots article)

- [x] T001 **GATE — owner direction.** Tristen reviewed
  the reference format (Joe Santavicca's Listening
  Edition) and the adaptation options on 2026-10-20 and
  chose: "Build the pilot: listening edition of the
  robots article on staging." Satisfied by that
  direction. Production is a separate, later gate
  (T008).
- [x] T002 Write the spec package on `staging`
  (spec.md / plan.md / tasks.md; FR-001–FR-008,
  claims C-029-1..3).
- [x] T003 Write the listening script from the
  published article text: 7 chapters, 6–8 minutes
  spoken, every figure identical to the article
  (C-029-1); chapter cards derived from each chapter's
  narration (C-029-2). Saved at
  `blog/listening/robots-can-do-the-work/script.md`.
- [x] T004 Synthesize one MP3 per chapter (ElevenLabs,
  Daniel — Steady Broadcaster) into
  `assets/audio/robots-can-do-the-work/`; measure each
  duration with ffprobe; write
  `blog/listening/robots-can-do-the-work/chapters.json`.
- [x] T005 Build hook: `{{LISTENING_HTML}}` slot in
  `scripts/templates/blog-article.html`; fill from
  chapter data in `scripts/build-site.mjs` (empty for
  articles without data — C-029-3); player assets
  `blog/listening.v1.css` / `blog/listening.v1.js`;
  generated pilot page updated to match build output.
- [x] T006 Commit to `staging` in logical commits
  (spec; script + audio + data; player + build) via
  the GitHub API — local git object writes are
  unavailable in the current sandbox (standing
  environment note, 2026-10-20).
- [x] T007 Verify on the staging deployment: player +
  chapter data in served HTML; all chapter MP3s 200 /
  audio type; exactly one newsletter form; Trinity +
  Lansing still 404 on staging; production unchanged;
  guard blobs identical. Live-browser listening pass
  by the parent agent (sandbox Playwright cannot reach
  public sites).
- [x] T008 **GATE — owner hears the pilot.** Production
  promotion and any wider rollout are decided by
  Tristen after listening. Not part of this pilot's
  execution.

  **Execution record (2026-10-20):** commits on `staging` —
  spec `674d412`; script + chapter data + audio `0279fb4`;
  player + build hook + generated page `5f22183`. Verified on
  the staging deployment: Listening Edition section in the
  served HTML with 7 chapters / 477.6 s of measured audio;
  all 7 chapter MP3s 200 audio/mpeg; player CSS/JS 200;
  exactly one newsletter form on the page; Trinity and
  Lansing still 404 on staging; staging guard blobs
  unchanged; production (main) untouched — no listening
  section on the production article. Remaining check is
  the parent's live-browser listening pass (T007 note:
  sandbox Playwright cannot reach public sites).

  **Gate record (2026-10-20):** Tristen heard the pilot and approved it —
  "I love it." Production promotion of the robots listening edition is
  approved and executed as the WS2 step of the 2026-10-20 follow-on
  direction (player v3 + blog.v12.css references, file-level promotion;
  production guard blobs verified unchanged). Wider rollout (every
  article, signals briefing) proceeds as separate staged workstreams;
  backfill promotion beyond the robots article remains owner-gated.

## Follow-on workstreams (owner direction, 2026-10-20)

- [x] T009 **WS1 — player v3** (media session, mini-player, resume,
  speed) on staging. Commit 754e9525.
- [x] T010 **WS2 — robots edition promoted to production**
  (file-level; guard blobs verified unchanged; homepage
  byte-identical). Commits cca6895 / d00d600 (+ site-sync).
- [x] T011 **WS3 — Signals Briefing, first edition** on staging
  (2026-10-20 edition, 7 chapters, 5:47) + daily-regeneration
  design drafted (daily-briefing-design.md; NO job created —
  owner blesses the first edition first). Commit 59cac7cc.
- [x] T012 **WS4 — pipeline**: `listening:` template flag +
  build warning, `scripts/build-listening.mjs` generator with
  the number-fidelity gate, spec amendment (FR-009–FR-012).
- [x] T013 **WS4 — backfill batch on staging**: editions for all
  five published posts + both held posts, each gate-passed;
  held posts remain held.
- [ ] T014 **GATE — owner samples the backfill batch** on
  staging. Production promotion of the batch only on his
  say-so (the robots promotion under T010 is unaffected).
