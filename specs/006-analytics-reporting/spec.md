# Feature Specification: Analytics Reporting (Cloudflare API + SEO/AEO)

**Feature Branch**: `006-analytics-reporting` (docs/tooling — no website
branch needed until implementation)

**Created**: 2026-10-05

**Status**: Requirements draft — **pending Tristen's approval** (gate
task T001). No implementation before approval.

**Direction (Tristen, 2026-10-05)**: "make sure we can do the analytics
via Cloudflare API. or MCP if available. and set up requirements —
spec-kit aee requirements for this. and we want a daily and weekly and
monthly report full of insights and suggestions including SEO and AEO
as part of this."

## Access audit (2026-10-05, verified)

- **No Cloudflare API token exists** anywhere in this environment: no
  env vars, no wrangler config, no token in any workspace file. All
  Cloudflare work so far (Turnstile, Pages settings, rate limit) was
  done in the dashboard; site deploys run through the GitHub
  integration.
- **No Cloudflare MCP/skill is connected** in this environment.
  Cloudflare publishes official MCP servers externally, but nothing is
  wired up here, and scheduled report jobs need a scriptable,
  token-based API regardless.
- **Decision (per the optimal-path rule)**: the **Cloudflare API** is
  the access path — GraphQL Analytics API for traffic data, REST only
  for zone lookup. MCP is not required and is out of scope unless a
  future need appears.

## What this adds

A reporting system over the AXIOVEX Cloudflare zone
(axiovexsystems.com, account 2f522086aed39057a5c3cc467855a8c9) that
produces **daily, weekly, and monthly** analytics reports, extending —
not replacing — the existing SEO/AEO monitoring (goal
`website-seo-aeo-health-monitoring`, runbook
`~/workspace/system/website-health/RUNBOOK.md`, state
`hidden_files/state.json`). The current weekly SEO/AEO cron folds into
the weekly report; the push-triggered check stays as-is.

## Functional requirements

- **FR-001 — API access, least privilege.** A dedicated Cloudflare API
  token, created once in the dashboard, scoped to the axiovexsystems.com
  zone only: Zone → Analytics: Read and Zone: Read. The token lives in
  the Secure Vault; the report runner reads it from a non-git env file.
  The token never enters any repo, report, or chat message. Recurring
  reports must never depend on dashboard scraping.
- **FR-002 — Daily report** (each morning ~08:00 ET, covering the prior
  day, America/New_York): total requests, unique visitors, bandwidth,
  cache ratio — each with a delta vs the trailing 7-day average;
  requests by status class with every 5xx called out; top 5 paths;
  `/api/contact` activity (requests + status split) now that the form
  is live; one short insights paragraph; any anomaly flagged plainly.
- **FR-003 — Weekly report** (Mondays ~09:00 ET, last 7 days vs the
  prior 7): everything in FR-002 aggregated to the week, plus top
  countries, week-over-week movers (paths gaining/losing most), and the
  **SEO + AEO section**: fresh AEO score (check.aeojs.org) and Seobility
  score with deltas vs `state.json`, open findings carried forward, and
  the runbook's safe-fix policy unchanged (safe technical fixes may be
  applied and reported; claims/branding are surfaced, never edited).
- **FR-004 — Monthly report** (1st of the month ~09:00 ET, previous
  calendar month vs the month before): traffic trend for the month
  (daily series summary), month-over-month deltas on all headline
  metrics, best/worst days, top content for the month (blog articles,
  /signals/, /documents/), SEO/AEO score history for the month, and a
  "next month" recommendations list.
- **FR-005 — Insights and suggestions.** Every report separates
  **measured facts** (numbers from that run's API/check responses),
  **insights** (interpretation: deltas, anomalies, patterns), and
  **suggestions** (prioritized; each labeled *safe to auto-fix* under
  the existing runbook policy or *owner decision*). Suggestions never
  invent benchmarks, traffic figures, or competitor data.
- **FR-006 — Data integrity.** Every number in a report comes from
  that run's API response or check output. If a dataset is unavailable
  (plan limits, retention, outage), the report says so for that section
  — it never estimates, back-fills silently, or reuses stale numbers as
  current. Raw API snapshots are retained per run for audit.
- **FR-007 — Delivery and state.** Each run delivers a concise chat
  summary to Tristen, saves the full report as markdown under
  `~/workspace/goals/website-seo-aeo-health-monitoring/files/reports/`
  (`daily-YYYY-MM-DD.md`, `weekly-YYYY-MM-DD.md`,
  `monthly-YYYY-MM.md`), and **emails the full report to
  tristen@axiovexsystems.com and rockson@axiovexsystems.com**
  (requirement added by Tristen 2026-10-05). Email is sent via the
  connected Gmail (tristen.pierson@gmail.com) in v1 — no new mail
  infrastructure; a dedicated Axiovex sender identity would be a
  separate change. `state.json` is updated with the run's headline
  metrics and snapshot pointers so deltas compound over time.
- **FR-008 — Failure behavior.** A failed run (API error, expired
  token, check unreachable) reports itself as failed with the reason;
  a silently missing report is a defect. Token expiry/rotation is
  surfaced before it breaks a run where the API exposes it.

## Data sources (to be probed in T003)

- GraphQL `httpRequests1dGroups` (zone): requests, bytes, cached
  requests/bytes, uniques, status-code map, per-day — headline metrics
  for all three cadences.
- GraphQL `httpRequestsAdaptiveGroups` (zone): top paths, countries,
  referrers — **free-plan retention/coverage to be verified by probe**;
  sections depending on it degrade per FR-006 if unavailable.
- Pages project metrics (account GraphQL) — optional in v1; include if
  the probe shows them accessible with the same token scope family.
- SEO/AEO: existing check.aeojs.org + Seobility flow (unchanged).

## Out of scope

- Real-user (RUM/Web Analytics beacon) instrumentation — not enabled
  on the site today; adding a beacon is a website change requiring its
  own wireframe/spec cycle.
- Any change to the website itself (this spec is reporting only).
- Logpush / raw log retention (paid-tier territory; not needed for
  these reports).
