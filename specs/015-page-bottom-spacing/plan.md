# Plan: Page-Foot Spacing Rhythm (spec 015)

**Status: proposal only.** This plan executes only after
the tasks.md T001 gate (Tristen approves the revised
wireframes). Nothing here has been implemented. Every
"current" value below was measured on 2026-10-06 from
`styles.v28.css` (the stylesheet main ships after the
spec 011/012 promotion, merge 89c65c1) and the page
shells/templates — the same measure-first method as
spec 003.

## Where the air is (measured)

Three shared values compose every page ending on the
site; no page invents its own bottom spacing:

- `.section { padding: 76px 0 }` (60px at ≤820px) — the
  final content section's padding-bottom is the first
  gap: 76px on Home (FAQ), Blog index, Documents,
  Signals, Privacy, Contact.
- `.cta-band { padding: 76px 0 }` (60px at ≤820px) —
  present on six of seven page types (all but Contact),
  contributing 76px above and 76px below its content.
- `.footer { padding: 56px 0 32px }` — 56px between the
  footer's top edge and its grid, on every page, with
  no ≤820px override.

Articles are the one variant construction: the article
body ends in `.post-article { padding: 56px 0 24px }`
(blog stylesheet), so the pre-band gap is 24 + 76 =
100px — already the tightest on the site. Full per-page
before-table: spec.md.

## The change (three values, one rhythm)

| Rule | Now | Proposed | ≤820px |
|---|---|---|---|
| Final content section padding-bottom | 76 | **48** | 60 → **40** |
| `.cta-band` padding | 76 0 | **56 0** | 60 → **44** |
| `.footer` padding-top | 56 | **40** | 56 → **40** |

Reductions are ~30% per element — the same proportion
as spec 011 Amendment 2's page-top condensing — and
they compound across the stack: band pages shed 84px
of pure padding at the ending, Contact sheds 44px
(exactly one third of its 132px void).

## Mechanism (implementation detail, settled here)

- **Band + footer** ride their shared rules directly —
  one declaration each, every page inherits, no
  per-page work: `.cta-band { padding: 56px 0 }` (+44px
  in the ≤820px block), `.footer { padding: 40px 0 32px }`.
- **Final-section padding-bottom must NOT ride the
  shared `.section` rule**: `.section` padding also
  sets every mid-page boundary on the home page, and
  FR-003 freezes those. Two candidate mechanisms were
  weighed:
  - *Sibling scoping* in the spec 003 `:has` tradition
    (`.section:has(+ .cta-band)`): covers Blog index,
    Documents, Signals, Privacy — but fails Home (a
    JSON-LD `<script>` sits between the FAQ section and
    the band, breaking adjacency) and fails Contact
    (the footer is `<main>`'s sibling, not the
    section's). Rejected as the sole mechanism.
  - *Explicit final-section marker* (recommended): the
    generator templates and static shells add one class
    (e.g. `section-end`) to each page's final content
    section — seven known sites: home FAQ section
    (`index.html`), blog-index list section, documents
    cards section, signals content section (templates),
    privacy prose section, contact content section
    (shells). The stylesheet carries
    `.section.section-end { padding-bottom: 48px }`
    (40px at ≤820px). Explicit, adjacency-proof, and in
    the spirit of the inline padding overrides the
    documents/signals templates already carry for their
    tops. Articles take no marker (FR-002).
- All values ship in the next versioned stylesheet on
  the staging chain (after styles.v28.css → v29),
  references repointed, prior file removed — the
  cache-busting rule. Generated pages are rebuilt by
  `scripts/build-site.mjs`; shells edited directly.

## Verification (tasks.md T004/T005)

- Computed-style measurement of the ending stack on all
  seven page types, desktop (1440) and 390px, against
  the rhythm table — the spec 003 verification method.
- Mid-page regression: home inter-section gaps and the
  spec 003 head values (36/40; signals 24/28) measured
  unchanged; article 24px unchanged; footer internals
  (grid gap 32, bottom-row padding-top 20) unchanged.
- Staging first (staging.axiovexsystems.com) per spec
  010; promotion merge checked against the FR-004
  hazard rule (no staging-only robots.txt / _headers
  in the diff); production re-measured after deploy;
  AEO/SEO baseline 100/90 confirmed on the next
  monitoring cycle.

## Out of scope / deliberately untouched

- No sticky or bottom-anchored footer (changes the
  layout character; the perceived emptiness on short
  pages in tall viewports is page length, not spacing).
- No change to the CTA band's or footer's internal
  layout, copy, or content on any page.
- No change to `/signals/` top spacing (spec 011
  Amendment 2 values stand) or to any page head
  (spec 003 values stand).
