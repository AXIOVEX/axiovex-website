# Tasks: Page-Foot Spacing Rhythm (spec 015)

Proposal package prepared 2026-10-06: measured the
ending stack of all seven page types from
`styles.v28.css` + shells/templates (before-table in
spec.md), defined the page-foot rhythm, revised the
wireframes (`docs/wireframes/wireframes.html` — WF-G2
rhythm addition, WF-G3/WF-G4 spacing captions, WF-01 +
WF-06 bottoms redrawn with before → after captions;
`wireframes.md` revision log) and wrote this spec
package. **PENDING OWNER APPROVAL — nothing below the
gate is done, and nothing is implemented.**

## Gate

- [ ] T001 **GATE — Owner approval of the wireframes
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

## Implementation (starts only after T001)

- [ ] T002 **Stylesheet (FR-001, FR-006)**: in the next
  versioned stylesheet on the staging chain (after
  styles.v28.css), set `.cta-band { padding: 56px 0 }`
  (44px at ≤820px), `.footer { padding: 40px 0 32px }`,
  and add `.section.section-end { padding-bottom: 48px }`
  (40px at ≤820px). Repoint every reference; remove the
  prior stylesheet file.
- [ ] T003 **Final-section markers (FR-002)**: add the
  `section-end` class to the final content section in
  `index.html` (FAQ section), `contact/index.html`,
  `privacy/index.html`, and the blog-index, documents,
  and signals templates. No marker on article pages
  (their 24px stands, FR-002). No other markup change.
- [ ] T004 **Rebuild + staging verification (FR-007)**:
  rebuild via `scripts/build-site.mjs`; on staging,
  measure the computed ending stack of all seven page
  types at 1440px and 390px against the rhythm table
  (band pages 200px / 168px total pure padding;
  Contact 88px / 80px; article 176px via shared values
  only); regression-measure mid-page home gaps, the
  spec 003 head values, the signals top values, footer
  internals, and tap targets — all unchanged.
- [ ] T005 **Promotion + production verification
  (FR-006, FR-007)**: merge staging → main under spec
  010's rules (promotion diff checked for the FR-004
  hazard: no staging-only robots.txt / _headers);
  re-measure the production ending stacks after
  deploy; confirm the AEO/SEO baseline (100/90) on the
  next monitoring cycle.
- [ ] T006 **Closeout**: wireframe revision log marked
  approved + implemented with the measured values;
  WF-G2/G3/G4 captions updated to the live values;
  review copy
  `~/workspace/your_files/axiovex-wireframes/wireframes.html`
  re-synced byte-identical; monitoring state
  `website_commit` advanced.
