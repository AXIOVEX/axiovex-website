# Spec 028 — Publication and sharing process (blog → personal LinkedIn → company page)

**Direction:** Tristen Pierson, 2026-10-20: "Document the
posting process, so that we know what the expectations are
for the quality of the posts and how to do the shares
across personal and company, LinkedIn and blog, and the
ideal times." Given as an AEE requirement — this package
is that documentation.

**Status:** SPECIFIED 2026-10-20. The owner's direction is
the gate for this package: it documents standing practice
and two owner rulings made the same day (FR-016, FR-019).
**Docs-only** — no site code, no wireframe cycle (no UX
change), no schedule changes. Where an existing job or
series rule conflicts with a requirement here, the
conflict is surfaced to the owner, not silently resolved.

## What this documents

How an Axiovex blog article is released and shared:

1. the article goes live on **axiovexsystems.com**;
2. **Tristen's personal LinkedIn** posts about it the same
   day;
3. the **Axiovex Systems company page** re-shares the
   personal post later.

The requirements below state the sequence (FR-001–003),
the ideal timing (FR-004–006), the quality bar every post
must clear (FR-007–013), the time-reference check
(FR-014), approval and control (FR-015–019), verification
(FR-020–021), and the roles of the two LinkedIn surfaces
(FR-022–023).

## Relationship to spec 007 (Michigan workforce monthly)

Spec 007 governs the workforce series' own date rule
(editions named for their data month; publish ~the 30th
~09:00 ET; personal post same day ~10:30 ET; company
re-share the following Tuesday ~09:30 ET) and its
series-specific post rules. Those continue to govern the
series. This spec governs **one-off articles** and every
other release, and it supplies the shared mechanics —
the quality bar, the time-reference check, exactly-once
discipline, and verification — to both. Two named
touchpoints, recorded rather than papered over:

- Spec 007 FR-005 carries the series' established
  five-hashtag set; FR-012 below caps one-off posts at
  three hashtags chosen for the topic.
- The series' publish day is set by the data calendar
  (~the 30th, whatever weekday that is). That is the
  FR-004 exception in action — the story's own dates
  force the day — not a violation of it.

## Functional requirements

### The share chain (sequence)

- **FR-001 — Blog first, in the morning, truly dated.**
  The article goes live on axiovexsystems.com **first**,
  in the morning — **~09:00 America/Detroit** — before
  anything is posted anywhere. The article's stated date
  is its **actual go-live date**, never a planned date
  (standing rule, 2026-10-12); if a launch moves, the
  date moves with it. The build holds future-dated
  posts, so an approved article can be committed ahead
  of its day without leaking early.
- **FR-002 — Personal LinkedIn the same day.** The
  personal post (FR-022) follows the same day at
  **~10:30 ET**, after the article is verified live
  (FR-020).
- **FR-003 — Company re-share the following Tuesday.**
  The company page re-shares the personal post with a
  short intro (FR-013) on the **following Tuesday
  ~09:30 ET** by default — the workforce series
  cadence. For one-off articles the re-share is
  staggered as needed so that two releases never stack
  into the same morning (FR-006).

### Ideal times

- **FR-004 — Publish Tue–Thu mornings.** Releases aim
  at **Tuesday–Thursday mornings** (America/Detroit),
  the strongest window for the professional audience
  the site writes for. Mondays, Fridays, and weekends
  are avoided **unless the story's own dates force
  the day** (a data-release calendar, an event date).
- **FR-005 — Time-sensitive pieces get runway.** A
  piece tied to a coming event (e.g. announced layoffs
  beginning on a known date) publishes **at least
  several days before** that event, so it can be read
  while it is still useful — never on or after the
  day it warns about, if that can be helped.
- **FR-006 — Never stack a morning.** An article
  launch, a personal post, and another article's
  company re-share never land in the same morning.
  When the calendar crowds, the re-share moves —
  it is the step with the most timing freedom.

### The quality bar (every post, every time)

- **FR-007 — Hook first.** The opening puts the stake
  in the **first two lines** — what happened, who it
  touches, why it matters — before any context or
  citation.
- **FR-008 — Plain language.** Post copy is plain
  language a general reader owns: jargon is defined
  in plain words at first use or cut; results are
  stated as what they mean, never as framework scores
  or instrument readings (standing rule, 2026-10-12).
- **FR-009 — Numbers exact and traceable.** Every
  number in a post is exact and traceable to the
  article's own sources. A figure that cannot be
  traced does not ship in the post; a discrepancy in
  the source material is reported as one, not rounded
  away.
- **FR-010 — Short paragraphs, with air.** Posts are
  built from **short paragraphs with blank lines
  between them** — no dense blocks. If a paragraph
  needs a breath in the middle, it becomes two.
- **FR-011 — Link in the first comment, never in the
  body.** The article URL is the post's **first
  comment**, posted immediately after the post. The
  post body carries **no link** (and ends by pointing
  to the first comment where that reads naturally).
- **FR-012 — At most three hashtags.** **Three
  hashtags maximum**, chosen for the topic — not a
  standing wall of tags pasted onto every post.
- **FR-013 — Re-share intros add a reason to read.**
  A company re-share intro is **one to two sentences**
  that add a reason to read (the angle, the stake,
  what is new) — never a repeat of the post's own
  opening lines.

### The time-reference check

- **FR-014 — Re-verify every relative time word at
  posting time.** Before a post goes out, every
  relative time reference in its copy — "this week",
  "last month", "today", "recently", and their kin —
  is **re-checked against the actual calendar for the
  day of posting**. This applies with full force to
  **previously approved copy being reused**: approval
  ages, and a line that was true on its approval date
  can be false on its posting date.
  **Named instance (the reason this requirement
  exists):** the robots-article personal post was
  written for Oct 15, 2026, opening "A widely shared
  post **this week**…". The post that finally fired
  was deleted by the owner; the repost on **Oct 20**
  initially carried the same line — by then the claim
  and the article were **last week's**, and "this
  week" would have been wrong in the owner's own
  name. The owner caught it; the line was corrected
  to "last week" and the live post edited in place
  (see FR-018). The check exists so the next stale
  reference is caught by the process, not by luck.

### Approval and control

- **FR-015 — Owner-approved verbatim.** Post copy is
  approved by the owner **verbatim** before posting
  and is posted **exactly as approved** — including
  line breaks and hashtags. If the composer mangles
  the formatting, it is fixed to match the approved
  text, never improvised away from it.
- **FR-016 — Posting runs from the Muse scheduler,
  never GitHub Actions.** Posting is executed by
  **owner-gated scheduler jobs carrying the verbatim
  approved text** (goal `website-seo-aeo-health-monitoring`).
  Autonomous public posting from CI is prohibited
  (owner ruling, 2026-10-20: an Action that posts in
  the owner's or the company's name lacks the control
  the act requires). Mechanical work — data refreshes,
  syncs, rebuilds, tests, report building — belongs in
  GitHub Actions; the public act of posting does not.
- **FR-017 — Exactly once.** A post is verified as
  landed by **reading the live post** — never by
  posting again. Before any retry of a failed step,
  check whether the post or re-share already exists.
  (Duplicate-send discipline, standing since the
  2026-10-13 Myrseth correction.)
- **FR-018 — Fix in place.** A post that goes out
  wrong is **edited in place promptly** (LinkedIn
  supports post edits) — not deleted and reposted —
  unless the owner directs otherwise.
- **FR-019 — A missed post is not caught up late.**
  If a scheduled post misses its window, it does
  **not** go out late on an agent's own initiative
  (owner ruling, 2026-10-20). The miss is reported as
  missed, and the owner decides whether it posts at
  all. (Instance: the Oct 14 company Signal-launch
  post and the Oct 16 company robots re-share never
  posted; on 2026-10-20 the owner closed both rather
  than catch them up.)

### Verification

- **FR-020 — Verify the article before posting.**
  Before the personal post: the article URL returns
  **HTTP 200** (success — the request was fulfilled),
  the article appears on the blog index, and it is
  present in `sitemap.xml`.
- **FR-021 — Verify every step after it happens.**
  After each step (publish, personal post, re-share)
  the result is confirmed on the live surface — the
  post visible on the profile or company feed, the
  first comment present with the correct URL — and
  the post's URL is **recorded in the run report**.
  A claim of "posted" rests on the live post, not on
  the job's exit status.

### Roles

- **FR-022 — The personal account carries the
  original.** Original posts are published from
  **Tristen's personal profile**. Axiovex stays
  low-key and subordinate to the founder's voice
  (investor-protection rule): a content post makes no
  change to profile structure, headline, or About,
  and carries no company-announcement framing beyond
  the article itself.
- **FR-023 — The company page re-shares; originals
  are for milestones.** The company page's normal
  role is **re-sharing the personal post** (FR-003).
  Original company-page posts are reserved for
  **company milestones** (e.g. the Axiovex Signal
  launch) and are individually owner-directed.

## AEE claims

- **C-028-1** — A documented share chain with fixed
  relative times (FR-001–003) makes every release
  auditable after the fact: any release can be
  checked against the sequence it was supposed to
  follow.
- **C-028-2** — The time-reference check (FR-014)
  removes a class of factual error that verbatim
  approval alone cannot catch, because approval and
  posting happen on different dates.
- **C-028-3** — Exactly-once verification by reading
  (FR-017) plus owner-gated execution (FR-016) keeps
  public acts in the owner's name singular and
  attributable.
- **C-028-4** — The quality bar (FR-007–013) is
  checkable at draft time: each requirement is a
  yes/no property of the copy, reviewable before
  approval.

## Out of scope

- Any site code change or schedule change (this
  package documents the process; the jobs that run it
  already exist).
- The workforce series' date rule and standing
  sections (spec 007 governs).
- The customer newsletter and the analytics report
  emails (their own specs and the month-end
  publication decision govern).
- Platforms other than the blog and LinkedIn.
- Profile, headline, or About changes on either
  LinkedIn surface (owner-only, item by item).
