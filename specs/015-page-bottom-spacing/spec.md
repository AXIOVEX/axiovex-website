# Feature Specification: Page-Foot Spacing Rhythm

**Feature Branch**: `015-page-bottom-spacing`

**Created**: 2026-10-06

**Status**: APPROVED 2026-10-06 (T001 gate — Tristen:
"Approve spec 015 wireframes — implement it") ·
**IMPLEMENTED AND LIVE 2026-10-06** — implemented on
staging (styles.v29.css; tasks T002–T004 verified by
computed-style measurement), promoted to production
with spec 013 in merge `4497704` (T005, per spec
010; FR-004 guard proof empty; the served
styles.v30.css carries the rhythm values 48px / 56px /
40px); closeout (T006) complete.

**Input**: Tristen Pierson (owner), 2026-10-06: "also there is
a lot of vertical empty space at the bottom of the pages too.
fix that by putting things closer together but to where
everything looks nice at the end."

This is the bottom counterpart to spec 003's page-head rhythm
(WF-G2: 36px / 40px at the top of the page) and follows the
same pattern: measure the real stacks, define ONE rhythm,
apply it everywhere, change nothing else.

## Measured current state (2026-10-06)

Read from the stylesheet the site ships on main after the
spec 011/012 promotion (`styles.v28.css`) and the page
shells/templates. Shared components: `.section` padding
76px top/bottom (60px at ≤820px); `.cta-band` padding 76px
top/bottom (60px at ≤820px), internal spacing eyebrow 16px /
lede 32px; `.footer` padding 56px top / 32px bottom (no
≤820px override), internal grid gap 32px, grid margin-bottom
36px, bottom-row padding-top 20px.

Desktop ending stacks — last content → footer content, pure
padding only (band content itself excluded):

| Page | Stack (in order) | Total |
|---|---|---|
| Home | FAQ rows → section pad-bottom **76** → band pad-top **76** → band content → band pad-bottom **76** → footer pad-top **56** | **284px** |
| Blog index | last card → list pad-bottom 24 → section pad-bottom **76** → band **76** → content → band **76** → footer **56** | **308px** |
| Article | back-link → article pad-bottom 24 → band **76** → content → band **76** → footer **56** | **256px** |
| Documents | cards-note → section pad-bottom **76** → band **76** → content → band **76** → footer **56** | **284px** |
| Signals | sources note → section pad-bottom **76** → band **76** → content → band **76** → footer **56** | **284px** |
| Privacy | last prose paragraph → section pad-bottom **76** → band **76** → content → band **76** → footer **56** | **284px** |
| Contact | form/panels → section pad-bottom **76** → footer pad-top **56** (no CTA band — the page is the CTA) | **132px** |

At ≤820px the same stacks total 236px on band pages and
116px on Contact (section 60, band 60/60, footer unchanged
at 56).

Notes on the measurements:

- Contact's 132px is one uninterrupted void — the same size
  as the 132px head void spec 003 measured and fixed at the
  top of Documents/Contact/Privacy. The bottom of Contact
  is today what the top of Documents was in spec 003.
- The article's pre-band gap (24 + 76 = 100px) is already
  the tightest on the site; the article's excess is the
  shared band + footer stack, not anything article-specific.
- Blog index carries an extra 24px inside its list
  (`#post-list` padding-bottom). That is the list
  component's own breathing room — counted above, and not
  part of the rhythm (FR-003).
- Every stack above is real, specifiable padding — none is
  a short-content artifact. One honest caveat: the footer
  is not bottom-anchored, so on a tall viewport the
  shortest pages (Contact, Documents) still end above the
  bottom of the screen. That is page length, not spacing;
  this spec fixes the gap stack and does not propose a
  sticky footer.

## Proposed rhythm (WF-G2 addition — "page-foot rhythm")

| Element | Desktop: now → proposed | ≤820px: now → proposed |
|---|---|---|
| Last content section, padding-bottom | 76 → **48px** | 60 → **40px** |
| CTA band, padding top + bottom | 76 + 76 → **56 + 56px** | 60 + 60 → **44 + 44px** |
| Footer, padding-top | 56 → **40px** | 56 → **40px** (no override today) |

Resulting ending stacks (desktop): band pages 284 → **200px**
(−84, ≈ −30%); blog index 308 → **224px**; article 256 →
**176px**; Contact 132 → **88px** (−44, exactly one third).
At ≤820px: band pages 236 → **168px**; Contact 116 →
**80px**. The ending cadence — 48 settle → filled band →
40 into the footer — mirrors the head rhythm's discipline
(36/40) without copying its values: even, deliberate,
visibly finished rather than trailing off.

## Requirements *(mandatory)*

- **FR-001**: One page-foot rhythm at the end of every
  page, recorded at WF-G2 as the counterpart to spec 003's
  page-head rhythm: last content section padding-bottom
  **48px**; CTA band padding **56px** top and bottom where
  present; footer padding-top **40px**. At ≤820px:
  **40px / 44px / 40px**.
- **FR-002**: The last-section value applies to the final
  content section of Home (FAQ), Blog index (post list),
  Documents (cards), Signals (content), Privacy (prose),
  and Contact (form/panels). Article pages end in
  `.post-article`, not a `.section`; their existing 24px
  article padding-bottom already sits inside the rhythm
  and is unchanged — articles tighten only via the shared
  band and footer values.
- **FR-003**: Nothing else changes — no copy, no
  structure, no other spacing. Explicitly unchanged: the
  CTA band's internal spacing (eyebrow 16px, lede 32px);
  the footer's internal spacing (grid gap, mission
  margins, bottom row, 32px bottom padding) and every tap
  target; `#post-list`'s internal 24px; all mid-page
  section spacing (the `.section` rule itself is not
  re-valued — the 48px lands only on final sections);
  spec 003's head rhythm; spec 011 Amendment 2's
  signals-only top values (this spec touches the signals
  page's bottom only, through the shared values).
- **FR-004**: Contact ends on the same rhythm minus the
  band: 48px → footer 40px = 88px total (was 132px). No
  CTA band is added to Contact.
- **FR-005**: Wireframes first (WF-G2 rhythm addition;
  WF-G3 and WF-G4 spacing captions; WF-01 and WF-06
  bottoms redrawn with before → after captions; the other
  page frames inherit through the global frames) and
  owner approval before implementation; revision log
  marked approved after verification.
- **FR-006**: Implementation lands on the staging branch
  per spec 010 and ships as the next versioned stylesheet
  in the staging chain sequence (after styles.v28.css),
  per the cache-busting rule; shells/templates are edited
  at the source and generated pages rebuilt by the
  generator — no hand-edited generated output.
- **FR-007**: Verified by measurement on staging and
  after promotion: computed ending stacks on all seven
  page types equal the rhythm values at desktop and
  390px; mid-page section gaps measured unchanged; the
  AEO/SEO baseline (100/90) holds.

## Acceptance scenarios

1. **Given** /contact/, **When** it loads, **Then** the
   form/panels end 48px above the footer's top edge and
   the footer content begins 40px below it — an 88px
   ending stack in place of today's 132px void.
2. **Given** any band page (home, blog index, article,
   documents, signals, privacy), **When** it loads,
   **Then** the last section ends 48px above the band
   (articles: their unchanged 24px), the band carries
   56px above and below its content, and the footer
   content sits 40px below the band.
3. **Given** the home page, **When** any mid-page section
   boundary is measured, **Then** it equals today's
   values — only the page's ending moved.
