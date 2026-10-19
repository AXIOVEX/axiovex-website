# Standing project information

- Newsletter sender: newsletter@axiovexsystems.com, existing dedicated Microsoft
  Newsletter app and scope group. Start is only for contact-form mail.
- Reports are HTML email; Markdown/raw JSON remain audit artifacts.
- Customer newsletter is MONTHLY after required monthly economic releases,
  normally near the 30th. It is not weekly on Wednesday.
- Both monthly report and newsletter wait for actual state + county data.
- Current authoritative decision: docs/decisions/2026-10-19-month-end-publication.md
  (OPS-2026-10-19-MONTH-END); executable settings: data/publication-policy.json.
- Preview emails go only to Tristen. Previewing does not distribute to customers.

- Economic reports and The Axiovex Signal use BLS, FRED, Census, DOL, EIA,
  College Scorecard and BEA analysis inputs plus configured publisher feeds.
  Keys live in repository Actions secrets. Canonical source/secret/collector
  mapping: data/report-sources.json and docs/report-data-sources.md.
- BEA_API_KEY was the only configured pack key absent from the repo secret
  inventory on October 19; owner added it and the live BEA collector passed
  in Actions run 39292582186. It is now configured.
- Founder reports follow the owner's October 12 .msg example: headline table,
  plain-English interpretation, top-path bars, traffic detail, subscriber
  counts/change, insights, suggestions, notes, and live SEO/AEO findings.
- Traffic reports use consistent UTC calendar windows (per that reference),
  daily-unique visitor-days for multi-day periods, and complete unsampled
  rollups. Sampled estimates cannot override authoritative totals.

- Persist validated aggregate daily Cloudflare rollups in D1 via the private
  ops traffic-archive endpoint. Missing historical dates yield unavailable
  monthly totals, never an assumed zero or a complete-month claim.

- SEO/AEO now uses locked Lighthouse, HTML-Validate and aeo.js engines plus
  live crawler checks; Seobility is optional. See docs/seo-aeo-checkers.md.
- Data-ready monthly customer release must send the final edition to Tristen
  first, then active subscribers, with a matching date/hash and Microsoft
  acceptance receipt. Today's October 19 test is only to Tristen and uses
  current snapshots with actual data vintages; it is not a customer release.

- Signals refreshes actual feed content every 15 minutes and BLS Pulse hourly;
  its insight arithmetic is rebuilt from published inputs. County and economic
  pack inputs refresh daily, with their true source vintages retained.
- Breaking-news CI polls configured feeds every five minutes and source-verifies
  narrow significant candidates before activating the existing banner; expiry,
  deduplication and partial coverage are recorded. Decision:
  docs/decisions/2026-10-19-breaking-news-ci.md supersedes Meta Muse approval loop.

- Meta Muse duty inventory: data/operations-duties.json; audit findings and
  residual review/session duties: docs/muse-migration-audit.md. Daily
  migration-audit.yml checks enabled/recent/successful execution. Verification:
  docs/verification/2026-10-19-signals-and-muse-ci.json. Do not claim editorial,
  LinkedIn, annual-vintage review or interactive mail-loop duties are unattended.
- Economic pack refresh retries transient failed providers once and fails on
  any remaining failed/skipped source, retaining both attempts and last-good
  data. All seven pack sources plus county refresh verified in run 39304059527.
