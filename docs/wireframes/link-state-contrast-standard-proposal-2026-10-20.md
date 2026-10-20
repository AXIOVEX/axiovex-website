# Proposal — Link, state & contrast standard (proposed WF-G9)

**Status: APPROVED — Tristen Pierson, 2026-10-20.** This document is
wireframe frame **WF-G9** (a global standard, alongside WF-G1 header /
WF-G4 footer / WF-G8 signup block). The revision-log entry is recorded
in `wireframes.md` (2026-10-20). Implementation ran staging-first the
same day (see "Implementation" at the end of this document); production
promotion stays a separate owner gate.

**Drawn from:** the full-site audit of 2026-10-20
(`2026-10-20-axiovex-full-site-audit.md`, delivered to the owner the
same day): 18 paths, 41,636 cascade-computed contrast evaluations
(element × state × viewport), ordered after two contrast defects
reached the owner in one day.

## Why

Twice on 2026-10-20 the site failed the same way: a state nobody had
rendered. Plain prose links had no site-defined color at all and fell
back to browser-default dark blue/purple — unreadable on navy (owner
screenshot: Signals Highlights source links). The emergency repair then
repainted *visited* pill-button text pale-on-cyan, because a bare
`a:visited` selector (specificity 0,1,1) outranks single-class
component rules (0,1,0). The second repair (styles.v43, live) scopes
the base rule with `:where()` and retests clean — the audit verified
the flagship pill at 10.07:1 in all four states. But a repair is not a
standard: the audit found the same *class* of problem still live in
three places, and nothing written down stops the next stylesheet edit
from re-opening any of them. This proposal writes the standard down.

## Audit evidence (summary)

- **A — Signup fine print fails on every page.** The consent line under
  every WF-G8 signup form (`.nl-fine`, white at 45% opacity, 12.5px)
  composites to **4.16:1** against the 4.5:1 requirement — 16 instances,
  all 15 content pages.
- **B — Newsletter placeholders unstyled.** Every signup email field
  shows its placeholder in browser-default gray (≈3.54:1, Chromium
  default) because only the contact form's placeholders are styled.
- **C — Heading skips.** Listening Edition card headlines are `<h3>`
  directly under the page `<h1>` (5 articles + /signals/), and
  /research/ has an `<h3>` section head under its `<h1>`.
- **D — Stylesheet drift.** /privacy/ and /disclaimer/ still load
  styles.v37, /research/ loads styles.v40, the 2026-10-14 newsletter
  issue loads blog.v11 — all outside today's v43 base-link safety net.
  No failure results *today* (their links are component-styled), but
  one plain prose link added to any of them re-opens defect #1.

## The standard (proposed WF-G9)

### S1 — Prose-link colors (links with no component style of their own)
- **Unvisited:** brand cyan, `var(--cyan)` (#00DEF6), underlined,
  `text-underline-offset: 3px`.
- **Visited:** pale ice cyan **#8BE9FF** — visibly distinct from
  unvisited, comparably readable on navy.
- **Hover:** same colors; underline remains; no color swap that drops
  contrast.
- **Focus:** the global `:focus-visible` outline (2px solid cyan,
  3px offset) — never removed, never outline:none without a replacement.
- These are exactly the values styles.v43 ships today; S1 ratifies them
  as design, so a future restyle must amend this frame to change them.

### S2 — Components are state-invariant
Buttons, pills, cards, nav items, footer links, chapter buttons, share
buttons — anything whose colors come from a component rule — must look
**identical in the visited state**. No state rule may repaint a
component. Visited styling (S1) applies only to links that have no
styling of their own.

### S3 — Implementation rule (how S1/S2 are guaranteed)
Base element fallback rules for links must be scoped at **zero
specificity** — e.g. `a:where(:visited)` — so they can never outrank a
component class. Bare `a:visited` / `a:hover` state rules are
prohibited outside `:where()` scoping. A component that needs a
distinct visited treatment defines it inside its own component rule.

### S4 — Minimum contrast (no exceptions by element size or role)
- Normal text: **4.5:1**. Large text (≥24px, or ≥19px bold): **3:1**.
- Judged on the **composited** color: semi-transparent text counts at
  what the eye actually gets (alpha over the real background), never at
  its declared value. Fine print, captions, and consent lines get **no
  exemption**.
- Token floor on the navy surfaces: secondary text uses the `--muted`
  token (white 72%) or stronger at caption sizes; the `--faint` token
  (white 50%) may be used only where its composited ratio still clears
  4.5:1 on that background (the audit measured 50% white passing at
  4.86–4.93:1 on the darkest cards — allowed, but with no headroom to
  spend).

### S5 — Placeholder text is text
Every `input`/`textarea` placeholder carries an explicit site-defined
color meeting 4.5:1 composited. No field ships with a browser-default
placeholder color. (Fixes class B by rule, not by instance.)

### S6 — One current stylesheet version, everywhere
Every page — templates **and** generated pages (newsletter issues
included) — pins the current base stylesheet version. A version bump
updates every pin in the same change; shipping a page on an older base
stylesheet is a defect even when nothing visibly breaks (class D).

### S7 — Heading order is part of the frame
Component sections (Listening Edition player, briefing card, tracker
blocks) must not introduce a heading level that skips: a card headline
at `<h3>` requires an `<h2>`-level section heading above it (visually
hidden where the design shows none).

### S8 — Verification gate (process)
Any stylesheet or template change is verified **with seeded history**
(a profile that has visited the site's internal targets), in default,
visited, hover, and focus states, desktop and ~375px, before
promotion. A fresh-profile check alone is not verification — it is how
both 2026-10-20 defects shipped.

## Per-page checklist (derived from the audit's defect classes)

Run on every page a change touches; run site-wide on any base
stylesheet change.

- [ ] Every prose link checked in default / visited / hover / focus;
      unvisited = cyan, visited = #8BE9FF, all ≥4.5:1 on their surface.
- [ ] Every component-styled link (buttons, pills, cards, nav, footer)
      renders identically visited vs unvisited.
- [ ] Fine print and captions composited ≥4.5:1 (alpha counted).
- [ ] Every placeholder has an explicit color, ≥4.5:1 composited.
- [ ] Every form field has a real label; dynamic error/summary messages
      use the approved colors (error #FFB4AB family).
- [ ] Heading outline has no skipped level, components included.
- [ ] Page pins the current base stylesheet version (check generated
      pages too).
- [ ] Images carry alt text; links have an accessible name.
- [ ] JS-built components (Signals widget, players) checked rendered,
      not just from static HTML.
- [ ] Verification performed with seeded history; fresh-profile-only
      results marked incomplete.

## What changes where — ON APPROVAL ONLY

1. `.nl-fine` moves from white 45% to the `--muted` token (72%) — fixes
   class A in all 16 instances at once (one component, WF-G8 + footer
   compact variant).
2. A `::placeholder` rule for signup-form inputs at a 4.5:1-clearing
   color — fixes class B.
3. Stylesheet pins unified: privacy/disclaimer templates to the current
   version, research template likewise, newsletter-issue generation to
   blog.v12 (or successor) — closes class D.
4. Listening sections gain an `<h2>`-level heading (visually hidden
   where the design shows none); research hub section heads re-leveled
   — closes class C.
5. This standard is added to the pre-promotion checklist used by the
   site workflow skill.

## Revision-log entry for wireframes.md (added on approval, 2026-10-20)

> 2026-10-20 — WF-G9 Link, state & contrast standard APPROVED by
> Tristen (proposed the same day by the full-site audit: 18 paths,
> 41,636 evaluations; two owner-reported defects retested fixed; four
> defect classes open). Implemented on staging the same day (below);
> production promotion is a separate gate.

## Implementation (staging, 2026-10-20)

Built to this standard on the staging branch only, for owner review:

1. **Class A** — `.nl-fine` moved from white 45% to the `--muted` token
   (72%) in the new base stylesheet **styles.v44.css**: 4.16:1 →
   **8.39:1** composited on the signup card (cascade-computed).
2. **Class B** — `.nl-form input::placeholder { color: var(--muted);
   opacity: 1; }` added in styles.v44.css (~8.7:1 composited on the
   field background); no signup field ships a browser-default
   placeholder color.
3. **Class D / S6** — every template and generated page now pins
   styles.v44.css; the hand-maintained /privacy/ and /disclaimer/
   (were v37) and /research/ (was v40) pin v44 as well; the
   2026-10-14 newsletter issue regenerated onto blog.v12.css.
4. **Class C / S7** — the Listening Edition eyebrow in
   `scripts/build-site.mjs` (`listeningHtml`, shared by article
   editions and the Signals Briefing) is now an `<h2>` carrying the
   same `.le-eyebrow` class and metrics — no visual change; the
   chapter headline `<h3>` now sits under a section heading. On
   /research/, "What stands" / "What does not stand" are `<h2>` with a
   `.status-h` rule preserving their exact former metrics.
5. **Verification** — the 2026-10-20 cascade auditor re-run against
   staging.axiovexsystems.com post-deploy: 0 contrast failures,
   heading skips resolved, every page on the current stylesheet
   (totals in the implementation report). The audit method is
   cascade-only: layout geometry remains unverified, as recorded in
   the audit itself.
