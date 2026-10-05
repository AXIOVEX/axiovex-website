# Tasks: Axiovex Systems Website — Baseline (as built)

**Spec**: specs/001-axiovex-website/spec.md · **Plan**: plan.md
Legend: [x] done · [ ] open · [OWNER] needs Tristen's decision

## Phase 1 — Site and redesign
- [x] T001 Static site live on Cloudflare Pages at axiovexsystems.com
- [x] T002 Wireframe set WF-01..09 + G1..G4 approved by Tristen (2026-10-04)
- [x] T003 Redesign implemented to the approved wireframes (7102f67) + visual QA fixes (ff4a4cc, 9baa6cd, 18eed9b)

## Phase 2 — Generated build and automation
- [x] T004 scripts/build-site.mjs: documents mirror + static blog + sitemap (dbb3deb)
- [x] T005 site-sync.yml automation incl. 15-min shared-documents poll; bot push verified (9ea504b)
- [x] T006 Blog migration: front-matter posts, /blog/<slug>/ URLs, post?p= redirect shim

## Phase 3 — Content and terminology
- [x] T007 SI terminology: blog post, FAQ item + JSON-LD, llms.txt (741767c); AI 101 deck v1.0.13 / handout v1.0.12 via shared-documents
- [x] T008 SMS share option restored touch-only (95a70bd) — layout since revised by spec 002

## Phase 4 — Monitoring
- [x] T009 Weekly + on-push SEO/AEO checks against baseline (AEO 100, Seobility 91)

## Phase 5 — SDD adoption (2026-10-05)
- [x] T010 spec-kit init (copilot, speckit 1.0.10) + AEE and evaluator extensions installed
- [x] T011 Constitution ratified; wireframes moved in-repo (docs/wireframes/)
- [x] T012 Baseline spec + claims register written (this folder)

## Open — compliance/security/accessibility audit (spec R-1)
- [ ] T013 Verify privacy-policy assertions against actual Cloudflare logging/cookies/challenges
- [ ] T014 Inspect/set CSP, HSTS, Referrer-Policy, Permissions-Policy, X-Content-Type-Options
- [ ] T015 WCAG pass: keyboard, focus order, contrast, heading order
- [ ] T016 Substantiate or narrow government/defense, CMMC-adjacent, local-data, and no-shared-training claims
- [ ] [OWNER] T017 Decide Terms / Disclaimer pages; keep privacy promises no broader than law
