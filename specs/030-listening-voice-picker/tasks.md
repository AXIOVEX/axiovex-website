# Tasks — Spec 030 listening-edition voice picker

- [x] T001 — Owner approval: WF-04 amendment + Brian as default
  (Tristen, 2026-10-22); roster narrowed the same day to two
  voices (Brian + Sarah).
- [x] T002 — Builder: roster table, `--voice` / `--all-voices` /
  `--samples` / `--force`, chapters.json merge semantics,
  default pin Wellington → Brian; fidelity gate untouched
  (passes on all six editions).
- [ ] T003 — Back-catalog render: Sarah complete (40 chapters);
  sample clips done (Brian + Sarah); Brian's 40 chapters still
  to render — the ElevenLabs monthly quota was exhausted by the
  pre-narrowing renders (resets 2026-10-27). Five out-of-scope
  voices' renders (162 files, 131,867 chars) deleted
  uncommitted. Completeness verified by verify-voices.mjs
  against the built tree once Brian lands.
- [ ] T004 — Player v4 (voice button + panel + samples + switch
  and resume semantics) and build-site asset bump; pages
  regenerated; page diffs confined to the listening block.
- [x] T005 — Wireframe amendment committed to
  docs/wireframes/wireframes.md; this spec opened.
- [ ] T006 — Privacy §3 edit as its own commit (FR-009).
- [ ] T007 — Staging verification as served: an edition lists
  all 8 voices; every per-voice file serves 200 with plausible
  size; the no-saved-choice default resolves to Brian's files;
  Wellington reachable as an alternate; guards intact
  (staging robots.txt / _headers untouched).
- [ ] T008 — Owner listens + rendered review on staging
  (desktop + mobile: picker closed, open, after a switch).
- [ ] T009 — GATE: production promotion on Tristen's explicit
  say-so only; production re-verified as served; the privacy
  notice from privacy@ confirmed as the single planned send
  for that policy version.
- [ ] T010 — Operating manual (local-axiovex-management)
  listening/voice sections updated to the new state.
