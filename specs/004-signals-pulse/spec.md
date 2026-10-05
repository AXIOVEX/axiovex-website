# Feature Specification: Signals + Michigan Pulse

**Feature Branch**: `004-signals-pulse`

**Created**: 2026-10-05

**Status**: Wireframes revised (WF-01 block + new WF-11) — **awaiting
Tristen's approval** (wireframe gate, constitution §III). No website
changes before approval.

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
