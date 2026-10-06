# Plan: Breaking News Banner (spec 012)

**Status: proposal only.** This plan executes only after the
tasks.md T001 gate (Tristen approves WF-G7). Nothing here has
been implemented.

## Injection investigation (the load-bearing decision)

The banner's markup changes with every entry — or vanishes —
so it cannot be static text pasted into pages. The plan needs
**one mechanism** that fills (or empties) a banner region on
every page the generator produces or maintains, with no
per-page hand edits that can drift. What the repo actually
looks like (verified 2026-10-06):

**Page sources — 7 files carry every page's top:**

| # | Source file | Kind | Output |
|---|---|---|---|
| 1 | `index.html` | hand-maintained shell | `/` (home) |
| 2 | `contact/index.html` | hand-maintained shell | `/contact/` |
| 3 | `privacy/index.html` | hand-maintained shell | `/privacy/` |
| 4 | `scripts/templates/blog-index.html` | template | `/blog/` |
| 5 | `scripts/templates/blog-article.html` | template | `/blog/<slug>/` (every article) |
| 6 | `scripts/templates/documents.html` | template | `/documents/` |
| 7 | `scripts/templates/signals.html` | template | `/signals/` |

All seven open with `<body id="top">` followed directly by the
header. The eighth HTML output, `blog/post.html`, is a static
noindex redirect shim (instant `location.replace`, no header,
no chrome) — excluded from the banner per spec FR-004.

**Precedent A — the home SIGNALS marker region.** The generator
already post-processes `index.html` in place: it replaces
everything between `<!-- SIGNALS:START -->` and
`<!-- SIGNALS:END -->` with freshly rendered HTML, using a
replacer *function* (not a `'$1…'` string — the rendered HTML
can contain literal `$` amounts from headlines, and
`String.replace` would misread them). Missing markers produce a
console warning, not a silent skip. This pattern is proven,
deterministic, and idempotent.

**Precedent B — the spec 008 widget mounts.** The widget's CSS
link, mount div, and script tag were hand-edited into all seven
shells/templates. That was correct *there*: widget markup is
fixed chrome that never changes. It is the wrong pattern here —
banner content is data (per-entry, often absent), so pasting
banner HTML into seven files per entry is exactly the drift
failure this plan must avoid.

**Chosen route — one marker contract + one final generator
pass:**

1. **One-time mechanical insert** (implementation, not per
   entry): add the marker pair immediately after `<body id="top">`
   in all seven source files:
   `<!-- BREAKING:START -->` / `<!-- BREAKING:END -->`, initially
   adjacent (empty region). This is the only hand edit, it is
   identical in all seven files, and it never changes again.
2. **`buildBreaking()`** in `scripts/build-site.mjs`, run as the
   **last step of the build** (after blog, documents, and
   signals outputs exist): read `data/breaking.json`, validate
   the entry (FR-001 rules), decide activeness against the
   build's clock (`publishedUtc` ≤ now < `expiresUtc`), render
   the banner HTML (or an empty string), and rewrite the marker
   region — with a replacer function, per the SIGNALS gotcha —
   in every output file: the three shells in place (index.html
   is already build-rewritten this way; contact/privacy gain a
   build-owned region and are otherwise untouched by the build)
   and the generated outputs (`blog/index.html`,
   `blog/*/index.html`, `documents/index.html`,
   `signals/index.html`).
3. **Fail-visible:** any expected file missing its markers logs
   a build warning naming the file (the SIGNALS pattern). A
   template or shell that loses its markers in a future edit is
   discovered at the next build, not by a visitor.

Rejected alternatives: a `{{BREAKING_HTML}}` placeholder filled
per template (four separate `fill()` call sites across three
builders, and the two non-generated shells still need a second
mechanism — two systems to keep in sync); client-side injection
from a first-party JSON (violates spec 004 FR-001's
build-time-only rule and flashes/shifts layout); Pages
Functions or edge middleware (a runtime layer the static site
deliberately does not have — spec 005's function is the sole,
form-scoped exception).

## Rendering details

**Banner markup** (emitted between the markers, only when an
entry is active):

```html
<div class="breaking-banner" role="region" aria-label="Breaking news">
  <a class="breaking-link" href="{url}" target="_blank" rel="noopener">
    <span class="breaking-lead">BREAKING</span>
    <span class="breaking-headline">{headline, escaped, verbatim}</span>
    <span class="breaking-meta">{sourceName} · {published, ET}</span>
  </a>
  <button class="breaking-dismiss" type="button"
          aria-label="Dismiss breaking news banner"
          data-breaking-dismiss="{id}">&#10005;</button>
</div>
<script src="/breaking.v1.js" defer></script>
```

- Headline/source escaped with the generator's existing
  `esc()`/`escAttr()`; the published time uses the existing ET
  formatting convention (`fmtUpdated()` pattern: "Oct 6, 2026
  at 2:41 PM ET").
- The dismiss `<button>` is a **sibling** of the link, never
  nested inside it (FR-005).
- No active entry → the region is rewritten to empty: no div,
  no script tag (FR-004 zero trace).
- The region carries **no heading elements** (FR-007).

**Dismissal script — `breaking.v1.js`** (new, versioned like
`signals-widget.v1.js`; emitted with the banner, so it loads
only when a banner exists): on load, read
`localStorage["axiovex-breaking-dismissed"]`; if its value
equals the rendered entry's id, hide the banner. On dismiss
click: hide immediately and store the entry id. All storage
access is wrapped in try/catch — unavailable storage degrades
to "hide for this page view only" (FR-005). The script is
small, dependency-free, and shared by every page unchanged.
One accepted trade-off: with `defer`, a previously dismissed
banner can paint briefly before the script hides it, and
hiding it shifts the header up into its place. The alternative
(an inline blocking script in every page's head) is rejected
as the larger smell for a cosmetic, user-chosen state.
Recorded here so verification looks at it knowingly (T005);
plan.md's Risks name the fallback if staging disagrees.

**Styles:** strip rules (deep red `#8C2B2B` background,
near-white `#F7FCFF` text, BREAKING lead-in letterspaced bold,
meta at reduced opacity, ✕ button with a translucent border,
`:focus-visible` outlines in near-white on the red for both
the link and the button, mobile wrap with the button held at
full tap size) ship in the **next versioned stylesheet bump**
per the standing cache rule: spec 011 takes `styles.v26.css`,
so this release is `styles.v27.css` if 011 lands first
(otherwise v26) — all references repointed, prior file removed,
the v24 → v25 (spec 008) procedure.

## Data file + curation mechanics

- `data/breaking.json` is created by the implementation with
  `{ "active": null }` and thereafter edited **by hand, in a
  commit** — no tool writes it. The commit message names the
  story and the curator; the entry's `reason` field records
  applicability (schema in spec.md).
- Validation lives in `buildBreaking()` (FR-001): malformed
  JSON, a missing field, a non-https URL, or an
  `expiresUtc` more than 72h after `publishedUtc` → entry
  treated as inactive + a build warning naming the defect.
  Fail-closed on the claim, never a partial render.
- Takedown is the same gesture: set `active` to `null`,
  commit. Expiry is the backstop if nobody acts (FR-006).

## Publication path (FR-008 mechanics)

1. Curator commits `data/breaking.json` to `main`.
2. **Workflow change (part of implementation):** add
   `'data/breaking.json'` to the push paths of
   `.github/workflows/site-sync.yml` (today: `blog/posts/**`,
   `scripts/**`, the workflow itself) so an entry commit
   triggers the build directly. Without this line the reliable
   paths are a manual `workflow_dispatch` and the hourly
   signals-sync — noted so the gap is a decision, not a
   surprise. (site-sync's 15-minute scheduled runs early-exit
   when shared-documents is unchanged, so the schedule is not a
   banner path either way.)
3. The Action runs `build-site.mjs`; the bot commits the
   rendered pages ("Site sync" bot, as today); Cloudflare
   Pages deploys on that push. Commit → live in minutes.
4. Expiry enforcement rides the hourly signals-sync build
   (cron `17 * * * *`), which always runs the full build:
   worst case, an un-removed entry disappears within ~an hour
   of `expiresUtc`.

## Staging-first flow (spec 010)

1. Implementation lands on the **`staging`** branch (markers,
   generator pass, CSS/JS, workflow line).
2. A **test entry** (an old, real, clearly-applicable published
   headline, entered with `reason: "spec 012 staging test"`) is
   committed to `data/breaking.json` **on the staging branch
   only**. Verification runs at staging.axiovexsystems.com
   (checklist below).
3. **Promotion caution (new, this spec):** before merging
   `staging` → `main`, staging's `data/breaking.json` is reset
   to main's state (`{ "active": null }` unless main carries a
   live entry) — `data/breaking.json` joins `robots.txt` /
   `_headers` on the never-promote list so a test entry can
   never reach production. The rest of the promotion follows
   spec 010's hazard rule unchanged.
4. Production receives the mechanism with **no active entry**;
   the first production entry is a real curation decision made
   after this spec closes, not part of implementation.

## Verification strategy (tasks.md T005/T006)

- **Active-entry pass (staging):** with the test entry active,
  fetch all seven page types — home, blog index, two articles
  (different posts), documents, signals, contact, privacy — and
  confirm the identical banner block (same id, headline bytes,
  href, meta line) in each; confirm `blog/post.html` still
  redirects and carries no banner (FR-004 exclusion).
- **Zero-trace pass:** set `active: null`, rebuild, and diff
  each page type against its pre-banner output — byte-identical
  outside the (now empty) marker region; no `breaking` strings
  anywhere in the served HTML.
- **Expiry pass:** an entry whose `expiresUtc` is in the past
  renders nothing; an entry with `expiresUtc` beyond the 72h
  cap renders nothing and the build log carries the warning; a
  malformed JSON renders nothing and warns.
- **Dismissal pass:** dismiss on one page → navigate to another
  page type → still hidden; publish a test entry with a **new
  id** → banner shows again; private-mode (storage throwing) →
  dismiss hides for the view, no console error.
- **Accessibility pass:** region is first in reading order;
  keyboard order is link → dismiss; focus states visible on the
  red at desktop and mobile widths; no motion; contrast of
  #F7FCFF on the chosen red measured and recorded (target ≥
  4.5:1 for the headline text); headline wraps untruncated at
  390px; no horizontal overflow at 1440 / 834 / 390px.
- **Regression pass:** nav, widget, Signals block, contact form
  (incl. Turnstile), and page heading order unchanged; SEO/AEO
  baseline confirmed on the next monitoring cycle (AEO 100 /
  Seobility 90).

## Risks / open points

- **Banner fatigue is a curation risk, not a code risk.** The
  mechanism makes banners cheap; the discipline in FR-002
  (genuine breaking significance, recorded reason) is what
  keeps the strip meaningful. If entries start appearing
  weekly, the design intent has failed even if the code is
  perfect — the wireframe notes say this in as many words.
- **Time zones:** all comparisons use the UTC fields in the
  file; only the *displayed* time is ET. A curator entering a
  local time as if it were UTC would shift the window — the
  schema's field names (`publishedUtc` / `expiresUtc`) are the
  guard, and the staging test entry exercises it.
- **The dismissed-paint trade-off** (defer script) is recorded
  in Rendering details; if staging verification finds the flash
  objectionable, the fallback is emitting the tiny dismissal
  check as an inline script directly after the banner markup —
  a plan amendment, not an improvisation.
- **Stale-entry skew between branches:** while a real entry is
  live on `main`, staging carries either `null` or a test
  entry; the promotion caution above is the control. A
  main → staging sync merge takes main's `breaking.json` with
  it, which is correct behavior (staging then mirrors the live
  banner).
