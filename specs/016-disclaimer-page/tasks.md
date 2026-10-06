# Tasks: Disclaimer Page (spec 016)

Docs package prepared 2026-10-06: owner decision
recorded (T001), wireframes revised (WF-14 new frame;
WF-G4 legal link row), spec + plan + claims written.
**Implementation proceeds on staging only (T002–T004);
promotion is blocked on the T005 copy gate.**
**IMPLEMENTED ON STAGING 2026-10-06 (T003/T004 —
staging tip `a3c27f9` + this record); production
untouched; T005 gate open by design.**

## Gate

- [x] T001 **GATE — Owner decision (spec 001 T017).**
  **DECIDED — Tristen Pierson (owner), 2026-10-06:
  adopt a short Disclaimer page now; defer a Terms
  page.** Basis: the T017 options memo (2026-10-06;
  monitoring-goal hidden_files/t017-terms-disclaimer-memo.md)
  — its §B scope and privacy-interaction rules are
  normative for the copy (FR-002). Recorded in
  specs/001-axiovex-website/tasks.md T017 the same day;
  **T017 stays open until this page is live.** This
  decision is the concept approval; it is NOT approval
  of the final page text — that is the separate T005
  gate below.

## Wireframes (constitution §III — before implementation)

- [x] T002 **Wireframes first**: `docs/wireframes/` —
  NEW **WF-14 Disclaimer** frame modeled on WF-05
  (Privacy pattern: shell, centered page head, strata,
  prose column, `section-end` bottom rhythm); **WF-G4
  revised**: the footer Company column's legal link row
  gains "Disclaimer" beside "Privacy Policy". Frame
  inventory + revision log updated in `wireframes.md`;
  review copy
  `~/workspace/your_files/axiovex-wireframes/wireframes.html`
  re-synced byte-identical. **Done 2026-10-06 with this
  docs package (main).**

## Implementation (staging branch, per spec 010)

- [x] T003 **Page + footer + discovery (FR-001–FR-005)**:
  new source `disclaimer/index.html` modeled on
  `privacy/index.html` (head machinery + WebPage
  JSON-LD, `.legal-body` page styles carried over, no
  `styles.v31.css` change); copy = the seven memo-§B
  sections, Privacy voice, no new firm claims, Privacy
  Policy cross-referenced not restated; footer
  "Disclaimer" link after "Privacy Policy" in the
  Company column of all 8 sources/templates
  (`aria-current="page"` on the new page's own link);
  `writeSitemap` gains the /disclaimer/ entry (8 → 9
  URLs); `llms.txt` gains the factual Disclaimer line
  in both page lists. Rebuild via
  `scripts/build-site.mjs`; generated pages never
  hand-edited. **Stop rule (FR-005):** if any CSS
  change proves necessary, stop and flag it instead.
  **Done on staging:** source commit `ad6653e`
  (disclaimer/index.html — 7 sections as drafted;
  footer links in all 8 sources/templates;
  writeSitemap + llms.txt), regenerated commit
  `a3c27f9` (build: "sitemap: 9 urls"; breaking pass
  now covers 8 pages). No CSS change was needed —
  styles.v31.css untouched.
- [x] T004 **Staging verification (FR-007)**: local
  build + Playwright (1440 / 834 / 390) — Privacy
  pattern, no overflow; heading order clean; axe-core
  on /disclaimer/ = zero violations; footer Disclaimer
  link present + correct on all 8 page types; staging
  sitemap serves 9 URLs; staging guards intact
  (`x-robots-tag: noindex` + Disallow robots); CSP
  header present on staging /disclaimer/; every other
  page's diff vs current production = footer link only
  (+ regenerated sitemap).
  **Verified 2026-10-06 (Playwright local build +
  staging host):** ending stacks byte-identical to
  /privacy/ at 1440 / 834 / 390 (48px prose-bottom,
  56/56 band, 40 footer-top; 40 / 44 / 40 at 390px);
  no horizontal overflow at any width; heading order
  H1 → 7 numbered H2s → CTA H2 → footer H3s, zero
  skips; axe-core on /disclaimer/ — zero in-scope
  violations (the single `link-in-text-block` finding
  is the breadcrumb Home link, byte-identical on
  /privacy/: spec 001 residual R-1d, the owner's
  standing design call, not introduced here); footer
  Disclaimer link present, after Privacy Policy, on
  all 8 page types (`aria-current="page"` on the new
  page itself); staging serves /disclaimer/ 200 with
  the full CSP + HSTS and `x-robots-tag: noindex,
  nofollow`, Disallow robots intact; staging sitemap
  serves 9 URLs incl. /disclaimer/ (lastmod
  2026-10-06); generated-page diffs vs the pre-change
  build = exactly +1 footer-link line on each of blog
  index, both articles, documents, signals, plus the
  sitemap entry. Production confirmed untouched:
  /disclaimer/ there returns the site's standing
  fallback (homepage body, byte-identical to a
  nonexistent-path control) and production pages
  carry no Disclaimer link. Served-page note: the
  staging /disclaimer/ body differs from the committed
  file only by Cloudflare's email-obfuscation rewrite
  of the CTA-band mailto (the same edge transform the
  Privacy page gets).

## Copy gate (blocks promotion)

- [ ] T005 **GATE — Pre-promotion copy approval
  (Tristen).** The final /disclaimer/ text, exactly as
  built on staging, is presented to Tristen; promotion
  (T006) does not start without his go-ahead on the
  text. The memo's counsel-review recommendation rides
  with the presentation. **This gate stays OPEN at the
  end of the staging pass by design.**

## Promotion (only after T005)

- [ ] T006 **Promotion + production verification (spec
  010)**: merge staging → main; FR-004 guard proof —
  promotion diff carries production `robots.txt` and
  the production `_headers` (staging's noindex guard
  line never reaches main); sync back with guards
  re-applied; production re-verified (page live, footer
  link everywhere, sitemap 9 URLs, headers intact);
  wireframe labels flipped to IMPLEMENTED + LIVE;
  review copy re-synced; monitoring state
  `website_commit` advanced; specs/001 T017 checked
  closed (Disclaimer live; Terms deferred on the
  record).
