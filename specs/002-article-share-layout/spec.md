# Feature Specification: Blog Article Share Layout — Top Only, More Air

**Feature Branch**: `002-article-share-layout`

**Created**: 2026-10-05

**Status**: Wireframes revised — **awaiting Tristen's approval** (wireframe
gate, constitution §III). No website changes before approval.

**Input**: Tristen Pierson (owner), 2026-10-05: "for blog articles, remove
the share buttons from the bottom of the blog articles. we should only
have them at the top. also update the wireframes if needed… also increase
padding between the top divider line and share links and articles
(depending on which page this is)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reader shares an article (Priority: P1)

A reader finds the share controls once — at the top of the article,
directly under the strata divider, with clear space around them — and
never meets a second, redundant share block at the end.

**Acceptance Scenarios**:

1. **Given** any article page, **When** it loads, **Then** exactly one
   `.share-row` exists, positioned under the strata bar.
2. **Given** the end of an article, **When** the reader finishes the body,
   **Then** the next element is "More analysis" — no "Share this article"
   block, no second button row.
3. **Given** a touch device, **When** the top row renders, **Then** the
   Text (SMS) option is present; on non-touch it stays hidden (unchanged
   behavior from 95a70bd).

### User Story 2 - Visitor scans the blog index (Priority: P2)

The article list starts with more air under the page divider, matching
the calmer spacing of the article page.

**Acceptance Scenarios**:

1. **Given** /blog/, **When** it loads, **Then** the article list's top
   margin is 44px (was 32px).

## Requirements *(mandatory)*

- **FR-001**: Article pages render exactly one share row — the top row
  (`{{SHARE_TOP}}`). The `.post-footer` block ("Share this article" +
  `{{SHARE_BOTTOM}}`) is removed from the template and the generator.
- **FR-002**: Top share row spacing increases: `.share-row` margin
  becomes `22px 0 20px` (was `6px 0 4px`) — clear space between the
  strata divider and the buttons, and between the buttons and the body.
- **FR-003**: Blog index: `#post-list` top margin becomes `44px`
  (was `32px`).
- **FR-004**: Wireframes WF-04 and WF-03 are updated first and approved
  before implementation (this spec's gate); after implementation the
  wireframe revision is marked approved in the revision log.
- **FR-005**: Stylesheet ships as a new versioned file (`blog/blog.v10.css`)
  per the cache-busting rule; generated pages are rebuilt by the
  generator, never hand-edited.
- **FR-006**: No other layout, content, or behavior changes; AEO/SEO
  baseline (100/91) must hold after the change.

## Out of scope

- Share button set, order, or targets (unchanged: X, Facebook, LinkedIn,
  Email, Text [touch], Copy link, More…).
- The "More analysis" cross-links and back-link (unchanged).
