# Plan: Signals in Nav, Home Highlight + Floating Widget (spec 008)

**Status: proposal only.** This plan executes only after the
tasks.md T001 gate (Tristen approves the revised wireframes).
Nothing here has been implemented.

## Where each piece lives

```
Nav (FR-001)
  header markup is duplicated per page shell — the SAME insert in:
    index.html                        (static; header outside the
                                       generated SIGNALS markers)
    contact/index.html                (static)
    privacy/index.html                (static)
    scripts/templates/blog-index.html
    scripts/templates/blog-article.html
    scripts/templates/documents.html
    scripts/templates/signals.html
  → insert <a href="/signals/">Signals</a> in .nav-links AND in
    .mobile-menu, after the Blog link, before Documents.
    signals.html additionally gets aria-current="page" on the new
    link in both menus (the pattern blog/documents already use).

Home highlight (FR-002)
  scripts/build-site.mjs — buildSignals() home-section string:
    · eyebrow: "Signals" → live-dot span + "Axiovex Signals — Live"
    · after the <h2>: a .pulse-strip element built from
      snap.pulse — referenceMonth + the tiles for
      SMU26000003000000001 (manufacturing employment),
      LASST260000000000003 (unemployment rate),
      LASST260000000000006 (labor force), using each tile's
      `display` value verbatim (no reformatting of BLS numbers
      beyond what the snapshot already carries).
  styles.v25.css (bumped from v24): .pulse-strip styles + the
    live-dot; every stylesheet reference updated in the same pass.

Widget data (FR-005)
  buildSignals() also writes signals-widget.json at the site root
  whenever it renders from a snapshot:
    { updatedUtc,
      pulse: { referenceMonth, source, stats: [{label, display}] },
      lanes: [{ id, title, items: [{source, title, link, date}] }] }
  Derived by slicing the parsed snapshot — no new fetch, no new
  fields invented; if a lane/stat is missing it is omitted.

Widget component (FR-003, FR-004, FR-006)
  New versioned assets at the site root:
    signals-widget.v1.css — pill + panel, fixed bottom-right,
      z-index below .nav / .mobile-menu, safe-area padding,
      ≤660px: panel max-height 70dvh with overflow auto.
    signals-widget.v1.js — deferred; builds the widget DOM into a
      mount element, fetches /signals-widget.json (same-origin),
      renders, wires the toggle.
  Mount: a single mount element + the two asset tags added to the
  same seven page shells as the nav — EXCEPT templates/signals.html
  and the generated /signals/ output (widget excluded there).
    · index.html mount carries no page hint (default ordering).
    · blog-article.html mount carries the post's tags via a
      data attribute the generator already knows at build time
      (e.g. data-tags="workforce, michigan, research, AI,
      education"); the script maps tags → lane
      (michigan|workforce → michigan; ai → ai-standards) and
      reorders per FR-006. No other shell needs a hint.
  Behavior details:
    · sessionStorage key "axiovex-signals-open" ("1"/absent);
      read on load, written on toggle; default collapsed.
    · ESC handler active only while expanded; collapse returns
      focus to the toggle button.
    · fetch failure / non-200 / JSON parse error → remove the
      mount, render nothing, log nothing to the visitor.
    · headlines open target="_blank" rel="noopener" (house pattern
      for signal links); internal links (/signals/) same-tab.
```

## Build + deploy flow (unchanged machinery)

Edits land as one implementation commit on `main` after the gate;
the `site-sync` Action rebuilds generated pages from the templates;
Cloudflare Pages deploys. The hourly `signals-sync` workflow keeps
refreshing `data/signals.json` → rebuild → home block, `/signals/`,
and `signals-widget.json` all move together from the one snapshot.

Local-build note (standing gotcha): the generator skips the
documents page unless a shared-documents checkout exists at
`/tmp/shared-documents` — keep the symlink in place when building
locally to verify, or the local output diff will look wrong.

## Verification strategy (FR-009)

- Source checks before push: `grep` the seven shells for the new
  nav link in both menus; `node --check` on the widget script and
  on `build-site.mjs`; build locally and diff `signals-widget.json`
  values against `data/signals.json` (byte-equal displays).
- Live checks after deploy: HTTP 200 on `/`, a blog article,
  `/documents/`, `/contact/`, `/privacy/`, `/signals-widget.json`;
  Signals link visible in the desktop nav and the hamburger panel;
  widget pill present on those pages and **absent on `/signals/`**;
  expand → Pulse values match the snapshot; ESC collapses; reload
  mid-session keeps the chosen state, a new session starts
  collapsed; 390px viewport: panel capped, scrolls internally,
  pill clears the safe area.
- Monitoring: the next scheduled SEO/AEO + analytics cycle
  re-reads the baseline; any score movement is reported in that
  cycle's report, not fixed silently here.

## Risks / open points

- **Header duplication**: seven shells carry the nav by hand; a
  missed shell = one page without the Signals link. Mitigated by
  the grep check above and the live pass over every page type.
- **Widget vs. consent/privacy copy**: the widget sets no cookie
  and stores state only in session storage; the privacy policy's
  statements remain accurate — no copy change needed. If
  implementation chooses any other storage, that stops and comes
  back for a policy review first.
- **Z-index / overlap on small screens**: the panel is capped and
  scrollable per WF-12; the verification pass includes the
  390px-wide article page (share row + widget pill coexisting).
- **"LIVE" wording**: bounded by FR-007 — the panel shows the
  snapshot's updated timestamp so the claim stays honest (hourly
  refresh, not real-time).
