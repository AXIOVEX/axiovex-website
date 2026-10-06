# Tasks: Staging Environment (spec 010)

Approved by owner direction 2026-10-06 (Tristen: "also add a
staging domain for both sites so we can publish on staging
before production"). No wireframe gate applies — infrastructure,
not a production UX change (spec.md records why, constitution
§III). T001 is executed by the agent preparing this package;
T002 belongs to the parent task (browser work in Cloudflare);
T004's documentation updates are handled in the parent thread.

## Preparation

- [ ] T001 **Spec package + staging branch prep.** Write
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

- [ ] T002 **Pages project + custom domain + variables
  (parent, browser).** In the Axiovex Cloudflare account create
  the Pages project `axiovex-website-staging` per plan.md:
  production branch `staging`, no build command, output = repo
  root; add the custom domain `staging.axiovexsystems.com`; set
  `TURNSTILE_SECRET_KEY` to Cloudflare's published always-pass
  test secret and the plain variable `ENVIRONMENT=staging`;
  set **no** Graph variables. Production project untouched.
  **Blocks T003.**

## Verification

- [ ] T003 **Staging verification (after T002).** Confirm at
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

- [ ] T004 **Docs close-out — EXTERNAL (parent thread).** The
  operations skill and the website-health runbook are updated in
  the parent thread (staging topology, change/promote/sync
  flows, the FR-004 promotion stop rule, checker scoping), and
  T001's checkbox + this spec's status line are finalized there.
  Nothing in this task is executed by the preparing agent.

## First exercise (optional)

- [ ] T005 **Promotion-flow first exercise (optional).** Run one
  real change through the full flow under supervision — land on
  `staging`, verify per T003, promote per the plan.md checklist
  (including the diff review and the `_headers`/`robots.txt`
  stop rule), verify production, merge `main` back into
  `staging` — to prove FR-002/FR-004 end to end. A suitable first
  passenger is the FR-006 subject-prefix change itself, which is
  already staged on the branch and is a production no-op.
