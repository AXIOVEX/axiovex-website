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

Known migration gaps: Muse-only runbooks/state/token and Gmail OAuth are
unavailable. Official SEO/AEO score collection, report email delivery,
editorial analysis, WARN review and signed-in LinkedIn posting require
restored access or human review; CI must disclose these gaps.

Tasks: inventory checked-in requirements; implement runners and workflows;
exercise deterministic tests and live read-only health; push a review branch
and run CI. Activation requires merging workflows to the default branch.
