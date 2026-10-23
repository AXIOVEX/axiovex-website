# Verification — 2026-10-23 paper-link amendment (staging)

- Staging deployment of commit 5346fe9: first attempt failed at
  the initialize stage; retried via the Cloudflare API; retry
  deployment succeeded (same pattern as earlier transient
  failures that day).
- Served staging HTML (curl): contains the Zenodo DOI link
  (2 occurrences: href + card source line) and the line
  "The work itself lives in four public places:".
- Rendered check: the staging page's HTML + assets were fetched
  and rendered locally in headless Chromium (the sandbox proxy
  blocks direct Chromium egress to the staging host; the local
  render uses the exact served bytes). Desktop close-up
  (staging-desktop-primary-material.png) shows all four
  primary-material cards in one row; the new fourth card —
  "The boundary-counting paper and its evidence", Zenodo,
  doi.org/10.5281/zenodo.23600630 — renders in the same style
  with no overflow. Mobile render of the full page also
  inspected; the card is present and stacked normally.
