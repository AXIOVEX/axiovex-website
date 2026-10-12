# Spec 023 amendment 2026-10-12 (anti-tally panel) — production promotion record

**Date:** 2026-10-12. **Owner approval:** Tristen approved the exact copy + staging screenshots, then instructed "Promote the new panel to production" (2026-10-12).

## Promotion mechanics (spec 018/023 pattern)

- Pre-promotion tips: `origin/main` = `074ce2b` (production, guards verified good: robots.txt Allow version; `_headers` X-Robots-Tag count 0); `origin/staging` = `07d26aa`. `origin/main` was an ancestor of staging, so the fast-forward was clean; the full main-vs-staging diff was exactly the 10 expected files (panel change + spec records + the two guard files).
- `main` fast-forwarded to staging tip `07d26aa`, then guard restore committed as **`ca91275`** ("restore production robots.txt/_headers after staging fast-forward"): both files byte-identical to pre-promotion production `074ce2b`. Pushed: `origin/main` = `ca91275`. Net diff vs previous production = the 8 content files only; net guard diff = empty.
- Staging re-synced from main; as the standing lesson predicts, the sync merge resolved staging's guard files to production's versions, so staging guards were re-asserted from the pre-merge staging tip (commit `b1014ce`) and pushed: `origin/staging` = `b1014ce`.

## Guard verification (pushed tips, read back from origin)

| Branch | robots.txt | `_headers` X-Robots-Tag |
|---|---|---|
| main `ca91275` | `User-agent: * / Allow: /` + sitemap line | 0 lines |
| staging `b1014ce` | `# STAGING ONLY` + `Disallow: /` | 1 line (present) |

Production never carried the staging guards at any pushed state: the only main push was `ca91275`, whose tree was verified guard-clean before pushing.

## Live production checks (curl, https://axiovexsystems.com, post-deploy)

- `/research/` → HTTP 200; deploy already landed on first poll.
- New panel present, each matched exactly once in the served HTML: heading "What the program has learned so far"; "depends on its coherences staying intact"; "holds exactly in the model"; "provably not the same operation"; "repairs the failure instead of deepening it"; "stands unjudged, not falsified"; "waiting on a laboratory partner".
- Old tally text, 0 matches each: "registered studies run", "claims confirmed", "claims falsified", old heading "Where this program stands".
- Page `<meta name="robots" content="noindex">` present; live `/research/` response headers carry **no** X-Robots-Tag; live `/robots.txt` is the Allow version; live `sitemap.xml` contains 0 research URLs.
- Homepage spot-check: HTTP 200, title "Axiovex Systems | AI Consulting, Training & Engineering" — unchanged.

## Visual verification — evidence route (stated plainly)

Local Playwright cannot reach public sites from this VM (CONNECT proxy tunnel failure — standing environment limit), so the evidence is split, as in the original spec 023 promotion:

- **Live content truth:** the curl checks above, run against the live production URLs.
- **Layout:** Playwright screenshots of the production tree (`main` @ `ca91275`, the exact tree production serves) served locally — `research-desktop-full.png`, `research-desktop-panel.png`, `research-mobile-full.png`, `research-mobile-panel.png` in this directory. The locally served `research/index.html` was diffed against the live-fetched HTML: the only differences are Cloudflare edge transformations (email-protection obfuscation + its decode script), so the local render is layout-faithful. Panel text was additionally asserted present in the rendered DOM at both widths (1280 / 390). Desktop: bordered panel in WF-18 position, five statements clean. Mobile: single column, clean stacking; the fixed nav / Signals widget overlap the mobile *element crop* only (capture artifact, already documented in the staging verification; the full-page capture shows the panel unobstructed).
