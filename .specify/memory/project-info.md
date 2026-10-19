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
