# Plan: Axiovex Systems Website — Baseline (as built)

**Spec**: specs/001-axiovex-website/spec.md

## Architecture

- Static site on Cloudflare Pages (project `axiovex-website`), source of
  truth this repository (AXIOVEX/axiovex-website, public).
- Generator: `scripts/build-site.mjs` (Node, no dependencies,
  byte-deterministic) — documents mirror, static blog, sitemap.
- Content sources: page templates in `scripts/templates/`; blog posts as
  front-matter markdown in `blog/posts/`; documents mirrored from
  AXIOVEX/shared-documents per its `docs.json`.
- Automation: `.github/workflows/site-sync.yml` (push triggers,
  repository_dispatch `shared-docs-updated`, 15-minute HEAD poll with
  early-exit), committing as github-actions[bot].
- Styles: versioned stylesheets (`styles.v20.css`, `blog/blog.v9.css`)
  for cache-busting per constitution §IV.
- Monitoring: AEO (check.aeojs.org) + Seobility per
  `~/workspace/system/website-health/RUNBOOK.md`; weekly cron + on-push
  hook with 12h cooldown; safe fixes auto-applied.

## Design

- Wireframes: `docs/wireframes/` (WF-01..09, G1..G4), approved 2026-10-04.
- Redesign: structure and rhythm per the approved wireframe set,
  Axiovex palette and centered axis (commit 7102f67).
