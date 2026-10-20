# Plan: Spec 028 — Publication and sharing process

1. **Spec first.** This package (spec.md / plan.md /
   tasks.md) records the owner's 2026-10-20 direction
   to document the posting process as an AEE
   requirement: the share chain (blog → personal
   LinkedIn → company re-share), the ideal times, and
   the quality expectations for every post. It also
   records the two owner rulings of the same day that
   the process depends on: posting runs from the
   Muse scheduler, not GitHub Actions (spec.md
   FR-016), and a missed post is not caught up late
   without the owner's explicit say-so (FR-019).

2. **Docs-only.** No site code changes, no wireframe
   cycle (nothing visual changes), no new schedules.
   The jobs that execute the process already exist as
   owner-gated runonce jobs under goal
   `website-seo-aeo-health-monitoring`; this package
   is the standard they are checked against.

3. **Owner direction is the gate (tasks.md T001).**
   The requirements were stated by the owner
   item-by-item in the 2026-10-20 direction and the
   same day's rulings; no separate wireframe or copy
   approval applies to a process document. Any future
   change to a requirement is an amendment to this
   spec, made on the owner's direction.

4. **Consistency with spec 007.** The workforce
   series keeps its own date rule and series-specific
   post rules (spec 007 Amendment 4, FR-005). Spec.md
   §"Relationship to spec 007" records the two
   touchpoints (the series' five-hashtag set vs
   FR-012's three-hashtag cap for one-offs; the
   series' data-forced publish day vs FR-004) so the
   two specs read consistently instead of silently
   conflicting.

5. **Operational checklist into the skill.** A
   one-screen version of the process (sequence, times,
   quality bar, time-reference check, verification)
   is added to the local operating manual
   (`~/workspace/custom-skills/local-axiovex-management/SKILL.md`,
   §3) so an executing agent carries the checklist
   without opening the spec. The spec remains the
   normative source; the checklist is its summary.

6. **Commit on staging.** The package lands on the
   `staging` branch as a docs-only commit, pushed.
   No promotion to production is required for a spec
   package (precedent: spec packages ride the normal
   branch flow); nothing on either live site changes.
