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

## Remaining duties migrated October 19

- Monthly data-ready publication now creates a source-linked workforce article,
  freezes its source hash, links it in the newsletter and queues social copy.
  Causal interpretation and reviewed research editions remain editorial work.
- LinkedIn has separate personal and company OAuth apps. Personal identity and
  token are saved in GitHub; company association is verified and the Community
  Management access application is in progress. The hourly job validates scope
  and expiry before reserving a post. A committed attempt record plus artifact
  prevents replay after an ambiguous response, even after artifact expiration.
- Weekly newsletter browser CI executes the real signup, confirmation, send,
  unsubscribe and suppression functions with a real browser and official test
  Turnstile keys. Captured mail proves content and lifecycle, not real inbox
  delivery or production Managed-challenge completion. Those live observations
  remain separately required; Mail.Send does not provide mailbox read access.
- Weekly annual-source CI discovers MCDA current workbook links, reads current
  BLS/PSEO releases, advances IPEDS only when both files are available, probes
  the newest completed QCEW year and follows Treasury's current pupil handout.
  Fixed MDE teacher tables are reconciled; CEPI's interactive indicators remain
  dated, reviewed inputs. A newly published MDE article is not automatically
  discovered by re-reading the old article. Unsupported schemas fail visibly.
- The current refresh advanced QCEW to 2025, excluded duplicate second-major
  awards in IPEDS, dated PSEO's 10% coverage as its 2015 estimate, and replaced
  the January pupil figure with the May conference's proposed FY2026–27
  estimate. Teacher enrollment stays 14,819; 17,780 includes completers.
- Historical Muse SEO score state and pre-baseline subscriber history were not
  exported. Missing historical evidence remains unavailable.

The daily audit now checks eight execution workflows, including the three new
jobs. Passing workflow execution is not a claim of company-product approval,
external inbox delivery, or new editorial review.

Live verification also exposed GitHub concurrency pending-run replacement when
unrelated writers shared one group. Each workflow keeps its own queue so a
new site-sync cannot cancel a pending economic refresh. Git rebase/push errors
remain visible rather than being ignored.

Economic refresh verification found FRED HTTP 502 and EIA timeout despite the
outer job succeeding. The CI wrapper now retries only transient failed sources
once, preserves both attempts, and fails the job if any requested source is
still failed or skipped. Successful sources and last-good snapshots survive.
