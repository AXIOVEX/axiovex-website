# Feature Specification: Staging Environment (staging.axiovexsystems.com)

**Feature Branch**: `010-staging-environment` (this spec lands on
`main` as documentation; the staging-only files land on the
`staging` branch and must never be promoted back — FR-004)

**Created**: 2026-10-06

**Status**: **Approved by owner direction 2026-10-06** (Tristen:
"also add a staging domain for both sites so we can publish on
staging before production" — recorded below as this spec's
approval). Spec package + staging branch prepared 2026-10-06
(tasks.md T001). The Cloudflare Pages project, custom domain, and
project variables are T002 (parent task, browser); staging
verification is T003. This spec covers axiovexsystems.com →
staging.axiovexsystems.com; the Rockeagle sites' staging domains
are handled in that project, under the same pattern.

**Direction (Tristen, 2026-10-06)**: "also add a staging domain
for both sites so we can publish on staging before production."

## Purpose

Today production is the only environment: every push to `main`
deploys straight to axiovexsystems.com, and verification happens
after the fact on the live site (constitution §V checks, the
push-check monitoring). That has worked, but it means the first
render of every change is the public one. Spec 010 adds a
persistent staging environment — a long-lived `staging` branch
served by its own Cloudflare Pages project at
**staging.axiovexsystems.com** — so changes are published and
verified there first, and only then promoted to production.

## Why the wireframe gate does not apply

Constitution §III gates **UX-impacting changes**: user-facing
design changes to the website, which must start in
`docs/wireframes/` and be approved before implementation. Spec
010 changes no production page, layout, copy, or behavior. It
adds deployment infrastructure — a branch, a second Pages
project, one subdomain — plus guard files that exist **only on
the staging branch** and are never served by production. The one
code change (FR-006) is constructed to be a no-op in production.
The gate's approval function is served instead by the owner's
explicit direction (2026-10-06, quoted above), recorded here as
the approval for this spec. Staging is a preview mechanism, not
an exemption: any future design change previewed on staging
still goes through the wireframe gate exactly as before.

## Topology

```
main     ──► Pages project "axiovex-website"          (existing, untouched)
             production branch: main
             domain: axiovexsystems.com               (PRODUCTION)

staging  ──► Pages project "axiovex-website-staging"  (NEW — T002)
             production branch: staging
             domain: staging.axiovexsystems.com       (STAGING)
```

Both projects deploy the repository root with **no build
command** — the site's generated output is committed to the repo
by the sync Actions and by implementers, exactly as production
works today. No framework preset.

## Functional requirements

- **FR-001 — Staging branch + dedicated Pages project.** A
  long-lived branch `staging` exists in
  `AXIOVEX/axiovex-website`, created from `main` and kept alive
  (never deleted after a promotion; it is the standing preview
  branch). A second Cloudflare Pages project,
  `axiovex-website-staging`, builds that branch as its
  production branch, with the custom domain
  `staging.axiovexsystems.com`. The existing production project
  (`axiovex-website`, branch `main`, axiovexsystems.com) is not
  reconfigured in any way.
- **FR-002 — Change flow.** Work lands on `staging` first
  (feature commits, or a merge of the change under review). The
  staging project deploys it; the change is verified at
  staging.axiovexsystems.com (T003 checklist). Promotion is a
  merge `staging` → `main`, after which production deploys from
  `main` exactly as today. Syncs run the other way: `main` is
  merged into `staging` whenever staging verification is needed,
  bringing staging back level with production (bot-generated
  documents/blog/Signals output included — FR-008).
- **FR-003 — Staging-only protections (staging branch only).**
  The `staging` branch — and only that branch — carries:
  - a root `_headers` file whose entire content is:
    ```
    /*
      X-Robots-Tag: noindex, nofollow
    ```
    so every staging response tells crawlers not to index it;
  - a root `robots.txt` whose entire content is:
    ```
    # STAGING ONLY — do not promote to main
    User-agent: *
    Disallow: /
    ```
  These files are the staging environment's identity. They are
  never linked to, advertised, or presented as a client surface;
  they exist so staging can never be indexed by search engines
  and never confused with production. (Spec 008's
  `signals-widget.json`, the sitemap, and canonical URLs inside
  staging pages still name production paths — acceptable on a
  noindexed preview, and another reason promotion review —
  FR-004 — matters.)
- **FR-004 — Promotion hazard (the standing stop rule).**
  Merges `staging` → `main` must **never** carry the staging
  `_headers` or `robots.txt` into `main`: if either file reached
  production, the live site would be de-indexed
  (`X-Robots-Tag: noindex` on every response, robots disallowing
  all crawlers). Therefore every promotion follows the checklist
  in plan.md: review `git diff main..staging --stat` before
  merging; only the intended change files may appear; **if
  `_headers` or `robots.txt` appear in a promotion diff, STOP**
  and exclude them from the merge (take `main`'s versions). After
  any promotion, production is verified: `axiovexsystems.com/robots.txt`
  still allows `/` and no `X-Robots-Tag: noindex` header is
  served on the apex. The reverse sync has the mirror-image
  duty: merges `main` → `staging` must **preserve** staging's
  `_headers` and `robots.txt`. Git normally keeps staging's
  versions (they diverge intentionally); if a conflict ever
  appears — for example if `main` later gains its own root
  `_headers` (the open spec 001 T014 security-headers work) —
  resolve by **combining**: `main`'s rules plus the staging
  noindex block, never by taking either side wholesale.
- **FR-005 — Contact form behavior on staging (by design).**
  The contact page already selects its Turnstile site key by
  hostname (`contact/index.html`: the production key only when
  `window.location.hostname === 'axiovexsystems.com'`,
  Cloudflare's published always-pass **test** site key on every
  other hostname — spec 005), so staging renders the test
  widget with no code change. The staging Pages project is
  configured (T002) with the matching always-pass **test**
  secret as `TURNSTILE_SECRET_KEY`, so staging submissions pass
  Siteverify through the function's existing testing-key path.
  The staging project deliberately gets **no** Graph variables
  (`GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`
  are all absent), so delivery cannot obtain a token and the
  function returns its graceful mail-failure fallback (HTTP 502,
  "We could not deliver your message right now. Please try again
  or email us instead."). Net behavior, by design: **on staging
  the form can be filled and submitted, the spam check passes,
  and nothing is ever delivered — no staging submission can
  reach the Start mailbox.**
- **FR-006 — `ENVIRONMENT=staging` + self-identifying mail.**
  The staging project carries the plain (non-secret) variable
  `ENVIRONMENT=staging`; the production project has no
  `ENVIRONMENT` variable. `functions/api/contact.js` prefixes
  the outgoing mail subject with `[staging] ` when — and only
  when — `env.ENVIRONMENT === "staging"` (implemented on the
  staging branch in T001; the change is written to promote
  cleanly to `main` later, where it is a permanent no-op because
  the variable is absent). This is future-proofing: if a Graph
  secret is ever added to the staging project, any mail it sends
  is self-identifying in the mailbox and can never be mistaken
  for a production submission.
- **FR-007 — Analytics and checkers stay scoped to production.**
  The spec 006 analytics fetcher reads **zone-wide** Cloudflare
  GraphQL totals for axiovexsystems.com, and staging traffic is
  inside the same zone — so staging requests will appear in the
  zone totals the daily/weekly/monthly reports are built from.
  This is a known, accepted effect of this design (recorded
  here, not fixed): adaptive analytics data carries hostnames,
  so reports can call out `staging.axiovexsystems.com` traffic
  when it is visible; no fetcher change is made. The SEO/AEO
  checkers (AEO scan, Seobility) always target
  **https://axiovexsystems.com/** (production) only — never the
  staging domain — and FR-003's noindex keeps staging out of
  search results regardless.
- **FR-008 — Generated output on staging: main-only Actions.**
  The repo's Actions never build or commit to `staging`
  (verified against the workflow files in plan.md):
  `site-sync.yml` triggers on pushes to `main` only, and its
  scheduled/dispatch runs check out and push to `main`;
  `signals-sync.yml` runs on schedule/dispatch and pushes
  explicitly to `origin main`. **No bot commits land on the
  staging branch.** Consequence: staging's generated output
  (documents mirror, blog, Signals blocks, sitemap) is only as
  fresh as the last `main` → `staging` merge — which is exactly
  the FR-002 sync: merge `main` into `staging` whenever staging
  verification is needed. Operational caution: never dispatch
  `site-sync` or `signals-sync` manually from the `staging`
  branch; dispatch from `main` only.
- **FR-009 — Production untouched until a promotion.** Apart
  from T002 adding the staging subdomain through the Pages
  custom-domain flow, nothing about production changes under
  this spec: no edits to production files on `main`, no changes
  to the production Pages project's settings, no changes to
  existing DNS records, no changes to the production Turnstile
  widget, the production Graph app, or any production secret.

## Claims discipline

The staging environment makes no public claims: it is noindexed,
unlinked, and internal (constitution §I). The `[staging] `
subject prefix and the staging `robots.txt` comment are internal
labels, not site copy. Nothing in this spec asserts a
capability, certification, partnership, or statistic.

## Out of scope

- Staging domains for the Rockeagle sites (owner direction
  covers both; that project applies the same pattern under its
  own spec).
- Authentication in front of staging (e.g. Cloudflare Access).
  V1 protection is noindex + disallow + an unadvertised
  subdomain; adding Access later is its own change if wanted.
- Any staging mailbox, Graph app, or Microsoft tenant change —
  FR-005's no-delivery behavior is the design, not a gap.
- Any production design, copy, or behavior change. The
  wireframe gate is untouched and still governs all of those.
