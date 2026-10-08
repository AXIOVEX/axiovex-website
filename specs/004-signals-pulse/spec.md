# Feature Specification: Signals + Michigan Pulse

**Feature Branch**: `004-signals-pulse`

**Created**: 2026-10-05

**Status**: IMPLEMENTED AND LIVE 2026-10-05 (commit 84939fd), after
Tristen approved the wireframe revision. Live verification: /signals/
200 with all five lanes, home block serving with the Aug 2026 Pulse
values, /feed.xml valid, and the hourly signals-sync workflow proven
by a manual dispatch (completed success, no-op commit).

**Input**: Tristen Pierson (owner), 2026-10-05: determine whether RSS /
news feeds tied to Axiovex careabouts (or other free pipe-ins) can make
the site more useful; he then directed "Do both — Signals/Pulse first"
(the Turnstile contact form follows as its own package).

## What this adds

1. A **Signals + Michigan Pulse block on the home page** (WF-01,
   between Evidence and About): four BLS Pulse tiles, the three latest
   signal cards (Manufacturing / AI-Standards / OT lanes), and a link
   to the full Signals page.
2. A **Signals page** at `/signals/` (WF-11): Pulse band + five lanes —
   Manufacturing & automation · AI, standards & research · Michigan
   workforce & industry · OT cybersecurity · Funding & policy — plus a
   sources & method note.
3. A **footer link** to Signals (Explore column). Nav unchanged in v1.

## Verified sources (fetched and parsed 2026-10-05)

| Lane | Source | Feed / API | Notes |
|---|---|---|---|
| AI/standards, Mfg, Funding | NIST | `nist.gov/news-events/news/rss.xml` (40 items) | Broad — keyword-filtered per lane |
| AI/research, Workforce | NSF | `nsf.gov/rss/rss_www_news.xml` (15) | Broad — keyword-filtered |
| Funding, Energy/Mfg | DOE | `energy.gov/rss/news.xml` (10) | Keyword-filtered |
| Manufacturing | Manufacturing Dive | `manufacturingdive.com/feeds/news/` (10) | Direct fit, unfiltered |
| Michigan, Manufacturing | Automation Alley | `automationalley.com/feed/` (10) | Michigan Industry 4.0 voice |
| OT cybersecurity | CISA ICS | `cisa.gov/cybersecurity-advisories/ics-advisories.xml` (30) | Direct fit, unfiltered |
| Michigan | Michigan WARN (LEO) | LEO WARN notices listing via its SXA results JSON (added 2026-10-08, see Amendment below) | Announced layoffs/closures; "announced" framing in every headline |
| Funding & policy | Federal Register API | `federalregister.gov/api/v1/documents.json` | Query-tuned; keyword-filtered |

**Michigan Pulse** — U.S. Bureau of Labor Statistics public API, no key
required (verified live 2026-10-05, ~32 monthly points per series):

| Tile | Series | Latest verified value |
|---|---|---|
| MI manufacturing employment | `SMU26000003000000001` | 586.7k (Aug 2026) |
| MI unemployment rate | `LASST260000000000003` | 5.0% (Aug 2026) |
| MI labor force | `LASST260000000000006` | 4,852,504 (Aug 2026) |
| MI total nonfarm employment | `SMU26000000000000001` | 4,505.9k (Aug 2026) |

Known data quirk: BLS series contain missing months (e.g. Oct 2025
unemployment reads `-`). Missing values render as gaps — never
interpolated, never hidden silently.

Deferred: arXiv firehoses (cs.AI/cs.RO) — v2 research lane only, with
strict filtering. Michigan MiNewswire advertises no RSS feed — not in
v1. Google News RSS — rejected (noise, duplicates, weak provenance).

## Requirements *(mandatory)*

- **FR-001**: All ingestion happens **at build time**. The published
  site contains no live third-party widgets, no visitor-side feed
  fetching, and no new tracking.
- **FR-002**: Items display **headline, source, and date only**, each
  linking to the publisher. No copied article text, no publisher
  images.
- **FR-003**: Broad feeds (NIST/NSF/DOE/Federal Register) pass
  per-lane keyword filters defined in a human-editable source config.
  Direct-fit feeds (Manufacturing Dive, Automation Alley, CISA ICS)
  may run unfiltered.
- **FR-004**: Dedupe by canonical link across sources; newest first;
  max 8 items per lane; nothing older than 45 days; home cards take
  the newest item from the Manufacturing, AI/Standards, and OT lanes.
- **FR-005**: **Last-good resilience.** A failed feed never blanks a
  lane or breaks the build: the previous snapshot is retained and the
  failure is logged in the ingest report.
- **FR-006**: Pulse values always carry their BLS reference month and
  a "U.S. Bureau of Labor Statistics" attribution. Month-over-month
  deltas are computed from the series itself; missing months show as
  gaps in the 12-month trend (static inline SVG).
- **FR-007**: The Signals page carries the sources & method note,
  including "inclusion is not endorsement," and the snapshot's updated
  timestamp. The home block shows the same timestamp.
- **FR-008**: Claims discipline (constitution §I): no auto-generated
  summaries, opinions, or "why it matters" text. Curation is by
  filter and lane design only, until a human-reviewed digest exists.
- **FR-009**: Wireframe gate first (WF-01/WF-11 revision), owner
  approval, then implementation; `/signals/` added to sitemap.xml and
  llms.txt; SEO/AEO baseline (100 / 90) must hold after launch.
- **FR-010**: Ingest cadence: hourly scheduled check; a new snapshot
  is committed and deployed **only when content actually changed**.

## Acceptance scenarios

1. **Given** the home page, **When** it loads, **Then** the Signals
   block shows four Pulse tiles with reference month and three current
   signal cards, all rendered as static HTML with an updated timestamp.
2. **Given** any feed is down at ingest time, **When** the snapshot
   rebuilds, **Then** that lane still shows its last good items and the
   build succeeds.
3. **Given** the Signals page, **When** a visitor clicks any item,
   **Then** they land on the publisher's article, with Axiovex having
   displayed only the headline, source, and date.
4. **Given** a BLS series with a missing month, **When** the Pulse
   renders, **Then** the trend shows a gap and no value is invented.

## Amendment — 2026-10-08: Michigan WARN (LEO) as a Signals source

**Direction**: Tristen Pierson, 2026-10-08 — "We should be using
WARN data in all our reports and things." This is a back-end data
change only: WARN items render inside the existing Michigan lane
exactly like every other item (headline + source + date, link
out). No layout, copy, or design change — **the wireframe gate
(FR-009) is not triggered** by this amendment.

- **FR-011 — Michigan WARN ingest.** The Michigan Department of
  Labor and Economic Opportunity (LEO) public WARN notices are
  an approved source for the **Michigan lane**, under the standing
  architecture: build-time ingestion (FR-001), headline + source
  + date only (FR-002), dedupe / newest-first / lane cap 8 /
  45-day max age (FR-004), last-good on failure (FR-005), and no
  summaries or opinions (FR-008). Source label: "Michigan WARN
  (LEO)".
  - **Access route (verified live 2026-10-08)**: the listing
    page (michigan.gov/leo/bureaus-agencies/wd/data-public-notices/warn-notices)
    is a Sitecore SXA search page with no server-rendered list;
    its results endpoint (`/leo/sxa/search/results/`, with the
    page's variant/scope identifiers) returns JSON whose
    per-result HTML carries the published notice fields —
    company, site address, county, type of company action,
    layoff date, jobs impacted, and (for most notices) a link to
    the notice PDF. The notice's posting (filed) date is carried
    in the result's search-data path. The site's edge rejects
    non-browser user agents (403), so the WARN request carries a
    browser user agent; the endpoint and its identifiers are
    configuration in `data/signal-sources.json` (`warnApi`). If
    LEO changes the page or its identifiers, the source fails
    absorbed under FR-005 and is reported in the ingest log —
    the lane is never blanked and no data is invented.
  - **Headline discipline**: headlines are composed ONLY from
    fields the listing itself publishes — company, action type,
    city (from the site address; county when no city is
    published), jobs impacted, and the layoff effective date —
    and always carry the announced framing ("announced facility
    closure", "announced permanent layoff", …). WARN notices are
    announcements of intent: **announced ≠ completed**, and no
    headline may state or imply the jobs are already gone. The
    item date is the notice's filed (posting) date; the
    effective date appears in the headline text only. Items link
    to the notice PDF when the listing exposes one, otherwise to
    the WARN listing page.
  - **Interaction with other specs**: WARN items in the snapshot
    are visible to the spec 012 hourly breaking-news scan, whose
    FR-011(iv) criterion covers major Michigan plant
    openings/closings — no change to spec 012 is needed or made.
    The workforce series' standing WARN pull is spec 007 FR-013.
