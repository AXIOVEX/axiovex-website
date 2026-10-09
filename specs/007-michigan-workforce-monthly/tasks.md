# Tasks: Michigan Workforce Monthly Article Series (spec 007)

## Build-out (2026-10-06)

- [x] T001 **GATE — Tristen directs the cadence** (monthly Michigan
  workforce article near mid-month; personal LinkedIn first with
  first-comment link; company re-share after; optimal mid-month
  days/times; documented in spec-kit + AEE and as a skill).
  Satisfied by Tristen's direction 2026-10-06. The per-article
  approval gate (FR-004) remains a separate, standing gate.
- [x] T002 Spec package written: `specs/007-michigan-workforce-monthly/`
  (spec.md FR-001–FR-008, plan.md, tasks.md, aee-claims.json); date
  rule + first three cycles' weekdays verified with `date -d`.
- [x] T003 Runbook skill written:
  `~/workspace/skills/michigan-workforce-monthly/SKILL.md`
  (date computation, data pull, model-format drafting, approval
  gate, publish + verify, personal post, company re-share,
  reporting, state, failure handling).
- [x] T004 Schedules created (owner
  `goal:website-seo-aeo-health-monitoring`, delivery chat
  `5cc14312-a580-4d86-ab88-b862cb295c29`):
  - `michigan-workforce-draft` — monthly day 8 ~09:00 ET
    (resolved start :39, matching the spec 006 jobs); next run
    Thu 2026-10-08.
  - `michigan-workforce-publish` — monthly day 12 ~08:45 ET;
    implements the date rule by self-scheduling a one-time publish
    run for the Publish Tuesday; next run Mon 2026-10-12.
  - Reshare one-offs (`michigan-workforce-reshare-<yyyy-mm>`) are
    created per cycle by the publish run.
- [x] T005 Memory: cadence recorded in `~/MEMORY.md` (2026-10-06).

## Study execution + format spec + test run (2026-10-06 amendment)

- [x] T006 **Study pipeline mapped** from the research repo
  (`docs/report-operations.md`, `scripts/reports.py`,
  `scripts/reviewed_evidence.py`, `scripts/release_request.py`,
  `.github/workflows/reports-release.yml`): Pipeline A (Docker
  collect → analyze → build → release) and Pipeline B (reviewed
  research edition → verify → release request → workflow publish →
  asset verification). Recorded normatively in spec FR-009,
  plan.md, and SKILL.md Step 1.
- [x] T007 **Test run — execute the study** (2026-10-06):
  - Pull: research repo `main` → `e15b810`. OK.
  - Verification leg: `reviewed_evidence.py` on the current
    (September) edition — valid: 28 sources, 187 observations, 36
    projection rows, ledger valid. Release
    `reports-2026.09.27.131143Z` assets re-downloaded; all
    SHA-256 checksums matched; manifest source commit `d0fbc71`.
    OK.
  - Collect/analyze/build leg: **BLOCKED** — no Docker runtime on
    this workstation (`docker: command not found`); all Pipeline A
    commands shell out to Docker.
  - New edition: **BLOCKED** — BLS API (2026-10-06) confirms the
    newest Michigan reference month is still August 2026
    (September state LAUS unreleased). No edition fabricated;
    FR-002/FR-009 prohibit repackaging the September edition as
    new.
  - Publish/push-back leg: **not executed** — no new reviewed
    sources exist to publish; a duplicate release of identical
    sources was deliberately not created. The exact commands are
    specified in plan.md for the first cycle with new data.
- [x] T008 **Formal blog format specification** written:
  `specs/007-michigan-workforce-monthly/blog-format.md` (filename,
  front matter, body structure, markdown subset, citation rules,
  validation checklist), referenced from FR-003 and SKILL.md.
- [x] T009 **Test article produced and validated** (NOT published,
  NOT committed to the website repo, NOT posted):
  `~/workspace/goals/website-seo-aeo-health-monitoring/files/workforce-drafts/2026-10-13-michigan-workforce-october-2026.md`
  with test notes beside it
  (`…TEST-NOTES.md`) and the run recorded in
  `hidden_files/workforce-monthly-state.json`. Insights derived
  from the verified September edition + the new national September
  2026 Employment Situation (BLS API). Validation vs
  `blog-format.md`: **format-valid** (record in blog-format.md §7).
- [x] T010 **Skill + draft job amended**: SKILL.md Step 1 now
  executes the study pipeline (FR-009); cron
  `michigan-workforce-draft` body updated to the study-execution
  steps (schedule/owner/delivery unchanged).

## October 2026 cycle — SUPERSEDED by Amendment 4 (2026-10-09)

The October-named cycle below was stood down unpublished on
Tristen's direction (2026-10-09): the advance-approved draft
(August data, `michigan-workforce-2026-10-draft.md`) never
published, and no Oct 13/15 firings exist. The cycle runs instead
as the **September edition** under the Amendment 4 data-month rule
— see the September-edition cycle section that follows.

- [x] T-OCT-01 **Draft** (executed Thu Oct 8): study executed per
  FR-009; draft produced and presented. (This draft is the
  superseded October-named draft; it is not the September edition.)
- [ ] T-OCT-02 → T-OCT-06 **Cancelled** under Amendment 4 — the
  October-named publish (Oct 13), personal post (Oct 13), company
  re-share (Oct 15), and cycle report do not occur.

## September-edition cycle (data month 2026-09 — run by the schedules + gate)

- [ ] T-SEP-01 **Draft** (draft job, Thu Oct 29 ~09:39 ET):
  **execute the study** per FR-009 on September data (state release
  Oct 20 + county/metro revision Oct 28 both landed); draft article
  + LinkedIn post text in the model format per `blog-format.md`,
  titled "Michigan's September workforce data…", slug
  `michigan-workforce-september-data-2026`, carrying the required
  editor's note on the series' new data-month dating; save to
  `files/workforce-drafts/michigan-workforce-2026-09-draft.md`;
  present to Tristen.
- [x] T-SEP-02 **GATE — Tristen approves the September-edition
  draft.** Advance approval granted by Tristen 2026-10-09
  ("I approve"), recorded in the workforce state file
  (draft_approval, 2026-10-09) — the same scope as the October
  cycle's 2026-10-07 approval: the regenerated draft is still
  presented on arrival (Oct 29) for visibility, and T-SEP-03
  onward are authorized on schedule unless he objects after
  seeing it. (The 2026-10-07 approval applied to the superseded
  October-named draft only and did not carry.)
- [ ] T-SEP-03 **Publish** (Fri Oct 30, article live ~09:00 ET):
  commit approved article to `blog/posts/` on `main`; verify live
  (200 + blog index + sitemap) per FR-007.
- [ ] T-SEP-04 **Personal LinkedIn post** (Fri Oct 30 ~10:30 ET):
  post from Tristen Pierson's profile via signed-in browser; no
  link in body; article URL as first comment; hashtags
  `#Michigan #WorkforceDevelopment #Manufacturing #LaborMarket #AI`;
  verify and capture the post URL.
- [ ] T-SEP-05 **Company re-share** (Tue Nov 3 ~09:30 ET): Axiovex
  Systems company page re-shares the personal post (one-off job
  created by the publish run); verify on the company feed; capture
  the URL.
- [ ] T-SEP-06 **Cycle report**: article URL, post URL, re-share
  URL, actual dates/times, any deviation + reason — delivered to
  Tristen; state file updated.

## Standing (every cycle)

- [ ] Repeat the cycle monthly under the Amendment 4 date rule
  (editions named for their data month; draft ~the 29th after the
  county revision; publish ~the 30th; re-share the following
  Tuesday). Next cycles: October edition — draft Sun Nov 29 2026,
  publish Mon Nov 30, re-share Tue Dec 1; November edition — draft
  Tue Dec 29 2026, publish Wed Dec 30, re-share Tue Jan 5 2027.
