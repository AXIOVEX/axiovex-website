# Blog Article File Format — Normative Specification

**Applies to**: every article published to the Axiovex Systems blog,
and normatively to the Michigan Workforce Monthly series
(spec 007, FR-003/FR-009). **Status**: normative from 2026-10-06.

**Sources of truth this spec codifies** (in case of conflict, the
generator's behavior wins and this spec must be corrected):
- `blog/README.md` (authoring guide)
- `scripts/build-site.mjs` → `parsePost()` (front matter parsing) and
  `buildBlog()` (rendering, ordering, feeds)
- The model article
  `blog/posts/2026-09-30-michigan-workforce-september-findings.md`

## 1. File location and filename

- Published articles live in `blog/posts/` in the website repo.
- Drafts (including test drafts) live outside the repo until the
  publish step; a draft file uses the identical format so it can be
  validated against this spec and later moved into `blog/posts/`
  unchanged.
- **Filename pattern** (REQUIRED):
  `YYYY-MM-DD-<slug>.md`
  - `YYYY-MM-DD` = the article's publish date (for this series, the
    Publish Day per spec 007's date rule). It MUST equal the
    front-matter `date` field.
  - `<slug>` MUST equal the front-matter `slug` field, character for
    character.
  - Extension is lowercase `.md`.
- Rationale: the generator falls back to deriving the slug from the
  filename (stripping the date prefix) when front matter omits it.
  The series does not rely on the fallback; both are always present
  and always agree, so a file is valid under either reading.

## 2. Front matter

- The file MUST begin with a front-matter block: a first line
  containing exactly `---`, one `key: value` line per field, and a
  closing line containing exactly `---`. The generator requires
  this block (it throws `missing front matter` without it) and
  parses keys matching `[A-Za-z]+` with single-line values.
- Fields, in the canonical order:

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string, single line | YES | The article's full title. The page template renders it as the H1; the body MUST NOT repeat it. For this series, the pattern is `Michigan's <Month> workforce data: what the numbers say, and what they don't`, where `<Month>` is the cycle month featured. |
| `date` | date | YES | `YYYY-MM-DD`, a real calendar date, equal to the filename date prefix. Used for index ordering (newest first) and the sitemap. For this series, the Publish Day. |
| `description` | string, single line | YES | 1–2 sentences. Shown verbatim on the blog index card, in search-result metadata, Open Graph/Twitter tags, JSON-LD, and the RSS feed. Plain text — no markdown, no quotes that would break HTML attributes. SHOULD be ≤ 300 characters and MUST stand alone as an accurate summary (no claims the article does not support). |
| `tags` | comma-separated list | YES | Lowercase words, comma + single space separated (e.g. `workforce, michigan, research, AI, education`; the generator trims each entry). Rendered as pills and used by index search/filtering. For this series, exactly: `workforce, michigan, research, AI, education` (deviations only per spec 007 with the reason recorded). |
| `slug` | string | YES | URL-safe: lowercase ASCII letters, digits, and hyphens only; no leading/trailing hyphen; no consecutive hyphens. MUST be unique across all files in `blog/posts/`. Determines the canonical URL `https://axiovexsystems.com/blog/<slug>/`. For this series: `michigan-workforce-<month>-<year>` with `<month>` the full lowercase English month name of the cycle. Once published, a slug MUST NOT change (published URLs are permanent; `/blog/post?p=<slug>` is only a legacy redirect shim). |

- No other front-matter fields are defined. Unknown keys are
  ignored by the generator; do not add any.
- Values are single-line: no line breaks, no YAML quoting tricks —
  the parser is a simple `key: value` split, not a YAML engine.
  Avoid a colon followed by a space inside `title`/`description`
  values is permitted (the split is on the first colon), but avoid
  leading/trailing whitespace (it is trimmed).

## 3. Body structure (this series — normative order)

The body begins immediately after the closing `---`. The page
template adds the title, date, and tag pills; the body MUST NOT
contain an H1 or repeat the title.

1. **Opening paragraph** — frames the newest data and the article's
   central reading in prose. No heading before it.
2. **Evidence cutoff line** (REQUIRED, immediately after the
   opening paragraph) — italic paragraph of the form:
   *Evidence cutoff: \<Month D, YYYY\> (America/Detroit). \<source
   sentences with links\>.* Every source the article's figures come
   from is named here, with the edition/release linked when a
   research edition is used.
3. **Lead analysis section** (`##` heading) — the headline figure
   examined: what it conceals (participation, composition,
   vintage). The series' signature move: the rate is not the story.
4. **Signals section** (`##` heading) — soft indicators treated as
   **warning signals, not forecasts**; cross-population or
   cross-vintage comparisons are explicitly bounded.
5. **Decisions section** (`##` heading) — numbered recommendations
   for education and industry, each resisting a lazy reading;
   attributed to the edition when they originate there (standing
   guidance is labeled as standing, never re-presented as new).
6. **Worked-example section** (`##` heading, when the edition
   supports one) — a single domain examined in depth (model:
   radiology). When no new evidence touches the example, a short
   "stands as published" treatment is acceptable.
7. **Method / pipeline note** (`##` heading, REQUIRED) — how the
   numbers were produced and verified, including any pipeline leg
   that did not run and why; links to the research repo, edition,
   and release.
8. **Closing block** — a `---` rule followed by an italic paragraph
   linking the public research repo, the edition, and the verified
   release.

Section headings are `##` (H2) only within the body; `###` (H3) may
subdivide a section when needed. No heading deeper than `####`.

## 3A. Standing sections added by FR-010 (2026-10-06)

From the FR-010 amendment (spec 007) onward, three standing
sections join the §3 structure, in these positions (FR-010 is the
normative source; this section fixes their placement in the file
format):

- **Trend board** — immediately after the lead analysis (§3
  item 3). Ticker-style `|` table of the four FR-002 BLS series:
  latest value + reference period, month-over-month change,
  change across the snapshot window, direction marker
  (▲/▼/▬). Deltas are labeled in the article as computed
  arithmetic on the published series; series gaps (missing
  months) are noted, never filled. A sentence states the reading
  rule: arrows show the direction of the number, not a verdict.
- **Cross-report trend insights (owner rule, 2026-10-08; spec 007
  FR-012)** — each standing board is read against the PRIOR cycle's
  report: rises, falls, and holds are called out explicitly, each
  with a reason that was checked against news sources, official
  notices (e.g. WARN filings, agency/company releases), and
  sentiment/context factors. A move with no verified cause is
  labeled unexplained — causes are never inferred from the numbers
  alone. Applies to the trend board, the education board, and
  county-level geography.
- **Outlook board** — immediately after the signals section (§3
  item 4). Published projections only (Michigan MCDA statewide
  vintage via the current edition; BLS Employment Projections
  national vintage), organized as rising / falling, with agency,
  horizon, and vintage stated in the section and annual openings
  shown beside percentage change where published. Framed as the
  agencies' modeled outlook; no Axiovex forecast is stated.
- **Education analytics** — immediately after the outlook board,
  before the decisions section (§3 item 5). Michigan education
  indicators in board form (indicator, latest, prior reading,
  trend), each from a published official source cited in place
  (CEPI/MDE; IPEDS/NCES for directly citable Michigan series;
  state consensus figures only when labeled as estimates).
  Indicators that cannot be verified from the published source
  are omitted and the omission disclosed.

The decisions section (§3 item 5) follows the three boards and
may cross-reference them; standing decisions remain labeled as
standing per §3.

## 3B. Talent geography callout (added by FR-011, 2026-10-06, via spec 014)

From the FR-011 amendment onward, a **Talent geography callout**
section joins the §3 structure, placed immediately after the
Education analytics section (§3A) and before the decisions
section (§3 item 5). FR-011 (spec 007) is the normative source;
this section fixes the file format:

- **Heading**: `## Talent geography` (series style).
- **Map links, never embeds**: the section links the Signals
  page geography subsection (`https://axiovexsystems.com/signals/`
  — the geography blocks inside "The full picture") and states
  each linked layer's vintage as of drafting: QCEW annual
  vintage (e.g. "QCEW 2024 annual averages"), LAUS reference
  month (e.g. "county unemployment, August 2026"), IPEDS
  survey cycle (e.g. "IPEDS 2024; completions 2023–24"), PSEO
  release (e.g. "PSEO R2026Q2"). No map images are embedded
  in the article in v1.
- **Computed insights**: one or two short paragraphs, each
  presenting ONE computed geographic insight from exactly the
  three computations FR-011 names (highest-LQ county for a
  rising industry; county unemployment spread naming both
  counties; PSEO spotlight in-state retention share at year 1).
  Each paragraph labels the figure as computed and names its
  inputs and vintages (dataset + period). An insight whose
  inputs are missing or stale is omitted — never approximated,
  never replaced by a different computation.
- **Stale layers**: a geography layer that could not be
  refreshed in the cycle is cited here and in the cycle report
  as last-good with its vintage (the §6 checklist carries the
  verification step).

## 4. Supported markdown subset

Per `blog/README.md` and the generator — nothing outside this list
is guaranteed to render:

- Headings `#`–`####` (body usage per §3: `##`/`###` only)
- **bold**, *italic*, `inline code`
- [links](https://example.com) — absolute URLs
- Images `![caption](relative-path.png)` — image files live beside
  the article in `blog/posts/` and are referenced relatively
- `-` bulleted and `1.` numbered lists, one nesting level
- `>` block quotes
- `---` horizontal rules
- Fenced code blocks (```)
- Simple `|` tables

Not supported / forbidden: raw HTML, footnotes, reference-style
links, nested lists beyond one level, YAML beyond §2, HTML entities
other than those the generator escapes itself.

## 5. Link and citation rules

- **Every figure is traceable**: each statistic in the body comes
  from the cited research edition, a BLS series named in spec 007
  FR-002, or another official source linked at first use. Figures
  are never invented, interpolated, or carried forward as current
  (constitution §I; spec 007 FR-002).
- Vintage discipline: every figure's reference period is stated or
  unambiguous in context; preliminary figures are labeled
  preliminary; windowed measures (e.g. U-6 annual windows) are never
  presented as monthly readings.
- Article-to-article and outbound canonical links use the clean
  form `https://axiovexsystems.com/blog/<slug>/` — never the
  `/blog/post?p=` shim.
- **Edition links are anchored to the release tag, never to a
  branch**: an edition link uses the tag form
  `https://github.com/AXIOVEX/michigan-workforce-intelligence/tree/<release-tag>/reports/<edition-dir>`
  (September 2026 edition: tag `reports-2026.09.27.131143Z`,
  commit `d0fbc71`). `tree/main` edition links are prohibited —
  main moves; the tag is the immutable record of the published
  data. Per-edition branches are not created; the release tag is
  the anchor (owner decision, 2026-10-06). The closing block also
  links the release page itself.

## 6. Validation checklist

An article (draft or publish candidate) is format-valid only when
every item passes:

- [ ] Filename matches `YYYY-MM-DD-<slug>.md`; filename date =
      front-matter `date`; filename slug = front-matter `slug`.
- [ ] Front matter opens the file (`---` first line) and contains
      exactly the five defined fields, in canonical order, each
      single-line.
- [ ] `title` follows the series pattern; `date` is a real date
      and the cycle's Publish Day; `description` is 1–2 sentences,
      ≤ ~300 chars, free-standing and accurate; `tags` equal the
      series set; `slug` matches the URL-safe rules and the
      series pattern, and is unique across `blog/posts/`.
- [ ] Body has no H1 and does not repeat the title.
- [ ] Evidence cutoff line present, dated, America/Detroit, with
      all sources named and edition/release linked.
- [ ] All eight body components of §3 present, in order (worked
      example per its condition); for series articles under the
      FR-010 amendment, the three standing sections of §3A are
      also present, in their §3A positions.
- [ ] Only `##`/`###` headings in the body; markdown stays inside
      the §4 subset.
- [ ] Every figure traceable to a cited source with its period
      (and preliminary status) stated; no carried-forward figure
      presented as current.
- [ ] All links absolute and canonical (no `/blog/post?p=` links);
      edition and release links resolve.
- [ ] Local build passes when the file is placed in `blog/posts/`:
      `node scripts/build-site.mjs` completes without error and
      the article renders at `/blog/<slug>/` (pre-publish drafts
      validate against this checklist without being placed in the
      repo).
- [ ] **Map-refresh verification (FR-011, from the spec 014
      amendment)**: each committed geography dataset in
      `data/geo/` was checked against its source's current
      release before drafting (LAUS reference month current;
      QCEW annual vintage current; IPEDS cycle current; PSEO
      release current). The §3B callout states each layer's
      vintage as of drafting; any layer that could not be
      refreshed is cited as last-good with its vintage in the
      article and the cycle report. Each §3B insight traces to
      one of FR-011's three named computations on the committed
      datasets, labeled computed with input vintages.

## 7. Validation record — 2026-10-06 test article

Test article (NOT published; produced by the spec 007 test run,
2026-10-06): `2026-10-13-michigan-workforce-october-2026.md`, held
in the series drafts location
(`~/workspace/goals/website-seo-aeo-health-monitoring/files/workforce-drafts/`).

| Checklist item | Result |
|---|---|
| Filename pattern; filename date = front-matter date (2026-10-13); filename slug = front-matter slug | PASS |
| Front matter opens file; exactly the five fields, canonical order, single-line values | PASS |
| Title pattern ("Michigan's October workforce data: what the numbers say, and what they don't") | PASS |
| Date = October cycle Publish Day (Tue 2026-10-13, per date rule) | PASS |
| Description 1–2 sentences, free-standing, accurate (states the September state data is unpublished and the national move) | PASS |
| Tags = series set (`workforce, michigan, research, AI, education`) | PASS |
| Slug URL-safe (`michigan-workforce-october-2026`), series pattern, unique vs `blog/posts/` (existing: `michigan-workforce-september-2026`, `what-superintelligence-means`) | PASS |
| No H1 in body; title not repeated | PASS |
| Evidence cutoff line present (October 6, 2026, America/Detroit), sources named, edition linked | PASS |
| §3 components in order: opening; cutoff; lead analysis ("The newest Michigan number is the one that isn't there"); signals-not-forecasts ("Nationally, a soft September — a signal, not a forecast"); decisions ("Five decisions, unchanged…", labeled standing); worked example ("The worked example stands too"); pipeline note ("The pipeline behind the numbers", including the legs that did not run); closing block with repo/edition/release links | PASS |
| Headings `##` only in body; markdown within §4 subset (paragraphs, bold/italic, numbered list, links, `---`) | PASS |
| Every figure traceable: MI Aug figures to BLS API readings 2026-10-06 + September edition observations (28-source verified edition); national Sep figures to BLS Employment Situation via API (UR 4.2%, payroll +29k, U-6 7.6%, LFPR 61.8%); preliminary status of MI Aug stated; U-6 window vintage stated | PASS |
| Links canonical; no `/blog/post?p=` links; edition + release links are the verified September ones | PASS |
| Local build render check | NOT RUN — by design: the test article is never placed in `blog/posts/` (unpublished test artifact). All other items validated directly against this spec. |

**Verdict: format-valid** under this specification (13/14 items
PASS; the build-render item is inapplicable to an unpublished test
artifact and is exercised at the real publish step per FR-007).
