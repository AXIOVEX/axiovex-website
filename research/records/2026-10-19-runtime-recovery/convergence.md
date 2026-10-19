# Recovery revision 2 — local convergence

The missing local runtime dependencies are repaired and the fresh local checks pass. The publication boundary remains explicit: this is validation of the surviving feature-034 baseline plus the new runtime repair. Unavailable feature-035 source and raw results have not been reconstructed or freshly replayed.

## Observed results

| Check | Fresh retained result |
|---|---|
| Original tracked baseline verification | All 1,031 Git blobs matched before engineering edits |
| Frozen source preservation after repair | All 1,027 tracked files outside the four explicit engineering edits remain identical |
| Python 3.11.17 bootstrap | Pass; 31 distributions, exact locked versions and valid import origins |
| Python 3.12.15 bootstrap | Pass; 31 distributions, exact locked versions and valid import origins |
| Independent Python 3.12 cold-cache bootstrap | Pass |
| Python 3.11 full experiment/control/replay checks | 7/7 pass, including `run_all.py`, frozen feature 033 replay and feature 034 verification |
| Python 3.12 full experiment/control/replay checks | 7/7 pass, covering the same commands |
| Python 3.11 complete pytest suite | 222 passed; zero failures, errors or skips |
| Python 3.12 complete pytest suite | 222 passed; zero failures, errors or skips |
| Test composition | 211 existing cases plus 11 new runtime failure-mode regressions in each matrix |
| Lean 4.33.1 | 40-job build passes; all 22 proof/configuration files unchanged; no proof placeholders |
| Graphviz | Locked local install, resolved libraries, real PNG and SVG rendering pass |
| Pinned Spec Kit 1.0.8 | Immutable archive and dependency installation, source identity, `pip check` and `specify --help` pass |
| Baseline SDD/content/AEE governance | 27/27 commands pass in an isolated copy |
| Runtime feature AEE | Specify, plan, tasks and implementation checkpoints pass; implementation challenge has no failures |
| Exact Docker/CI Python-install boundary | Missing-package control fails as expected; package COPY repair and both hash-locked installation phases pass |
| Independent engineering review | Pass; no blocking findings |

Each Python matrix uses a separate snapshot with retained command logs and an input manifest. The package imported from the active checkout is byte-identical to the package in those snapshots; the frozen package sources remain unchanged. The snapshot records disclose engineering documentation/CI edits that occurred while long checks ran. Final helper execution and the independent staged-install review cover the completed runtime code. Remote current-head CI has not been represented as executed.

## Repairs made

The Python bootstrap starts with an unseeded environment, installs complete artifact-hash locks, installs the real local package with the locked build backend, and validates distribution metadata and import origins. It refuses to reuse an existing environment or accept a partial lock, foreign import, unexpected version, duplicate distribution, malformed metadata or inherited system packages. The original Dockerfile's editable path is now copied before dependency installation; Docker and CI use the same locked backend and complete dependency set. CI selects exact Python patch releases. Spec Kit is installed from a verified immutable commit archive rather than a mutable tag.

The first two bootstrap probes exposed an empty generated egg-info directory left after preserving untracked files. Removing that empty directory changed no tracked file. Both failed receipts remain retained, and a new regression covers malformed metadata. A governance preflight initially compared raw directory contents, including untracked caches; it stopped before executing a governance command. The corrected preflight uses the verified Git-tracked inventory, and all subsequent governance commands pass. The staged missing-package failure is retained as the negative control for the Docker repair.

## Remaining boundaries

The new installer hashes identify recovery revision 2, not the unavailable earlier implementation. Prior conversation reports of 300-test runs have no surviving raw logs in this workspace and are not counted as evidence for this recovery. The fresh result is 222 tests on each supported Python version. A frozen feature 033 replay passes its declared tolerances; it is not independent empirical evidence or a claim of bitwise equality of every floating-point output.

No Docker daemon was available. The exact Python dependency-install boundary was executed in a fresh staged environment; no Docker image build or container execution is claimed. Graphviz's locked packages still use explicitly inventoried host libraries. The Docker base image and apt layer are outside the Python artifact lock.

The public recovery bundle contains newly authored runtime fixes, focused execution evidence and a small patch for the four necessary existing-file edits. Detailed private-source inventories, existing test-case inventories and expanded historical scientific assessments are retained locally and excluded from public downloads. This limitation is explicit rather than replacing those records with invented public evidence.

Source integration and its required current-head CI remain open under task T10. Publishing this engineering bundle on the company website does not merge the private source repository. No new physical study, empirical measurement, theorem or closure of the 14 broader reconstruction targets is claimed.
