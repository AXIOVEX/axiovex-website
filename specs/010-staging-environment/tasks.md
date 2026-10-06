# Tasks: Staging Environment (spec 010)

Approved by owner direction 2026-10-06 (Tristen: "also add a
staging domain for both sites so we can publish on staging
before production"). No wireframe gate applies — infrastructure,
not a production UX change (spec.md records why, constitution
§III). T001 is executed by the agent preparing this package;
T002 belongs to the parent task (Cloudflare work — executed
via the Cloudflare API under the API-first directive, not the
browser; the browser wording in the original text is corrected
in this close-out);
T004's documentation updates are handled in the parent thread.

## Preparation

- [x] T001 **Spec package + staging branch prep.** — **DONE
  2026-10-06**: package written on `main` (`bf7a143`); staging
  branch created; staging-only commits `7a6c132` (guard files)
  + `cd0493f` (FR-006 prefix); diff vs `main` was exactly the
  three intended files. Write
  `specs/010-staging-environment/` (spec.md, plan.md, tasks.md,
  aee-claims.json) on `main`. Create the long-lived `staging`
  branch from `main` and push it. On `staging` only, commit:
  (a) root `_headers` with the `/*` `X-Robots-Tag: noindex,
  nofollow` rule; (b) `robots.txt` replaced with the staging
  disallow-all version headed `# STAGING ONLY — do not promote
  to main`; (c) the `functions/api/contact.js` subject-prefix
  change (`[staging] ` iff `env.ENVIRONMENT === "staging"`,
  production no-op), syntax-checked with `node --check`. Push
  `staging`. Verify `git diff main..staging --stat` shows only
  `_headers`, `robots.txt`, and `functions/api/contact.js`, and
  that `main` carries no production-file changes. (Completion is
  recorded in the preparing agent's report; this box is checked
  at the T004 close-out so the checked state itself never enters
  the `main..staging` diff.)

## Cloudflare (parent task)

- [x] T002 **Pages project + custom domain + variables
  (parent — executed via the Cloudflare API).** — **DONE
  2026-10-06 via the cf-ops CLI / Cloudflare API** (the
  API-first directive superseded this task's original browser
  route before execution): project `axiovex-website-staging`
  created (production branch `staging`, no build command,
  output = repo root); custom domain
  `staging.axiovexsystems.com` attached (active); DNS CNAME
  created; `ENVIRONMENT=staging` + the always-pass test secret
  set in both environments; **no** Graph variables.
  Production project untouched. In the Axiovex Cloudflare account create
  the Pages project `axiovex-website-staging` per plan.md:
  production branch `staging`, no build command, output = repo
  root; add the custom domain `staging.axiovexsystems.com`; set
  `TURNSTILE_SECRET_KEY` to Cloudflare's published always-pass
  test secret and the plain variable `ENVIRONMENT=staging`;
  set **no** Graph variables. Production project untouched.
  **Blocks T003.**

## Verification

- [x] T003 **Staging verification (after T002).** — **DONE
  2026-10-06**: staging serves 200 with
  `X-Robots-Tag: noindex, nofollow` and the disallow-all
  staging `robots.txt`; shared content renders as production.
  Contact form: the interactive Playwright submission could
  not run from the agent sandbox (its Chromium cannot open
  the egress tunnel — `ERR_TUNNEL_CONNECTION_FAILED` under
  direct, env-proxy, and tunnel-proxy configurations), so the
  chain was verified server-side instead. That surfaced a
  real defect: the staging project's `TURNSTILE_SECRET_KEY`
  held an **empty value** (the key existed; the secret did
  not), so submissions failed closed with the 500
  "not configured" message. Root cause: secret values cannot
  round-trip through the Pages API (GET returns them empty),
  so any GET-merge-PATCH that rewrites both environments —
  including cf.mjs `pages set-env` used once per environment —
  clobbers the sibling environment's secret with the empty
  read-back. Repaired 2026-10-06 with a single PATCH writing
  the test secret into **both** environments at once, then a
  redeploy. After the repair: a POST to the staging
  deployment returns the designed behavior — Siteverify
  passes via the test secret and delivery ends at the
  graceful **502 fallback** ("We could not deliver your
  message right now. Please try again or email us
  instead."), and nothing is delivered anywhere (no Graph
  variables exist on the project). Note: through the custom
  domain the zone serves the same 502 status with
  Cloudflare's plain error body in place of the function's
  JSON. Production was byte-unchanged throughout: apex
  `robots.txt` allows `/`, no `noindex` header on the apex. Confirm at
  https://staging.axiovexsystems.com: the site serves and
  renders as production does for shared content; responses carry
  `X-Robots-Tag: noindex, nofollow`; staging `/robots.txt` is
  the disallow-all staging file; the contact form shows the test
  Turnstile widget, a test submission passes the spam check and
  ends at the graceful mail-failure fallback, and the Start
  mailbox receives nothing. Confirm production is byte-unchanged
  by the exercise: apex `robots.txt` still allows `/`, no
  `noindex` header on axiovexsystems.com, production form
  behavior unaffected (constitution §V).

## Documentation

- [x] T004 **Docs close-out — EXTERNAL (parent thread).** —
  **DONE 2026-10-06**: the `axiovex-management` skill +
  references carry the staging topology, the change /
  promote / sync flows, the FR-004 stop rule, and checker
  scoping; T001's checkbox is finalized in this close-out. The
  operations skill and the website-health runbook are updated in
  the parent thread (staging topology, change/promote/sync
  flows, the FR-004 promotion stop rule, checker scoping), and
  T001's checkbox + this spec's status line are finalized there.
  Nothing in this task is executed by the preparing agent.

## First exercise (optional)

- [x] T005 **Promotion-flow first exercise (optional).** —
  **EXERCISED 2026-10-06**: the specs 011 + 012 promotion
  (merge `89c65c1`) ran the full flow under the FR-004
  checklist — diff reviewed first, guard files excluded
  (post-merge `git diff origin/main..HEAD -- robots.txt
  _headers` empty), production verified, `main` merged back
  to `staging`. One mechanics lesson recorded in the
  close-out: because the promotion merge makes `main` a
  descendant of `staging`, the sync back fast-forwards and
  would drop the guard files — they were re-applied in a
  dedicated commit (`223f90a`) before the push, so
  `origin/staging` never carried an unguarded tree.
  **INVARIANT UPDATED 2026-10-06 (spec 001 T014):** main now
  carries a production `_headers` (security header set), so
  the guard rule for `_headers` is no longer "file must not
  reach main" but "staging's file = main's file + exactly the
  `X-Robots-Tag: noindex, nofollow` line"; the `robots.txt`
  rule is unchanged. See plan.md Risks (resolved bullet) and
  specs/001 tasks.md T014 for the exercised proofs. Run one
  real change through the full flow under supervision — land on
  `staging`, verify per T003, promote per the plan.md checklist
  (including the diff review and the `_headers`/`robots.txt`
  stop rule), verify production, merge `main` back into
  `staging` — to prove FR-002/FR-004 end to end. A suitable first
  passenger is the FR-006 subject-prefix change itself, which is
  already staged on the branch and is a production no-op.
