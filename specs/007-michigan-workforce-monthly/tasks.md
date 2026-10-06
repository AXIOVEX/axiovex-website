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

## October 2026 cycle (unexecuted — run by the schedules + gate)

- [ ] T-OCT-01 **Draft** (draft job, Thu Oct 8 ~09:00 ET): pull
  newest BLS MI data (4 series); check
  `~/workspace/michigan-workforce-intelligence` for a new edition;
  draft article + LinkedIn post text in the model format; save to
  `files/workforce-drafts/michigan-workforce-2026-10-draft.md`;
  present to Tristen.
- [ ] T-OCT-02 **GATE — Tristen approves the October draft.**
  Blocks T-OCT-03 onward. No approval → nothing publishes, ping sent.
- [ ] T-OCT-03 **Publish** (Tue Oct 13, article live ~09:00 ET):
  commit approved article to `blog/posts/` on `main`; verify live
  (200 + blog index + sitemap) per FR-007.
- [ ] T-OCT-04 **Personal LinkedIn post** (Tue Oct 13 ~10:30 ET):
  post from Tristen Pierson's profile via signed-in browser; no
  link in body; article URL as first comment; hashtags
  `#Michigan #WorkforceDevelopment #Manufacturing #LaborMarket #AI`;
  verify and capture the post URL.
- [ ] T-OCT-05 **Company re-share** (Thu Oct 15 ~09:30 ET): Axiovex
  Systems company page re-shares the personal post (one-off job
  `michigan-workforce-reshare-2026-10`, created by the publish run);
  verify on the company feed; capture the URL.
- [ ] T-OCT-06 **Cycle report**: article URL, post URL, re-share
  URL, actual dates/times, any deviation + reason — delivered to
  Tristen; state file updated.

## Standing (every cycle)

- [ ] Repeat T-OCT-01 → T-OCT-06 monthly under the date rule
  (Nov 2026: draft Sun Nov 8, publish Tue Nov 10, reshare Thu Nov 12;
  Dec 2026: draft Tue Dec 8, publish Tue Dec 15, reshare Thu Dec 17).
