# Tasks: Page-Foot Spacing Rhythm (spec 015)

Proposal package prepared 2026-10-06: measured the
ending stack of all seven page types from
`styles.v28.css` + shells/templates (before-table in
spec.md), defined the page-foot rhythm, revised the
wireframes (`docs/wireframes/wireframes.html` — WF-G2
rhythm addition, WF-G3/WF-G4 spacing captions, WF-01 +
WF-06 bottoms redrawn with before → after captions;
`wireframes.md` revision log) and wrote this spec
package. **APPROVED 2026-10-06 (T001); implemented on
staging (T002–T004); promoted to production (T005,
merge `4497704`) and closed out (T006) 2026-10-06.**

## Gate

- [x] T001 **GATE — Owner approval of the wireframes
  (Tristen).** Scope of the approval: WF-G2 as revised
  by spec 015 (the page-foot rhythm: final content
  section padding-bottom 48px, CTA band padding 56px
  top/bottom, footer padding-top 40px; ≤820px 40/44/40)
  and the measured before-table + FR-003 freeze list in
  spec.md (band/footer internals, mid-page spacing,
  spec 003 head values, and spec 011 Amendment 2
  signals-top values all unchanged). **Blocks every
  task below.** Nothing is implemented, committed to
  the live pages, or deployed until Tristen approves;
  if he requests changes, the wireframes are revised
  and re-presented first (constitution §III).
  **APPROVED — Tristen Pierson (owner), 2026-10-06
  13:39 EDT: "Approve spec 015 wireframes — implement
  it".** Implementation proceeds on the staging branch
  per spec 010.

## Implementation (starts only after T001)

- [x] T002 **Stylesheet (FR-001, FR-006)**: in the next
  versioned stylesheet on the staging chain (after
  styles.v28.css), set `.cta-band { padding: 56px 0 }`
  (44px at ≤820px), `.footer { padding: 40px 0 32px }`,
  and add `.section.section-end { padding-bottom: 48px }`
  (40px at ≤820px). Repoint every reference; remove the
  prior stylesheet file. **Done on staging:**
  `styles.v29.css` created from v28 with exactly those
  three changes, v28 removed, every shell/template
  reference repointed (commit `fd2fcfb`).
- [x] T003 **Final-section markers (FR-002)**: add the
  `section-end` class to the final content section in
  `index.html` (FAQ section), `contact/index.html`,
  `privacy/index.html`, and the blog-index, documents,
  and signals templates. No marker on article pages
  (their 24px stands, FR-002). No other markup change.
  **Done on staging:** all six markers added — home FAQ
  (`#faq`), contact form section, privacy prose section,
  blog-index list section, documents cards section,
  signals content section (commit `fd2fcfb`). Home diff
  vs pre-change is exactly the stylesheet repoint + the
  FAQ marker.
- [x] T004 **Rebuild + staging verification (FR-007)**:
  rebuild via `scripts/build-site.mjs`; on staging,
  measure the computed ending stack of all seven page
  types at 1440px and 390px against the rhythm table
  (band pages 200px / 168px total pure padding;
  Contact 88px / 80px; article 176px via shared values
  only); regression-measure mid-page home gaps, the
  spec 003 head values, the signals top values, footer
  internals, and tap targets — all unchanged.
  **Verified on the staging build (Playwright, computed
  styles, 1440 + 390):** ending stacks — band pages
  (home, documents, signals, privacy) **200px / 168px**;
  blog index **224px / 192px** (incl. the frozen 24px
  list padding); article **176px / 152px** (its own
  24px unchanged at both widths); contact **88px /
  80px**. No horizontal overflow on any page at either
  width. Regression: home mid-page sections still
  76px / 60px padding-bottom (only the marked FAQ
  section is 48 / 40); spec 003 head margins 36px
  (documents, privacy), signals head 24px (Amendment 2
  value); signals tape present above the page head with
  exactly its 16px offset, 4 Pulse tiles, sparkline
  percentages ▲ +0.4% / ▲ +2.0% / ▼ −3.0% / ▲ +0.0%,
  MCDA outlook group and the 84.01% education figure
  intact, lanes intact; contact form + Turnstile script
  present; footer internals unchanged (grid gap 32px,
  bottom-row padding-top 20px). Staging sync note: the
  sanctioned main→staging merge (spec 015 package)
  left the main..staging diff at exactly the guard set
  (`_headers`, `robots.txt`).
- [x] T005 **Promotion + production verification
  (FR-006, FR-007)**: merge staging → main under spec
  010's rules (promotion diff checked for the FR-004
  hazard: no staging-only robots.txt / _headers);
  re-measure the production ending stacks after
  deploy; confirm the AEO/SEO baseline (100/90) on the
  next monitoring cycle.
  **Done 2026-10-06:** promoted with spec 013 in merge
  `4497704` under spec 010's rules — FR-004 hazard
  checked (guard diff
  `git diff origin/main..HEAD -- robots.txt _headers`
  empty; production robots intact, no `_headers`).
  Production values read from the served
  `styles.v30.css` (the stylesheet chain reached v30
  via spec 013's appended block; spec 015's values are
  unchanged in it): `.section.section-end`
  padding-bottom **48px**, `.cta-band` padding
  **56px 0**, `.footer` padding **40px 0 32px** —
  the approved page-foot rhythm, live. AEO/SEO
  baseline (100/90) confirmation rides the next
  monitoring cycle.
- [x] T006 **Closeout**: wireframe revision log marked
  approved + implemented with the measured values;
  WF-G2/G3/G4 captions updated to the live values;
  review copy
  `~/workspace/your_files/axiovex-wireframes/wireframes.html`
  re-synced byte-identical; monitoring state
  `website_commit` advanced.
  **Done 2026-10-06:** revision-log closeout recorded
  in `wireframes.md`; WF-G2 page-foot, WF-G3, and
  WF-G4 labels flipped to APPROVED · IMPLEMENTED +
  LIVE in `wireframes.html`, as were the WF-01 and
  WF-06 page-bottom notes; review copy re-synced
  byte-identical (cmp verified); monitoring state
  `website_commit` advanced to `4497704`; spec.md
  status → implemented and live.
