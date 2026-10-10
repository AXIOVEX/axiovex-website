# Proposal — Newsletter signup placement expansion

**Status: APPROVED by Tristen Pierson 2026-10-10** — header
label decided: **Subscribe**. Implementation runs through the
spec-kit + AEE flow as **spec 021-newsletter-signup-placement**
(staging first; production promotion is a separate owner
approval), with this note and the revised frames as its
wireframe basis.

**Approval record (2026-10-10).** The ranked set is approved
as drawn. The three flagged items are resolved: (1) the
header label is **Subscribe** — the "The Signal" alternative
is declined (naming collision with the nav's existing
**Signals** item, below); (2) WF-15's v1 "Not in the nav"
note is **superseded** by the WF-G1 header CTA; (3) the
homepage section sits **after the Signals + Michigan Pulse
block**, as drawn (the stricter "immediately after the
services grid" reading is not taken).

## Why

Spec 020 (The Axiovex Signal) is live, but its signup exists only
inside /signals/ content and on the /newsletter/ archive — a visitor
who enters anywhere else never meets it. Tristen asked for a more
obvious signup. A placement research report (2026-10-10,
`~/workspace/research_notes/newsletter-signup-placement-research-20261010-1314/report.md`)
found no single winning placement: the highest per-visitor
conversion is a dedicated landing page, the highest intent is
end-of-article, the highest reach is a persistent header CTA plus a
sitewide footer form. The recommendation is a layered,
always-visible system in the site's centered editorial style — and
no interruptive formats (modal popups are the most-disliked format
in NN/g's research and a credibility risk for a trust-sold firm).

## The ranked set, and what changes where

Every placement reuses the existing **WF-G8** signup block — same
copy elements (heading "The week, in your inbox.", the "Wednesdays
at 10:00 AM ET" cadence line, the one-email-a-week + no-tracking
fine print with the Privacy policy link), same email-only field,
same **Subscribe →** button, same confirmation-first pending state.
Adaptations are positional only; implementation stays DRY — one
component, plus the new **compact variant** drawn at WF-G8 for the
two tight slots. Each placement records its own signup *source*
(the endpoint already stores it) so placements can be compared per
1,000 visitors, the way Industry Dive tags `signup_location`.

1. **Header CTA — WF-G1 (all pages).** A **Subscribe** ghost
   button → /newsletter/, immediately left of the Contact CTA;
   the hamburger panel gains the matching row above its full-width
   Contact CTA. Contact keeps the stronger bordered treatment and
   stays visually primary. *Label decision:* **Subscribe** is
   drawn. The alternative, "The Signal", was set aside: the nav
   row already carries **Signals** (the board), and a one-letter
   difference in the same row invites mis-taps. If the owner
   prefers the product name, it is a label-only change at
   approval. No form in the header; the button is a plain link.
   Drawn at WF-G1; the per-frame nav mocks inherit at
   implementation.
2. **End-of-article block — WF-04 (every blog article).** The
   WF-G8 block in full, centered at the article measure, after the
   body and before More analysis. Source: `article`. WF-16 issue
   pages already close with this block ("Get your own,
   Wednesdays." under "Reading someone else's copy?" — that
   heading variant stays issue-page-only); this extends the same
   pattern to articles, including Signals posts published as
   articles.
3. **/newsletter/ as a landing page — WF-15.** Order becomes:
   page head (existing value promise) → landing lead → archive →
   CTA band → footer. The lead carries the WF-G8 form **above the
   archive**, the cadence restated at the form ("Every
   Wednesday"), three factual content bullets (Michigan workforce
   data with vintages · manufacturing & field signals · industrial
   AI checked against sources — the series' actual sections), and
   the privacy/no-tracking line. The archive becomes the sample
   proof ("Read a sample issue ↓"). The v1 closing WF-G8 block is
   removed — **one form per page**. A proof slot is drawn empty:
   no subscriber count or testimonial exists, so none is claimed;
   it ships only when a real one does. Source: `landing`. Normal
   navigation is retained; the page has one conversion goal.
4. **Homepage section — WF-01.** The WF-G8 block in full as a new
   section directly after the Signals + Michigan Pulse block and
   before About — below the hero and the services grid, whose CTAs
   are untouched and unmoved. Source: `home`. WF-02 (mobile)
   inherits the section in its stack.
5. **Footer form — WF-G4 (all pages).** A centered newsletter
   strip above the three-column grid: the WF-G8 compact variant
   with a working email field, not just a link. The passive layer —
   lowest per-impression conversion, zero interruption, present
   everywhere including Contact. Source: `footer`. The grid, legal
   row, and bottom row are unchanged.
6. **Signals page head — WF-11 (research item 6).** The compact
   variant directly under the page head, ahead of Highlights. The
   approved full WF-G8 block keeps its v1 slot at the page foot
   (below the Sources & method note, above the CTA band) — the page
   carries both deliberately. Sources: `signals-top` / `signals`.

## llms.txt addition (proposal only — not edited by this revision)

Two lines for the link list, in the file's existing style, to sit
beside the Signals line:

```
- Newsletter — The Axiovex Signal (weekly email edition of Signals; subscribe + archive): https://axiovexsystems.com/newsletter/
- Latest issue of The Axiovex Signal (web edition): https://axiovexsystems.com/newsletter/2026-10-14/
```

(The second line names the current issue at proposal time;
implementation should point it at the then-latest issue.)

## Non-goals — explicit

- **No popups, modals, slide-ins, welcome mats, or exit intent** —
  the research's brand-risk finding and the owner's taste agree.
  (The research leaves a capped, articles-only scroll slide-in as
  a possible later test; it is NOT part of this proposal.)
- **The homepage hero CTA is unchanged** — above-the-fold stays
  with the primary services offer; the newsletter section sits
  below it.
- **Contact remains the primary CTA** everywhere both appear.
- **No new claims** — no subscriber counts, testimonials, urgency,
  or scarcity; no copy beyond WF-G8's existing words and three
  factual content bullets.
- **No nav restructure** — one button is added; no link moves or
  is renamed. (Making /signals/-style nav entries for the archive
  beyond the Subscribe button is out of scope.)
- **No second form design** — if a placement cannot take WF-G8 or
  its compact variant as drawn, it waits rather than improvising.

## Conflicts found in the existing wireframes (flagged, not overridden)

- **"The Signal" vs "Signals" (naming collision).** The research
  offers "The Signal" as a header label, but WF-G1's row already
  carries **Signals** for the board. The frames therefore draw
  **Subscribe** and record the alternative here; the owner decides
  at approval with the collision in view.
- **WF-15's v1 note "Not in the nav (v1)"** records that WF-G1
  stays unchanged and a nav entry is a later decision. Placement 1
  is that later decision arriving: if approved, the v1 note is
  superseded (annotated as such at WF-15, not silently deleted).
- **WF-G8's v1 placement statement** ("v1 placement: /signals/
  only") and WF-15's "WF-G8 block closes the page" are the
  approved spec 020 positions this proposal revises; both frames
  carry the PROPOSED annotation alongside the original text so the
  change is visible at review, not buried.
- **Homepage slot.** The research says "below the hero and core
  services proof"; the frames draw the section after the Signals +
  Michigan Pulse block (the newsletter's own content home on the
  page) rather than immediately after the services grid. Moving it
  up one slot is a zero-cost change at approval if the owner
  prefers the stricter reading.

## Approval ask

Approve the ranked set as drawn (frames WF-G1, WF-G4, WF-G8,
WF-01, WF-04, WF-11, WF-15 as revised 2026-10-10), with any
label/slot adjustments noted, and an implementation spec follows
under the SDD flow. Approval covers placements and copy reuse
only — implementation details (stylesheet bump, generator slots,
per-placement source values) belong to that spec.

**Satisfied 2026-10-10:** approved as drawn, header label
**Subscribe**; the implementation spec is
`specs/021-newsletter-signup-placement/`.
