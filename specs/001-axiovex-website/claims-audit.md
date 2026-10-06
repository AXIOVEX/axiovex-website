# Claims audit record — spec 001 T013 + T016

Executed 2026-10-06. Method: every factual assertion extracted from the
privacy policy and the claim families in scope, checked against (a) live
response behavior (curl sweeps of every page type), (b) zone/account
configuration read through the Cloudflare API with the "Axiovex Ops"
token, (c) the served HTML/JS of every page type, and (d) the project
records (spec 005 record, memory/2026-09-29.md). Verdicts are CONFIRMED,
CONTRADICTED, NARROWED, or FLAGGED (owner-only fact; left unchanged).
Copy only ever moves in one direction: narrower (constitution §I).

## T013 — Privacy assertions vs actual Cloudflare behavior

| # | Assertion (privacy/index.html unless noted) | Verdict | Evidence |
|---|---|---|---|
| P1 | §2 "The Site has no accounts or newsletter sign-ups." | CONFIRMED | Static site; no account or newsletter mechanism exists in any page source. Intake is email + the spec 005 form only. |
| P2 | §2 Information you provide: name, email, message contents via email or the form | CONFIRMED | Spec 005 record: form fields are exactly name / email / company (optional) / topic / message. |
| P3 | §2 "The contact form is protected by Cloudflare Turnstile, a spam check run by Cloudflare." | CONFIRMED | Turnstile widget "Axiovex Contact — Production" (Managed, hostname axiovexsystems.com); contact page loads `challenges.cloudflare.com/turnstile/v0/api.js` and renders explicitly; server-side Siteverify enforced, fail-closed (spec 005). Cloudflare's published position is that Turnstile does not use cookies to collect or store information; observed surface on the local build: script + iframe from challenges.cloudflare.com only, zero cookies set. |
| P4 | §2 "The form delivers your message to our mailbox, and we do not store form submissions anywhere else." | CONFIRMED | Spec 005: the function stores nothing, `saveToSentItems: false`, logs only Graph status codes. Production E2E verified 2026-10-05 and re-verified 2026-10-06 (one approved test, delivered to Start, deleted after evidence). |
| P5 | §2 Automatically collected: hosting provider processes IP address, browser type, pages requested | CONFIRMED, disclosure completed | Cloudflare Pages processing is inherent to serving the site; zone read via API 2026-10-06 (SSL mode Full, security level medium, Browser Integrity Check on). **Gap found and fixed:** the policy described only the provider's processing; Axiovex itself reviews aggregate statistics from these logs (spec 006 reporting). Sentence added: "We review aggregate statistics derived from this technical data — for example, how many requests each page receives — to operate the Site." |
| P6 | §2 "We do not combine this data with any other personal information." | CONFIRMED | Operator practice; no mechanism combines log data with form data — the spec 006 fetcher reads aggregate GraphQL counts only. |
| P7 | §2 "We do not use cookies, analytics, advertising pixels, or other tracking technologies on the Site." | CONFIRMED in served behavior; wording NARROWED | Cookies: zero `Set-Cookie` on every page type across repeated curl sweeps; no `document.cookie` writes in any site script. Tracking/pixels: no third-party script loads anywhere; the only external origin on any page is challenges.cloudflare.com (P3). **Analytics wrinkle:** Cloudflare Web Analytics (RUM) is *configured* for this zone with `auto_install: true` and an enabled injection ruleset (site created 2026-09-29) — but the beacon is empirically NOT injected into any served page (all 8 page types fetched and searched: zero `beacon.min.js` / `cloudflareinsights` occurrences; the auto-install does not inject into this Pages-served site today). The unqualified word "analytics" also sat next to the spec 006 log reporting (P5). Copy narrowed: "analytics" → "**analytics scripts**", which is exactly what is true of the Site's pages. The armed RUM configuration remains an owner action (residual R-1b): the ops token cannot change RUM config (API PUT → 403, no Web Analytics edit permission); owner can disable auto-install in the dashboard (Web Analytics → axiovexsystems.com site → disable automatic setup) or extend the token. |
| P8 | §2 functional storage (banner dismissal, panel state) | DISCLOSED (was undisclosed) | Spec 012 dismissal memory is localStorage; spec 008 widget/panel state is session storage — on-device functional preferences, never transmitted, not tracking. Sentence added to the "What we do not collect" paragraph. |
| P9 | §3 Use purposes; §3/§7 no advertising use, no sale/sharing for marketing | CONFIRMED | Operator practice statements; no advertising or marketing integration exists in the platform behavior. |
| P10 | §4 Sharing: service providers (Cloudflare hosting, email provider) | CONFIRMED | Architecture: Cloudflare Pages + Microsoft 365 mailbox via Graph (spec 005). |
| P11 | §5 Retention: provider logs "subject to that provider's own retention practices" | CONFIRMED | No specific retention period is promised anywhere. |
| P12 | §6 "encrypted (HTTPS) connections to the Site" | CONFIRMED | HTTPS on every page; zone SSL Full, TLS 1.3 on. T014 now also sends HSTS from the site itself. Observation only: zone `min_tls_version` is 1.0 — no copy depends on it; raising it is a zone-setting decision left to the owner. |
| P13 | §10 Do Not Track: "the Site uses no tracking technologies" | CONFIRMED | Consistent with P7 as narrowed. |
| P14 | Contact page microcopy: "The spam check is run by Cloudflare Turnstile" / "Sent to our Start mailbox; a founder replies." | CONFIRMED | P3 + P4; spec 005 record (evidence cell completed at restoration — see the T016 restoration note below). |

## T016 — Claim families: substantiate or narrow

**Restoration note (2026-10-06):** the T016 table originally written
with this record was lost at write time — the committed file ended
mid-row at P14 followed by a literal truncation marker, and the T016
section never reached git (the file has a single commit, 249d02b).
This section is restored the same day from the surviving records
(tasks.md T016, spec.md R-1c, and the live texts) and states rows only
at the granularity those records support.

At audit (2026-10-06): 10 claim groups — 6 SUBSTANTIATED, 1 NARROWED,
2 FLAGGED unchanged — plus 1 awareness item outside the four families.
No claim was strengthened. Owner dispositions later the same day:

| # | Claim (location) | Verdict at audit | Disposition |
|---|---|---|---|
| C-gov | FAQ "Do you work with government or defense organizations?" (index.html, visible + JSON-LD) | NARROWED | The unqualified "Yes." was removed in both renderings; the answer now states the membership facts and support for organizations pursuing government contracts, including CMMC readiness — what the record supports. |
| C-mem | APEX Accelerator + Velocity membership statements | SUBSTANTIATED | Basis: owner-directed statements recorded 2026-09-29. |
| C-cmmc | CMMC-adjacent content (FAQ; llms.txt) | SUBSTANTIATED | Self-limiting readiness language only ("we aren't assessors"; "not a CMMC assessor"); no certification, accreditation, or compliance status claimed. |
| C-data | Local-data practice claim — FAQ "How do you handle our data?": "your data stays on your floor, under your control, processed locally — not shipped to third-party clouds. We don't train shared models on client data." (visible + JSON-LD renderings) | FLAGGED (owner-only fact; left unchanged) | **SUBSTANTIATED 2026-10-06** — basis: owner-confirmed practice, Tristen Pierson, 2026-10-06. Stands as published; no copy changed. Residual R-1c CLOSED. |
| C-llms | llms.txt, "Notes for AI assistants": "no training shared models on client data" | FLAGGED (owner-only fact; left unchanged) | **SUBSTANTIATED 2026-10-06** — basis: owner-confirmed practice, Tristen Pierson, 2026-10-06. Stands as published. Residual R-1c CLOSED. |
| C-jobs | Jobs/education FAQ verb: "partner with educators and workforce organizations" (visible; JSON-LD: "partners with") — awareness item outside the four families; no record basis for "partner" located | Awareness item | **NARROWED 2026-10-06** → "work with educators and workforce organizations" (visible) / "works with educators and workforce organizations" (JSON-LD); shipped in the R-1c/R-1d closure pass. |

The remaining SUBSTANTIATED groups from the audit (services and
design-approach copy within the four families) are carried by the
tasks.md T016 record — 6 groups substantiated at audit; their per-row
text was in the lost table and is not reconstructed beyond that
record.