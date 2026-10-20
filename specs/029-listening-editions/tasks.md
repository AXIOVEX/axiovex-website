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
- [ ] T003 Write the listening script from the
  published article text: 7 chapters, 6–8 minutes
  spoken, every figure identical to the article
  (C-029-1); chapter cards derived from each chapter's
  narration (C-029-2). Saved at
  `blog/listening/robots-can-do-the-work/script.md`.
- [ ] T004 Synthesize one MP3 per chapter (ElevenLabs,
  Daniel — Steady Broadcaster) into
  `assets/audio/robots-can-do-the-work/`; measure each
  duration with ffprobe; write
  `blog/listening/robots-can-do-the-work/chapters.json`.
- [ ] T005 Build hook: `{{LISTENING_HTML}}` slot in
  `scripts/templates/blog-article.html`; fill from
  chapter data in `scripts/build-site.mjs` (empty for
  articles without data — C-029-3); player assets
  `blog/listening.v1.css` / `blog/listening.v1.js`;
  generated pilot page updated to match build output.
- [ ] T006 Commit to `staging` in logical commits
  (spec; script + audio + data; player + build) via
  the GitHub API — local git object writes are
  unavailable in the current sandbox (standing
  environment note, 2026-10-20).
- [ ] T007 Verify on the staging deployment: player +
  chapter data in served HTML; all chapter MP3s 200 /
  audio type; exactly one newsletter form; Trinity +
  Lansing still 404 on staging; production unchanged;
  guard blobs identical. Live-browser listening pass
  by the parent agent (sandbox Playwright cannot reach
  public sites).
- [ ] T008 **GATE — owner hears the pilot.** Production
  promotion and any wider rollout are decided by
  Tristen after listening. Not part of this pilot's
  execution.
