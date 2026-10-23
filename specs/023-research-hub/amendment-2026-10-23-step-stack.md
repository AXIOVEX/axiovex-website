# Spec 023 amendment — 2026-10-23: verdict steps stack vertically

Owner report (2026-10-23, with screenshot of the production
page): in "How a claim earns its verdict", the four step chips
(1 State the claim · 2 Register both publicly · 3 Run exactly
what was registered · 4 Publish the verdict either way) wrapped
horizontally (1–2 on one row, 3 and 4 below) instead of stacking
vertically in order.

## Cause

The shared rule in the versioned site stylesheet
(styles.v45.css) is
`.step-row { display: flex; flex-wrap: wrap; gap: 8px; }` —
a horizontal, wrapping row. The component exists only on this
page.

## Fix

Page-scoped override in research/index.html's inline style:

    .step-row { flex-direction: column; align-items: flex-start; }

The chips now stack 1 → 2 → 3 → 4, each at its natural width.
The shared stylesheet is untouched: it is versioned and
site-wide, and editing it in place would also sit behind the
~4-hour stylesheet cache; this component is used nowhere else.

## Status

Staged + rendered-verified on staging, then promoted to
production by cherry-pick of this commit alone (same scoped
promotion as the day's other hub changes).

## Production record (2026-10-23)

Verified on staging first (deployment of e7fd10d succeeded;
rendered screenshot shows the four chips stacked 1 → 2 → 3 → 4,
each on its own line). Promoted by cherry-pick to main as
5a2fc8d (research/index.html + this record only; robots.txt and
_headers untouched). Production deployment succeeded; the live
page serves the override and a render of the production bytes
shows the stacked steps.
