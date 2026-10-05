# Plan: Analytics Reporting (spec 006)

## Architecture

```
Cloudflare GraphQL Analytics API ──┐
check.aeojs.org (weekly) ──────────┼──> report runner (Node, dependency-free)
Seobility (weekly) ────────────────┘        │
                                            ├─> raw snapshot JSON (per run, retained)
                                            ├─> report .md → goal files/reports/
                                            ├─> state.json updated (deltas compound)
                                            └─> chat summary to Tristen
```

One runner script, three cadence modes (`--mode daily|weekly|monthly`).
SEO/AEO checks remain browser-run per the existing runbook (both are
JS-heavy); the weekly cron composes the API snapshot and the browser
check results into one report.

## Components

1. **API token** (T002): dashboard-created, zone-scoped
   (Analytics: Read + Zone: Read on axiovexsystems.com). Stored in the
   Secure Vault; runtime copy in
   `~/workspace/system/website-health/.env` (mode 600, not a git repo).
   Zone ID resolved once via `GET /zones?name=axiovexsystems.com` and
   recorded in the runbook (IDs are not secrets).
2. **Fetcher** (T004): `~/workspace/system/website-health/fetch-analytics.mjs`
   — Node, no dependencies (same house style as build-site.mjs).
   Queries `httpRequests1dGroups` for the requested window + prior
   comparison window; probes `httpRequestsAdaptiveGroups` for top
   paths/countries when the window is within retention. Writes a
   normalized snapshot JSON to the goal's `hidden_files/snapshots/`.
   Fail-closed: API error → non-zero exit, no snapshot written.
3. **Report composer**: the scheduled agent run reads the snapshot +
   state.json (+ browser check results for weekly), writes the report
   markdown, updates state.json, and sends the chat summary. Insights
   and suggestions follow FR-005 labeling.
4. **Schedules** (T007), all owned by goal
   `website-seo-aeo-health-monitoring`:
   - Daily cron ~08:00 ET — API snapshot + daily report.
   - Weekly cron Mondays ~09:00 ET — replaces `website-seo-aeo-weekly`;
     same runbook flow plus the API section (runbook updated to match).
   - Monthly cron on the 1st ~09:00 ET — monthly report.
   - `website-push-check` hook unchanged.

## Verification strategy

- **T003 probe** establishes exactly which GraphQL datasets this
  plan/token can read and their retention, before any report depends
  on them (FR-006 degradation rules apply to anything unavailable).
- **T005 cross-check**: the fetcher's numbers for today + last 7 days
  are compared against the Cloudflare dashboard figures pulled manually
  on 2026-10-05 (same ranges). Mismatches beyond rounding/timezone
  effects falsify the query design and stop the rollout.
- First daily/weekly/monthly outputs are reviewed against FR-002–005
  before the crons are left to run unattended.

## Risks

- Free-plan GraphQL limits (adaptive-group retention, query rate) —
  mitigated by the T003 probe and FR-006 degradation.
- Token leakage — mitigated by vault storage, 600-perm env file,
  zone-scoped read-only permissions; token appears in no output.
- Report noise (ADHD-aware delivery): daily is a digest, not a dump;
  weekly carries the detail; monthly carries the strategy. Anomalies
  are the only daily items allowed to expand.
