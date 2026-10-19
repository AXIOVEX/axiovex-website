# Report and Signal data sources

Owner reminder recorded 2026-10-19: economic reports and The Axiovex Signal
use several sources; their API keys are repository Actions secrets, not
Cloudflare analytics credentials. Canonical executable inventory:
`data/report-sources.json`. Secret **names** were verified with `gh secret list`;
values were not read or printed. GitHub can inject secrets in CI but cannot
return existing secret values to a workstation.

| Source | Repository secret | Collector / use |
|---|---|---|
| BLS state Pulse + county LAUS + JOLTS | BLS_API_KEY | fetch-signals, fetch-geo, pack/jolts |
| Federal Reserve Bank of St. Louis | FRED_API_KEY | pack/fred economic context |
| Census ACS/CBP/QWI | CENSUS_API_KEY | pack/census |
| Labor Department weekly national claims | DOL_API_KEY | pack/dol-claims; do not label Michigan |
| Energy Information Administration | EIA_API_KEY | pack/eia; publication lag retained |
| Education College Scorecard | DATAGOV_API_KEY | pack/scorecard; metric years vary |
| BEA county GDP/income | BEA_API_KEY | pack/bea; missing as of Oct 19, requested |
| Configured source headlines / WARN | No universal key | data/signal-sources.json; fetch-signals |
| Website traffic | CLOUDFLARE_ANALYTICS_TOKEN | ops/analytics; separate from economic sources |
| Production newsletter aggregates / delivery | NEWSLETTER_SEND_SECRET | Pages ops endpoints; Microsoft credentials stay in Pages |

Weekly data-pack sync and the monthly release runner inject existing keys.
The monthly runner refreshes the state Pulse, 83 county LAUS and the pack
before checking release readiness. Missing keys and failed refreshes retain
explicitly dated last-good context; they do not prove a current release.
The release gate requires the target month in all four state series and
83 county rates. Other datasets have weekly, quarterly, annual and delayed
monthly calendars; report/Signal context retains the actual period, units,
geography, and retrieval date instead of waiting for nonexistent same-month
annual data. Economic source values never come from Cloudflare traffic.
