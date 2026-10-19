# OPS-2026-10-19-MONTH-END — authoritative publication decision

Owner: Tristen Pierson. Recorded 2026-10-19 from this direct instruction:

> make sure we automatically send out the newsletter later in the month. this should have been ledgered in project info. we want the monthly report and newsletter released after we get all the economic data for the month which is typically towards the end of every month

This supersedes spec 020's weekly Wednesday cadence and the weekly timer in
the original CI migration. The newsletter is monthly. Prepare near the 29th;
release near the 30th at 10:00 AM Eastern, after required data actually exist.
February uses its last day. Date alone never authorizes release. September
2026 data are first eligible October 30, 2026. Delayed releases are retried
daily until the next month-end cycle begins, retaining the original data month.

The new month-end workflow owns BOTH monthly report delivery and customer
newsletter release. Daily and weekly internal website reports stay unchanged.
The required monthly gate is explicit and executable: all four configured BLS
state series must include the intended data month as their latest reading,
and county LAUS must carry that same month with 83 distinct numeric county
readings. Missing/unreleased data hold publication; no last-good substitution
is relabeled current. Quarterly/annual sources retain their actual vintages;
this gate does not pretend every economic dataset has a monthly release.

Standing authorization applies to the deterministic monthly newsletter:
published headlines, verbatim source figures/vintages and labeled arithmetic.
It does not authorize invented causal commentary, forecasts, an unreviewed
research edition or an automatic blog/LinkedIn publication. The old per-issue
manual gate remains for discretionary editorial content; the source-only
monthly edition follows this owner's explicit automatic-release instruction.

The pipeline refreshes sources, checks data readiness, generates and emails
the monthly report, builds/publishes the newsletter web edition, verifies it
live, reserves a durable month-specific send attempt, then sends to active
subscribers using the existing double-opt-in/suppression path. An uncertain
partial send is never automatically restarted. A replay reservation blocks
that data month. CI retains the source evidence and exact generated email.

Today's customer newsletter preview goes ONLY to Tristen and is not a list
send. The October 14 source is used only as a labeled design-review sample.
Policy source: data/publication-policy.json. Implementation: monthly-publication.yml.
