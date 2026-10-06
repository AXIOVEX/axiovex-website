# Plan: Michigan Workforce Monthly Article Series (spec 007)

## Study execution pipeline (FR-009, added 2026-10-06)

The draft step does not merely "check for a new edition" — it
**executes the study** in `~/workspace/michigan-workforce-intelligence`
(GitHub `AXIOVEX/michigan-workforce-intelligence`), whose own
operations doc (`docs/report-operations.md` there) is the governing
procedure. Exact sequence:

```sh
cd ~/workspace/michigan-workforce-intelligence
git pull --ff-only origin main            # record HEAD SHA in cycle state

# Pipeline A — evidence refresh (Docker; canonical local gate)
python3 scripts/reports.py build-image
python3 scripts/reports.py collect        # BLS monthly series -> audited evidence
python3 scripts/reports.py analyze        # ledger + artifact-hash checks (read-only)
python3 scripts/reports.py build          # -> output/pdf/<version>/ (PDFs, manifest, checksums, ZIP)
# vintage collectors (collect-qcew / collect-reference /
# collect-comparisons / collect-hardship) only after period review

# Pipeline B — reviewed research edition (the monthly edition path)
#   research official sources -> write reports/<YYYY-MM-DD>-<slug>/
#   (executive brief, analysis, evidence/, observations.json,
#    source-registry.json, research-ledger.jsonl)
python3 scripts/reviewed_evidence.py --record   # append ledger events
python3 scripts/reviewed_evidence.py            # verify edition + ledger chain
#   update reports/current-edition.json -> commit edition to main -> push

# Publish (research-repo spec 010 connector path)
python3 scripts/release_request.py prepare --version YYYY.MM.DD.HHMMSSZ
#   commit ONLY release/request.json -> push -> "Reviewed workforce
#   reports" workflow publishes release reports-<version>

# Verify the published outputs
gh release download reports-<version> --repo AXIOVEX/michigan-workforce-intelligence
sha256sum -c SHA256SUMS.txt               # assets + ZIP members
#   manifest.json: version + source_commit must match the request
```

Then the article is drafted **from the verified study outputs**
(edition brief / ledger / recommendations, plus any genuinely new
official dataset since the edition cutoff), in the format specified
by `blog-format.md` (this package), and validated against that
spec's checklist before presentation.

**Test run 2026-10-06 (recorded in tasks.md T006–T010)**: pull OK
(`e15b810`); edition verification OK (28 sources, 187 observations,
ledger valid, head `87afe0b2…`); September release
(`reports-2026.09.27.131143Z`, workflow run `36321581479`) assets
re-verified — all checksums matched, manifest source commit
`d0fbc71`. Pipeline A blocked (no Docker runtime on the
workstation); new edition blocked (BLS: newest Michigan reference
month still August 2026 — September LAUS unreleased); publish leg
not executed (nothing new to publish; no duplicate release
created). Test article produced + format-validated, not published.

## Architecture

```
BLS public API (4 MI series) ──────┐
michigan-workforce-intelligence ───┤
  (new edition, when available)    │
                                   ▼
        DRAFT job — monthly, day 8 ~09:00 ET
        pull data → draft article + LinkedIn post text
        → save draft → present to Tristen
                                   │
                        ┌──────────▼──────────┐
                        │  APPROVAL GATE      │  (FR-004 — blocking;
                        │  Tristen approves   │   nothing proceeds
                        │  the draft          │   without it)
                        └──────────┬──────────┘
                                   ▼
        PUBLISH job — monthly, day 12 ~08:45 ET
        computes this month's Publish Tuesday;
        if today isn't it → self-schedules a one-time
        run for that Tuesday 08:45 ET and stops
                                   │  (on Publish Tuesday)
                                   ▼
        commit article → build/deploy → verify live
        (200 + blog index + sitemap)         ~09:00 ET
                                   │
                                   ▼
        personal LinkedIn post via signed-in browser
        (no link in body; URL = first comment;    ~10:30 ET
         hashtags; verify; capture post URL)
                                   │
                                   ▼
        one-time RESHARE job — that Thursday ~09:30 ET
        Axiovex Systems company page re-shares the
        personal post → verify → cycle report to Tristen
```

## Components

1. **Runbook skill** (the execution contract):
   `~/workspace/skills/michigan-workforce-monthly/SKILL.md` — date
   computation, data pull, drafting in the model format, approval
   gate, publish + verify, personal post, company re-share,
   reporting, state tracking, failure handling. The cron bodies point
   at the skill; the skill points back at this spec.
2. **Schedules** (owner `goal:website-seo-aeo-health-monitoring`,
   delivery chat `5cc14312-a580-4d86-ab88-b862cb295c29`):
   - `michigan-workforce-draft` — monthly, day 8, ~09:00 ET. Drafts
     only; never publishes.
   - `michigan-workforce-publish` — monthly, day 12, ~08:45 ET.
     Self-rescheduling pattern: the cron system has no
     "nth-weekday / nearest-Tuesday" schedule kind, so the recurring
     job fires on a fixed day — the 12th, which is on or before every
     possible Publish Tuesday (the Tuesday nearest the 15th always
     falls between the 12th and the 18th) — and its instructions
     implement the date rule: compute the
     Publish Tuesday; if today is not that Tuesday, create a one-time
     run of the publish step for that Tuesday 08:45 ET and stop.
     On the Tuesday it executes publish → post → schedules the
     Thursday re-share one-off.
   - One-time reshare jobs are created per cycle by the publish run
     (id pattern `michigan-workforce-reshare-<yyyy-mm>`), Thursday of
     Publish Week ~09:30 ET.
3. **Drafts**: saved to
   `~/workspace/goals/website-seo-aeo-health-monitoring/files/workforce-drafts/michigan-workforce-<yyyy-mm>-draft.md`
   (article + proposed LinkedIn post text in one package), presented
   to Tristen in the delivery chat for the FR-004 approval.
4. **Publish path**: the approved article file is committed to
   `~/workspace/axiovex-website/blog/posts/` on `main` (git identity
   tbitcs) — the existing `site-sync` Action rebuilds and Cloudflare
   Pages deploys; verification per FR-007 before any LinkedIn step.
5. **LinkedIn steps**: signed-in browser tasks from the publish /
   reshare runs (no LinkedIn connector exists). Personal profile
   first (FR-005), company page re-share second (FR-006) — the
   series ordering rule.
6. **State**: `hidden_files/workforce-monthly-state.json` under the
   monitoring goal — one record per cycle: publish dates computed,
   draft path, approval timestamp, article URL, post URL, reshare
   URL, deviations. Read at the start of every run so steps never
   duplicate.

## Verification strategy

- Spec build (this package) is verified by: weekdays for the Oct /
  Nov / Dec 2026 cycles checked with `date -d`; cron `next_run_local`
  values checked after creation; skill cross-read against the model
  article and this spec.
- Per cycle: FR-007 verification gates each external step; a step is
  reported done only from its verified URL, never from a click.

## Known gaps / risks

- **No nth-weekday cron kind**: the date rule is implemented by the
  day-12 job + self-scheduled one-off (above). If a one-off creation
  fails inside a run, the run must report it loudly — a silent miss
  would skip the cycle (FR-001/FR-008).
- **BLS release timing**: state labor data for a reference month
  typically lands mid-to-late the following month; the newest
  *available* reference month is what the article covers (FR-002),
  and FR-008 covers the not-yet-released case.
- **LinkedIn via browser** is session-dependent; a signed-out
  browser at post time is an FR-008 failure (report + next-morning
  retry), never a reason to post from the wrong account.
