# CI operations replacing Meta Muse

Owner request: 2026-10-19. Replace the unavailable Meta Muse recurring
website work with executable GitHub Actions. No website UX changes.

Acceptance criteria:
- Preserve amended ET schedules from specs 006, 007 and 020, including DST,
  February and data-month naming. Manual dispatch supports recovery.
- Analytics produces auditable raw responses, measured comparisons, explicit
  gaps, insights and suggestions; absent credentials fail visibly.
- Health checks run weekly and on website pushes, without inventing external
  AEO/Seobility scores or changing brand/copy to satisfy a checker.
- Weekly newsletter preparation and monthly workforce evidence execution
  produce review artifacts. Subscriber sends require an explicit per-issue
  owner approval tied to the exact email bytes.
- Existing Signals, document and pack sync continue unchanged.
- Reports are Actions artifacts and job summaries, never public site content.
  Do not publish research, articles or LinkedIn posts without their review.

Plan: standard-library Node runners, timezone-aware scheduling, bounded
network requests, artifact retention, tests for dates, failures and approval
integrity. Separate review-only evidence preparation from external writes.

Known migration gaps: Muse-only runbooks/state are unavailable.
Official SEO/AEO score collection, editorial analysis, WARN review and signed-in LinkedIn posting require
restored access or human review; CI must disclose these gaps.

Tasks: inventory checked-in requirements; implement runners and workflows;
exercise deterministic tests and live read-only health; push a review branch
and run CI. Activation requires merging workflows to the default branch.

## Microsoft mail amendment — 2026-10-19

Owner directs using the existing Axiovex Microsoft 365 tenant, replacing the
obsolete Gmail reporting lane from spec 006. CI authenticates to a Pages-only
report endpoint using NEWSLETTER_SEND_SECRET. That endpoint uses the existing
Newsletter application's NEWSLETTER_GRAPH_* credentials, already restricted to the newsletter mailbox, to
send reports from newsletter@axiovexsystems.com to the two fixed founders. No
Microsoft credentials are exported, no tenant/app permissions are expanded,
and no subscriber send/approval rule changes. Reject sender/recipient overrides,
staging sends, oversized payloads and unauthenticated requests. Save Graph
acceptance receipts; do not equate acceptance with confirmed inbox delivery.

Daily/weekly/monthly, workforce and newsletter preparation reports are emailed.
Weekly/monthly analytics include live technical health. Expected dataset gaps
produce clearly marked PARTIAL reports; actual API failures and failed email
delivery remain failed jobs. This follows spec 006 FR-006's unavailable-section
rule instead of making every valid partial report a permanently failing job.

## Readable email amendment — 2026-10-19

Owner rejects raw Markdown in email and requests a customer newsletter review
sent only to Tristen. Reports render to HTML on the server: branded Outlook-safe
table shell, real headings/lists/tables, rounded numbers, KB/MB units and a
coverage badge. Markdown and exact source JSON remain audit artifacts. The
newsletter uses the same solid-color table shell, keeping the issue's facts,
vintages, postal address and production unsubscribe links intact.

The separate authenticated preview route fixes its recipient to Tristen,
prefixes REVIEW ONLY, sends HTML plus plain text, and never reads/writes the
subscriber store. Preview unsubscribe is explicitly disabled. Review the
latest committed October 14 edition as that edition, not as a new issue.
Verify desktop and 390/320px rendering before sending. Internal report
formatting is deployed for future sends; no customer distribution is approved.
