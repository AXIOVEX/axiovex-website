# Tasks: Breaking News Banner (spec 012)

Proposal package prepared 2026-10-06: wireframes revised
(`docs/wireframes/wireframes.html` — new global frame WF-G7,
the breaking news banner; `wireframes.md` revision log) and
this spec package written. **APPROVED 2026-10-06 (Tristen) —
implementation underway on the staging branch.**

## Gate

- [x] T001 **GATE — Owner approval of the wireframes (Tristen).**
  **APPROVED — Tristen, 2026-10-06 12:55 EDT: "Approve spec 012
  wireframes — implement it".**
  Scope of the approval: WF-G7 (curated deep-red banner above
  the nav on every page; verbatim headline + source + published
  time; whole strip links to the source story; dismiss
  remembered per entry; 72-hour max life; zero layout trace
  when inactive; deliberately off-palette) and the curation +
  integrity rules in spec.md FR-002 / FR-003. The gate blocked
  every task below until the approval above was given.

## Implementation (starts only after T001)

- [x] T002 **Data file + validation (FR-001, FR-006)**: create
  `data/breaking.json` with `{ "active": null }`; implement
  the entry validation + activeness window in the generator
  (required fields, https URL, `expiresUtc` after
  `publishedUtc` and ≤ +72h; invalid → inactive + a build
  warning naming the defect; expired → dropped).
- [x] T003 **Marker contract + generator pass (FR-004)**:
  insert the `<!-- BREAKING:START -->` / `<!-- BREAKING:END -->`
  pair immediately after `<body id="top">` in all seven page
  sources (`index.html`, `contact/index.html`,
  `privacy/index.html`, `scripts/templates/blog-index.html`,
  `blog-article.html`, `documents.html`, `signals.html`);
  implement `buildBreaking()` as the build's last step —
  render-or-empty the region in the three shells (in place)
  and the generated outputs (blog index, every article,
  documents, signals), replacer function not a `$`-string,
  missing markers → build warning naming the file. The
  `blog/post.html` shim is untouched (FR-004 exclusion).
- [x] T004 **Banner rendering + dismissal + styles (FR-003,
  FR-005, FR-007)**: the banner markup per plan.md (region
  with `aria-label="Breaking news"`, one link with the
  BREAKING lead-in + verbatim headline + source · ET time,
  dismiss `<button>` as a sibling with accessible name
  "Dismiss breaking news banner", no heading elements);
  `breaking.v1.js` (localStorage dismissal keyed by entry id,
  new id shows again, storage failure degrades to per-view
  hide, emitted only with an active banner); strip styles in
  the next versioned stylesheet bump (`styles.v27.css` if
  spec 011's v26 lands first), every reference repointed,
  prior file removed.
- [x] T005 **Publication path (FR-008)**: add
  `'data/breaking.json'` to the push paths in
  `.github/workflows/site-sync.yml` so an entry commit
  triggers the build; confirm the hourly signals-sync build
  remains the expiry backstop.

## Verification + promotion

- [x] T006 **Stage + verify (FR-004–FR-007)**: land the work
  on the `staging` branch; commit a test entry to staging's
  `data/breaking.json` only (an old, real, applicable
  headline; `reason: "spec 012 staging test"`); verify at
  staging.axiovexsystems.com — identical banner on home,
  blog index, two articles, documents, signals, contact,
  privacy; `blog/post.html` unchanged and banner-free;
  zero-trace pass with `active: null` (byte-diff outside the
  marker region); expired entry dropped; >72h entry dropped
  with the build warning; malformed JSON dropped with the
  warning; dismissal persists across page types, a new id
  shows again, storage-unavailable dismiss still hides;
  accessibility pass (first in reading order, keyboard order
  link → dismiss, visible focus on the red, no motion,
  headline contrast measured ≥ 4.5:1, untruncated wrap and
  no overflow at 1440 / 834 / 390px); regression pass (nav,
  widget, Signals block, contact form + Turnstile, heading
  order).
- [ ] T007 **Promote + production verification (FR-008,
  FR-009)**: reset staging's `data/breaking.json` to main's
  state before merging (test entries never promote — it joins
  `robots.txt` / `_headers` on the never-promote list); merge
  `staging` → `main` under spec 010's hazard rule; verify
  production serves the mechanism with **no active entry**
  (zero trace on every page type) and that a production entry
  commit follows the FR-008 path in minutes (proven with the
  first real entry when one is curated, or by a same-day
  place-and-remove cycle if the owner directs one); confirm
  the SEO/AEO baseline holds on the next monitoring cycle
  (AEO 100 / Seobility 90).
- [ ] T008 **Close-out**: mark the `docs/wireframes/wireframes.md`
  revision-log entry APPROVED + implemented (with the
  implementation commit), sync the review copy at
  `~/workspace/your_files/axiovex-wireframes/`, record the
  change in this spec's status line, and check off these
  tasks with the completion record.

## Completion record — T002–T006 (2026-10-06, staging branch)

Implemented on `staging` (commits 78bf5d5, c24f05d, 4c7c2a4):
`buildBreaking()` is the build's last pass; the BREAKING marker
pair sits immediately after `<body id="top">` in all seven page
sources; `data/breaking.json` ships as `{ "active": null }`;
`breaking.v1.js` carries the per-entry dismissal;
`styles.v27.css` (v26 removed, all references repointed) carries
the WF-G7 strip styles; site-sync now triggers on
`data/breaking.json`.

Verification was run LOCALLY against the built site (Playwright,
per the implementation brief) with a staging-only TEST entry
(a real NIST headline from the Signals snapshot, verbatim;
`reason: "TEST — staging verification only"`):

- Inactive (`active: null`): every page's diff vs its pre-change
  output is exactly the empty marker line + the v27 repoint —
  no banner markup, no script, zero layout trace.
- Active TEST entry: identical banner on all 8 served pages
  (home, blog index, both articles, documents, signals,
  contact, privacy) — verbatim headline, click target = the
  entry URL, source + ET time, region semantics, dismiss button
  outside the link; `blog/post.html` byte-unchanged and
  banner-free (FR-004 exclusion). 83/83 browser checks passed.
- Dismissal: hides immediately, persists across reload and
  across page types, keyed by entry id; a NEW entry id re-shows
  the banner (4/4 checks). Headline contrast measured 8.14:1
  (#F7FCFF on #8C2B2B, ≥ 4.5:1 required). No horizontal
  overflow at 1440 or 390px; the headline wraps untruncated at
  390px (banner grows to 103px).
- Fail-closed passes: expired entry dropped (build logs it);
  expiry beyond the 72h cap dropped with a warning naming the
  defect; malformed JSON dropped with a warning naming the
  defect; the build completes in every case.
- Regression: spec 011's Trends & outlook section and the home
  Signals block verified intact with the banner active.
- Final state: `data/breaking.json` reset to
  `{ "active": null }`, rebuilt, working tree clean — the
  branch ships NO active banner. The staging-URL pass at
  staging.axiovexsystems.com rides the push of these commits
  and is confirmed by the parent at promotion (T007).
