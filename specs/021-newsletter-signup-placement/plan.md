# Plan: Spec 021 — Newsletter Signup Placement Expansion

1. **Wireframes APPROVED first (T001/T002).** The placement
   revision was drawn 2026-10-10 in `docs/wireframes/`
   (frames WF-G1, WF-G4, WF-G8 + compact variant, WF-01,
   WF-04, WF-11, WF-15) with the proposal note
   `newsletter-signup-placement-proposal-2026-10-10.md`;
   Tristen approved it as drawn on 2026-10-10 with the
   header label decided as **Subscribe**, WF-15's v1
   "Not in the nav" note superseded by the header CTA, and
   the homepage section after the Signals block as drawn.
   The frames and the log are marked APPROVED 2026-10-10;
   the review copy is re-synced byte-identically to
   `~/workspace/your_files/axiovex-wireframes/wireframes.html`.

2. **One generator component (T003).** `newsletterBlock()`
   in `scripts/build-site.mjs` generalizes from "variant =
   source string" to `(source, opts)`: variants `full`
   (today's block, copy unchanged), `compact` (WF-G8's
   compact variant), `landing` (full block + the WF-15
   lead's bullets, at-form cadence line, and sample-issue
   anchor; the proof slot renders nothing), and the footer
   rendering of the compact variant with WF-G4's drawn
   heading + sub-line. Element ids become source-keyed
   (`nl-email-<source>`) and each block carries
   `data-nl-block`; the `id="newsletter"` anchor is kept on
   the `/signals/` foot block only (the confirmation/
   unsubscribe emails' CTA links target `/signals/#newsletter`).
   Placements wire in where the generator already works:
   - blog articles: a `{{NEWSLETTER_HTML}}` fill in
     `buildBlog()` + the blog-article template slot between
     the body and `{{MORE_HTML}}` (source `article`);
   - `/signals/`: a `{{NEWSLETTER_TOP_HTML}}` fill in
     `buildSignals()` + the template slot ahead of
     Highlights (source `signals-top`); the foot fill is
     unchanged (source `signals`);
   - `/newsletter/`: `buildNewsletter()` passes the landing
     variant (source `landing`) and the template moves the
     fill above the issue list, which gains `id="issues"`
     as the sample anchor's target; the closing slot is
     removed;
   - home + footer: marker regions in `index.html`
     (`NLHOME`) and in every standard shell (`NLFOOTER`,
     above the footer grid), filled by a new
     `buildNewsletterChrome()` step modeled on
     `buildBreaking()` — it runs after all page generation
     and rewrites the regions in the full output list
     (static pages, blog index + articles, documents,
     signals, newsletter index + issues, disclaimer), so
     the strip markup is generated once, identically,
     everywhere, and rebuilds stay idempotent.

3. **Shell edits (T005).** The header Subscribe button and
   the mobile-panel Subscribe row are static markup in
   each shell (the repo's pattern for WF-G1 changes — cf.
   specs 008/009): the four static pages (`index.html`,
   `contact/`, `privacy/`, `disclaimer/`) and the six
   templates (blog-article, blog-index, documents, signals,
   newsletter-index, newsletter-issue). The newsletter
   templates' Subscribe item carries `aria-current="page"`.
   Pages gaining a form gain the signup script include
   (blog index, documents, and the static pages that did
   not carry it); pages already carrying it just bump the
   version (step 4).

4. **Client script v2 (T004).** `newsletter-signup.v2.js`
   replaces v1: instances are discovered via
   `[data-nl-block]`, each with its own form state and its
   own Turnstile widget rendered into its own container on
   first interaction with that form's email field. The
   Turnstile api.js loads once, lazily, exactly as v1
   (interaction-triggered; the global onload renders every
   armed instance). Submit, error, token-refresh, and
   pending-state behavior are v1's, per instance; compact
   blocks additionally hide their heading/fine print on
   success so the pending state swaps in place as drawn.
   v1 stays in the tree (versioned-asset convention);
   references move to v2.

5. **Endpoint constraint (T006).** `functions/api/newsletter/
   subscribe.js`: the source is validated against the known
   set (`signals`, `signals-top`, `article`, `landing`,
   `home`, `footer`, `archive`, `issue`); anything else
   coerces to `signals`. **Found during implementation
   prep:** pre-021 the endpoint stored the source as free
   text (`cleanText(..., 40)`, default `signals`) with no
   allowlist — FR-009's constraint is therefore a small
   server-side change, not a no-op. Nothing else in the
   endpoint changes.

6. **Stylesheet (T007).** `styles.v36.css` = v35 + a spec
   021 section: `.nav-subscribe` ghost treatment (quieter
   than `.nav-cta`), `.nav-links a[aria-current="page"]`
   cyan (the WF-G1 current-item treatment), compact-variant
   styles (`.nl-compact`, heading, sub-line, compact fine
   print), the footer-strip spacing inside `.footer`, the
   landing lead's bullets/cadence/sample rows, and the
   article-measure block margin. All `<link>` references
   move to v36 sitewide (templates + static pages); v35 is
   never edited.

7. **llms.txt (T008).** The two approved lines go beside
   the Signals line in the top link list, verbatim from
   the proposal note, the second pointing at
   `/newsletter/2026-10-14/` (the latest issue at
   implementation).

8. **Verify (T009/T010).** The spec 020 harness
   (`scripts/newsletter/test-harness.mjs`) gains placement
   checks (each new source stored verbatim; an out-of-set
   source stored as `signals`) and must stay fully green;
   a form-count/source audit runs over the built output
   against C-021-1/C-021-3; a second build must produce
   zero diff. Staging is then verified with Playwright at
   desktop and 390px against the approved frames —
   homepage (hero untouched + new section), one article
   (end block), `/newsletter/` (landing structure),
   `/signals/` (both forms), and a page's header + footer
   strip — plus the cold-load network check for
   C-021-4 on the homepage. Screenshots land in
   `~/workspace/your_files/spec021-review/`.

9. **Closeout (T011).** Tasks updated with evidence;
   staging only. Production promotion is a separate owner
   approval under spec 010 and is not requested by this
   spec's completion.
