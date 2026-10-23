---
title: Measure space. Without a ruler.
date: 2026-10-23
description: Can you measure the size of a slice of space by counting events? The 60-second explainer — video and full text — of the separator-counting paper: count the two causal layers straddling a slice, correct exactly for the diamond's edges, and the prediction lands within 0.8% of the simulations.
tags: causal sets, quantum gravity, explainers
slug: measure-space-without-a-ruler
video:
  src: /assets/video/measure-space-without-a-ruler/measuring-space.mp4
  poster: /assets/video/measure-space-without-a-ruler/poster.jpg
stills:
  counting: /assets/video/measure-space-without-a-ruler/still-counting.jpg
  edges: /assets/video/measure-space-without-a-ruler/still-edges.jpg
  comparison: /assets/video/measure-space-without-a-ruler/still-comparison.jpg
  results: /assets/video/measure-space-without-a-ruler/still-results.jpg
listening:
  enabled: true
---
Can you measure the size of a slice of space by counting — no ruler, no measuring rod, just events and the links between them?

That is the question behind a paper by T. Pierson (Axiovex Systems / Research, October 2026). This article is its 60-second explainer, written out in full — watch the video, or read the same story below with the stills.

[VIDEO EMBED]

## Count the layers next to the slice

[STILL: counting]

Suppose spacetime is not a smooth sheet but a sprinkling of discrete events — dots — linked by cause and effect: this event can influence that one. That picture is the starting point of the causal set approach to quantum gravity.

Now take a diamond-shaped region of that sprinkling, and look at its middle slice — a "moment" cutting the diamond at its widest. The events fall into causal layers. Count the events in the last layer just before the slice, and the first layer just after it: the two layers that straddle the cut.

The claim is simple to state: at a known sampling density, that boundary count measures the slice. The number of events in the two straddling layers works as a statistical ruler for the slice's size — its area, in this two-space-plus-time model. No geometry is measured directly; the count, and the count alone, carries the size.

## The subtlety is the edges

[STILL: edges]

A first version of the ruler overpredicts. The reason is the diamond's shape: away from the middle slice, the diamond narrows, so fewer events near the edges can belong to the layers that matter. A formula that prices the boundary as if the region were uniform expects too many counted events.

The paper corrects this exactly. Geometry supplies an exact finite-size correction — in effect, an accounting for the rim of the diamond — that can be computed before any simulation is run. The corrected formula is a single exact prediction, not a fit.

## A prediction that lands

[STILL: comparison]

[STILL: results]

In the paper's test, with 2,000 events on average in the whole region: ignoring the edges predicts about 536 counted events. Including the correction predicts about 484. The reported simulation average is 483, over 24 random realizations.

Across four model sizes and 72 simulations, the pattern holds: the reported normalized averages match the exact predictions with less than 0.8% left over. (The figures here are rounded; the paper's Table 2 and its leading coefficient carry the exact values.)

## What this is — and what it is not

This is a result about a model of spacetime: a better ruler for that model, not a new law of gravity. Its value is the shape of the success. The prediction was exact and made in advance; the correction was derived, not tuned; and the simulations landed where the corrected formula said they would.

If spacetime really is built from events and their causal links, then counting is a way of measuring — and getting the edges right is the difference between a rough guess and a prediction that lands.

*The paper itself is public on Zenodo: [records/23604642](https://zenodo.org/records/23604642). Its reproducibility package (data + code) is at [records/23600630](https://zenodo.org/records/23600630), and the Lean formalization at [records/23600458](https://zenodo.org/records/23600458). More explainers will live here on the blog as the work produces them.*
