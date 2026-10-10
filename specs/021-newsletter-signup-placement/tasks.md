# Tasks: Spec 021 — Newsletter Signup Placement Expansion

- [x] T001 **GATE — Tristen approves the wireframes.** The
  placement revision (frames WF-G1, WF-G4, WF-G8 + compact
  variant, WF-01, WF-04, WF-11, WF-15 as revised 2026-10-10)
  and the proposal note are his to approve, amend, or
  reject. **Blocks every task below.** **APPROVED by
  Tristen Pierson, 2026-10-10, as drawn**, with the three
  flagged items resolved: (1) the header label is
  **Subscribe** — "The Signal" declined (it sits one letter
  from the nav's existing Signals item); (2) WF-15's v1
  "Not in the nav" note is superseded by the WF-G1 header
  CTA; (3) the homepage section sits after the Signals +
  Michigan Pulse block, as drawn. Production promotion is
  NOT covered by this gate.
- [x] T002 (after T001) Mark the wireframes APPROVED:
  `wireframes.md` (inventory annotations + revision-log
  entry), `wireframes.html` (frame status lines), and the
  proposal note (status + approval record) all record the
  2026-10-10 approval and the three resolutions; review
  copy re-synced byte-identically to
  `~/workspace/your_files/axiovex-wireframes/wireframes.html`.
- [x] T003 (after T002) Generator: generalize
  `newsletterBlock()` to `(source, opts)` with full /
  compact / landing / footer variants, source-keyed
  element ids, and `data-nl-block` hooks; wire the
  placements — blog-article fill (source `article`),
  `/signals/` head fill (`signals-top`), `/newsletter/`
  landing fill (`landing`, template restructured: lead
  above the archive, closing slot removed, `id="issues"`
  on the list), and the `NLHOME` / `NLFOOTER`
  marker-region step (`buildNewsletterChrome()`) for the
  homepage section (`home`) and the sitewide footer strip
  (`footer`).
- [x] T004 (after T003) Client script:
  `newsletter-signup.v2.js` — multi-instance discovery via
  `[data-nl-block]`, per-form Turnstile widgets rendered
  on first interaction with that form's email field, the
  api.js still loaded lazily and only then; v1 behavior
  (submit, errors, token refresh, pending state) preserved
  per instance; compact blocks swap in place. All script
  references move to v2.
- [x] T005 (after T002) Shells: the Subscribe ghost button
  (desktop, immediately left of Contact) and the mobile
  panel Subscribe row (immediately above Contact) in every
  standard shell — `index.html`, `contact/`, `privacy/`,
  `disclaimer/`, and the blog-article, blog-index,
  documents, signals, newsletter-index, and
  newsletter-issue templates; `aria-current="page"` on the
  newsletter templates' Subscribe item. `NLFOOTER` markers
  above the footer grid in the same shells; signup script
  includes added to the pages gaining a form that did not
  carry it (blog index, documents, static pages).
- [x] T006 (after T002) Endpoint: constrain the subscribe
  source server-side to the known set (`signals`,
  `signals-top`, `article`, `landing`, `home`, `footer`,
  `archive`, `issue`); out-of-set or missing values coerce
  to `signals`. (Pre-021 finding: the source was stored as
  free text — this task is the change that constrains it.)
- [x] T007 (after T003) Stylesheet: `styles.v36.css`
  (v35 + the spec 021 section — nav ghost button, nav
  current-item cyan, compact variant, footer strip,
  landing lead rows, article block margin); every
  stylesheet reference moves to v36. v35 is not edited.
- [x] T008 (after T002) llms.txt: add the two approved
  lines beside the Signals line (latest-issue line →
  `/newsletter/2026-10-14/`).
- [x] T009 (after T003–T008) Build + evidence: site build
  clean; the spec 020 harness extended with placement /
  source checks (P-series) and fully green; form-count
  and source audit over the built output (C-021-1 /
  C-021-2 / C-021-3); second build produces zero diff
  (idempotence). **Done 2026-10-10:** harness **31/31**
  (24 spec-020 checks + P1 ×5 sources stored verbatim,
  P2 out-of-set → `signals`, P3 missing → `signals`);
  built-output audit clean on all 13 pages (exactly one
  desktop + one mobile Subscribe, correctly positioned;
  sources per page exactly as wireframed; no duplicate
  element ids); the `/newsletter/` issue list is
  byte-identical to the pre-021 build apart from its new
  `id="issues"` anchor (C-021-6); second build = zero
  diff.
- [x] T010 (after T009) Staging visual verification:
  Playwright screenshots at desktop and 390px — homepage
  (hero untouched + newsletter section), one article
  (end-of-article block), `/newsletter/` (landing
  structure), `/signals/` (both forms), header + footer
  strip — compared against the approved frames; cold-load
  network check: no `challenges.cloudflare.com` request
  on page view (C-021-4), spot-checked on the homepage.
  Screenshots in `~/workspace/your_files/spec021-review/`.
  **Done 2026-10-10:** Playwright (Firefox, desktop 1440 +
  390px, reduced-motion path for final-state captures)
  against staging — header (Subscribe ghost immediately
  left of Contact; hero untouched), homepage section
  (centered, full block; on focus its own Turnstile widget
  rendered and completed with the test-key Success state),
  article end block (after body, before More analysis;
  stacks full-width at 390px), `/newsletter/` landing
  (lead above the archive, bullets + Every Wednesday
  cadence at the form, sample-issue anchor, one content
  form), `/signals/` head compact + unchanged foot block,
  footer strip above the grid (desktop + mobile), mobile
  menu order (… Documents · Subscribe · Contact). Cold
  loads of `/` and `/signals/` made **zero**
  challenges.cloudflare.com requests, no Turnstile script
  in the DOM, no widget iframes (C-021-4); focusing an
  email field fired the lazy load (3 challenges requests).
  One fix during verification: the ghost treatment's
  `!important` muted color initially overrode the
  current state on `/newsletter/` — v36 gained the
  winning rule (commit `1a66f12`); Subscribe now computes
  cyan there. Also recorded: v36's nav current-item rule
  makes the current item cyan sitewide, as WF-G1 draws
  it — production's v35 CSS never carried that rule, so
  current items render muted there today; the staging
  rendering now matches the frame.
- [x] T011 (after T010) Closeout on staging: this file
  updated with evidence; the owner reviews staging.
  **Production promotion is out of scope** — a separate
  owner approval under spec 010. **Closed 2026-10-10:**
  spec 021 is IMPLEMENTED ON STAGING (commits `9951afb`
  wireframe approval, `0941851` spec record, `059a837`
  implementation, `1a66f12` current-state fix); live
  staging verified by curl (all pages 200 (OK), per-page
  sources as wireframed, llms.txt lines served,
  styles.v36.css + newsletter-signup.v2.js 200 (OK)) and
  by the T010 Playwright pass.
- [x] T012 (after T011; separate owner approval) Production
  promotion. Owner approved in chat 2026-10-10 ("Promote
  spec 021 to production"). Executed per the spec 020
  playbook: pre-promotion main `38c7aaf` (spec 020 closeout
  `d2c3279` + two automated signals refreshes), staging tip
  `89d60eb`; merge `202a944` (only conflict
  `signals/index.html` — regenerated from the merged
  template + main's snapshot, never hand-picked);
  post-merge build commit `b43e0a9`; final merged tree
  build-idempotent (repeat build = zero diff). Guards:
  `git diff d2c3279..HEAD -- robots.txt _headers` EMPTY —
  production robots.txt (Allow) and `_headers` (no
  X-Robots-Tag) were restored into the merge itself;
  staging's guard versions never left staging. Turnstile
  v2 verified pre-push: the hostname gate is preserved —
  axiovexsystems.com loads the production site key, every
  other host the public test key (v1's mechanism, carried
  verbatim). Deployment `f40deb94` (`b43e0a9`) success.
  Live verification: `/`, `/signals/`, `/newsletter/`,
  `/newsletter/2026-10-14/`, an article page, `/privacy/`,
  `/robots.txt`, `/sitemap.xml`, `/llms.txt` all 200 (OK);
  served HTML carries the header Subscribe button (desktop
  + mobile markup), the footer strip form, the homepage
  section, the landing form above the archive, both
  llms.txt newsletter lines, and styles.v36.css +
  newsletter-signup.v2.js; no X-Robots-Tag on production
  responses. Endpoint ladder: subscribe empty payload 422,
  bogus confirm/unsubscribe tokens 200 (OK) graceful
  landings including the one-click POST, `GET /api/contact`
  405, never 500. Production D1 unchanged by the promotion:
  subscribers 1 (the owner's pending row), sends 0.
  Playwright production screenshots (`prod-*`, desktop
  1440 + mobile 390) in `~/workspace/your_files/
  spec021-review/` match the approved frames. Staging
  sync-back to final main follows this closeout with the
  staging guards re-asserted, per the playbook.
- [ ] T013 (owner correction 2026-10-10, after T012) One form
  on `/newsletter/`. As promoted, the landing page rendered
  two subscribe forms — the WF-15 landing form (source
  `landing`) and the sitewide WF-G4 footer strip (source
  `footer`). Tristen directed a single form, the top one.
  Fix: the generator's newsletter-chrome step suppresses
  the footer strip on the `/newsletter/` landing page only
  (explicit per-page exclusion; the NLFOOTER region is
  written empty there). Issue pages and every other page
  keep the strip. Wireframes annotated (WF-G4 + WF-15 +
  revision log, owner correction 2026-10-10). Verify by
  build audit (form counts per page), harness, staging +
  production Playwright screenshots; promote under the
  standing spec 021 promotion approval and close out here
  with the final main hash.
