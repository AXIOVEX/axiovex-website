# SEO/AEO engines and verified corrections — October 19, 2026

Owner requests alternate SEO checkers and fixes to verified findings.

## Executable checks

- Google Lighthouse 13.5.0: rendered mobile SEO on every public sitemap URL.
- HTML-Validate 10.5.0: HTML5 standard conformance on public URLs and research.
- aeo.js 0.0.16: independent readiness/citability scan, with scope limitations.
- Existing live crawl: exact canonicals, parsed JSON-LD, metadata, internal
  anchors/resources, missing-page status, real machine-text responses and
  intentional research indexing policy.

All npm packages and transitive dependencies are locked in
`scripts/ops/audit-tools/package-lock.json`. CI uses Node 24 and installed
Chrome. No new API secrets, external accounts or paid quotas are required.
Seobility is optional historical context, not a gating dependency. Missing
engines produce unavailable/partial coverage, never a passing score. Verified
findings fail the check. Raw Lighthouse JSON and validator messages survive
in the existing report artifacts. Scores from different engines are separate.

Official implementation references:
- https://developer.chrome.com/docs/lighthouse/overview
- https://github.com/GoogleChrome/lighthouse
- https://html-validate.org/usage/index.html

Ahrefs Free and Bing Webmaster Site Scan were also evaluated. They require
site/account verification and are useful for authenticated indexing/backlink
work, but are not needed to make these CI checks reliable.

## Findings and actions

1. Unknown production paths returned the homepage with HTTP200. Add a branded
   generated 404.html so Pages returns a real 404; keep it noindex and outside
   the sitemap. Add a live missing-path regression probe.
2. /llms-full.txt was absent but returned homepage HTML200. This falsely
   satisfied the old AEO existence check. Generate genuine public-source text
   with canonical/source links and dated data, exclude unlisted research, set
   text/plain, and verify both response type and body.
3. Lighthouse scored the September workforce article 92 due to a generic
   “here” release link. Give that same verified target descriptive link text.
4. HTML-Validate found 16 invalid p children in research summary elements.
   Replace them with spans and preserve the existing layout in v40 CSS. Keep
   current research records, noindex and discovery exclusions.
5. The AEO social-profile suggestion was false: Organization.sameAs already
   contains the public GitHub and LinkedIn profiles. No new claim is added.
6. Requests for statistics on a contact page and lists on every archive/legal
   page are generic heuristics, not verified defects. Public article cards
   already link to source articles; source articles carry their own citations.
   Do not invent numbers, repeat unrelated facts or rewrite legal/brand copy
   merely to increase a citability score.

## Newsletter sequence amendment

Owner directs a current-data October 19 test only to Tristen, then for each
final data-ready monthly edition: publish/verify web; send that exact edition
to Tristen; verify a Microsoft202 receipt, date and SHA256; reserve the monthly
attempt; send to active subscribers. A failed/mismatched owner preview blocks
customer sending. This is an automatic ordered release, not a new approval
requirement. Existing month/data and replay gates remain in force.
