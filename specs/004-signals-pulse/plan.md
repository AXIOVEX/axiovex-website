# Plan: Signals + Michigan Pulse

**Spec**: specs/004-signals-pulse/spec.md

## Approach (after the approval gate)

The site is a generated static build; Signals extends that pattern
instead of adding runtime machinery:

1. **Ingest** — `scripts/fetch-signals.mjs` (new):
   - Fetches each configured feed/API with a short timeout and a
     descriptive User-Agent; parses RSS/XML and the Federal Register /
     BLS JSON responses.
   - Applies per-lane keyword filters from `data/signal-sources.json`
     (human-editable: source, lane, feed URL, include/exclude terms,
     cap).
   - Normalizes items to `{source, title, link, date, lane}`, dedupes
     by canonical link, sorts newest-first, caps per FR-004.
   - Fetches the four BLS series, computes latest value, MoM delta,
     and the 12-month trend points; missing values stay missing.
   - Writes `data/signals.json` (snapshot + `updatedUtc`) **only if
     changed**; on any source failure, keeps that source's last-good
     items from the previous snapshot and logs the failure to the run
     report (never fails the whole ingest for one bad feed; fails
     loudly only if *every* source fails).
2. **Schedule** — a new GitHub Action (`signals-sync.yml`), hourly,
   modeled on `site-sync.yml`: run ingest → if the snapshot changed,
   run `scripts/build-site.mjs` → commit as github-actions[bot] →
   Cloudflare Pages deploys. Manual dispatch supported.
3. **Render** — `build-site.mjs` gains a Signals step:
   - Home: inject the Pulse tiles + three lane cards into the home
     template's new Signals block (template in
     `scripts/templates/`, never hand-edit `index.html`).
   - `/signals/`: new page from a new template
     (`scripts/templates/signals.html`), page head per WF-11 with the
     WF-G2 rhythm (36/40), lanes rendered from the snapshot, sources &
     method note, CTA band, footer with the new Signals link.
   - `sitemap.xml` + `llms.txt` gain `/signals/`.
   - Styles land in a new versioned stylesheet (styles.v23.css) per
     the cache-busting rule; trend lines are inline SVG generated
     from series data (no chart library, no client JS).
4. **Verify** — local build with a frozen fixture snapshot (tests do
   not depend on live feeds): lane caps, dedupe, 45-day cutoff,
   missing-month gap, last-good behavior with a simulated dead feed.
   Then live: home block + /signals/ render, values match the BLS API
   at check time, timestamps present, AEO/SEO re-check holds the
   100/90 baseline.

## Risks & mitigations

- **Feed format drift** (esp. CISA's large ICS file, ~570KB): parser
  is tolerant (title/link/date only); last-good covers outages.
- **Noise from broad feeds**: keyword filters are config, tunable
  without code; v1 errs toward fewer, stronger items.
- **Commit noise**: snapshot writes only on change (FR-010).
- **BLS unregistered rate limits**: four series, hourly, is far below
  published unregistered limits; a free registered key is the fallback
  if limits ever bite (stored as a GitHub secret, never in the repo).
