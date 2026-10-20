# Scheduler / Actions sorting — owner rule, October 20, 2026

Owner rule (Tristen Pierson, 2026-10-20): work that needs judgment or an
owner decision stays in the Muse scheduler; mechanical, deterministic
work runs in GitHub Actions; an Action that performs a public act on its
own, with no human gate, is removed or gated.

Applied the same day:

1. `linkedin-publish.yml` is removed. Posting to LinkedIn in the owner's
   name is an owner-gated act. It runs from the Muse scheduler with
   verbatim owner-approved copy (the workforce cycle's personal post and
   company re-share, and one-off article posts). The helper scripts and
   policy file (`scripts/ops/linkedin.mjs`,
   `scripts/ops/linkedin-authorize.mjs`, `data/linkedin-policy.json`,
   `data/publications/`) stay in the repo, unused by CI: their safeguards —
   identity preflight, token scope and expiry checks, and a durable
   exactly-once reservation recorded before any POST — are the checklist
   the scheduler jobs mirror.

2. `monthly-publication.yml` is reduced to the monthly report. It still
   gates on the month's economic data, builds the monthly analytics report
   including website health, and emails it to both founders. It no longer
   publishes the newsletter issue or web edition, no longer publishes the
   source-only workforce brief, and never sends the customer newsletter.
   Those are public acts and return to the owner-gated scheduler process
   (the workforce publish job publishes only an owner-approved edition;
   the customer newsletter send follows the per-issue approval record in
   `newsletter/approvals/`). This narrows the October 19, 2026
   authorization in `docs/decisions/2026-10-19-month-end-publication.md`:
   the data gate and the founders' report stay automatic; the release
   does not. `scripts/ops/month-end.mjs` keeps its publish/preview/send
   modes for the human-gated process; CI no longer calls them. Timing:
   the first cycle under the October 19 authorization would have been
   September data on October 30, 2026, so the change must be merged
   before that date or the workflow disabled until it is.

3. The `signals-sync.yml` breaking-news step now runs in detect-only mode
   (`BREAKING_MODE=detect` in `scripts/ops/breaking.mjs`). The five-minute
   checks, source verification and candidate records are unchanged and
   are kept as run artifacts; the step never writes `data/breaking.json`
   or `data/breaking-state.json`. Banner activation returns to the
   scheduler judgment check and the owner's approval, as spec 012
   originally required. This narrows
   `docs/decisions/2026-10-19-breaking-news-ci.md`: frequent Signals
   refresh stays; automatic banner publication does not. Signals content
   freshness is unchanged — only banner activation changes, and an
   activated banner still expires on schedule (the visitor code hides an
   expired banner even if a deployment is delayed).

Unchanged: `operations.yml` was audited for autonomous acts and has none —
its email step sends only the internal founders' reports, its newsletter
task prepares drafts and candidates and never sends, and its workforce
task executes the study and publishes nothing. Data refreshes, syncs,
rebuilds and tests stay in Actions. Article drafting, breaking-news
qualification, workforce editorial publication, LinkedIn posting and
owner reminders stay in the Muse scheduler.
