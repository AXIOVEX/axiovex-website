# Plan: Staging Environment (spec 010)

**Status: approved by owner direction 2026-10-06; T001 (this
plan's branch + spec prep) executes immediately.** The Pages
project work (T002) is a separate parent task — executed via
the Cloudflare API under the API-first directive (the browser
route in the original text was superseded before execution) —
this plan specifies exactly what it must create so the repo side
and the Cloudflare side meet.

## Topology

```
AXIOVEX/axiovex-website
├── main     ──► Pages: axiovex-website          ──► axiovexsystems.com
└── staging  ──► Pages: axiovex-website-staging  ──► staging.axiovexsystems.com
```

## The staging Pages project (T002 — parent; executed via the Cloudflare API)

Create in the **Axiovex** Cloudflare account
(`2f522086aed39057a5c3cc467855a8c9`), connected to
`AXIOVEX/axiovex-website`:

| Setting | Value |
|---|---|
| Project name | `axiovex-website-staging` |
| Production branch | `staging` |
| Framework preset | None |
| Build command | *(none — output is committed to the repo)* |
| Build output directory | `/` (repository root) |
| Root directory | `/` |
| Custom domain | `staging.axiovexsystems.com` (added via the project's custom-domain flow, which creates the DNS record) |

Environment variables / secrets on the **staging** project
(production + preview environments of that project):

| Name | Kind | Value |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | secret | Cloudflare's published always-pass **test** secret (`1x0000000000000000000000000000000AA`) |
| `ENVIRONMENT` | plain | `staging` |
| `GRAPH_TENANT_ID` | — | **absent (deliberate)** |
| `GRAPH_CLIENT_ID` | — | **absent (deliberate)** |
| `GRAPH_CLIENT_SECRET` | — | **absent (deliberate)** |

The production project's variables are not touched: real
Turnstile secret, Graph variables as today, and **no**
`ENVIRONMENT` variable (that absence is what makes FR-006 a
production no-op).

Side effect to expect, not fix: the existing production project
will also produce branch-preview deployments when `staging` is
pushed (its preview of the branch, on a `pages.dev` URL). The
staging `_headers` ships in that output too, so those previews
are noindexed as well. Harmless duplication.

## What lives on the staging branch (T001)

Exactly three files differ from `main`:

```
_headers                 (NEW — staging only)
  /*
    X-Robots-Tag: noindex, nofollow

robots.txt               (REPLACED — staging only)
  # STAGING ONLY — do not promote to main
  User-agent: *
  Disallow: /

functions/api/contact.js (one minimal change, promotes cleanly)
  In deliverMessage(), the subject gains the prefix
  "[staging] " iff env.ENVIRONMENT === "staging":
      const subjectPrefix = env.ENVIRONMENT === "staging" ? "[staging] " : "";
      const subject = `${subjectPrefix}Website contact: ...`
  (Production has no ENVIRONMENT variable → prefix is "" →
  byte-identical behavior there.)
```

Everything else on the branch is `main`, verbatim.

## Workflow branch behavior (verified 2026-10-06)

Read directly from `.github/workflows/`:

- **`site-sync.yml`** — `on.push` is restricted to
  `branches: [main]` (paths `blog/posts/**`, `scripts/**`, the
  workflow itself). The 15-minute schedule, `workflow_dispatch`,
  and `repository_dispatch` runs use `actions/checkout` with no
  ref, i.e. the default branch (`main`), and the commit step's
  bare `git push` goes back to that same branch. **It builds and
  commits to `main` only.**
- **`signals-sync.yml`** — hourly schedule + `workflow_dispatch`
  only (no push trigger). Checkout is the default branch
  (`main`); the commit step does `git pull --rebase origin main`
  and `git push origin main` — **hard-coded to `main`.**

Conclusion (spec FR-008): **no bot commits ever land on
`staging`.** The staging branch changes only when a human (or an
agent under instruction) commits or merges to it. Its generated
output is refreshed by merging `main` → `staging`. Corollary
caution: never dispatch either workflow manually from the
`staging` branch — dispatch from `main` only.

## The flows

**Preview a change**

1. Land the change on `staging` (commit, or merge the change
   branch into `staging`; if the change needs current generated
   output, merge `main` → `staging` first, preserving FR-003
   files per the sync caution below).
2. The staging project deploys. Verify at
   https://staging.axiovexsystems.com (T003 checklist).
3. Iterate on `staging` until it passes.

**Promote to production (checklist — FR-004)**

1. `git diff main..staging --stat` — only the intended change
   files may appear.
2. **If `_headers` or `robots.txt` appear: STOP.** Exclude them
   from the merge (checkout `main`'s versions into the merge).
   Their presence in `main` would de-index production.
3. Merge `staging` → `main`; push. Production deploys as today.
4. Post-promotion production checks: apex `robots.txt` allows
   `/`; no `X-Robots-Tag: noindex` response header on
   axiovexsystems.com; the promoted change is live (constitution
   §V live verification).
5. Merge `main` back into `staging` so the branches reconverge.

**Sync staging (refresh generated output)**

1. On `staging`: merge `main`.
2. Conflicts, if any, are expected only around the intentionally
   diverged files. For `robots.txt`, keep staging's version. For
   `_headers`, **combine** (see Risks) — never take one side
   wholesale.
3. Push `staging`; the staging project redeploys.

## Verification strategy (T003, after T002)

- staging.axiovexsystems.com serves the site (200), rendering
  identically to production for shared content.
- Response headers on staging include
  `X-Robots-Tag: noindex, nofollow`; `/robots.txt` on staging is
  the disallow-all staging file.
- The staging contact form renders the **test** Turnstile widget
  (test site key by hostname), a test submission passes the spam
  check and ends at the graceful mail-failure message — and the
  Start mailbox receives **nothing**.
- Production is byte-unchanged by the whole exercise: apex
  serves as before, production `robots.txt` still allows `/`,
  no `noindex` header on the apex, and a production-path check
  of the contact form is unaffected (no `ENVIRONMENT` variable
  exists on the production project).

## Risks / open points

- **Promotion carrying the guard files into `main`** is the one
  way this spec can hurt production (de-indexing). It is
  mitigated by the FR-004 checklist + stop rule, and by the
  staging `robots.txt` carrying its warning as its first line.
  There is no automation guardrail in v1 — the checklist is the
  control, and T005 exists to exercise it once under supervision.
- **`_headers` collision — RESOLVED 2026-10-06 (spec 001 T014)**:
  main now carries a production root `_headers` (the security
  header set: CSP, HSTS, Referrer-Policy, Permissions-Policy,
  X-Content-Type-Options, X-Frame-Options). The guard invariant
  changed accordingly and is now: **the staging `_headers` is
  main's file plus exactly one line — the `X-Robots-Tag:
  noindex, nofollow` guard** — and `robots.txt` remains
  staging-only as before. Promotion proof: `robots.txt` diff
  empty; `_headers` diff = exactly the intended production file
  (no guard line). Sync-back proof: branch diff vs main =
  exactly the guard line + guard `robots.txt` (exercised in the
  spec 001 promotion, merge `7bd2cfb`, guard commit `f1f14e9`).
  One mechanics note from that exercise: the sync back
  fast-forwarded staging to main (main was a descendant), which
  replaced BOTH guard files at once — the guard commit must
  therefore restore the `_headers` line AND the `robots.txt`
  guard together before pushing.
- **Staging content drift**: between syncs, staging's documents
  mirror / blog / Signals snapshot age. That is acceptable for a
  preview surface and is cured by the FR-002 sync; it is not a
  defect.
- **Zone analytics noise**: staging requests count in the
  zone-wide spec 006 totals (FR-007, accepted). If staging
  traffic ever becomes material, the reports call it out by
  hostname; re-scoping the fetcher would be a spec 006 amendment,
  not part of this spec.
