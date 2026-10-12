# Spec 023 — Research hub page (`/research/`, unlisted)

**Direction:** Tristen Pierson, 2026-10-11 — "Publish the research
hub quietly: plain-English RCPH + framework page at an unlisted URL
(not in nav, noindex), cross-linked with BitConcepts and GitHub."
The page concept, the naming of RCPH on the page, and the
quiet-publication properties below are the owner's own settings,
given in that direction.
**Status:** SHIPPED 2026-10-11 — Tristen approved WF-18 +
the copy at the T001 gate, with one amendment (the
"deliberately quiet" small print under the lede is removed;
applied in the copy draft and the WF-18 frame). Implemented
and verified on `staging`; staging review approved at T007
(2026-10-11 20:19 EDT); promoted to production per spec 010
(T008) and verified live at
https://axiovexsystems.com/research/ — intentionally
unlisted (no nav item, no sitemap entry, page-level
noindex). Closeout recorded in tasks.md T009.

## Scope

One new hand-authored static page, `/research/`, presenting the
company's research programs and their status in plain English, plus
the wireframe frame that specifies its layout (WF-18). Nothing else
on the site changes: no nav change, no footer change, no other
page's copy, no stylesheet release (page-local `<style>` only, on
the Privacy/Disclaimer precedent).

The page is **unlisted by design**, with four cooperating
properties, all required:

1. **Not in navigation** — WF-G1 is unchanged; no "Research" item
   appears in the nav on any page.
2. **Not linked from anywhere on this site** — no page, footer
   (WF-G4 unchanged), blog post, or `llms.txt` entry points to it.
3. **Noindex** — the page carries
   `<meta name="robots" content="noindex">`, so a crawler that
   arrives via an external cross-link can read the page but must
   not index it.
4. **Not in the sitemap** — `/research/` is never added to the URL
   list in `scripts/build-site.mjs` (`writeSitemap()`); see FR-004.

The page is reachable by direct URL and by exactly two inbound
cross-links, both outside this repo: the BitConcepts research page
(parallel effort) and the AXIOVEX/epistemic-ledger GitHub repo
(back-link noted as a follow-up in tasks.md T009 — that repo is not
edited in this pass).

## Functional requirements

- **FR-001 — Unlisted mechanics.** As Scope 1–4. Production
  `robots.txt` is deliberately **not** changed: a Disallow would
  prevent crawlers from fetching the page and reading its noindex,
  and a disallowed URL can still surface as a link-only result.
  The noindex meta is the correct control; the sitemap omission
  and the absence of internal links remove the discovery paths we
  control. No `_headers` change (the meta travels with the page).
- **FR-002 — Page shell.** `research/index.html`, hand-authored on
  the `privacy/index.html` shell pattern (same head structure,
  versioned site stylesheet + widget stylesheet links, nav WF-G1,
  page head + strata WF-G2 with the spec 003 rhythm, footer WF-G4,
  reduced CTA band as WF-05/WF-14). Page-local `<style>` block for
  the status panel and link cards, following the privacy page's
  precedent of page-local CSS. JSON-LD WebPage schema as on the
  privacy page. Canonical URL `https://axiovexsystems.com/research/`.
  The Signals floating widget follows the global rule (present, as
  on every page except `/signals/`); it links *out* to Signals and
  never into `/research/`.
- **FR-003 — Content.** The page copy is
  `specs/023-research-hub/research-hub-copy.md` in this package,
  verbatim once approved at the T001 gate. Structure: page head →
  Program one (projected constraints / RCPH): plain-English
  findings (time; gravity with its premise stated openly; origin
  as decompression; perception/report with its boundary; the three
  named reasons questions stay stuck) → status panel → the
  framework section (five ideas: constraints, interfaces,
  records, counting, the register-run-publish method) → Program
  two (the epistemic ledger) → primary-material link cards →
  reduced CTA band.
- **FR-004 — Content limits (hard).** The copy carries **no**
  internal claim labels, **no** grades or scores of any kind,
  **no** internal study/spec numbers, **no** staging or generator
  identifiers, and no internal process jargon. Program status is
  stated as plain counts and plain sentences only. "RCPH" is
  named once, in the Program one introduction, under the owner's
  approval in the Direction line. Public framing throughout:
  results and framework ideas are public; internal bookkeeping is
  not. Any future copy change to this page re-runs this check.
- **FR-005 — Outbound links.** Exactly the three primary-material
  links in the copy draft, each verified resolving before being
  listed (see Link registry): the epistemic-ledger GitHub repo,
  the OSF program parent, and the BitConcepts research page. Plus
  the closing band's `start@axiovexsystems.com` mail route on the
  WF-05/WF-14 pattern. No other outbound links.
- **FR-006 — Sitemap guard.** Because hand-authored pages enter
  the sitemap by being added to `writeSitemap()`'s list, the
  implementation's verification includes a post-build check:
  `sitemap.xml` contains no `research` URL, and `llms.txt` is
  byte-unchanged. If a future change ever proposes listing this
  page, that is a new owner decision, not an edit.

## Link registry (verified 2026-10-11 by direct fetch)

| Link | Target | Status |
|---|---|---|
| Framing paper + ledger (GitHub) | https://github.com/AXIOVEX/epistemic-ledger | HTTP 200, public repo |
| Registered studies (OSF) | https://osf.io/nerxz/ | HTTP 200, public program parent |
| Research at BitConcepts | https://bitconcepts.tech/research/ | HTTP 200 at drafting time; built in parallel — linked regardless per the owner's direction; it resolves at launch |

## Design

WF-18 (docs/wireframes/) — drawn on the WF-05/WF-14 shell: centered
page head, strata, prose segments in the centered ~760px editorial
column, the status panel as a bordered panel inside that column,
the framework's method step as a four-step row, link cards as a
three-card row, reduced CTA band, unchanged footer. Mobile: the
same order, single column (the status lines and cards stack);
tablet follows the shared sub-page behavior (WF-09). No new global
component is created; WF-G1 and WF-G4 are explicitly unchanged.

## Verification standard

Per constitution §V and the standing visual rule: after the T001
gate, implementation happens on `staging` only; the page is
rendered with Playwright at desktop and mobile widths and
screenshotted against WF-18 before any "verified" claim; the
unlisted properties are verified on staging (robots meta present
in served HTML, sitemap rebuilt without the URL, nav/footer
diff-empty for Research); promotion follows spec 010 with the
`robots.txt` / `_headers` guard diffs checked by name, and
production is verified live the same way after the merge.

## Implementation status

- 2026-10-11: spec package + WF-18 + full copy draft prepared on
  branch `spec/023-research-hub` for the T001 approval gate.
  Nothing implemented; staging and main untouched.
- 2026-10-11: T001 gate satisfied — the owner approved WF-15 +
  the copy with the small-print removal amendment (applied in
  `research-hub-copy.md` and the WF-15 frame; the wireframe
  approval markings updated to APPROVED 2026-10-11).
  Implementation on staging in progress.
- 2026-10-11: merged to `staging` (T004). At the merge the
  frame was renumbered **WF-15 → WF-18** across this package
  and the wireframes set: staging's canonical set already
  carried WF-15/16/17 (newsletter frames, spec 020) — a
  collision that did not exist on `main`, where this package
  was drafted. The frame as approved is unchanged; only its
  number moved. (The T001 bullet above keeps the number the
  owner approved under; this bullet is the renumber record.)
- 2026-10-11: **implemented and verified on `staging`**
  (T005/T006; commits `16264e9`, `ee3bcc1`). The page is live
  at https://staging.axiovexsystems.com/research/ behind
  staging's noindex guards. **T007 gate pending:** the
  owner's staging review; `main`/production untouched.
