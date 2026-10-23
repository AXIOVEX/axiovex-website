# Listening edition — Measure space. Without a ruler.

Spoken adaptation of the article (Axiovex Systems blog, published 2026-10-23).
Script discipline (spec 029, FR-001): every number and fact is taken from the
published article; only the phrasing is adapted for the ear.

- Voice: Brian (ElevenLabs)
- Chapters: 5 · Total runtime: 3:21 (201 seconds, measured per file)
- Audio: /assets/audio/measure-space-without-a-ruler/ch-01.mp3 … ch-05.mp3

## 01 · THE QUESTION — Measure space, without a ruler (0:29)

**Key points**

- The question: can counting events measure the size of a slice of space?
- The paper is by T. Pierson (Axiovex Systems / Research, October 2026)
- The article is the paper's 60-second explainer in full — video, text, and stills

**Takeaway:** No ruler, no measuring rod — just events, links, and a count.

**Narration**

Can you measure the size of a slice of space by counting — no ruler, no measuring rod, just events and the links between them? That is the question behind a paper by T. Pierson, of Axiovex Systems Research, dated October twenty twenty-six. The article on this page is that explainer, written out in full: a short video to watch, and the same story in text below it, with stills from the video. This listening edition reads that story aloud.

## 02 · COUNTING — Count the layers next to the slice (0:59)

**Key points**

- Spacetime as a sprinkling of events linked by cause and effect — the causal set picture
- Count the last layer before the middle slice and the first layer after it
- At a known sampling density, that count is a statistical ruler for the slice's area

**Takeaway:** The count alone carries the size — no geometry is measured directly.

**Narration**

Suppose spacetime is not a smooth sheet, but a sprinkling of discrete events — dots — linked by cause and effect: this event can influence that one. That picture is the starting point of the causal set approach to quantum gravity. Now take a diamond-shaped region of that sprinkling, and look at its middle slice — a moment, cutting the diamond at its widest. The events fall into causal layers. Count the events in the last layer just before the slice, and the first layer just after it: the two layers that straddle the cut. The claim is simple to state: at a known sampling density, that boundary count measures the slice. The number of events in the two straddling layers works as a statistical ruler for the slice's size — its area, in this two-space-plus-time model. No geometry is measured directly; the count, and the count alone, carries the size.

## 03 · THE EDGES — The subtlety is the edges (0:34)

**Key points**

- The diamond narrows away from its middle, so a uniform formula expects too many counted events
- The paper's fix is an exact finite-size correction — an accounting for the rim of the diamond
- The corrected formula is a single exact prediction, not a fit

**Takeaway:** Get the edges right, and the prediction is exact — derived, not tuned.

**Narration**

A first version of the ruler overpredicts. The reason is the diamond's shape: away from the middle slice, the diamond narrows, so fewer events near the edges can belong to the layers that matter. A formula that prices the boundary as if the region were uniform expects too many counted events. The paper corrects this exactly. Geometry supplies an exact finite-size correction — in effect, an accounting for the rim of the diamond — that can be computed before any simulation is run. The corrected formula is a single exact prediction, not a fit.

## 04 · THE PREDICTION — A prediction that lands (0:36)

**Key points**

- With 2,000 events in the whole region: ignoring the edges predicts about 536 counted events
- Including the correction predicts about 484 — the reported simulation average is 483, over 24 realizations
- Across 4 model sizes and 72 simulations, the averages match the exact predictions within 0.8%

**Takeaway:** Five hundred thirty-six without the correction; four hundred eighty-four with it; four hundred eighty-three measured.

**Narration**

In the paper's test, with two thousand events on average in the whole region: ignoring the edges predicts about five hundred thirty-six counted events. Including the correction predicts about four hundred eighty-four. The reported simulation average is four hundred eighty-three, over twenty-four random realizations. Across four model sizes and seventy-two simulations, the pattern holds: the reported normalized averages match the exact predictions with less than zero point eight percent left over. The figures here are rounded; the paper's Table two and its leading coefficient carry the exact values.

## 05 · THE BOUNDARY — What this is, and what it is not (0:43)

**Key points**

- A better ruler for a model of spacetime — not a new law of gravity
- The prediction was exact and made in advance; the correction was derived, not tuned
- The reproducibility package (data + code) is public on Zenodo, and the Lean formalization is linked in the article

**Takeaway:** Counting is a way of measuring — and the edges are the difference between a guess and a prediction that lands.

**Narration**

This is a result about a model of spacetime: a better ruler for that model, not a new law of gravity. Its value is the shape of the success. The prediction was exact, and made in advance; the correction was derived, not tuned; and the simulations landed where the corrected formula said they would. If spacetime really is built from events and their causal links, then counting is a way of measuring — and getting the edges right is the difference between a rough guess and a prediction that lands. The paper's reproducibility package — data and code — is public on Zenodo, and the Lean formalization is public as well; both are linked in the article.
