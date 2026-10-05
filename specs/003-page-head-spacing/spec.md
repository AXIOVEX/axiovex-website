# Feature Specification: Page-Head Spacing Rhythm

**Feature Branch**: `003-page-head-spacing`

**Created**: 2026-10-05

**Status**: Wireframes revised — **awaiting Tristen's approval** (wireframe
gate, constitution §III). No website changes before approval.

**Input**: Tristen Pierson (owner), 2026-10-05, with a screenshot of
/documents/: "fix padding here between the cards and divider above them
and move the divider up more closer to the text above it with sufficient
padding — there is too much blank space and it looks bad. make sure this
applies to all similar parts in the site/UX."

## Measured current state (2026-10-05, 1440px viewport)

| Page | Head text → strata | Strata → first content |
|---|---|---|
| Documents | **132px** (void) | **~8px** (crowded) |
| Contact | **132px** | **~8px** |
| Privacy | **132px** | 48px |
| Blog index | 16px | tools/list (44px list margin, spec 002) |
| Article | 28px (tags → strata) | 22px (share row, spec 002) |

The 132px comes from the shared `.section` head construction (76px
padding-bottom plus lede margins); the ~8px from the following section's
8px top padding. The home hero divider is a different construction
(full sections on both sides, no void) and is out of scope.

## Requirements *(mandatory)*

- **FR-001**: One page-head rhythm wherever the strata bar closes a page
  head: last head text → strata = **36px**; strata → first content =
  **40px**. Applies to Documents, Blog index, Contact, Privacy.
- **FR-002**: Article heads join the same rhythm above the bar:
  tags → strata = **36px** (was 28px). Below the bar, the article keeps
  spec 002's approved values (share row 22px above / 20px below).
- **FR-003**: Nothing else changes — no copy, no structure, no other
  spacing. Section rhythm elsewhere (home page) is untouched.
- **FR-004**: Wireframes first (WF-G2 rhythm spec; notes on WF-03,
  WF-05, WF-06; new WF-10 Documents frame) and owner approval before
  implementation; revision log marked approved after verification.
- **FR-005**: Ships as a new versioned stylesheet (styles.v22.css) per
  the cache-busting rule; generated pages rebuilt by the generator.
- **FR-006**: Verified by measurement after deploy: computed gaps on all
  five page types equal the specified values at desktop and mobile
  widths; AEO/SEO baseline (100/90) holds.

## Acceptance scenarios

1. **Given** /documents/, **When** it loads, **Then** the lede sits 36px
   above the strata bar and the document cards begin 40px below it.
2. **Given** any other page head (blog index, contact, privacy,
   article), **When** it loads, **Then** the same 36px-above value
   holds, with 40px below (article share row excepted per FR-002).
