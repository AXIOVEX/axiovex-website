---
title: Robots can do the work. Almost none of it pays yet.
date: 2026-10-15
description: Anthropic's robot exposure index finds robots and AI together reach about 80% of U.S. job tasks by working time — and that robots are cost-competitive for 0.3% of tasks today. We read the study. Here is what it measured, what holds up, and what it means for Michigan plants.
tags: manufacturing, automation, AI, workforce, michigan
slug: robots-can-do-the-work
---
A widely shared LinkedIn summary made the rounds this week with a striking claim: Anthropic has found that AI and robots together are already capable of performing tasks covering about **81% of U.S. employment**. We read the study behind it — Russell Legate-Yang and Maxim Massenkoff's *What work can robots do?*, published by Anthropic's economics team on September 30, 2026 ([Anthropic](https://www.anthropic.com/research/what-work-can-robots-do)). The summary's numbers are mostly right. Its unit is wrong — and the study's most useful figure for anyone who runs a plant or plans a workforce is the one the summary buried: **0.3%**.

That is the share of U.S. job tasks for which a robot is already *cheaper* than the person doing them, on the study's own costing. Robots can *do* far more than that. The distance between those two numbers — what robots are capable of, and what they cost — is the whole story, and it is a much more practical story than the headline suggests.

## What the study actually measured

The researchers started from O*NET, the federal occupational database: roughly **900 occupations** and **19,000 task descriptions**. Of those tasks, **7,594 are classified as physical**, and each one was scored for whether a robot available today could perform it, and in what kind of setting. A "robot" here means an autonomous machine that senses and acts on its own — a car wash that scans a vehicle to set its sprayers counts; a surgeon-guided surgical system, being teleoperated, does not.

The scoring used three environment tiers, which matter more than any headline number:

- **Purpose-built settings** — a robot can do the task only in an environment built for robots. The study's example is a factory assembly line. This is the largest tier.
- **Structured facilities** — a robot can do it in an organized human workplace, like a logistics warehouse.
- **Unstructured settings** — a robot can do it out in the open world, like a city road. Very little qualifies.

"Capable" was held to a demonstrated standard: the evidence had to point to real deployments, commercial sales, or demonstrations of a robot doing the task about as well as a human, reliability and speed included. One more structural fact frames everything else: by the study's accounting, **54% of U.S. work time is cognitive or interpersonal and 46% is physical** — so even a perfect score on physical work touches less than half the economy's hours.

## Tasks and hours, not jobs

The 81% figure is a share of **job tasks weighted by working time** — about 80% in the study's key findings, 81% in its body text — not a share of jobs, workers, or employment. A job counts toward exposure if a meaningful slice of its tasks is exposed, which is a very different claim from "a robot can do this job." Two more qualifications shrink it further:

- About **half of work time** is exposed to LLMs alone — but that half is *theoretical* capability, in the established research sense of "an LLM could at least halve the time this task takes." It is not a measure of what AI is actually doing in workplaces today.
- Robots account for the rest of the headline, and their number needs its setting qualifier. Robots can perform **74% of physical work — equal to 34% of all working hours** — but roughly half of that physical work is doable *only* in the purpose-built tier, about 22% in structured facilities, and only about **2% in unstructured settings**. Most of the 74% assumes the workplace has been built or organized around the robot.

What remains unexposed — the other fifth — is work that is highly interpersonal, or that needs physical skills current robots do not have. And the exposure is not evenly shared: workers in robot-exposed occupations are more likely to be male, far less likely to hold a bachelor's degree, and paid roughly **$30 an hour less** on average than workers in unexposed ones — nearly the mirror image of the higher-paid, more-credentialed workforce that LLM exposure touches.

## Capable is not the same as cheaper

The study's second half prices the capability. A task counts as cost-competitive when the full annual cost of a robot doing a human's annual output — purchase and installation spread over about ten years, plus maintenance, energy, insurance, and part-time human supervision — comes in below human labor cost. On that test, robots are cost-competitive for **0.3% of job tasks** today. For that share to reach 10%, robot costs would need to fall about 70%; at the historical trend of roughly **3% per year** since the 1990s, that takes **around 40 years**. In the study's own scenarios, cost-competitiveness for half of today's physical work arrives around **2085** on the baseline trend, and around **2050** in a fast scenario where costs fall up to four times faster. Those are extrapolations of a trend line, not forecasts — but as planning bounds they are the honest version of the timeline.

The paper's cautionary example is welding. Autonomous welding is real capability: AI-powered welding cells are deployed in fabrication shops in the U.S. and Canada, and the weld itself rates as doable in a purpose-built setting. But automating the *full welder's job* — positioning large parts, climbing to hard-to-reach joints, checking quality, grinding and finishing — costs an estimated **five times** what a human welder costs. The weld was never the bottleneck. Everything around it is.

Two cautions keep the 0.3% in proportion. First, it is a small share of tasks but not of people: it still covers roughly **300,000 workers** in occupations where robots can do about 95% of the work. Second, the authors are explicit that cost parity alone does not produce displacement — the human tasks left behind can become the bottleneck, and the robot's price often still includes human supervision, exception-handling, and repair.

## Where the math already works

One large occupation clears the bar today. **Packers and packagers** — about **560,000 U.S. workers** — spend 97% of their time on tasks robots can do. The study prices a multi-robot system costing over $2 million to buy and install, replacing roughly 14 workers' annual output, at about **$45,000 per worker per year against $49,000** for human labor: already about **$2,500 per worker per year cheaper**. Employment in the occupation has fallen **22% since 2015**. That is what the leading edge actually looks like: not a wave, a specific occupation where a structured task met a cost line.

The other hotspot is movement. Transportation and material-moving tasks go from **under 15%** exposed to LLMs alone to **about 90%** once robots are counted; nine of the ten most-exposed occupations are vehicle operators. At the other end, nursing and general repair are among the least exposed — current robots can do little of that work even in highly controlled settings. And one finding applies to the front office of every plant: office and administrative support rises to nearly **100%** combined exposure once robots' coverage of light physical tasks is added to the LLM side.

## Read it with both eyes open

The study deserves a careful reading, not a credulous one, and the reasons are in its own methods section. **Every score in it was produced by Claude — Anthropic's own AI model.** Claude classified the tasks as physical, generated the concrete examples of how each task is performed, searched for and cited the robot evidence, rated the exposure, estimated the time shares, and built the cost estimates. The study's main text describes no human rating or validation step. The work is Anthropic company research and has not been peer reviewed. That does not make it wrong — the method is documented in unusual detail, the underlying data is public, and the authors check their index against history: occupations rated more exposed, scored back to 1977, did go on to see larger wage and employment declines. But it is a map drawn by the company selling one of the technologies being mapped, and it should be weighted accordingly.

Anthropic's own earlier work supplies the sharpest check. In *Labor market impacts of AI* (Massenkoff & McCrory, March 2026; [Anthropic](https://www.anthropic.com/research/labor-market-impacts)), the same research program found that *observed* coverage of work by AI was a fraction of theoretical capability — computer and mathematical occupations scored 94% on theoretical coverage and 33% on what usage data actually showed. There is no equivalent usage data for robots, so the new index is capability plus a cost model, with nothing observed in between. The authors say as much: the cost figures are approximate, the cost-competitiveness measure is "more suggestive" than predictive, the scenarios assume the same cost decline lands on every task at once, and the study does not consider AI improving physical work *without* robots — predictive maintenance for factory machines being the obvious case for a manufacturing reader.

The binding physical constraint, for what it is worth, is not intelligence. Capability barriers of some kind block about **70% of physical tasks**, and the standout is manipulation — touching and handling objects. About half of physical tasks will not automate at scale unless robots get better at handling the physical world, while limits on planning and reasoning block only about 8%.

## What it means in Michigan — our reading, not the study's

The study is national; it publishes no state or regional breakdown, and its occupational data carries no Michigan figures. What follows is our application of its logic to a manufacturing-heavy state, labeled as such.

Start with the tiers. The factory assembly line is the study's archetype of the purpose-built tier, and that tier is where most robot capability already lives. For a Michigan plant, that means exposure is mostly a property of the *environment*, not the headcount: layout, fixturing, part presentation, and changeover discipline determine what is automatable sooner than wage levels do. The same investments that make a cell robot-ready tend to pay for themselves in throughput first.

The study's ordering is also a sensible capital sequence. Packing and structured material movement — the warehouse end of a Michigan plant's footprint — are at or near cost parity now. Purpose-built line tasks are capable but not yet cheap; those are five-to-twenty-year conversations, not next year's budget. Dexterous, variable, judgment-heavy work — setup, quality calls, exception handling, repair — is what the study finds robots worst at, and it is exactly the work to hire, train, and retain for. General repair sits in the study's least-exposed set for a reason.

## What we are watching

Three things will tell us whether this map is tracking the territory: whether independent researchers replicate the index with human raters and get similar numbers; whether deployed robot costs in specific categories — machine tending, palletizing, flexible handling — bend faster than the 3%-a-year trend the timeline rests on; and whether the next occupations to cross the cost line are the ones the study points to, packing and driving first. We will report what they show, either way. The discipline this series runs on applies to robots exactly as it does to jobs reports: capability, cost, and observed use are three different numbers, and a plan built on the wrong one is worse than no plan at all.

*Sources: Legate-Yang & Massenkoff, "What work can robots do?", Anthropic Economics, September 30, 2026; Massenkoff & McCrory, "Labor market impacts of AI: A new measure and early evidence", Anthropic, March 5, 2026. All figures are the studies' national estimates; the robot study publishes no state-level breakdown.*
