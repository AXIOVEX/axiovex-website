# Tasks: Signals + Michigan Pulse

**Spec**: specs/004-signals-pulse/spec.md · **Plan**: plan.md
Legend: [x] done · [ ] open · [OWNER] needs Tristen's decision

## Feasibility + gate
- [x] T001 Feeds fetched and parsed (NIST, NSF, DOE, Manufacturing Dive, Automation Alley, CISA ICS, Federal Register API)
- [x] T002 BLS Pulse series verified live without a key (values + history + missing-month quirk recorded in spec.md)
- [x] T003 Wireframes updated first: WF-01 Signals/Pulse block + new WF-11 Signals page; revision logged as pending
- [ ] [OWNER] T004 Tristen approves the wireframe revision — **blocks all tasks below**

## Implementation (after T004)
- [ ] T005 `data/signal-sources.json` (lanes, feeds, keyword filters, caps) + `scripts/fetch-signals.mjs` with last-good retention
- [ ] T006 `signals-sync.yml` hourly Action (ingest → build → commit only on change)
- [ ] T007 Home Signals block + `scripts/templates/signals.html` in the generator; styles.v23.css; sitemap + llms.txt
- [ ] T008 Fixture-based verification (caps, dedupe, cutoff, missing-month gap, dead-feed last-good) + live verification; SEO/AEO baseline confirmed
- [ ] T009 Axiovex blog RSS/Atom feed (`/feed.xml`) from the same generator step — small companion win
- [ ] T010 Wireframe revision log marked approved; spec status → implemented

## Queued next package (owner said "do both")
- [ ] T011 Turnstile contact form: WF-06 wireframe revision + spec 005 — starts after this package ships
