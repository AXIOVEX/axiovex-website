# Feature Specification: Prompt-Injection Publication Package — whitepaper document, blog article, LinkedIn

**Feature Branch**: documents work lands in `AXIOVEX/shared-documents`;
website-side change (documents mirror + blog article) lands on
`staging` per spec 010; promotion is a merge `staging` → `main`.

**Created**: 2026-10-22

**Status**: WHITEPAPER DOCUMENT PUBLISHED 2026-10-22 — owner go
given 2026-10-22 ("ASAP") under the publish pre-authorization
below; FR-001…FR-005 executed and verified (see tasks.md T006/T007
for the staging + production served-identity evidence). Blog
article (FR-006) and LinkedIn (FR-007) are **not** part of this
execution and remain gated.

**Direction (owner, 2026-10-22)**: publish the prompt-injection case
(research run of 2026-10-22; primary record
`~/workspace/research_notes/mpcodec-edge-stt-speaker-tts-20261022-2210/`)
as an Axiovex publication package: a whitepaper in the /documents/
area, a blog article telling the story, and the Spec 028 LinkedIn
sequence. Title "Endorsed by Experts" (FR-008, owner pick). Plain
language; every fact traceable to the primary record or an original
disclosure; no capability or compliance claims beyond what the
record supports.

## Authorization — whitepaper document (owner, 2026-10-22)

- **Scope: the document upload only.** Once the whitepaper PDF is
  final — approved text (FR-001) typeset in the Axiovex branding
  system (FR-002) — it publishes **without a second publish
  approval**. Blog (FR-006) and LinkedIn (FR-007) remain gated as
  normal.
- **Route:** file the PDF in `AXIOVEX/shared-documents` with a
  `docs.json` manifest entry (title, category, description, order —
  same shape as the two AI 101 entries) → the website build mirrors
  it into `/documents/files/` and renders its card on `/documents/`.
  **Staging verification first (FR-004), then production (FR-005).**
- **Served-identity verification (the publish is not done until
  all pass):**
  1. Card present on https://axiovexsystems.com/documents/ with the
     approved title and description.
  2. The PDF serves **200** with content type **application/pdf**
     at its `/documents/files/` URL.
  3. The served file is proven to be the **final branded build** by
     a content marker only the final has — the branded title page
     and the "© 2026 Axiovex Systems, LLC. All rights reserved."
     footer in the served bytes — **not** by liveness (a 200 alone
     proves nothing about *which* file is served).
  4. Discoverability consistent with the existing documents: the
     site build's indexes and the documents treatment in llms.txt /
     sitemap match how the AI 101 documents are handled — no
     better, no worse, no orphan.
- **MATERIALITY CAVEAT (binding):** this pre-authorization assumes
  the document the owner has been reviewing — the MPCodec
  first-draft lineage. The **Corrections list at the top of the
  polished draft is the materiality evidence** for that judgment.
  **If the polished text changes anything material beyond that
  list, the diff is surfaced at the owner's gate BEFORE publishing
  instead** — the pre-authorization does not carry it.
- **Owner ruling recorded 2026-10-22 (materiality trail):** the
  polish had dropped the first draft's "signed-out" detail; the
  owner ruled it accurate by design (the deep-research agent runs
  isolated and signed-out — no accounts, no sign-in, no access to
  the user's data) and directed its restoration. It is restored in
  §2 and §5 of the final text and recorded as item 9 of the
  Corrections list, with its basis.

## Scope — requirements

- **FR-001 — Whitepaper text.** Polished from the MPCodec first
  draft against the primary record; payload reproduced verbatim as
  evidence; the four documented cases (EchoLeak, Slack AI, arXiv
  hidden prompts, "Invitation Is All You Need") each cited to its
  original disclosure in a sources section; intent stated as
  unproven; "what stopped it" stated as an event record, **never**
  as a capability/compliance claim. Includes the owner-ruled
  signed-out restoration (see Authorization).
  **Acceptance: GATE** — owner approval (given 2026-10-22 with the
  go + the signed-out ruling).
- **FR-002 — Branded PDF production.** The published PDF is
  typeset in the **Axiovex branding system**, reference example =
  the AI 101 handout
  (https://axiovexsystems.com/documents/files/ai-101-handout.pdf),
  verified from the file: deep navy **#081F32** primary, steel
  **#405B70** secondary, electric cyan **#00DEF6** accent,
  near-white **#F7FCFF** background; **Noto Sans** body text,
  **Noto Serif Bold** display headings; footer "© 2026 Axiovex
  Systems, LLC. All rights reserved."
  **Acceptance: TEST** — rendered visual check of the final PDF
  against the handout reference (palette, typefaces, footer, title
  page); the title page + © footer double as the served-identity
  content marker in FR-005.
- **FR-003 — Documents-area filing.** PDF + `docs.json` manifest
  entry in `AXIOVEX/shared-documents` (build sources under its
  `src/whitepaper/` convention; manifest fields: category,
  description, file `docs/<name>.pdf`, order, title). Filename
  `endorsed-by-experts-prompt-injection.pdf`.
  **Acceptance: TEST** — manifest parses; website build mirrors
  the file to `/documents/files/endorsed-by-experts-prompt-injection.pdf`
  and renders the card; existing two documents' cards unchanged.
- **FR-004 — Staging verification (document).** On the staging
  deployment: card on /documents/ with the approved
  title/description; PDF 200 + application/pdf; served bytes
  contain the FR-002 content markers; rendered screenshots of
  /documents/ at desktop and mobile widths.
  **Acceptance: TEST.**
- **FR-005 — Production publication (document only;
  pre-authorized per §Authorization).** Promote per spec 010
  (merge `staging` → `main`; `robots.txt` diff empty; `_headers`
  diff = production's security file only). Then the full
  served-identity verification of §Authorization on production.
  **Acceptance: TEST** — all four served-identity checks pass on
  production and are recorded in the run record. **No second
  approval gate** — the materiality caveat holds (the only
  post-polish change is the owner-ruled item 9, recorded above).
- **FR-006 — Blog article.** `blog/posts/<go-live-date>-endorsed-by-experts.md`
  (front matter per blog/README.md; slug `endorsed-by-experts`),
  written in the site's established article voice, telling the
  story for a general reader, linking the whitepaper at its
  /documents/files/ path. True publication date set at the gate.
  Content-only on the existing blog template — **no UI/UX change,
  no wireframe change**.
  **Acceptance: GATE** — owner approves the draft, reviews the
  rendered article on staging, and sets the date. NOT covered by
  the document pre-authorization. **Not in the 2026-10-22
  execution.**
- **FR-007 — LinkedIn sequence (Spec 028).** Personal post
  (Tristen) same day as the article ~10:30 ET, article link in
  the **first comment**; Axiovex Systems company-page re-share
  the following Tuesday ~09:30 ET with a 1–2 sentence intro and
  its own first-comment link; ≤3 hashtags; time-reference re-check
  on each posting day.
  **Acceptance: GATE** — copy owner-approved verbatim, posted only
  under his direction for those items. NOT covered by the
  document pre-authorization. **Not in the 2026-10-22 execution.**
- **FR-008 — Title.** "Endorsed by Experts".
  **Acceptance: HUMAN-AS-ORACLE** — owner's pick (recorded
  2026-10-22); propagated to the PDF title page, the docs.json
  title, and (later) the blog title and LinkedIn copy.
- **FR-009 — Claims discipline (skill §2.4).** No statement
  anywhere in the package may assert: a standing Axiovex security
  capability or compliance posture; the flagged page's publisher's
  intent; a second occurrence of the payload; or any case fact not
  in its original disclosure.
  **Acceptance: TEST** — final texts scanned against the
  Corrections list and the sources section before each gate; any
  hit blocks the gate.

## Publication mechanics (documents area)

1. Produce the final PDF from the approved markdown (FR-001) in
   the branding system (FR-002). Build source lives with the
   document's sources in shared-documents (`src/whitepaper/`) so
   the PDF is reproducible.
2. Add the PDF under `docs/` in `AXIOVEX/shared-documents` + a
   `docs.json` entry (order after the two AI 101 entries).
3. The website build mirrors shared-documents into
   `/documents/files/` and regenerates `/documents/` (site-sync
   automation: repository_dispatch / 15-minute poll of
   shared-documents HEAD; `workflow_dispatch` of site-sync.yml
   against a branch builds and commits that branch's mirror). The
   generated mirror rides the website repo's normal staging →
   production flow; never hand-edit generated output.
4. Verify staging (FR-004), promote (FR-005), verify production
   served identity (§Authorization checks 1–4).

## Verification summary

- **Staging:** /documents/ rendered screenshots (desktop +
  mobile); card title/description; PDF 200 + application/pdf;
  content markers in served bytes.
- **Production:** the four served-identity checks of
  §Authorization, recorded with timestamps.
- **Guards on promotion:** `robots.txt` diff empty; `_headers`
  diff = production's file only (spec 010 FR-004 pattern).
