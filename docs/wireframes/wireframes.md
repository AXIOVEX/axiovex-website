# Wireframes — Axiovex Systems website

Canonical set: `wireframes.html` in this folder (branded review document).
This file is the index, the gate rule, and the revision log.

## The gate (owner rule, Tristen Pierson)

- **Wireframes first.** Any change that impacts UX starts here: update the
  wireframes, get Tristen's approval, and only then change the website.
- **Always current.** The wireframes must match the approved design of the
  live site at all times. A website change that ships without a matching
  wireframe update is a process defect, not a shortcut.
- UX changes run through the spec-kit + AEE SDD flow (`specs/`): the spec
  references the wireframe revision it implements.

## Frame inventory (approved 2026-10-04)

- WF-01 Home — desktop · WF-02 Home — mobile (390px)
- WF-03 Blog index · WF-04 Blog article · WF-05 Privacy policy
- WF-06 Contact · WF-07 Home — tablet (834px) · WF-08 Contact — tablet
- WF-09 Blog / article / privacy — tablet
- Global components: WF-G1 nav · WF-G2 strata bar · WF-G3 CTA band · WF-G4 footer

Framing decisions baked into the set (2026-10-04): centered axis (standing
symmetry rule); strata = 3 segments
(Axiovex's three service lines); no contact form (email routes only); no
invented proof — evidence band carries real published material only; FAQ kept
as accordion rows.

## Revision log

- **2026-10-04** — Full set (14 frames incl. tablet set) approved by Tristen;
  redesign implemented the same day (commit 7102f67).
- **2026-10-05** — REVISION PENDING APPROVAL (spec 002-article-share-layout):
  WF-04 — share row drawn at the TOP of the article only, directly under the
  strata divider, 22px clear above / 20px below; the end-of-article share
  block removed from the frame. WF-03 — article list starts lower under the
  divider (list top margin 32px → 44px). Not yet implemented on the live
  site; implementation waits on approval of this revision.
