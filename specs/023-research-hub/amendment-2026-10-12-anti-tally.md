# Spec 023 — Amendment 2026-10-12: status panel becomes mechanism-first

**Approved by the owner 2026-10-12.** Implemented on `staging` only;
production promotion is a separate, later owner-gated step and is
NOT part of this amendment's execution.

## Reason

The program's reporting doctrine was realigned 2026-10-12 on the
anti-gradability principle: verdicts are never reported as bare
tallies — counts never stand in for understanding; every reported
result carries its mechanism. The hub's status panel was the one
public surface in direct conflict with that doctrine: it reported
Program one's state as verdict counts ("32 registered studies run
to completion / 15 claims confirmed / 11 claims falsified / 1 study
running / 1 awaiting a lab partner") with no mechanism attached.
The panel was also stale: the "1 study running now" line's study
has since closed without a verdict (the signal could not be read
from its dataset at the preregistered standard), so the count line
was inaccurate as well as tally-form.

## Change

- The tally panel is replaced, in the same WF-18 panel position and
  styling, by five plain-language mechanism statements under the
  heading **"What the program has learned so far"**, followed by a
  single status line stated as a state, not a count: "One further
  study is designed, registered, and waiting on a laboratory
  partner."
- The replacement copy carries no counts of studies, claims, or
  verdicts; no claim labels, scores, or internal identifiers —
  FR-004's other content limits are unchanged and re-checked.
- This amendment supersedes the FR-004 clause "Program status is
  stated as plain counts and plain sentences only" for this panel:
  program status on this page is now stated as plain sentences
  only.
- One dependent sentence is corrected: Program two's paragraph
  previously pointed at "the confirmed and falsified counts above";
  it now points at the results being stated with their reasons
  attached.
- `research-hub-copy.md` and WF-18's drawn panel + copy notes are
  updated to match, so wireframe, copy source, and page agree.
- Copy-only change. No layout change; the panel keeps its bordered
  form (page-local styles only, per WF-18's Privacy precedent). The
  shared stylesheet is untouched.

## Verification (staging)

- Playwright screenshots of staging `/research/` at desktop (1280)
  and mobile (390) widths, panel in frame, compared against WF-18
  as amended.
- Staging guards re-verified after the change: `robots.txt` is the
  Disallow version; `_headers` carries the X-Robots-Tag line; the
  page's own `noindex` robots meta is unchanged.
