# Feature Specification: Disclaimer Page

**Feature Branch**: `016-disclaimer-page` (documentation first
per constitution §III; implementation lands through the
staging flow in spec 010)

**Created**: 2026-10-06

**Status**: DECIDED + WIREFRAMED 2026-10-06 — owner
decision recorded (tasks.md T001): a short Disclaimer page
now, a Terms page deferred. Implementation proceeds on
staging (T002–T004); **promotion is blocked on the distinct
pre-promotion copy gate (T005)** — Tristen's go-ahead on
the final page text. Spec 001 T017 stays open until the
page is live.

**Decision (spec 001 T017)**: Tristen Pierson (owner),
2026-10-06 — adopt a short Disclaimer page now; defer a
Terms page. Basis: the T017 options memo (2026-10-06,
monitoring-goal hidden_files/t017-terms-disclaimer-memo.md).
The memo's §B scope and its privacy-interaction rules are
normative for the copy: the site's genuine exposure is
reliance on republished statistics and projections; a
Disclaimer does not weaken the privacy policy and the two
cross-reference rather than duplicate; and **no new page
may re-broaden the privacy promises spec 001 T013 narrowed
today** (promotion `7bd2cfb`).

## What exists today

- The site's not-a-forecast discipline already exists at
  the point of use: Signals captions state that
  projections are the publishing agency's modeled outlook,
  not Axiovex forecasts and not guarantees (spec 011
  FR-005); the monthly workforce series carries the same
  restraint language (spec 007); the FAQ's CMMC answer is
  self-limiting ("we aren't assessors"). There is no single
  canonical page these statements point to.
- The Privacy page (`privacy/index.html`, WF-05) is the
  established legal-page pattern on this site: same shell,
  centered page head ("Legal" eyebrow), strata bar, a
  left-justified prose column (`.legal-body`, inline
  page-level styles), the reduced CTA band, and the shared
  footer. Its prose section already carries the spec 015
  `section-end` page-foot marker.
- The footer (WF-G4) carries the legal link: "Privacy
  Policy", last in the Company column of every page source
  and template.
- The sitemap is generator-emitted (`writeSitemap` in
  `scripts/build-site.mjs`) with 8 URLs; `llms.txt`
  enumerates the site's pages in two lists, Privacy Policy
  included in both.

## What this adds

- **`/disclaimer/`** — a short Disclaimer page in the
  Privacy page's pattern (new wireframe **WF-14**),
  covering exactly the memo §B scope and nothing more:
  (a) the site publishes analysis and information for
  general purposes; (b) data is republished from primary
  sources that revise their data — figures carry source +
  vintage labels and readers should check them;
  (c) projections are the publishing agencies' modeled
  outlook — not Axiovex forecasts, not advice, not
  guarantees; (d) nothing on the site is professional
  advice (legal, financial, tax, or compliance);
  (e) CMMC-related content is readiness information only —
  not assessment, certification, or a compliance
  determination; (f) external links are provided for
  reference and are not endorsements; (g) the Privacy
  Policy governs personal information — cross-referenced,
  never restated.
- **A "Disclaimer" footer link** beside "Privacy Policy"
  in the Company column of every page (WF-G4 revised).
- **Sitemap inclusion** (8 → 9 URLs) and a factual
  Disclaimer line in both `llms.txt` page lists.

## Design reference (wireframes, this package)

- **WF-14** (new frame): the Disclaimer page drawn on the
  WF-05 pattern — nav, centered page head (breadcrumb,
  "Legal" eyebrow, title, "Last updated" line), strata,
  prose column, reduced CTA band, footer. No new layout,
  no new component, no stylesheet change: the prose
  styles the Privacy page defines are reused as-is.
- **WF-G4** (revised): the Company column gains
  "Disclaimer" beside "Privacy Policy" — the footer's
  legal link row, on every page.
- No other frame changes. WF-09's tablet pattern covers
  the page the same way it covers /privacy/.

## Requirements *(mandatory)*

- **FR-001**: A Disclaimer page is served at
  `/disclaimer/` from a new page source
  `disclaimer/index.html`, structurally modeled on
  `privacy/index.html`: identical shell (breaking-banner
  marker pair, skip link, WF-G1 nav, WF-G4 footer,
  `site.v1.js` + signals-widget mounts), centered page
  head (breadcrumb Home / Disclaimer, "Legal" eyebrow,
  H1 "Disclaimer", "Last updated: October 6, 2026"),
  strata bar, prose section carrying the `section-end`
  page-foot marker (spec 015 rhythm, as Privacy's does),
  and the reduced legal-page CTA band. Heading order has
  no skips (H1 → H2 sections; footer columns in the
  post-T015 pattern).
- **FR-002**: The copy covers exactly items (a)–(g) of
  the memo §B scope (listed in "What this adds"), in the
  Privacy page's plain voice, short — the Privacy page's
  length or shorter. It makes **no new claims** about the
  firm, its clients, or its capabilities; it restates no
  privacy promise (the Privacy Policy is linked, not
  duplicated); CMMC wording stays consistent with the
  FAQ's standing self-limiting language ("we aren't
  assessors").
- **FR-003**: Every page's footer gains a "Disclaimer"
  link (`/disclaimer/`) immediately after "Privacy
  Policy" in the Company column — in the three page
  sources (`index.html`, `contact/index.html`,
  `privacy/index.html`), the new page source, and the
  four templates (`scripts/templates/blog-index.html`,
  `blog-article.html`, `documents.html`, `signals.html`).
  The Disclaimer page's own footer marks the Disclaimer
  link `aria-current="page"` (the Privacy page's pattern
  for its own link). No other footer content changes.
- **FR-004**: `writeSitemap` emits
  `https://axiovexsystems.com/disclaimer/` alongside the
  Privacy entry (same yearly/0.5 treatment), taking the
  sitemap from 8 to 9 URLs. `llms.txt` gains a factual
  Disclaimer line after each of its two Privacy Policy
  lines.
- **FR-005**: **No stylesheet change.** The page reuses
  `styles.v31.css` and the Privacy page's `.legal-body`
  pattern (its page-level `<style>` block is carried over
  with the comment naming the Disclaimer page). If
  implementation finds a CSS change necessary, work stops
  and the need is flagged — a version bump is a separate
  decision (cache-busting rule).
- **FR-006**: Governance gates, in order: (1) owner
  decision (T001 — recorded, spec 001 T017); (2)
  wireframes first — WF-14 + WF-G4 revision in this
  package, before any page code (constitution §III);
  (3) implementation verified on staging only (T002–
  T004); (4) a **distinct pre-promotion copy gate**
  (T005): the final page text is presented to Tristen
  and promotion waits for his go-ahead; (5) promotion
  per spec 010 (T006) under the standing guard invariant
  (staging robots.txt Disallow; staging `_headers` =
  production security file + exactly the X-Robots-Tag
  noindex line — spec 001 T014).
- **FR-007**: Verification on staging: /disclaimer/
  renders in the Privacy pattern at 1440 / 834 / 390;
  heading order clean; axe-core pass on /disclaimer/ =
  zero violations; the footer Disclaimer link is present
  and correct on all 8 page types; the sitemap serves 9
  URLs including /disclaimer/; staging still serves
  `x-robots-tag: noindex` + Disallow robots; the new page
  carries the combined `_headers` CSP; and every other
  page's diff vs current production is the footer link
  only (plus legitimately regenerated artifacts: the
  sitemap).

## Acceptance scenarios

1. **Given** any page on the site, **When** a visitor
   reaches the footer, **Then** the Company column offers
   "Disclaimer" beside "Privacy Policy", and following it
   lands on a short page that says what the site's
   content is and is not — sourced, vintaged, agencies'
   projections, not advice — in the Privacy page's own
   pattern.
2. **Given** the T005 copy gate, **When** staging is fully
   verified but Tristen has not yet approved the final
   text, **Then** nothing merges to main and production
   is unchanged.
3. **Given** the promoted site, **When** the sitemap is
   fetched, **Then** it lists 9 URLs including
   `https://axiovexsystems.com/disclaimer/`, and the
   AEO/SEO baseline (100/90) holds on the next monitoring
   cycle.
