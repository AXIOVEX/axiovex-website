# Plan: Spec 018 — Hook-First Hero

1. **Docs on `main`** (this package + wireframes): spec.md /
   plan.md / tasks.md; `docs/wireframes/wireframes.html` hero copy
   updated on WF-01 (desktop), WF-02 (mobile), WF-07 (tablet);
   revision-log entry in `docs/wireframes/wireframes.md`; review
   copy at `~/workspace/your_files/axiovex-wireframes/wireframes.html`
   re-synced byte-identically. Commit + push `main`. The approval
   gate (tasks.md T001) is already satisfied by the owner's
   recorded 2026-10-07 decision — no separate wireframe approval
   round: the owner picked the exact copy.
2. **Staging sync**: in a staging worktree, merge `origin/main`
   into `staging` per spec 010 FR-004 discipline, preserving the
   staging guards (`robots.txt` Disallow version; `_headers` =
   production security-headers file + exactly the
   `X-Robots-Tag: noindex, nofollow` line). Verify the guards
   after the merge.
3. **Implement**: edit the hero H1 + lede in `index.html`
   verbatim (index.html is hand-authored; the generator does not
   own the hero). Run `scripts/build-site.mjs` only if the repo
   pattern requires it, and confirm any diff stays scoped to the
   hero.
4. **Push `staging`**; wait for the Pages deploy; verify live on
   staging.axiovexsystems.com (200, new H1 present,
   `x-robots-tag` noindex intact).
5. **Screenshot verification**: Playwright against the locally
   served committed staging build (the sandbox browser cannot
   reach the staging host through the proxy) at desktop 1440 +
   mobile 390 — hero styled, H1 wraps cleanly, no horizontal
   overflow, centered layout intact. Screenshots saved to
   `~/workspace/your_files/spec018-review/`.
6. **Record + stop**: update tasks.md with the staging commit and
   verification evidence. **Owner gate (T006)** — Tristen reviews
   the hero on staging. Promotion (T007) is a separate later step
   under his direction; production stays untouched in this spec's
   implementation pass.
