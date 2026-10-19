# Plan and analysis — Spec 026

## Implementation

1. Preserve the recovered report byte-for-byte. Retain the original source
   inventory privately and exclude it from all public files and links. Document
   the missing source and raw records in both the article and README.
2. Reuse the approved WF-18 article block and current main shell. Update the
   publication date independently of the retained October 13 study snapshot.
3. Externalize the original tracker script without changing a data byte.
   Append scoped link styles to an otherwise exact copy of styles.v38.css,
   shipped under styles.v39.css.
4. Check artifacts, protected files, original data, browser rendering,
   controls and download bytes with the actual production CSP enforced.
5. Evaluate atomic publication claims if AEE is available. Record an explicit
   tooling limitation if it is not; never invent a passing assessment.
6. Freeze a reviewed allowlist and per-file SHA-256/Git-blob manifest outside
   the published tree. Root performs bounded GitHub connector writes, records
   acknowledgments, reads back each tree/commit/ref, and verifies deployments.

## Branch protocol

Recovery observed main `a43d821a5166a97e60ef686eb9e520527c81e23b`, tree
`36daedae805738d4d20b2640e54b30370dbd66d9`, and staging
`12338a5a8560b428bc1b064b3fe8e465bc5b8a65`, tree
`a7e5f46db45acc2f12dc0eb12779675be59c6c8f`.
Main contains new operations/newsletter work; do not overwrite it with the
older staging tree. Re-read both refs before each mutation.

Sync latest main into staging with a genuine merge preserving the existing
staging `_headers` and `robots.txt`. Apply only the reviewed publication paths
to that base. Verify https://axiovex-website-staging.pages.dev/research/ and its file
hashes. Promote selected publication paths onto the latest main, excluding
the staging guards, and verify https://axiovexsystems.com/research/.
The existing Pages projects deploy committed root output with no build step.
New operations workflows in main do not authorize email sends from this task.

## Risk resolution

- Missing raw records: visible archival limitation and no unavailable links.
- Old validation statements: preserved inside the exact historical report,
  explicitly distinguished from current reproduction in surrounding copy.
- Scope drift: no public-study identifier is assigned to formalization035;
  historical board arrays and verdicts remain byte-identical.
- Lost intermediate state: the root publication process checkpoints bounded
  remote acknowledgments before proceeding; local hashes are not remote proof.
- Wireframe scope: existing approved component reuse only; no wireframe file
  is changed or included in the allowlist.
- Test isolation: browser QA never submits a contact or newsletter form.

## Later runtime update

Append fresh runtime evidence to the same October 19 article, specifying the
exact surviving source baseline, environment versions, commands and outcomes.
A successful baseline rerun cannot be labeled a recovered035 reproduction.

## Publication checkpoint refresh

Before publication, root re-read main at
`263067ffc348f268cacb911f50fb3313cd627168` and synchronized that main into
staging without changing the existing crawler guards. The prepared article
checkpoint targets staging `bdb6fe2f39dc4f9ee9876e9f4a6c70fb10aecc6b`, tree
`4b1918725de901440bd3daf502fe1038fe75f310`. Both refs must be checked again
before mutation. Only the reviewed publication paths are applied; protected
files and unrelated concurrent changes come from the current destination tree.

## Publication-scope correction

The reviewed public package contains only the recovered report, its current
availability note and their publication checksums. The original private source
inventory is excluded, including from links, release manifests, evidence and
other attachments. The preceding private checkpoint is preserved for audit;
this corrected package uses a new checkpoint and does not republish it.

## Completed initial deployment and runtime continuation

The initial report was published to staging commit
`c9f88f0df70a11bebdfd45315dddf1a68493b16b`, then merged to production through
PR #7 at `f53c2499afa06c4a3326e240ca7a0653a7742b27`. Actual HTTPS asset,
crawler-header and cloud-browser interaction checks passed for both. The
production zone performs its existing contact-email obfuscation: both tokens
decode to the expected contact address, the known same-origin decoder is the
only script insertion, and the remaining HTML matches the frozen bytes.
No Cloudflare or security setting was changed to accommodate that behavior.

The eight frozen runtime assets were separately committed to staging at
`652a64985e21bbcbec659f67dd2e47b036ae3485`, tree
`8a4fa2c9a1ad1a46651b277d8923bf00de1bab76`. The new article checkpoint starts
from that stage and changes only reviewed publication paths. Production is
prepared from the latest main and retains unrelated concurrent changes.

Append the runtime results to the same October 19 article. Keep the original
findings byte-identical, update its current availability note, and bind the
eight runtime assets plus their new README in a download checksum manifest.
The runtime ZIP and eight staged asset bytes are immutable. Verify all linked
files, the exact result counts, the partial-stdout disclosure, the missing035
boundary, unchanged tracker behavior and desktop/mobile rendering under CSP.
Then rerun the atomic website AEE claims against those current verification
receipts. Source integration remains a separate open engineering task.
