# Spec 023 amendment — 2026-10-23: "Measuring Space" slide figure

Owner-supplied slide (PowerPoint + PNG render, 2026-10-23):
"Measuring Space from Cause & Effect — Exact finite-size
corrections for a discrete spacetime model."

## Audit before use (done in the RCPH chat, 2026-10-23)

Every number on the slide was checked against the paper
(main.tex, Table 2 and §4.3 text):

- "<0.8% at all four tested sizes": the paper's per-size
  deviations of the measured mean ratios from the exact
  finite-size predictions are −0.3%, +0.7%, +0.2%, −0.7% —
  all inside 0.8%. The page's own Oct 22 article states the
  same bound from the unrounded means.
- Chart points (normalized by the asymptotic coefficient
  1.7587142573): 90.0 / 92.9 / 93.9 / 94.4% measured against
  the predicted curve 90.3 / 92.2 / 93.8 / 95.0% — matches
  Table 2 within rounding; error bars are ±1 SE as labeled.
- "72 simulations | 4 sizes": 24 + 20 + 16 + 12 = 72. ✓
- Diagram: the deck's own notes disclose it is an
  independent illustrative Poisson realization (nominal
  N=260), not a registered run; highlighted points are the
  maximal elements below the cut and the minimal elements
  above it — the paper's separator definition. The slide
  labels it "Illustrative". ✓
- Honesty lines on the slide: "MODEL RESULT, NOT A
  MEASUREMENT OF PHYSICAL SPACETIME". ✓

No corrections were required. One cosmetic nit (owner's
deck, not changed here): the "Middle slice" label touches
a highlighted point.

## Change

- New asset: research/assets/measuring-space-from-cause-and-effect.png
  (2401×1350, the owner's render of the slide).
- The slide is embedded as a figure at the end of the
  October 22, 2026 Latest-research article (the Study 038
  entry), with a caption stating the diagram is illustrative
  and the chart plots the study's reported means, and
  pointing to the Zenodo deposit linked at the page bottom.
- Scoped CSS added for .article-body figure.slide-fig
  (full-width image, rounded corners, muted caption).
  No layout change elsewhere; no wireframe change.

## Status

Staged + verified on staging (rendered check of the article
section). Production promotion awaits the owner's go —
this amendment was prepared on his "can we incorporate
them?" and is held at staging until he approves.
