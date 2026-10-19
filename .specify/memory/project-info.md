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
  docs/verification/2026-10-19-signals-and-muse-ci.json. See the October 19 remaining-duties decision for the source-only article,
  hourly LinkedIn publisher, weekly annual refresh and browser lifecycle CI.
  Company API approval and actual mailbox observation remain separate gates.
- Economic pack refresh retries transient failed providers once and fails on
  any remaining failed/skipped source, retaining both attempts and last-good
  data. All seven pack sources plus county refresh verified in run 39304059527.

- Remaining-duty implementation: docs/decisions/2026-10-19-remaining-duties.md.
  LinkedIn personal app 264153192 and company-only app 264163092; the latter's
  Axiovex Page association is verified. Never attach Share/OIDC to the company
  app: LinkedIn requires Community Management to be its only product.
  Tokens stay in Actions secrets, IDs/expiry in variables. No posts are sent
  merely to test authentication. Expiry warnings begin 14 days ahead.
- Annual collector: scripts/ops/annual-refresh.mjs + annual-tables.py. MDE pinned
  articles and interactive CEPI inputs have explicitly limited discovery;
  never claim the whole education source universe is automatically refreshed.
- Newsletter browser evidence uses public test Turnstile and captured messages;
  it does not represent real inbox receipt. No production bot bypass.

- Owner approved Microsoft Platform Policies and delegated Mail.Read/User.Read/
  offline_access for Tristen only on October 19. App: Axiovex Newsletter Delivery
  Verification, client ID 832e46b9-6552-4ee3-a4ab-5d58f97cae5d; single Axiovex
  tenant 7792b718-1c9e-4924-b52d-37b846119458. No application-wide Mail.Read.
  Authorization uses a temporary localhost PKCE callback only. Production checks
  run on GitHub; the owner's computer need not stay on. Refresh token is only in
  NEWSLETTER_MAILBOX_REFRESH_TOKEN Actions secret; identifiers/date are variables.
- newsletter-mailbox.yml: daily read-only preflight, no scheduled test mail.
  Manual delivery_test sends one fixed-recipient review to Tristen and verifies
  matching sender/recipient/subject/time plus HTML tables, postal footer and review
  notice. No raw received messages are retained. After successful proof, enable
  NEWSLETTER_VERIFY_INBOX=true so month-end distribution requires this receipt.
  Expired/withdrawn authorization fails visibly; renew via mailbox-authorize.mjs.
- LinkedIn company app status observed October 19: Review in progress. Association
  and business email verified. Personal auth passed GitHub run 39321252983. Company
  OAuth cannot be completed until LinkedIn approves the requested product.
- Annual source main-branch proof passed run 39322836382. BLS blocks GitHub HTML,
  XLSX and bulk download requests, so CI uses its keyed named-measure API across
  all 831 verified 2025–35 occupations. A new base year requires a newly verified
  occupation universe before ranking; no fixed list is called timeless/latest.

- Real newsletter inbox proof passed GitHub run 39324152242: received October 19
  at 21:01:42 UTC, only Tristen; all eight delivery/content checks passed.
  NEWSLETTER_VERIFY_INBOX=true is enabled. Month-end subscriber distribution
  now requires the matching final-preview inbox receipt, not Graph acceptance alone.
- CI publication identity decision: docs/decisions/2026-10-19-ci-publisher.md.
  The owner approved a private AXIOVEX-owned repository-scoped publisher app after
  GitHub rejected its built-in Actions app as a ruleset bypass actor. Preserve
  owner-only other branches and main creation/deletion/force-push protections.
  The dedicated app gets only normal main-update exception. Never replace this
  with an owner's personal access token or a global branch-protection disable.

- Live app-authenticated publication proof after concurrency repair: Signals
  39326016092, document sync 39326021925, economic pack 39326027076 and
  annual sources with publish=true 39326031925 all passed. Main advanced through
  20c2d7e to 0778a1a; Cloudflare production and staging deployments passed.
  Nine-workflow migration audit 39326180523 passed. PR #19 supplies bounded
  rebase/rebuild publication for every writer; conflicting source data stops.
- MCDA occupation detail provenance now switches to direct-workbook only after
  the validated parser succeeds for every retained geography. Historical study
  links remain background reading. Signals source notes use current pupil
  metadata instead of the obsolete January estimate label.
