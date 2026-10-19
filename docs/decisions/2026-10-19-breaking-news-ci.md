# Frequent Signals and automatic breaking-news publication

Owner direction, October 19, 2026: refresh Signals frequently and run a fast
breaking-news checker in CI which triggers the existing banner.

This supersedes spec 012's Meta Muse detection and per-story approval loop
for the narrow deterministic criteria below. The existing banner layout,
source-only headline, dismissal and single-slot design remain unchanged.

- GitHub Actions checks configured publisher RSS feeds every five minutes;
  Signals headline content refreshes every fifteen minutes, BLS once hourly;
  county data and the economic pack refresh daily and rebuild calculated insights. GitHub schedules
  are best effort, not a real-time delivery guarantee. Manual dispatch is available.
- Only source-timestamped items within three hours qualify. No date-only
  timestamps, routine advisory batches, opinion, previews or podcasts.
- Significance: an actively exploited industrial/OT vulnerability; an actual
  industrial breach, emergency, recall or plant shutdown; a Michigan plant
  opening/closure or mass layoff; or an official NIST/NSF/DOE announcement
  of at least $100 million concerning industry, AI or workforce.
- Publication requires a matching source-page headline and matching precise
  publication timestamp. Keep the publisher's headline unchanged. Store
  criterion, source and expiry in the committed entry; retain run evidence.
- One active entry, twelve-hour life, no repeat posting of a seen URL. Keep
  an unexpired manually curated entry. Expiry rebuilds all banner regions;
  visitor code also hides an expired banner if deployments are delayed.
- Partial feed outages are reported, never counted as clean coverage. Total
  outage fails the job after clearing expired entries. No API keys needed
  for the fast path, and economic APIs are not polled every five minutes.

No customer email is sent by this monitor.

The fast automatic path covers the six configured RSS publishers. Federal
Register and Michigan WARN remain in the 15-minute Signals ingestion; their
date-only records cannot establish a three-hour breaking timestamp.
