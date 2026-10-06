# Feature Specification: Breaking News Banner

**Feature Branch**: `012-breaking-news-banner` (documentation only
until the approval gate passes — implementation lands through the
staging flow in spec 010)

**Created**: 2026-10-06

**Status**: **Implemented on the staging branch 2026-10-06**
(approved by Tristen 2026-10-06 12:55 EDT — tasks.md T001).
The mechanism is built and verified locally end to end
(T002–T006, see the completion record in tasks.md);
`data/breaking.json` ships as `{ "active": null }`, so staging
serves no banner. Promotion to production (tasks.md T007) and
close-out (T008) remain, under spec 010's rules.

**Direction (Tristen, 2026-10-06)**: "also add a breaking news
headliong so when we get breaking news that is applicable to what
we care about, there is a banner on the top of all pages and when
clicked goes to the page."

## What exists today

The site has no alert mechanism. Pages are assembled by
`scripts/build-site.mjs` from three hand-maintained shells
(`index.html`, `contact/index.html`, `privacy/index.html`) and
four templates (`scripts/templates/` — blog index, blog article,
documents, signals). The generator already post-processes one
marker region — the home page's `<!-- SIGNALS:START --> …
<!-- SIGNALS:END -->` block — and the spec 008 widget mounts were
hand-edited into every shell and template (acceptable there
because widget markup never changes). Signals itself runs on the
architecture this spec reuses (spec 004): scheduled server-side
ingest, build-time generation, **no client-side fetching**, and
items shown as **headline + source + date only**, each linking to
the publisher.

## What this adds

A **breaking news banner** (WF-G7): a full-width strip above the
sticky header on every page, present only while a curated entry
is active. The banner is **curated, not auto-triggered**: a
person places an entry in a committed data file,
`data/breaking.json`, and the commit is the audit trail. The
strip shows the source's own headline verbatim, the source name,
and the item's published time; the whole strip is one link to
the source story; a dismiss button hides it for that entry only.
Entries expire — at most 72 hours after the story's published
time — and the build drops expired entries. With no active
entry, the banner leaves zero layout trace.

## Design reference (wireframes, this proposal)

- **WF-G7** (new global frame): the strip drawn on a page mock
  above the WF-G1 nav — anatomy (BREAKING lead-in, verbatim
  headline, source + published time, dismiss ✕), a mobile (390px)
  variant, and the no-active-entry state (nav alone, nothing
  above it). Captions record the decisions: curated-only,
  verbatim-only, 72-hour cap, per-entry dismissal, build-time
  injection, and the color reasoning — the deep red (#8C2B2B
  family) with near-white text is **deliberately the only
  off-palette element on the site, used nowhere else**, because
  an alert must read as an alert. The headline in the frame is a
  labeled placeholder, so the wireframe itself makes no news
  claim (the spec 011 placeholder discipline).
- No other frame changes. WF-G1 through WF-G6 and all page
  frames are untouched; the banner composes with them (it sits
  above WF-G1 in flow; the spec 008 widget is unaffected).

## Entry schema (`data/breaking.json`)

The file holds exactly one slot — curation is singular by
construction:

```jsonc
{ "active": null }            // the normal state — no banner
// — or —
{ "active": {
    "id": "2026-10-06-nist-example-slug",  // unique per entry; keys dismissal
    "headline": "…",          // the publisher's headline, verbatim
    "sourceName": "NIST",     // the publisher's name, as shown
    "url": "https://…",       // the story URL (https only)
    "publishedUtc": "2026-10-06T18:41:00Z",  // the story's published time
    "expiresUtc":   "2026-10-08T18:41:00Z",  // ≤ publishedUtc + 72h
    "addedBy": "Tristen",     // who placed the entry
    "reason": "…"             // why this is applicable to Axiovex's
                              // audience — recorded, never displayed
} }
```

Git history of this file is the complete record of what was
bannered, by whom, and why. There is no history file to keep in
sync and no second slot that could compete.

## Functional requirements

- **FR-001 — Data file + schema.** The banner is driven solely
  by the committed file `data/breaking.json` holding a single
  `active` entry (schema above) or `null`. The generator
  validates every render: required fields present and non-empty,
  `url` is https, `expiresUtc` is after `publishedUtc` and **at
  most 72 hours after it**. An entry that fails validation is
  treated as inactive and the build logs a warning naming the
  defect — it is never partially rendered and its expiry is
  never silently extended.
- **FR-002 — Curation workflow (human-gated).** An entry is
  added deliberately — by Tristen, or by an agent acting under
  the website monitoring runbook — and committed; the commit is
  the audit trail, and the entry's `reason` records why the item
  is applicable. Applicability is the Signals lanes' subject
  matter (manufacturing & automation; AI, standards & research;
  Michigan workforce & industry; OT cybersecurity; funding &
  policy) at genuine breaking significance — the curator's
  judgment, recorded, not a keyword match. **No automatic
  banner from raw feed items exists in v1**: no feed item,
  score, or keyword trigger can raise the banner. Automated
  detection is a future extension that would require a spec
  amendment with evidence-based criteria of its own.
- **FR-003 — Content integrity (verbatim only).** The strip
  displays the source's headline **verbatim**, the source name,
  and the published time (formatted in ET, the site's existing
  convention). Axiovex adds no summary, no opinion, no
  rewording, and no urgency language of its own — the only
  added words are the "BREAKING" lead-in and the dismiss
  button's accessible name. This is the Signals display rule
  (spec 004 FR-002) applied to the banner. "Breaking" is a
  status a curator judged and recorded a reason for (FR-002);
  it is never a style applied to ordinary items, and an expired
  or unjudged item never acquires it.
- **FR-004 — Rendering + injection scope.** The banner is
  injected **at build time only** — no client-side fetching, no
  runtime third-party calls (spec 004 FR-001). One mechanism
  covers every page: a `<!-- BREAKING:START --> …
  <!-- BREAKING:END -->` marker region immediately after
  `<body>` in all seven page sources (3 shells + 4 templates),
  rewritten by a single generator pass (plan.md) — home, blog
  index, every blog article, documents, signals, contact,
  privacy. The blog redirect shim (`blog/post.html`) is the one
  exclusion: it is a noindex page that redirects instantly and
  carries no page chrome, so there is nothing to banner; the
  exclusion is named here so the scope is complete, not
  assumed. When no entry is active, the region renders empty —
  **zero layout trace**: no element, no reserved space, no
  script.
- **FR-005 — Link + dismiss behavior.** The whole strip is one
  link to the entry's `url` (external; new tab with
  `rel="noopener"`, the site's convention for publisher links —
  spec 004). The dismiss control is a real `<button>` **outside**
  the link (never nested interactive elements), accessible name
  "Dismiss breaking news banner". Dismissing hides the banner
  immediately and is remembered **per entry**: the dismissal is
  stored in `localStorage` keyed by the entry's `id`, so the
  same entry stays dismissed across pages and visits while a
  **new entry (new id) shows again**. Only one banner exists at
  a time — the single active entry (FR-001). If storage is
  unavailable (e.g. private browsing), dismissal still hides
  the banner for the current page view; nothing errors.
- **FR-006 — Expiry.** Every entry carries `expiresUtc`, at
  most 72 hours after `publishedUtc` (FR-001 validation). The
  generator renders an entry only while `publishedUtc` ≤ build
  time < `expiresUtc`; an expired entry is dropped by the build
  — never rendered, never carried indefinitely. Because the
  hourly signals-sync build always runs (spec 004 FR-010
  cadence), an entry that nobody removes manually disappears
  within roughly an hour of its expiry even in the worst case;
  deliberate removal is faster (FR-008).
- **FR-007 — Accessibility.** The strip is a `role="region"`
  with `aria-label="Breaking news"`, placed **first in reading
  order** (it precedes the header in the document). Link and
  dismiss button are keyboard-reachable in that order and each
  carries a **visible focus state** against the red background.
  There is **no motion or animation** of any kind — no
  scrolling, flashing, or pulsing. The strip contains no
  heading elements (page heading order is untouched) and its
  text is real text at full size on mobile (the headline wraps;
  it is never truncated). Near-white (#F7FCFF) on the deep red
  is verified for contrast at implementation.
- **FR-008 — Publication path (how fast up, how fast down).**
  Going live: commit `data/breaking.json` → the site build runs
  (the site-sync workflow gains `data/breaking.json` in its push
  paths, so an entry commit triggers the build itself — plan.md)
  → the bot commits the rendered pages → Cloudflare Pages
  deploys on that push. End to end: minutes. Coming down is the
  same path in reverse: set `active` to `null` (or delete the
  entry) and commit; expiry (FR-006) is the automatic backstop.
  **Test entries exist only on the staging branch** — production
  receives real entries only, and a staging test entry is never
  promoted (plan.md carries the promotion caution).
- **FR-009 — Gate, staging-first flow, stylesheet, monitoring.**
  No implementation before Tristen approves WF-G7 (tasks.md
  T001). Implementation is built and verified on the **staging
  branch** at staging.axiovexsystems.com, then promoted by
  merging `staging` → `main` under spec 010's rules (a promotion
  diff containing staging-only `robots.txt`/`_headers` stops the
  promotion; staging's `data/breaking.json` is reset to main's
  state before any promotion so a test entry can never ride
  along). Strip styles ship in the **next versioned stylesheet
  bump** per the standing cache rule (spec 011 takes
  `styles.v26.css`; this release takes the next number —
  `styles.v27.css` if 011 lands first). Sitemap and `llms.txt`
  are unchanged (no new URL). The SEO/AEO baseline (AEO 100 /
  Seobility 90) must hold; the banner adds no headings and no
  layout shift when inactive.

## Claims discipline

A breaking banner is the loudest claim the site can make
(constitution §I), so the design narrows it to what can be
proven: the headline is the **publisher's own words** (FR-003),
the decision to banner it is a **named human's recorded
judgment** (FR-002), and its lifespan is **bounded by the file
itself** (FR-006). The banner asserts nothing about Axiovex —
no capability, no endorsement beyond "this is applicable to
what we care about" (the Signals lanes already carry "inclusion
is not endorsement"), and never urgency Axiovex invented. Any
copy beyond the headline/source/time and the BREAKING lead-in
is out of bounds for implementation.

## Out of scope

- Automatic detection or triggering from feeds (future
  amendment only — FR-002).
- Multiple simultaneous banners, a banner queue, or a banner
  history page (git history of `data/breaking.json` is the
  record).
- The blog redirect shim (`blog/post.html`) — excluded with
  reason in FR-004.
- Any change to the Signals lanes, the Pulse, the floating
  widget (WF-G6), or the nav (WF-G1).
- Push notifications, email alerts, or any off-site alerting.
