# Spec 023 amendment — 2026-10-23: boundary-counting paper link

Owner directive (2026-10-23, RCPH chat): link the separator
paper on the research page, update the page, push to prod.

## Change

"Read the primary material" gains a fourth link card, and its
intro line now reads "four public places" (was three):

4. **The boundary-counting paper and its evidence** — Zenodo
   (https://doi.org/10.5281/zenodo.23600630)
   "Everything behind the paper in 'Gravity may be counting'
   above, public now: both registered tests' full data, the
   frozen code, the run logs, the derivations, and the
   computer-checked proof companion."

The DOI is the paper's reproducibility package, published on
Zenodo the same day (companion Lean formalization:
10.5281/zenodo.23600458, linked from the package record).
No layout change; the card reuses the existing link-card
markup and styles, so no wireframe change was required.
Copy file and research/index.html updated together.

## Promotion note

Staging currently carries unrelated, not-yet-promoted
workstreams (spec 030 listening, spec 031 articles, the
newsletter endpoint work). This amendment's commit was
verified live on staging, then promoted to production by
cherry-pick of this commit alone, so the unrelated work was
NOT shipped by this promotion. The standard guard checks
were applied to the production push (robots.txt unchanged;
_headers unchanged — neither file is touched by this
commit).

## Verification

- Staging: served page contains the new card + DOI link;
  screenshots (desktop + mobile) inspected.
- Production: same identity checks on axiovexsystems.com
  after the push; screenshots inspected.

## Production record (2026-10-23)

Promoted the same day: cherry-picked to main as 1fafa42
(3 files only; robots.txt and _headers untouched — guard
check empty). Cloudflare Pages production deployment of
1fafa42 succeeded; https://axiovexsystems.com/research/
serves the new card, and the production page is byte-identical
to the verified staging page apart from Cloudflare's
per-request email-obfuscation tokens. Staging verification
record: verification-2026-10-23-paper-link/ (on staging;
commit 97b3f71).
