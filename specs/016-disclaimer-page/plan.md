# Plan: Disclaimer Page (spec 016)

**Status: decided + wireframed; implementation on
staging, promotion gated.** The owner decision (spec 001
T017, Tristen 2026-10-06: Disclaimer now, Terms deferred)
and the wireframes (WF-14 + WF-G4 revision) are in this
package. Implementation follows this plan on the staging
branch; promotion waits for the T005 copy gate.

## Source of truth for the copy

The T017 options memo
(`~/workspace/goals/website-seo-aeo-health-monitoring/hidden_files/t017-terms-disclaimer-memo.md`),
§B scope + the privacy-interaction rules:

- Privacy governs data; the disclaimer governs reliance
  on content. Cross-reference, never duplicate.
- The disclaimer's honest form is "sources revise their
  data; check the vintage" — not "nothing here is
  reliable": the page may not disclaim away the accuracy
  duties the site voluntarily assumes (constitution §I),
  and it may not re-broaden any promise spec 001 T013
  narrowed (promotion `7bd2cfb`).
- The memo recommends counsel review before publication;
  that recommendation is recorded for the owner and rides
  with the T005 copy presentation.

## The page (mechanism)

`disclaimer/index.html` is a new hand-maintained page
source — the fourth shell, beside `index.html`,
`contact/index.html`, and `privacy/index.html`. It is
modeled line-for-line on `privacy/index.html`:

- Same `<head>` machinery with the page's own title,
  description, canonical, and WebPage JSON-LD; the
  Privacy page's page-level `<style>` block (`.legal-body`
  rules) carried over with its comment re-named —
  **no change to `styles.v31.css`** (FR-005).
- Same body shell: `<!-- BREAKING:START -->` /
  `<!-- BREAKING:END -->` marker pair (so the spec 012
  build pass treats it like every other shell), skip
  link, WF-G1 header/nav (no nav item is current — the
  page is footer-reached, like Privacy), `<main>`.
- Page head: breadcrumb `Home / Disclaimer`, eyebrow
  "Legal", H1 "Disclaimer", lede line
  "Last updated: October 6, 2026" (`.legal-updated`).
- Strata bar, then the prose section with
  `class="section section-end"` + `padding-top: 0`
  (exactly Privacy's construction — the spec 015
  page-foot rhythm), `.legal-body` with numbered H2
  sections in the Privacy voice.
- Reduced legal CTA band (Privacy's pattern: "Questions
  about this disclaimer?" → legal@axiovexsystems.com +
  the Contact button).
- WF-G4 footer with the FR-003 link row (Disclaimer
  marked `aria-current="page"` on this page), then
  `site.v1.js` + the signals-widget mounts, as Privacy.

Copy: seven short numbered sections matching spec.md
(a)–(g) 1:1 — General information · Data from primary
sources · Projections · Not professional advice · CMMC
and compliance-framework content · External links ·
Privacy. Drafted in the staging pass; the verbatim text
is what T005 presents to the owner.

## Footer link (mechanism)

One line added after the "Privacy Policy" anchor in the
Company column of 8 files: `index.html`,
`contact/index.html`, `privacy/index.html`,
`disclaimer/index.html` (new), and
`scripts/templates/{blog-index,blog-article,documents,signals}.html`.
Generated pages are never hand-edited: the build
regenerates blog index, articles, documents, and signals
from the templates; the shells' footers change because
the shells are sources. The build's breaking pass covers
the new shell automatically via its marker pair.

## Sitemap + llms.txt (mechanism)

- `scripts/build-site.mjs` `writeSitemap`: one entry
  added after the Privacy entry —
  `e(SITE + '/disclaimer/', gitDate(ROOT, 'disclaimer/index.html'), 'yearly', '0.5')`
  — 8 → 9 URLs. `gitDate` resolves from the staging
  commit of the new source (commit the source before the
  build runs, so lastmod lands).
- `llms.txt` (hand-maintained, enumerates pages): one
  factual line — `- Disclaimer: https://axiovexsystems.com/disclaimer/`
  — after each Privacy Policy line (both lists).

## Staging flow + guards

Per spec 010: docs package lands on main first; main →
staging sync; implementation commits on staging; staging
verified (staging.axiovexsystems.com carries the combined
`_headers` + Disallow robots — untouched by this spec);
**stop**. Promotion (T006, after T005) merges staging →
main and syncs back under the standing invariant:
promotion diff shows production `robots.txt` and the
production `_headers` (no noindex line); post-sync branch
diff = exactly the guard set. Monitoring `state.json`
advances at promotion closeout, not before.

## Verification (tasks.md T004)

Local build + Playwright (venv
`~/workspace/venvs/playwright`) + curl of the staging
host:

- /disclaimer/ at 1440 / 834 / 390: Privacy pattern
  intact, no horizontal overflow, strata + head +
  section-end rhythm measure like Privacy's.
- Heading-order audit on the new page: H1 → H2s, footer
  H3s — no skips (post-T015 discipline).
- axe-core on /disclaimer/: zero violations.
- Footer Disclaimer link present + href-correct on all
  8 page types (home, contact, privacy, disclaimer, blog
  index, article, documents, signals).
- `sitemap.xml` serves 9 URLs incl. /disclaimer/.
- Staging guards: `x-robots-tag: noindex, nofollow`
  header + Disallow robots still served; CSP header
  present on /disclaimer/ (combined `_headers` covers
  the new path automatically — confirmed, not assumed).
- Diff discipline: every other page vs current
  production = footer link only; regenerated artifacts
  limited to the sitemap (+ llms.txt, a source edit).

## Out of scope / deliberately untouched

- No Terms page (deferred by the owner's decision).
- No nav change: the page is footer-reached, like
  Privacy today (WF-G1 untouched).
- No stylesheet change (FR-005 stop rule), no copy
  change to any existing page beyond the footer link,
  no privacy-policy edits.
- Counsel review: recommended by the memo; scheduling
  it is the owner's call, surfaced at the T005 gate.
