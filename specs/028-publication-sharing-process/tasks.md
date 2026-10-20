# Tasks: Spec 028 — Publication and sharing process (blog → personal LinkedIn → company page)

- [x] T001 **GATE — owner direction.** Tristen directed
  this documentation on 2026-10-20 ("Document the
  posting process… This should be AEE requirement"),
  including the quality expectations, the share flow
  across blog / personal LinkedIn / company page, and
  the ideal times. The same day's rulings supply
  FR-016 (posting from the Muse scheduler, not
  GitHub Actions) and FR-019 (a missed post is not
  caught up late without his explicit say-so).
  **Satisfied by the direction itself** — a process
  document has no wireframe or copy gate. Blocks
  T002–T004 as ordered; all were executed after the
  direction was given.
- [x] T002 Write the spec package on `staging`:
  spec.md (FR-001–FR-023, claims C-028-1..4),
  plan.md, tasks.md. Content check run against the
  requirements as directed: the share chain (blog
  ~09:00 ET truly dated → personal ~10:30 ET →
  company re-share the following Tuesday ~09:30 ET),
  ideal times (Tue–Thu mornings; runway for
  time-sensitive pieces; never stack a morning),
  the quality bar (hook first; plain language;
  numbers exact and traceable; short paragraphs;
  link in the first comment, never the body; ≤3
  hashtags; re-share intros that add a reason to
  read), the time-reference check with its
  2026-10-20 robots-post instance, approval +
  control (verbatim approval; scheduler execution;
  exactly-once; fix in place; no late catch-up),
  verification (article 200 before posting; live
  confirmation + URL recorded after), and roles
  (personal carries originals; company re-shares,
  originals reserved for milestones).
  Consistency pass against spec 007: the two
  touchpoints (series hashtag set, series
  data-forced publish day) are recorded in spec.md
  rather than left as silent conflicts.
- [x] T003 Add the one-screen operational checklist
  to the local skill
  `~/workspace/custom-skills/local-axiovex-management/SKILL.md`
  (§3, after the task index): sequence, times,
  quality bar, time-reference check, verification —
  plus a task-index row pointing to it and to this
  spec. The skill file is local (not in this repo);
  the change is reported alongside the spec commit.
- [x] T004 Commit + push on `staging`, docs-only:
  `specs/028-publication-sharing-process/` only.
  The three files were authored complete in the
  staging worktree and committed verbatim through
  the GitHub API (blob → tree → commit → ref update)
  on 2026-10-20: at authoring time local git object
  writes from the authoring sandbox returned
  "Operation not permitted", and the Muse GitHub
  App's installation on this repo is read-only
  (Contents and Trees APIs both 403), so the parent
  agent landed the commit through the owner's
  established gh route. Verified before commit: the
  worktree's other in-flight changes (a modified
  `sitemap.xml` and untracked future-dated blog
  posts belonging to other workers) are **not**
  part of this commit. No site code changed; no
  live surface affected.
