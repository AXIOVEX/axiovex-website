# Spec 030 — Listening-edition voice picker

**Direction:** Tristen Pierson, 2026-10-21: "Add setting on the
website to change voices. Allow several more voices, a few
females and other voices that may resonate well for listeners."
Design package (wireframe delta + implementation plan) prepared
2026-10-21; **owner decisions 2026-10-22:** (1) the default voice
is **Brian** — Tristen, replying to the Brian audition sample:
"I like all of these but can we make this one the default?";
(2) the roster is narrowed to **two voices — Brian and Sarah**.
Eight voices were auditioned; five further voices (Matilda,
Bella, Bill, Eric, River) were wholly or partly rendered before
the narrowing and are NOT shipped (131,867 characters spent on
them — see plan.md), and Mr Wellington leaves the article
picker entirely.

**Status:** APPROVED for staging implementation 2026-10-22
(WF-04 amendment approved with the package). Production is a
separate owner gate after the staging build is heard and seen
(FR-011).

## What this is

Listening editions (spec 029) gain a narrator choice. Article
editions are pre-rendered in every roster voice; the player
(listening.v4) offers a Voice button and narrator panel on
editions that offer more than one voice; the choice persists
on the listener's device and applies to every edition.

## The roster (owner's ear — HUMAN-AS-ORACLE)

| Voice | ElevenLabs id | Panel description |
|---|---|---|
| Brian (default) | nPczCjzI2devNBz1zQrb | Deep and resonant, comforting and steady. |
| Sarah | EXAVITQu4vr4xnSDxMaL | Warm and reassuring, with a calm, confident delivery. |

Brian is also the Signals Briefing voice from 2026-10-22 (the
builder's pinned default); past briefing editions stay as
recorded, in the voice they were recorded in. Wellington's
article-edition audio is removed from the deploy by this change
(the flat paths become Brian's render); his files remain
recoverable in git history, and the removal is named in the
commit that carries it.

## Requirements

- **FR-001 — Roster rendering.** `scripts/build-listening.mjs`
  renders any single roster voice (`--voice`) or all of them
  (`--all-voices`, the standard article build); with no voice
  option it renders the default voice only, the behaviour the
  daily briefing flow relies on. Already-rendered files are
  never re-rendered unless `--force`.
- **FR-002 — Back-catalog completeness.** Every article edition
  offers every roster voice for every chapter before promotion:
  file present, duration present and > 0, data aligned with
  files. (Verified by `verify-voices.mjs` in this folder.)
- **FR-003 — Presence rule.** The voice control renders if and
  only if the edition's data offers more than one voice;
  single-voice editions render exactly the spec 029 frame.
- **FR-004 — Switch semantics.** Switching voice mid-edition
  preserves chapter, within-chapter position (clamped to 2 s
  before the new voice's chapter end), and play/pause state.
- **FR-005 — Persistence.** The chosen voice (localStorage
  `le-voice`) survives reloads and applies on every edition
  page; it never leaves the device.
- **FR-006 — Resume integrity.** Resume records carry the voice
  they were saved in. Restoring in a different voice lands in
  the same chapter at the same fraction through it. Records
  written before this feature name no voice; they were saved
  against the pre-picker default (Wellington), which the
  roster no longer offers, so they are read against the
  DEFAULT (Brian) track — same chapter, same position, in the
  default voice's pacing (owner scope decision 2026-10-22).
- **FR-007 — Fallbacks.** A stored voice missing from an
  edition's roster, or a chapter file missing for the chosen
  voice, degrades to the default voice for that edition or
  chapter with no error state shown.
- **FR-008 — Mini-player reflection.** The mini-player plays
  the selected voice and gains no new controls.
- **FR-009 — Privacy disclosure.** The privacy policy §3
  storage bullet names the narrator voice ("…and the playback
  speed and narrator voice you chose."), committed on its own;
  on production promotion the subscriber privacy notice fires
  from privacy@ — a planned effect of this change.
- **FR-010 — Roster of record.** The voices offered are exactly
  the table above; the descriptions are the panel copy.
- **FR-011 — Staging first, owner gate.** The full package is
  verified on staging as served (rendered checks at desktop and
  mobile widths; evidence the served audio for a chosen voice
  is that voice's file). Production promotion happens only on
  Tristen's explicit say-so, then is re-verified the same way.
- **FR-012 — New-article rule.** A new article's listening
  edition is built in the full roster (`--all-voices`) as part
  of its normal build; the daily briefing build is untouched
  and stays default-voice-only.

## Out of scope / known edges

- Five auditioned voices were rendered in whole or part before
  the roster narrowed (131,867 characters; ledger in plan.md).
  Their files were deleted uncommitted; nothing of them ships.


- The Lansing article (dated 2026-10-27, unpublished) already
  has a single-voice edition on staging. It is outside this
  spec's six-edition back catalog; its edition must be rendered
  in the full roster with `--all-voices` when it publishes.
- By design (FR-005) the site collects nothing about which
  voices listeners pick; there is no usage signal to report.
