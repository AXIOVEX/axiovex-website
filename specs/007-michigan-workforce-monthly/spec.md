# Feature Specification: Michigan Workforce Monthly Article Series

**Feature Branch**: `007-michigan-workforce-monthly` (documentation +
scheduling — articles themselves are blog content commits to `main`)

**Created**: 2026-10-06

**Status**: **Specified 2026-10-06.** Cadence directed by Tristen
2026-10-06 (gate T001 satisfied by that direction). Skill written,
draft + publish schedules live; **no cycle has executed yet** — the
first cycle is October 2026 (tasks T-OCT-* in tasks.md). Each article
still passes its own approval gate (FR-004) before anything publishes
or posts.

**Amendment — 2026-10-06 (Tristen's direction, same day)**: the
series now includes the real **study-execution pipeline** (FR-009):
each cycle executes the workforce study in
`AXIOVEX/michigan-workforce-intelligence` (pull → collect/run →
edition → publish → push back → verify), and the article's insights
are derived from the study's outputs. The normative blog file
format is specified in **`blog-format.md`** in this package. A full
**test run** of the pipeline was executed 2026-10-06, producing a
format-validated test article that was **not** published (outcome
recorded in tasks.md, T006–T010).

**Direction (Tristen, 2026-10-06)**: once per month near mid-month,
publish a Michigan workforce data blog article matching the
presentation and feel of the first one (2026-09-30); then determine
the best time to share it on his **personal** LinkedIn page and post
it there, **link in the first comment**; then re-share the post from
the **Axiovex Systems** company page at the appropriate later time;
use tags as appropriate; release everything on the most optimal days
and times toward the center of the month (not mechanically the 15th —
e.g., Tuesday mornings). Document it in spec-kit + AEE and as a skill.

## What this adds

A recurring monthly content series on the Axiovex website blog:
**"Michigan's \<Month\> workforce data: what the numbers say, and what
they don't"** — a data-grounded reading of the newest Michigan labor
figures, in the format and voice of the model article
(`blog/posts/2026-09-30-michigan-workforce-september-findings.md`),
followed by a two-step LinkedIn distribution (personal first, company
re-share second). Execution is defined by the runbook skill at
`~/workspace/skills/michigan-workforce-monthly/SKILL.md`; schedules
live under goal `website-seo-aeo-health-monitoring` alongside the
spec 006 reporting jobs.

**Series ordering rule (Tristen, 2026-10-06)**: for this series the
**personal profile posts first** and the company page **re-shares
afterward**. This supersedes the 2026-09-30 launch pattern (company
page posted first) for this series only; other Axiovex LinkedIn
activity is unaffected.

## The date rule (normative)

- **Publish Day** = the **Tuesday nearest the 15th** of the month;
  if two Tuesdays are equidistant, the **earlier** Tuesday wins.
- Article live **~09:00 ET** on Publish Day.
- **Personal LinkedIn post** the same Tuesday **~10:30 ET**.
- **Company page re-share** the **Thursday of the same week ~09:30 ET**.
- All weekdays are verified with `date -d` when a cycle is planned —
  never computed by counting in one's head.

First cycles under this rule (weekdays verified 2026-10-06):

| Cycle | Draft presented | Publish Day | Personal post | Company re-share |
|-------|-----------------|-------------|---------------|------------------|
| Oct 2026 | Thu Oct 8 | **Tue Oct 13** | Tue Oct 13 ~10:30 ET | Thu Oct 15 ~09:30 ET |
| Nov 2026 | Sun Nov 8 | **Tue Nov 10** | Tue Nov 10 ~10:30 ET | Thu Nov 12 ~09:30 ET |
| Dec 2026 | Tue Dec 8 | **Tue Dec 15** | Tue Dec 15 ~10:30 ET | Thu Dec 17 ~09:30 ET |

Rationale: Tuesday–Thursday mornings are the strongest LinkedIn
engagement windows; anchoring to the Tuesday nearest mid-month keeps
every step inside that window instead of scattering across weekends
when the 15th falls badly.

## Functional requirements

- **FR-001 — Monthly cadence + date rule.** One article per month,
  published per the date rule above (Publish Tuesday ~09:00 ET;
  personal post same day ~10:30 ET; company re-share that Thursday
  ~09:30 ET). The cadence runs indefinitely until Tristen changes or
  stops it. Months are never silently skipped: a missed cycle is
  reported as missed, with the reason (see FR-008).
- **FR-002 — Data sourcing.** Figures come from exactly two source
  families, cited in the article. The article's **insights are
  derived from the executed study's outputs** (FR-009) — the current
  edition's executive brief, evidence ledger, and recommendations —
  not assembled from raw BLS numbers alone; the BLS readings below
  are the study's inputs and cross-checks, and are cited as such.
  1. **BLS public API** (no key), the series already used by Michigan
     Pulse (spec 004): MI manufacturing employment
     `SMU26000003000000001`, MI unemployment rate
     `LASST260000000000003`, MI labor force
     `LASST260000000000006`, MI total nonfarm employment
     `SMU26000000000000001` — newest released reference month, with
     month-over-month and year-over-year context where the series
     support it.
  2. **New editions of `AXIOVEX/michigan-workforce-intelligence`**
     (local clone `~/workspace/michigan-workforce-intelligence`) when
     a new edition exists for the cycle — its findings, decisions,
     and worked examples anchor the article, as in the model article.
  Every figure is traceable to one of these sources; **no statistic
  is invented, interpolated, or carried forward as current**
  (constitution §I). Months BLS has not yet released are shown as
  gaps, never filled. When no new research edition exists, the
  article is written from the BLS data alone and says the research
  edition is pending — it does not repackage the prior edition as
  new.
- **FR-003 — Article format parity.** Each article matches the model
  article's structure and voice. The normative file-level format —
  filename, front matter, body structure, markdown subset, citation
  rules, validation checklist — is the **Blog Article File Format
  specification (`blog-format.md`, this package)**; every draft and
  publish candidate is validated against it:
  - Front matter per `blog/README.md` (title, date = Publish Day,
    description, tags `workforce, michigan, research, AI, education`,
    slug `michigan-workforce-<month>-<year>`).
  - Title pattern: "Michigan's \<Month\> workforce data: what the
    numbers say, and what they don't."
  - Opening paragraph framing the newest data; **evidence cutoff
    line** (date, America/Detroit) naming the sources used.
  - A lead analysis section in the spirit of "The rate is not the
    story": the headline figure is the least interesting part; what
    it conceals (participation, composition, vintage) is the story.
  - A "warning signals, not forecasts" treatment of soft indicators —
    restraint is a defining feature of the series.
  - A decisions section: concrete implications for education and
    industry, each resisting a lazy reading.
  - A method/pipeline note: how the numbers were produced and
    verified, with links to the public research repo and, when used,
    the edition/release.
  - First-person founder voice; plain English; no claims beyond the
    cited evidence.
- **FR-004 — Approval gate (blocking).** A draft is prepared and
  presented to Tristen around the 8th of the month (see plan.md).
  **Nothing publishes and nothing posts without Tristen's explicit
  approval of that month's draft.** Edits he requests are folded in
  and re-presented if substantive. If approval has not arrived by
  Publish Day, nothing goes out and Tristen is pinged in the
  delivery chat — the cycle waits for him; it never self-approves.
- **FR-005 — Personal LinkedIn post.** On Publish Day ~10:30 ET,
  after the article is verified live (FR-007), a post is published
  from **Tristen's personal LinkedIn profile** via the signed-in
  browser:
  - Post body carries **no link** and ends with "Link in the first
    comment."
  - The **article URL is the first comment** on the post.
  - Hashtags at the end of the body, from the established set:
    `#Michigan #WorkforceDevelopment #Manufacturing #LaborMarket #AI`
    (adjust only if the month's angle genuinely warrants it, and say
    so in the cycle report).
  - The post text is part of the approved draft package (FR-004) —
    it is drafted alongside the article, not improvised at post time.
  - The post URL is captured and verified (author = Tristen Pierson;
    first comment present with the correct URL).
  - **Investor-protection rule holds**: this series post is a normal
    content post; it makes no change to profile structure, headline,
    or About, and includes no Axiovex announcement framing beyond
    the article itself.
- **FR-006 — Company re-share.** On the Thursday of Publish Week
  ~09:30 ET, the **Axiovex Systems company page** re-shares Tristen's
  personal post (LinkedIn re-share of the original post, not a new
  standalone post and not a duplicate of the link). A one-line
  framing comment from the page is permitted if it adds context;
  the shared post must carry through to the original (author and
  first-comment link intact). The re-share is verified on the
  company page feed and its URL captured.
- **FR-007 — Verification + reporting.** Before the personal post:
  the article URL returns HTTP 200, the article appears on the blog
  index, and it is present in `sitemap.xml`. After each step
  (publish, personal post, re-share) the result is verified, not
  assumed. Each cycle ends with a report to Tristen in the delivery
  chat (chat `5cc14312-a580-4d86-ab88-b862cb295c29`): article URL,
  personal post URL, re-share URL, the dates/times actually used,
  and any deviation from the date rule with its reason. Cycle state
  (draft path, approval, URLs, dates) is recorded in
  `~/workspace/goals/website-seo-aeo-health-monitoring/hidden_files/workforce-monthly-state.json`.
- **FR-008 — Failure handling.**
  - **BLS data not yet released** for the newest reference month by
    Publish Day: shift the publish (and both LinkedIn steps, keeping
    their relative order and times) to the next day **within the
    same week**, and say so in the cycle report. If the data is
    still unavailable by that Friday, either draft from the latest
    available reference month (labeled as such in the article and
    the report) or hold the cycle — Tristen's call, asked once.
  - **Approval missing** (FR-004): publish nothing, post nothing,
    ping Tristen. No partial execution.
  - **LinkedIn/browser failure** at either step: the article stays
    live; the failed step is reported the same day with the exact
    blocker; retry once the next morning; **never double-post** —
    before any retry, check whether the post/re-share already
    exists.
  - **Build/deploy failure**: the article commit is not reported as
    published until FR-007 verification passes; fix forward per the
    site runbooks and report.
- **FR-009 — Study execution (the workforce study itself).** The
  article is the *output* of executing the study in
  `AXIOVEX/michigan-workforce-intelligence` (local clone
  `~/workspace/michigan-workforce-intelligence`). Each cycle's draft
  step executes this pipeline, in order, following the research
  repo's own governance (`docs/report-operations.md` in that repo):
  1. **Pull**: `git pull --ff-only` the research repo's `main`;
     record the HEAD SHA in the cycle state.
  2. **Collect / run**: refresh the study's evidence per the repo's
     documented process. The canonical local path is Docker-based:
     `python3 scripts/reports.py build-image`,
     `python3 scripts/reports.py collect` (plus the reviewed
     vintage-specific collectors when their periods are updated),
     `python3 scripts/reports.py analyze`,
     `python3 scripts/reports.py build` → `output/pdf/<version>/`.
     Where Docker is unavailable, that leg is recorded as **not
     run, with the reason** — never silently skipped and never
     replaced by unlabeled ad-hoc numbers (direct API readings are
     labeled readings, not ingested evidence).
  3. **New edition (when the data supports one)**: research current
     official sources (Michigan MCDA/LEO, BLS, Census, NCES/IPEDS,
     O*NET) and write the edition under
     `reports/<YYYY-MM-DD>-<slug>/` in the established layout
     (executive brief, economic analysis, evidence, observations,
     source registry, append-only research ledger), run
     `python3 scripts/reviewed_evidence.py --record` then
     `python3 scripts/reviewed_evidence.py` to verify it, and point
     `reports/current-edition.json` at it. **An edition is a claim
     about new evidence**: if the newest Michigan reference month
     has not advanced since the current edition (state LAUS
     unreleased), NO new edition is produced — the cycle works from
     the current verified edition and the article says so
     (repackaging the prior edition as new is an FR-002 violation).
  4. **Publish + push back**: commit the edition sources to the
     research repo's `main` and push; then publish via the repo's
     documented release path (spec 010 there):
     `python3 scripts/release_request.py prepare --version
     YYYY.MM.DD.HHMMSSZ`, commit **only** `release/request.json`,
     push — the *Reviewed workforce reports* workflow builds and
     publishes release `reports-<version>` (or
     `python3 scripts/reports.py release` with authenticated `gh`).
     Ordinary commits never publish; a release publishes exactly
     its reviewed source commit.
  5. **Verify the study outputs**: `python3
     scripts/reviewed_evidence.py` passes for the current edition
     (sources / observations / ledger chain), and the release's
     assets verify — `gh release download reports-<version>` +
     `sha256sum -c SHA256SUMS.txt` (downloadable assets and ZIP
     members) + `manifest.json` version and `source_commit` match.
     Verification results are recorded in the cycle state.
  6. **Insights from outputs**: the article is drafted from the
     verified outputs of steps 1–5 — the current edition's
     executive brief, evidence ledger, and recommendations, plus
     any genuinely new official dataset since the edition's
     cutoff, cited as such (FR-002).
  - **Blockers are first-class results.** A leg that cannot run
    (Docker absent, data unreleased, credentials) is recorded in
    the cycle state and reported in the cycle report with the exact
    reason, and the article's pipeline note discloses it — the
    study is never described as having run a leg it did not run.
  - **Test run (2026-10-06)**: the pipeline was executed end to end
    as far as the environment and data allow — pull OK
    (`e15b810`); edition + release verification OK (28 sources,
    187 observations, ledger valid; September release checksums all
    matched); collect/build leg blocked (no Docker runtime on the
    workstation); new edition blocked (newest Michigan reference
    month still August 2026 — September state LAUS unreleased);
    publish leg not executed (no new reviewed sources; a duplicate
    release of identical sources was deliberately not created). A
    test article was produced from the verified outputs and
    validated against `blog-format.md` — **not published**. Full
    record: tasks.md T006–T010.

## Out of scope

- Publishing or posting anything for the October cycle as part of
  this spec's build-out (documentation + scheduling only; the cycle
  itself runs under the schedules in plan.md).
- Any website UX change — articles are content commits through the
  existing static build; no wireframe cycle is triggered.
- Other LinkedIn content (company-page original posts, the spec 006
  report emails, profile changes) — governed by their own rules.
- New data sources beyond FR-002 without a spec amendment.
