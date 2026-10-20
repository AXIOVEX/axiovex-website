# Design note — Signals Briefing, daily regeneration (DRAFT, not enabled)

**Status:** Design only, written 2026-10-20 alongside the first
hand-built edition (signals/listening/2026-10-20/). **No recurring
job exists or is authorized by this note.** The owner hears the
first edition and decides whether a daily edition should exist at
all; only then is a job created, on his say-so.

## What the daily edition is

The same "Signals Briefing" block that the first edition adds to
the top of /signals/: an intro chapter, one chapter per Signals
lane (five), and a closing "what to watch" chapter — the existing
listening player, unchanged. Each edition is labeled with its
date and the snapshot's "as of" time, exactly like the first.

## Proposed morning pipeline (when and if the owner blesses it)

Home: the Muse scheduler, per Spec 028 (publication work runs
from the scheduler, never from GitHub Actions). Proposed fire
time: after the morning signals-sync has refreshed
`data/signals.json` (about 08:40 ET), on weekdays.

1. **Freshness check.** Read the committed snapshot's
   `updatedUtc`. If the snapshot did not refresh today, stop and
   report — never narrate a stale board as if it were fresh.
2. **Script build (mechanical).** Assemble the script from the
   snapshot only: lane chapters from item titles, sources, and
   dates; the Michigan chapter adds the Pulse tiles (BLS figures
   with their reference month); a lane whose newest item is more
   than a few days old is narrated as quiet, with the date of its
   newest item — honesty is a feature, per the first edition.
   The "what to watch" chapter is built from future-dated facts
   already in the snapshot (e.g. WARN effective dates still
   ahead) and from quiet lanes. Numbers are converted to spoken
   form by a number-to-words step; no figure is typed by hand.
3. **Fidelity check (hard gate).** Before any audio is made:
   every number in the generated narration (digits or spelled
   out) must match a value present in the snapshot or the Pulse
   tiles, and every quoted headline must match an item title in
   the snapshot. Any mismatch stops the run: nothing is
   synthesized, nothing is published, and the mismatch list goes
   to the owner in the morning report.
4. **Synthesis.** Same voice as the pilot (Daniel — Steady
   Broadcaster), one MP3 per chapter, durations probed, written
   to `assets/audio/signals-briefing/<YYYY-MM-DD>/` with
   `chapters.json` + `script.md` under
   `signals/listening/<YYYY-MM-DD>/` — the same layout as the
   first edition, so the build's "newest edition" selection
   picks it up with no code change.
5. **Publish + verify.** Commit to staging and production (the
   briefing is a standing feature once blessed, not a per-day
   editorial decision), let the build run, then verify the
   served page: briefing block present with today's date, MP3s
   return 200 audio/mpeg, page invariants unchanged (the two
   designed newsletter sections stay; breaking banner logic
   untouched; guard files untouched). Exactly-once: if today's
   edition already exists, the job does nothing.
6. **Report.** The morning report names the edition's runtime,
   the lane states (including quiet lanes), and any fidelity
   stops. A failed run is reported as failed, never silently
   retried into a late edition (Spec 028 discipline).

## Open questions for the owner (decide at blessing time)

- Weekdays only, or seven days a week?
- Retention: keep every daily edition's audio on the site, or
  only the latest edition (older scripts stay in git either
  way)?
- Does the daily edition also get announced anywhere (it is not
  a blog article; the Spec 028 posting cadence does not cover
  it), or does it simply live at the top of /signals/?
