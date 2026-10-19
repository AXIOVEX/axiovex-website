Runtime repair and fresh validation — recovery revision 2
Publication date: October 19, 2026

SCOPE
This package repairs missing local runtime dependencies and supplies fresh
validation of the surviving feature-034 baseline plus the runtime changes.
Baseline commit: 8409f6506bd7c96ab44e44770537e349f1fcfdd1
Baseline tree:   9e45fdaa026b0a7c338de91e0b73da99b0848fda
The unavailable feature-035 source and full raw results were not reconstructed
or freshly replayed. The original recovered findings remain a separate
archival publication. Detailed private-source and test-case inventories are
excluded from these public downloads.

START HERE
Read convergence.md for the repairs, results and limits. Read runtime-setup.md
for portable setup and rerun commands. The ZIP is an engineering overlay and
small patch requiring an existing checkout of the exact baseline; it is not a
standalone copy of the private source repository. The ZIP's README describes
how to apply the overlay and check the four-file patch in an isolated checkout.
Use a new external runtime directory and fresh evidence destinations.

FRESH RESULTS
Python 3.11.17: 222 passed, zero failures/errors/skips; 7/7 experiment checks.
Python 3.12.15: 222 passed, zero failures/errors/skips; 7/7 experiment checks.
Each test matrix contains 211 existing cases and 11 new runtime regressions.
Both Python bootstraps verified 31 distributions and their import origins.
An independent Python 3.12 cold-cache bootstrap passed.
Lean 4.33.1: 40 build jobs passed; 22 proof/configuration files unchanged.
Graphviz: locked local packages and actual PNG/SVG rendering passed.
Spec Kit 1.0.8: immutable source and locked dependency installation passed.
Baseline SDD/content/AEE governance: 27/27 commands passed in an isolated copy.
Runtime AEE: all four checkpoints passed; independent engineering review passed.
The staged Docker/CI dependency boundary reproduced the original missing-local-
package failure and passed after the repair. No Docker image was built here.

CONSOLE-CAPTURE LIMIT
The Python 3.12 stdout artifact contains 54 progress bytes, not the complete
console output or a final total. Successful completion is established by the
observed process exit code 0 and the independently parsed retained JUnit
record: 222 tests, zero failures, errors or skips. The separate focused
python312-test-completion.json binds these facts without publishing the
private case inventory. The package was already frozen when that explanatory
receipt was added, so this receipt is a separate download, not a ZIP member.
Do not interpret the package README's general reference to console totals as
a claim that the Python 3.12 console capture contains its completion line.

AVAILABLE FILES IN THIS DIRECTORY
runtime-repair-and-validation-036.zip — new runtime overlay, minimal engineering
  patch and focused evidence. SHA-256:
  4dfca5d28d5fc1655c4e987fcce41963cb269d68efb80478199d0079909f190f
  Size: 268,828 bytes. It contains 212 ZIP entries; its manifest covers the
  other 211 files. It excludes the old private full-source inventory.
runtime-validation-summary.json — exact baseline, versions, command outcomes
  and evidence hashes. Read it with the separate Python 3.12 completion note.
runtime-release-manifest.json — checksums of the 211 newly published package
  files. This is not an inventory of the private source baseline.
package-verification.json — archive-manifest and four-file patch verification.
public-scope-audit.json — the focused package's publication-scope audit.
python312-test-completion.json — aggregate completion evidence and explicit
  partial-stdout limitation, supplied separately from the frozen ZIP.
convergence.md — readable repair/results/limits account.
runtime-setup.md — portable installation and validation commands.
README.txt — this current download and availability note.
download-checksums.json — size and SHA-256 of the nine other files listed above.

REMAINING BOUNDARIES
Source integration and required current-head source CI remain open. Website
publication does not merge source changes. A Docker daemon was unavailable;
only the exact Python dependency-install boundary was executed in a fresh
staged environment. The Docker base image and apt layer are outside the Python
artifact lock; Graphviz still uses inventoried host libraries. The frozen
feature-033 replay passes declared tolerances, not bitwise equality of every
floating-point output. No new physical measurement, theorem or closure of the
14 broader reconstruction targets is claimed. Earlier conversation reports
of 300 tests have no surviving raw logs and are not counted as current evidence.
