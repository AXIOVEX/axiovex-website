# Tasks: Analytics Reporting (spec 006)

- [x] T001 **GATE — Tristen approves these requirements** (spec.md
  FR-001–FR-008 + cadences). Blocks all tasks below.
- [x] T002 Create the scoped Cloudflare API token (Zone → Analytics:
  Read + Zone: Read, axiovexsystems.com only) in the dashboard; store
  in the Secure Vault + runtime env file
  (`~/workspace/system/website-health/.env`, 600, outside git); verify
  with a token-verify call. Token value never in chat or repo.
- [x] T003 Probe the API with the token: resolve the zone ID; confirm
  `httpRequests1dGroups` fields for this zone; probe
  `httpRequestsAdaptiveGroups` coverage/retention on this plan;
  record exactly which FR sections are fully served vs degraded
  (FR-006) in the runbook.
- [x] T004 Build `fetch-analytics.mjs` (daily/weekly/monthly windows +
  comparison windows, normalized snapshot JSON, fail-closed on API
  errors).
- [x] T005 Cross-check the fetcher against the 2026-10-05 dashboard
  pull (today + last 7 days): headline metrics must match within
  rounding/timezone effects; investigate and fix any real mismatch
  before proceeding.
- [x] T006 Report composition: daily/weekly/monthly markdown templates
  per FR-002–FR-005 (facts / insights / suggestions with
  auto-fix vs owner-decision labels), chat-summary format, state.json
  schema extension, and the email step (full report emailed to
  tristen@axiovexsystems.com + rockson@axiovexsystems.com via the
  connected Gmail; subject pattern "Axiovex website — <daily|weekly|monthly> report <date/window>").
- [x] T007 Schedules: daily cron (~08:00 ET), weekly cron (Mon ~09:00
  ET, supersedes `website-seo-aeo-weekly`), monthly cron (1st ~09:00
  ET) — all under goal `website-seo-aeo-health-monitoring`; update
  RUNBOOK.md to the unified flow.
- [x] T008 First runs delivered and reviewed: one daily, one weekly
  (with SEO/AEO section), one monthly baseline (partial-month labeled
  as such); email delivery to both founders verified for each;
  Tristen's feedback folded into the templates.
- [x] T009 Closeout: spec status → implemented; goal GOAL.md updated
  to the daily/weekly/monthly scope; memory note; AEE claims statuses
  updated with probe/cross-check evidence.

Completion notes (2026-10-05): T001 approved by Tristen 2026-10-05.
T002 token "Axiovex Analytics Reporter" (id 42e28fed6fcc85daee5c934033cf96a8),
Zone Analytics:Read + Zone:Read on axiovexsystems.com only, verified active;
runtime copy in ~/workspace/system/website-health/.env (600, outside git).
T003 probe: httpRequests1dGroups full history OK; adaptive retention 31 days
on Free; cachedRequests under-reports (~0) while cachedBytes tracks the
dashboard — reports use the bytes ratio; Pages Metrics tab unreliable for
production (no data despite endpoint hits) — zone GraphQL is authoritative.
T005 cross-check PASSED vs the 2026-10-05 dashboard pull (404: 391 vs 396;
403: 126 vs 128; 405: 45 vs 46; 5xx: 14 vs 14). T007 schedules: daily
website-analytics-daily (~08:39 ET), weekly website-seo-aeo-weekly unified
(Mon ~09:39 ET), monthly website-analytics-monthly (1st ~09:39 ET).
T008 first reports delivered + emailed to both founders: daily 2026-10-04,
weekly 2026-09-28→10-04 (AEO 100 / Seobility 90), monthly 2026-09 (launch).
