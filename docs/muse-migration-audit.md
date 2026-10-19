# Meta Muse migration audit — October 19, 2026

Scope: website specifications 004, 006, 007, 011–014, 019, 020 and 022;
the existing migration runbook; project decisions; all repository workflows;
and actual GitHub Actions execution history. This inventories the recoverable
repository requirements. Private Muse timers/state not exported into these
sources cannot be independently enumerated or recovered.

Machine-readable inventory: `data/operations-duties.json`. The daily
`migration-audit.yml` checks all five execution workflows are enabled, recent
and successful, retains evidence, and fails on missing/disabled/overdue/failed
workflows. Success of an outer workflow does not imply every source succeeded;
source-specific coverage remains in the collector artifacts.

## Gaps closed

| Finding | Resolution |
|---|---|
| Breaking checker existed only as a Meta Muse task | Five-minute GitHub feed poll and source verification, narrow automatic publication, URL deduplication, 12-hour expiry, committed audit trail |
| Signals refresh only hourly | Real RSS/API headline ingestion every 15 minutes; BLS Pulse hourly; unchanged values do not create a fake refresh |
| Pack refresh weekly and did not rebuild public content | Daily keyed pack + county reads and site rebuild; updated manufacturing context and county-range insights are computed from actual values |
| County fetch ignored revisions in the current month | Compare published values and preliminary flags, not just reference month |
| Failed geo refresh could exit successfully without status | CI gets an explicit status artifact and failed job while retaining last-good data |
| No recurring migration coverage check | Daily workflow audit with freshness thresholds and an explicit duty inventory |
| New Lighthouse failure looked like robots syntax regression | Exact artifact showed `Timed out fetching resource`; bounded retry retains both raw attempts; persistent timeout is unavailable evidence, never an invented markup defect or passing score |

## Existing automatic duties verified in source

Daily analytics and subscribers; weekly comparisons and independent SEO/AEO;
data-gated monthly report and newsletter; final preview to Tristen before the
active-subscriber send; persistent aggregate traffic archive; evidence-study
execution; shared-document synchronization; blog/feed/sitemap generation.

## Remaining review/session dependencies

- Workforce research interpretation, cause claims, new reviewed editions,
  article and social editorial approval remain review tasks. CI executes the
  evidence pipeline, sends its review instructions to the founders and retains
  artifacts; it does not manufacture a new reviewed release.
- LinkedIn personal/company publication has no signed-in CI publisher or token.
  This was not migrated as an automatic publishing job.
- The full newsletter Managed Turnstile/confirmation/unsubscribe browser loop
  and actual inbox observation need an interactive browser/mailbox. CI covers
  API, fixed-recipient preview, rendering and sender behavior. Microsoft
  acceptance is not proof of inbox delivery.
- Annual projections, education and annual geographic vintages remain clearly
  dated review inputs. A fixed-year collector is not a latest-vintage service.
- Historical Muse SEO score state and subscriber history were not exported.
  Missing history remains unavailable; new measurements are retained forward.

These are explicit residual duties, not a claim that every old Muse activity
has become fully unattended. The current implementation removes Muse from
automatic website monitoring and deterministic publication.
