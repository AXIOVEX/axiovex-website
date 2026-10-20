# Spec 029 — Listening editions (pilot: the robots article)

**Direction:** Tristen Pierson, 2026-10-20. After reviewing
Joe Santavicca's Market Intelligence "Listening Edition"
(a narrated report whose slide cards advance with the
audio), Tristen directed: adapt the format for Axiovex —
"we want the live report thing he does where we have the
report speak live and has a slideshow kind of thing" — and
chose the pilot option: a listening edition of the robots
article, built on **staging** for his review.

**Status:** PILOT, specified and built 2026-10-20 on
`staging` only. Production is **not** in scope: it requires
the owner's separate approval after he has heard the
pilot (FR-006).

## What a listening edition is

A sister deliverable of a published blog article: a spoken
adaptation of the article, recorded as audio, presented on
the article's own page as a player whose slide card —
kicker, headline, three key points, one takeaway — swaps
at each chapter boundary while the narration plays. A
numbered chapter list beside the player seeks the audio
to the chapter clicked. The format grammar is adapted
from the reference design; the visuals are this site's own
(navy/cyan design language, existing styles).

## Requirements

- **FR-001 — Script source discipline.** The narration is
  derived solely from the published article's text. Every
  number and fact is identical to the article; no new
  claims, examples, or framing facts are introduced.
  Phrasing may change for the ear (abbreviations spelled
  out, numbers written as spoken).
- **FR-002 — Length and shape.** The spoken script runs
  6–8 minutes at a normal pace and is divided into 5–7
  chapters. Each chapter carries a kicker, a headline,
  exactly three key points, and one takeaway line — all
  derived from that chapter's own narration.
- **FR-003 — One audio file per chapter.** Narration is
  synthesized and stored as one MP3 per chapter, so
  chapter boundaries — and therefore slide sync — are
  exact rather than timestamp-estimated.
- **FR-004 — Player.** The article page carries a
  "Listening Edition" section near the top with: the
  slide-card area, the numbered chapter list (clicking a
  chapter starts that chapter), play/pause, an
  elapsed/total time readout, and a progress control
  reflecting the whole edition. Chapters play in sequence
  as one continuous edition.
- **FR-005 — Per-article gating.** The only switch is a
  data file, `blog/listening/<slug>/chapters.json`. The
  build emits the player only for an article that has
  one; all other article pages render unchanged.
- **FR-006 — Staging-only pilot.** The pilot ships to
  staging only. Any production promotion is a separate
  owner decision, made after the owner hears the pilot.
- **FR-007 — Site invariants preserved.** Exactly one
  newsletter form on the page; staging/production guard
  files (`robots.txt`, `_headers`) untouched; future-dated
  posts remain held by the build's date discipline; the
  research hub's noindex posture is unaffected.
- **FR-008 — Assets.** Player CSS/JS are new versioned
  files (`blog/listening.v1.css`, `blog/listening.v1.js`)
  per the site's cache rule, dependency-free vanilla JS.
  Audio lives under `assets/audio/<slug>/`.

## Claims (AEE, light)

- **C-029-1** — The narration contains no claim that is
  absent from the published article. *Checked at
  authoring, figure by figure, against the article text.*
- **C-029-2** — Every chapter card's content is derivable
  from its own chapter's narration; the cards introduce
  no facts of their own.
- **C-029-3** — The feature is inert for articles without
  a listening data file: the build emits nothing for them.

## Out of scope

- Production release of any listening edition (FR-006).
- Listening editions for other articles; a daily/weekly
  "signal cast"; podcast/RSS distribution of the audio.
  Each is a later decision, informed by this pilot.
- Any change to the article's text, claims, or metadata.
