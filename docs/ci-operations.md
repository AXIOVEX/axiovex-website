# Website operations after Meta Muse

## Authoritative amendment — October 19, 2026

Supersedes conflicting earlier weekly/Wednesday and unconditional calendar
release rules below. Owner directs automatic monthly report and customer
newsletter release after economic releases, normally near the 30th at 10 ET
(February last day), with daily catch-up until the next month-end cycle. The month-end runner
checks actual target-month state + 83-county availability before sending.
Decision OPS-2026-10-19-MONTH-END is recorded in
`docs/decisions/2026-10-19-month-end-publication.md` and project info; executable
policy is `data/publication-policy.json`. Standing authorization covers the
deterministic source-only monthly edition. Discretionary editorial/research,
blog and LinkedIn work retains review; do not manufacture issue approval.

The owner's October 12 .msg is the founder report presentation reference.
Include current subscriber counts, dated net changes and latest-timestamp
flows. Missing history is unavailable, never an assumed zero. Aggregate daily
snapshots begin with this implementation; no reader tracking is added.
Cloudflare traffic uses matching UTC daily windows with daily uniques summed
as visitor-days, complete day coverage and reconciled status totals. Preserve
raw API contradictions and exclude impossible adaptive status findings.
Daily/weekly/monthly reports include a live technical SEO/AEO audit; pinned
aeo.js 0.0.16 supplies independently labeled readiness/citability scores.
Seobility's historical 90 is never represented as a current reading.

Economic/API-secret source inventory: `data/report-sources.json` and
`docs/report-data-sources.md`. All existing pack keys are injected in CI; BEA
key was added and verified the same day (Actions run 39292582186). Actual source vintages remain visible.


The source inventory is specs 006 (analytics + SEO/AEO), 007 (monthly
workforce study/article/social), 014 (map vintages), 019 (analysis pack),
020 (newsletter), 022 (newsletter loop test), 023/024 (unlisted research hub).
Muse stored the old runners, state and credentials outside this repository.
No Muse service is required by the new Actions runners.

## Trigger map

| Work | Original requirement / amended schedule (ET) | CI replacement |
|---|---|---|
| Daily analytics | Every day 08:39, prior day vs trailing 7-day average | `operations.yml`, daily report |
| Weekly analytics + SEO/AEO | Monday 09:39, last 7 days vs previous 7 | weekly report + live technical health |
| Monthly report + newsletter | Near 30th 10 ET, February last day; wait for source release | monthly-publication.yml; check daily until the next month-end cycle |
| Push health | Website changes on main | live technical health |
| Workforce study/draft | 29th 09:39; February last day; prior data month | Docker collect/analyze/build, reviewed-edition verification, LAUS refresh, review artifacts |
| Workforce publication | 30th 09:00; January data publishes March 1 | Human editorial/publication gate; see below |
| LinkedIn personal/company | Publication day 10:30 / following Tuesday 09:30 | Human signed-in steps; no CI browser session migrated |
| Newsletter preparation | 29th 09:39; February last day | workforce + candidate artifacts |
| Newsletter delivery | Monthly, after verified economic releases | monthly-publication.yml; deterministic source-only standing authorization |
| Signals/Pulse | Hourly | Existing `signals-sync.yml`, unchanged |
| Shared documents/blog | Push / every 15 minutes | Existing `site-sync.yml`, unchanged |
| Analysis pack | Monday 12:23 UTC | Existing `data-pack-sync.yml`, unchanged |

Actions schedules are approximate. The runner fires at :39 in UTC hours
12–15; monthly release checks run at :00 in UTC hours 14/15 daily, then gates
on America/New_York local hour and minute. Both DST offsets are
covered with one eligible slot per task per day. Manual dispatch recovers
missed schedules. Gates use the nominal UTC cron slot so runner queue delays
within the day do not silently drop the task. Dispatching reports uses the current date; historical
backfill is not implemented. Concurrency serializes each task.

## Outputs and failures

The job summary carries the report; `website-<task>-<run>-<attempt>` artifacts
carry reports, raw Cloudflare responses and workforce outputs for 90 days.
Download these artifacts to preserve a longer audit trail. They are not
committed or published as website content. GitHub failure notifications
depend on the repository watchers' Actions notification settings.

Missing configuration fails visibly. The analytics collector's exit 2 means
partial evidence. The report runner labels that report PARTIAL and lets it be
delivered; actual API failures, failed health checks and email failures fail
the job. Raw responses survive report/API errors. Official checker scores
are never replaced by a made-up local score. Live health checks preserve the
intentional `/research/` noindex and sitemap/llms exclusion (specs 023/024).

Analytics uses unsampled hourly rollups at ET boundaries in two-day batches.
Live verification confirmed the Free-plan hourly dataset retains only about
three days, so older comparisons use the fallback below. If plan retention
rejects them, a labeled UTC daily fallback is attempted. Adaptive paths,
countries, contact activity and server failures are sampled; hostnames are
retained. Raw unsampled status totals remain authoritative. Distinct visitors
are explicitly unavailable because hourly uniques cannot be summed safely.
Daily request series, observed best/worst days and sampled path movers are
included. Paths absent from a top-100 query are unknown, not zero. External
score history and older adaptive detail still need the Muse state/export.
API results have been exercised with the migrated credential; a separate
dashboard cross-check remains outstanding. Adaptive server-error groups whose
status code has zero authoritative rollup requests are excluded as unconfirmed,
with the raw responses retained (spec 006 phantom-status guard).

## Credentials to migrate (GitHub Actions secrets)

- `CLOUDFLARE_ANALYTICS_TOKEN`: the existing zone-only Analytics Read + Zone
  Read token from the Muse vault; do not use an account administrator token.
- `NEWSLETTER_SEND_SECRET`: the production automation shared secret, already
  configured. It authenticates newsletter sending and the fixed-recipient
  founder report endpoint. No Gmail credentials are used or required.
- `BLS_API_KEY` already exists and is passed to the workforce collector.
  The pack sync's existing keys are unchanged.

Do not paste credentials into issues, PRs, reports or chat. Use GitHub's
Actions secret settings or `gh secret set NAME` with secure stdin.

## Microsoft 365 founder report delivery

CI posts reports to `/api/ops/report`. The endpoint sends from
`newsletter@axiovexsystems.com` to tristen@axiovexsystems.com and
rockson@axiovexsystems.com only. The existing dedicated Newsletter application
and its mail-enabled security scope group remain unchanged. Its
`NEWSLETTER_GRAPH_TENANT_ID`, `NEWSLETTER_GRAPH_CLIENT_ID` and
`NEWSLETTER_GRAPH_CLIENT_SECRET` stay encrypted/configured in Cloudflare Pages;
they are not copied into GitHub. The Contact app and Start mailbox are untouched.
The endpoint refuses unauthenticated requests, staging sends, recipient/sender
overrides and oversized bodies. These internal report emails do not touch the
subscriber list, send ledger, subscriber approval or unsubscribe state.

Daily/weekly/monthly, workforce execution and newsletter preparation reports
are emailed to both founders. Weekly/monthly reports include live technical
health. `mail-delivery.json` records Microsoft acceptance, sender, recipients
and time; the message is saved in Newsletter Sent Items. Graph acceptance is
not proof of inbox delivery. No retry is made after an uncertain mail result.

Reports are rendered as styled HTML, not raw Markdown. `report.html` and
`report.txt` join the original `report.md` and exact raw JSON in CI artifacts.
The renderer escapes source content, creates real tables/headings/lists and
formats request counts and byte units for reading. Source values are unchanged.

`node scripts/ops/preview-email.mjs --kind newsletter --date 2026-10-14`
generates the latest committed customer edition for design review without
sending. Add `--send` only when the owner requests a preview. The authenticated
`/api/ops/preview` route hardcodes tristen@axiovexsystems.com, uses the dedicated
Newsletter sender, and does not access subscriber storage or issue approvals.
The preview is labeled REVIEW ONLY and cannot unsubscribe or distribute to the
list. Monthly source-only editions follow the standing authorization above; discretionary editorial sends require exact-issue approval.

## Discretionary editorial review and manual send (no weekly timer)

1. Download the month-end candidate snapshot and editorial template. Complete
   editorial review, source/cause checks, NDR suppression review and address.
2. Run `node scripts/newsletter/assemble.mjs YYYY-MM-DD editorial.json`.
   Review the rendered email and web edition. The source and email live at
   `newsletter/issues/YYYY-MM-DD.json` and `.email.json`.
3. After Tristen approves those exact bytes, commit a matching
   `newsletter/approvals/YYYY-MM-DD.json`:

   ```json
   {"issue":"YYYY-MM-DD","approvedBy":"Tristen Pierson","approvedAt":"ISO timestamp","sha256":"SHA-256 of the .email.json bytes"}
   ```

   Compute the hash with `sha256sum newsletter/issues/YYYY-MM-DD.email.json`.
   Never manufacture an approval. The approval file records an actual review.
4. Merge the reviewed files before manual dispatch. The manual CLI only accepts
   today's issue, checks the exact-byte approval and calls the existing
   production sender. Missing approval or secret blocks all sending.

An attempt artifact is reserved **before** the sender is invoked. A rerun or
second dispatch for the same date refuses to send, including after an
uncertain partial failure. Inspect the server sends ledger before recovery;
do not delete the reservation to blindly retry. The existing endpoint lacks
per-recipient idempotency; automated partial-send recovery is not implemented.
The sender now fails on recipient failures/throttling instead of declaring
completion. This guard does not cover someone invoking the legacy CLI by hand.

## Workforce review

CI clones the current public research main, records its SHA, uses a fresh
aggregate-only Docker evidence volume and runs the canonical launcher. No
private workstation database is imported. It verifies the existing reviewed
edition and keeps its metadata; a successful build is not a new monthly
reviewed edition. Vintage-specific collectors are not advanced automatically.

Review current state/county release availability, all new Michigan WARN
notices, prior-cycle comparisons, official projection/education vintages,
geo suppression/coverage and every rendered report page. Prepare the article
and social text under spec 007/blog-format.md. The workflow does not invent
interpretive prose, publish a research release, commit an article or post to
LinkedIn. These Muse duties need a reviewer, an approved draft and restored
signed-in access. Newsletter full-loop testing also remains manual: spec 022
depends on Managed Turnstile and signed-in mailbox observations, which a
normal GitHub runner cannot satisfy honestly.

## Activation / verification

Merge the CI branch to main to activate schedules. Run the `health`, `daily`,
`newsletter-draft` and `workforce` dispatches, inspect artifacts and restore
credentials before considering the migration complete. Old Muse timers
cannot be disabled from this checkout; disable them in Muse if it returns,
especially subscriber sends and article/social publishing.

## Monthly release operation

`monthly-publication.yml` owns the release; `operations.yml` cannot dispatch
a monthly/customer send. On each eligible day: refresh existing keyed sources;
verify state + county target month; generate and email the founder report;
render/commit the monthly issue + web edition; wait for verified deployment;
reserve `month-end-attempt-YYYY-MM` before calling the existing active-only
sender. The reservation prevents automatic replay after partial uncertainty.
Manual dispatch respects the same date and source gates. A held source gate
writes evidence and sends nothing; an execution failure fails the job. The
first eligible cycle is September data on October 30. API keys remain in
GitHub; no new Microsoft/Cloudflare administrator permissions are needed.

Subscriber measurements use an authenticated production-only endpoint. It
returns aggregate counts/source totals, latest-timestamp flows, sender gauge
and dated net active changes from saved aggregate snapshots. It never returns
subscriber addresses, confirmation tokens or unsubscribe tokens. Repeated
confirm/unsubscribe history is not reconstructable from the existing schema;
first baseline net change is explicitly unknown.

## Source-refresh verification — October 19

Actions run 39292582186 confirmed the newly added BEA_API_KEY works: all
three BEA series refreshed. FRED, DOL, JOLTS and Scorecard also refreshed;
Census returned unchanged. EIA timed out and kept its last-good snapshot.
The pack runner now records per-source success/failure/skipped state, emits
visible warnings, and retains an artifact rather than implying every source
passed because some did. Manual data-pack dispatch accepts a single source
for isolated verification. The monthly founder report consumes this manifest.
An EIA parsing defect was also corrected: null/blank prices no longer become
zero; actual zero values remain valid.

## Historical traffic coverage correction — October 19

Inspection of the old monthly artifacts found only two returned September
dates and an empty August result. Those are not complete monthly totals or
a zero baseline. Reports now keep observed subsets separate from headline
metrics: a missing full window is unavailable, with no percentage change or
zero-5xx claim manufactured. A partial report can still be delivered.

Authenticated `/api/ops/traffic-archive` saves validated aggregate UTC daily
rollups in D1 and restores them on later runs. The API stores only counts,
status totals, country totals and daily uniques, with a capture timestamp;
no visitor identifiers, URLs, addresses or tracking are stored there. Fresh
Cloudflare rows supersede the same archived day. Raw responses and merged
day evidence remain in CI artifacts. Retained evidence improves future
monthly coverage; it cannot recover data absent before collection began.

Every daily/weekly/monthly report also pulls and verifies all available closed
UTC days in the preceding 90 days before aggregation. This bootstraps the
archive and repairs missed daily collections while the source still retains
them. Current-month missing-date lists and exact round-trip verification are
saved as backfill-verification.json. The archive keeps older saved dates; the
90-day query window does not delete them. An archive/backfill failure makes
coverage partial and remains visible instead of silently claiming persistence.
