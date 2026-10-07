# Feature Specification: Breaking News Banner

**Feature Branch**: `012-breaking-news-banner` (documentation only
until the approval gate passes — implementation lands through the
staging flow in spec 010)

**Created**: 2026-10-06

**Status**: **Implemented and live 2026-10-06** (approved
by Tristen 2026-10-06 12:55 EDT — tasks.md T001). Built and
verified on staging end to end (T002–T006, see the completion
record in tasks.md), then promoted to production in merge
`89c65c1` under spec 010's rules (T007/T008):
`data/breaking.json` is `{ "active": null }`, so production
serves the mechanism with no banner and zero layout trace —
verified on the served site. Amendment 1's hourly check
(`website-breaking-news-check`) is live; its first
observation is pending (tasks.md T010).

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
  amendment only — FR-002). **Superseded in part by
  Amendment 1 below**: automated *detection* with owner
  approval is now specified (FR-010–FR-012); automated
  *posting* remains out of scope.
- Multiple simultaneous banners, a banner queue, or a banner
  history page (git history of `data/breaking.json` is the
  record).
- The blog redirect shim (`blog/post.html`) — excluded with
  reason in FR-004.
- Any change to the Signals lanes, the Pulse, the floating
  widget (WF-G6), or the nav (WF-G1).
- Push notifications, email alerts, or any off-site alerting.

## Amendment 1 — owner direction 2026-10-06: hourly detection check + retention policy

**Direction (Tristen, 2026-10-06)**: "add an hourly task to
check for breaking news. and once breaking news is there, how
long should we keep it? what are best practices for that?"

FR-002 barred any automatic banner in v1 and prescribed that
automated detection "would require a spec amendment with
evidence-based criteria of its own." **This amendment is that
amendment.** It changes *detection speed only*: an hourly
automated check identifies candidate stories and presents them
for the owner's decision. Posting remains exactly what FR-002
requires — a curated, committed act by a named human, with the
reason recorded. What changes is how fast a qualifying story is
*noticed*, not who judges it. The amendment also answers the
retention question with a normative policy (FR-013).

### FR-010 — Hourly detection check

A scheduled job, **`website-breaking-news-check`**, runs
hourly, owned by the `website-seo-aeo-health-monitoring`
goal and reporting to the Axiovex website chat. Each run:

- Reads the freshest committed `data/signals.json` (produced
  by the hourly signals-sync build, spec 004 FR-010 cadence —
  the check is scheduled after that build so it reads the
  newest snapshot) and the current `data/breaking.json`.
- Scans items **published within the last 3 hours** against
  the candidate criteria (FR-011).
- Keeps a **seen-state file** with the monitoring system's
  state (the goal's `hidden_files/`, alongside `state.json`)
  recording every candidate already presented, so a candidate
  is **never presented twice**.
- Also watches the **active banner**, if any (FR-013): its
  age, whether the story has resolved, and whether a newer
  item supersedes it — and recommends takedown or replacement
  when warranted.

The check itself never writes `data/breaking.json` and never
posts anything (FR-012).

### FR-011 — Candidate criteria (evidence-based)

An item qualifies as a candidate only if it meets one of
these criteria:

- (i) a CISA ICS advisory ≤3h old affecting widely deployed
  industrial control products, or naming a KEV-listed/actively
  exploited vulnerability;
- (ii) a Federal Register final rule or major action ≤3h old
  in manufacturing, AI, or workforce policy;
- (iii) a NIST / NSF / DOE item ≤3h old announcing a major
  program, award round, standard, or incident;
- (iv) a Michigan-lane item ≤3h old reporting a major plant
  opening/closing, a state workforce/industry program launch,
  or an emergency affecting Michigan industry;
- (v) any lane item reporting an active incident (breach,
  recall, shutdown, safety alert) affecting manufacturing
  or OT.

**Mere publication in a lane is NOT sufficient** — the item
must clear a significance bar above the lane's ordinary daily
flow. At most **ONE candidate is presented per run** (the
strongest). These criteria are deliberately narrow: the
banner's credibility depends on it staying rare (the banner
fatigue risk named in plan.md).

### FR-012 — Approval loop (the judgment layer is unchanged)

- Before presentation, a qualifying candidate is **verified
  against its source page**: the headline is confirmed
  verbatim and the published time confirmed. A candidate that
  cannot be confirmed on its source page is not presented.
- The candidate is presented to Tristen in the Axiovex
  website chat with: the reason it qualifies (which FR-011
  criterion), the source link, and a **proposed expiry** set
  per the retention policy (FR-013).
- Posting happens **only on Tristen's approval**, via the
  FR-008 commit path — the entry is placed in
  `data/breaking.json` on `main` (with `addedBy` and the
  recorded `reason`), site-sync builds, and the banner is
  live in minutes.
- **Fully automatic posting is explicitly NOT adopted.** It
  would require a further owner direction. This preserves
  FR-002's curation principle: detection is automated, the
  claim is not.

### FR-013 — Retention policy (normative)

Once a banner is up, its life is governed by these defaults,
which set the entry's `expiresUtc`:

- **Default life: 12 hours from posting.**
- **Standard maximum: 24 hours from posting.**
- The FR-001 cap — `expiresUtc` at most 72 hours after the
  story's `publishedUtc` — remains only as an **absolute
  outer bound** for a genuinely developing situation, and
  using it requires the reason to be recorded in the entry.

Rationale (best practice, recorded at the owner's request):
newsroom practice keeps a story in "breaking" posture only
while it is developing — typically a few hours, within the
same news cycle; design-system guidance for alert banners
stresses removing them the moment they stop being current.
A stale banner trains banner blindness and spends
credibility — and credibility is Axiovex's core asset, the
thing the curation rules in FR-002/FR-003 exist to protect.

**Event-driven ends beat clock ends**: a banner comes down
early when the story resolves or is superseded, even with
time remaining on its expiry. The hourly check's active-
banner watch (FR-010) is the mechanism that notices: it
recommends takedown or replacement rather than letting an
entry ride out its clock by default.

## Amendment 2 — Staleness guard for the hourly check (2026-10-07, owner direction)

Context: on 2026-10-07 the hourly check found its input snapshot
(data/signals.json) ~14.5 hours old. The signals-sync Action is
scheduled hourly but GitHub fires it only every ~4–8 hours in
practice, and it writes only on content change — so the check's
3-hour scan window could not be certified overnight. A fresh
manual comparison proved nothing qualifying had been missed, and
a dispatched refresh restored currency, but the gap must not
rely on luck.

FR-014 (staleness guard): at the start of each run the check
compares the snapshot's updatedUtc to now. If it is more than
3 hours old, the run (i) dispatches a refresh through the
pipeline's own mechanism (`gh workflow run signals-sync.yml`;
no hand-edits to data files), (ii) records the episode in its
state file, (iii) reports one short failure line to the owner —
rate-limited to at most one such line per 6 hours via the state
file's lastStaleReportUtc, while the dispatch itself happens on
every stale run — and (iv) logs the run as degraded rather than
a clean no-candidate. Implemented in the website-breaking-news-check
job body the same day; the FR-010/FR-012 detection-and-approval
model is unchanged (the job still never posts).
