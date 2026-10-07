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
- [ ] T006 **GATE — Tristen reviews the hero on staging.** OPEN.
  Promotion does not proceed without his go.
- [ ] T007 (after T006) Promotion staging → main per spec 010
  FR-004 (guard proofs), production verification. Blocked on
  T006.
