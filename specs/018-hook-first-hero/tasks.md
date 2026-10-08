# Tasks: Spec 018 — Hook-First Hero

- [x] T001 **GATE — Tristen approves the hero copy.** **SATISFIED
  2026-10-07**: Tristen reviewed the three drafted hero options
  and the composite recommendation, and directed verbatim: "Go
  with the composite — Option 2 headline + Option 1 lede." The
  approved copy is recorded verbatim in spec.md.
- [x] T002 Spec package (spec.md / plan.md / tasks.md) + wireframes
  on `main`: WF-01 hero copy updated in wireframes.html (WF-02 /
  WF-07 hero H1s updated to match), revision-log entry in
  wireframes.md, review copy re-synced byte-identically.
- [x] T003 Sync main → staging (merge per spec 010 FR-004),
  staging guards preserved and verified after the merge
  (`robots.txt` Disallow; `_headers` = production file + exactly
  the noindex line). DONE 2026-10-07: merge `60a046a`; robots.txt
  = staging Disallow version; `_headers` diff vs `origin/main` =
  exactly one added line, `X-Robots-Tag: noindex, nofollow`.
- [x] T004 Hero implemented on staging: `index.html` H1 + lede
  replaced verbatim with the approved copy; diff scoped to the
  hero; committed + pushed to `staging`. DONE 2026-10-07: commit
  `e1e340b` (1 file, 2 lines). Generator re-run confirmed the
  build touches `index.html` only inside the SIGNALS markers and
  the (inactive) breaking pass — the post-build diff was exactly
  the hero (an unrelated sitemap lastmod artifact of the local
  build was reverted, not committed).
- [x] T005 Verification: live staging fetch (200, new H1 present,
  `x-robots-tag` noindex intact) + Playwright screenshots of the
  committed staging build at desktop 1440 and mobile 390 saved to
  `~/workspace/your_files/spec018-review/` — hero styled, H1 wraps
  cleanly, no horizontal overflow. DONE 2026-10-07: live
  staging.axiovexsystems.com serves 200 with the new H1 verbatim
  and `x-robots-tag: noindex, nofollow`; the brand line still
  appears 4× on the page (slogan/OG/Twitter/footer, per FR-004).
  Screenshots (locally served committed build `e1e340b`):
  staging-desktop-top/full.png + staging-mobile-top/full.png —
  H1 centered at 76px desktop (4 wrapped lines) / 42px mobile
  (6 wrapped lines), lede centered, no horizontal overflow at
  either width (scrollWidth == innerWidth), layout intact — no
  restyle needed. Production verified untouched (old H1 live).
- [x] T006 **GATE — Tristen reviews the hero on staging.**
  **SATISFIED 2026-10-07**: Tristen reviewed the hero on staging
  (screenshots + staging URL presented) and directed verbatim:
  "Approved" (2026-10-07 ~19:20 EDT). Promotion authorized.
- [x] T007 (after T006) Promotion staging → main per spec 010
  FR-004 (guard proofs), production verification. DONE
  2026-10-07: approval record `a6569a0` on main; promotion merge
  `be1d8e0` (staging → main, production guard files restored
  inside the unpushed merge). FR-004 proofs: `git diff
  a6569a0..HEAD -- robots.txt _headers` = 0 lines; promotion file
  list = `index.html` only (2 lines — the hero H1 + lede).
  Production verified live: https://axiovexsystems.com/ → 200,
  new H1 + lede served verbatim, NO `x-robots-tag` header,
  robots.txt = Allow version. Playwright screenshots of the
  production (main) build: prod-desktop-top/full.png +
  prod-mobile-top/full.png in `~/workspace/your_files/
  spec018-review/` — H1 centered, wraps as on staging (4 lines
  desktop / 6 mobile), no horizontal overflow at either width
  (scrollWidth == innerWidth). Sync back: main → staging merge
  `79213e6` + guard re-application commit `1a4a10b` BEFORE push
  (origin/staging never carried an unguarded tree); staging
  guards verified after (robots Disallow; `_headers` delta vs
  production = exactly the one noindex line; live staging 200
  with `x-robots-tag: noindex, nofollow`).

## Amendment 1 — service-section lead lines (2026-10-08)

- [x] T008 **GATE — owner direction.** **SATISFIED
  2026-10-08**: Tristen directed "do these now:
  hook-first lead lines for the three service sections"
  — the package FR-008 held for later. Approval basis
  recorded in spec.md Amendment 1.
- [x] T009 Docs package first (wireframes-first rule):
  WF-01 services grid + WF-G5 card notes revised in
  `docs/wireframes/wireframes.html`, revision-log entry
  in `docs/wireframes/wireframes.md`, review copy
  re-synced to `~/workspace/your_files/axiovex-wireframes/
  wireframes.html`; spec.md Amendment 1 + these tasks.
- [x] T010 Implementation on staging: the three service
  cards in `index.html` gain the Amendment-1 lead lines
  verbatim; existing copy kept, trimmed only where a
  lead takes over its closing clause; generator re-run;
  diff scoped to the three card paragraphs; commit +
  push to `staging` with guards intact. DONE 2026-10-08:
  docs commit `5740ead`, implementation commit `2433568`
  (index.html only, 3 lines — one per card; the build's
  sitemap lastmod artifact was reverted, not committed,
  per the T004 precedent). Guards verified in the pushed
  tree (robots.txt = staging Disallow version;
  `_headers` carries the one `X-Robots-Tag` line).
- [x] T011 Verification + **GATE — Tristen reviews the
  service sections on staging**. Verification DONE
  2026-10-08: live staging.axiovexsystems.com → 200,
  all three lead lines served verbatim (1× each),
  `x-robots-tag: noindex, nofollow` intact, stylesheet
  still v33 (no CSS change). Playwright screenshots of
  the locally built staging output at desktop 1440 and
  mobile 390 saved to `~/workspace/your_files/
  services-hook-leads/` (staging-desktop-services.png,
  staging-mobile-services.png): cards render cleanly at
  both widths, `scrollWidth == innerWidth` (no
  horizontal overflow), rendered card text matches the
  approved copy exactly. **Owner review APPROVED —
  Tristen, 2026-10-08 17:34 ET ("Promote to
  production").**
- [x] T012 (after T011) Promotion staging → main per
  spec 010 FR-004 (guard proofs), production
  re-verification. **DONE 2026-10-08:** staging first
  re-synced with main (ab3d555); the sync merge pulled
  production's guard files into staging (side effect of
  the amended fast-forward promotion earlier that day)
  — caught on the pre-push check and repaired by
  re-asserting staging's guards (808ca5e) before the
  promotion merge. Merged to main (156b092) with
  robots.txt and `_headers` diffs vs pre-merge main
  both EMPTY; production confirmed live serving all
  three lead lines (1× each), Allow robots.txt, no
  X-Robots-Tag header. Production desktop verified in
  the live browser (lead line is the first text of each
  card, clean equal-width row, arrows render).
  Production mobile verified on the exact deployed
  tree at 390px (all three leads present,
  scrollWidth == innerWidth; prod-mobile-services.png).
