# Tasks: Analytics Reporting (spec 006)

- [ ] T001 **GATE — Tristen approves these requirements** (spec.md
  FR-001–FR-008 + cadences). Blocks all tasks below.
- [ ] T002 Create the scoped Cloudflare API token (Zone → Analytics:
  Read + Zone: Read, axiovexsystems.com only) in the dashboard; store
  in the Secure Vault + runtime env file
  (`~/workspace/system/website-health/.env`, 600, outside git); verify
  with a token-verify call. Token value never in chat or repo.
- [ ] T003 Probe the API with the token: resolve the zone ID; confirm
  `httpRequests1dGroups` fields for this zone; probe
  `httpRequestsAdaptiveGroups` coverage/retention on this plan;
  record exactly which FR sections are fully served vs degraded
  (FR-006) in the runbook.
- [ ] T004 Build `fetch-analytics.mjs` (daily/weekly/monthly windows +
  comparison windows, normalized snapshot JSON, fail-closed on API
  errors).
- [ ] T005 Cross-check the fetcher against the 2026-10-05 dashboard
  pull (today + last 7 days): headline metrics must match within
  rounding/timezone effects; investigate and fix any real mismatch
  before proceeding.
- [ ] T006 Report composition: daily/weekly/monthly markdown templates
  per FR-002–FR-005 (facts / insights / suggestions with
  auto-fix vs owner-decision labels), chat-summary format, state.json
  schema extension.
- [ ] T007 Schedules: daily cron (~08:00 ET), weekly cron (Mon ~09:00
  ET, supersedes `website-seo-aeo-weekly`), monthly cron (1st ~09:00
  ET) — all under goal `website-seo-aeo-health-monitoring`; update
  RUNBOOK.md to the unified flow.
- [ ] T008 First runs delivered and reviewed: one daily, one weekly
  (with SEO/AEO section), one monthly baseline (partial-month labeled
  as such); Tristen's feedback folded into the templates.
- [ ] T009 Closeout: spec status → implemented; goal GOAL.md updated
  to the daily/weekly/monthly scope; memory note; AEE claims statuses
  updated with probe/cross-check evidence.
