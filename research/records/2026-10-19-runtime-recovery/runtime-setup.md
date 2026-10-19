# Reproducible runtime setup — recovery revision 2

This repair replaces reliance on missing local packages with explicit, inspectable setup commands. It was rebuilt after a transient workspace was lost. The surviving repository was verified against commit `8409f6506bd7c96ab44e44770537e349f1fcfdd1`, tree `9e45fdaa026b0a7c338de91e0b73da99b0848fda`: all 1,031 tracked files matched before the four intentional engineering edits. Untracked checkpoint, cache and egg-info files were preserved separately. No missing feature 035 source or raw result is recreated by this repair.

The new installers and lock files are recovery revision 2. Their hashes need not match the unavailable first implementation. The current validation receipts describe fresh execution of the available baseline and new runtime regression tests; previous test counts quoted in chat are not substituted for those receipts.

## Supported runtime

| Component | Verified configuration |
|---|---|
| Python matrix | CPython 3.11.17 and 3.12.15, Linux x86_64 |
| Resolver and interpreter catalogue | uv 0.12.23; executed binary hash retained in each bootstrap receipt |
| NumPy / SciPy on Python 3.11 | 2.4.6 / 1.17.1 |
| NumPy / SciPy on Python 3.12 | 2.5.4 / 1.18.1 |
| Shared direct checks | SymPy 1.14.0, pytest 9.1.1, AEE 1.4.0 |
| Python dependencies | Complete version and SHA-256 artifact locks in `locks/python311.lock` and `locks/python312.lock` |
| Editable package | This checkout's `packages/constraint-research`, version 0.1.0 |
| Spec Kit | 1.0.8, immutable upstream commit `0cc9a6a1159471a3108b9bad718ba17006dd6039`, exact archive and dependency hashes |
| Graphviz | Eleven locked Ubuntu 24.04 amd64 packages plus explicitly inventoried host shared libraries |
| Lean | Lean 4.33.1, bundled Lake, exact official release archive hash |

The frozen `requirements.txt`, `requirements-dev.txt` and scientific source files remain unchanged. Matrix constraints are derived from the complete hash locks. The constraints are convenient for the final editable installation; the complete locks determine the installed distribution set and build backend.

## Clean Python environments

Run from a checkout containing the baseline and this repair. The host must already provide Python 3 and uv 0.12.23. The bootstrap checks the uv version and records its executable hash. Choose a new writable runtime directory outside the source tree. Each destination and evidence directory must be absent; a failed environment is retained for inspection and a new destination is used for a corrected attempt.

```bash
RCPH_RUNTIME=/absolute/path/to/new/rcph-runtime
mkdir -p "$RCPH_RUNTIME"
python3 scripts/bootstrap_python036.py \
  --python 3.11 \
  --destination "$RCPH_RUNTIME/python311" \
  --evidence "$RCPH_RUNTIME/evidence-python311"
python3 scripts/bootstrap_python036.py \
  --python 3.12 \
  --destination "$RCPH_RUNTIME/python312" \
  --evidence "$RCPH_RUNTIME/evidence-python312"
```

The installer uses a new unseeded virtual environment, verifies every dependency against its artifact hash, and installs the actual local package with the already locked build backend. It then runs `pip check`, records imported module locations and every installed distribution, and rejects malformed or duplicate metadata, unexpected versions, inherited system packages and imports from another workspace. Do not point the interpreter at somebody else's site-packages or reuse a half-populated environment.

The first recovery attempts exposed an empty untracked egg-info directory left by quarantine. Its metadata had no package name. Those failed receipts are retained under `evidence/python-bootstrap311` and `evidence/python-bootstrap312`; the empty generated directory was removed, malformed metadata now receives an explicit diagnostic, and the final attempts are recorded in the corresponding `*-final` directories. No tracked file was removed to correct that issue.

## Graphviz

The local Graphviz installer supports Ubuntu 24.04 on x86_64. It downloads the locked official packages, checks sizes and SHA-256 hashes, extracts them under the chosen destination, constructs the plugin-aware wrapper, checks shared-library resolution, and renders actual PNG and SVG files. It does not install packages into the host. The host's remaining native dependencies are inventoried in the receipt; this is not a fully self-contained operating-system image.

```bash
python3 scripts/bootstrap_graphviz036.py \
  --destination "$RCPH_RUNTIME/graphviz" \
  --evidence "$RCPH_RUNTIME/evidence-graphviz"
export PATH="$RCPH_RUNTIME/graphviz/bin:$PATH"
dot -V
```

## Pinned Spec Kit

Spec Kit uses a separate Python 3.12 dependency lock. Its installer verifies the official archive's exact size and SHA-256 digest, installs hash-locked runtime and build dependencies, installs from the verified immutable source with no dependency or build-backend re-resolution, records the installed source identity, and runs the real `specify --help` console entry point.

```bash
python3 scripts/install_spec_kit036.py \
  --python "$RCPH_RUNTIME/python312/bin/python" \
  --evidence "$RCPH_RUNTIME/evidence-spec-kit"
export PATH="$RCPH_RUNTIME/python312/bin:$PATH"
specify --help
```

The dependency lock is in `locks/spec-kit312.lock`; `spec-kit-lock.json` identifies the official commit and archive. Do not replace the immutable source URL with a mutable branch or tag. Spec Kit adds its own distributions to this environment, so the original base-bootstrap receipt describes the environment before that explicitly recorded addition. This recovery used a separate environment for Spec Kit while the scientific matrices ran.

## Lean 4.33.1

The official Linux archive is pinned to SHA-256 `890afd185370f85666025b883914ab4f4b339136f8c96167b69cfb62aecaf235`, 570,405,234 bytes. The retained release metadata, exact extraction command and full build logs are under `evidence/lean`. An ordinary Linux setup can use:

```bash
mkdir -p "$RCPH_RUNTIME/lean"
curl --fail --location \
  https://github.com/leanprover/lean4/releases/download/v4.33.1/lean-4.33.1-linux.tar.zst \
  --output "$RCPH_RUNTIME/lean/lean-4.33.1-linux.tar.zst"
printf '%s  %s\n' \
  890afd185370f85666025b883914ab4f4b339136f8c96167b69cfb62aecaf235 \
  "$RCPH_RUNTIME/lean/lean-4.33.1-linux.tar.zst" | sha256sum --check -
tar --no-same-owner --zstd \
  -xf "$RCPH_RUNTIME/lean/lean-4.33.1-linux.tar.zst" \
  -C "$RCPH_RUNTIME/lean"
export PATH="$RCPH_RUNTIME/lean/lean-4.33.1-linux/bin:$PATH"
lean --version
lake build
```

Run the build in an isolated checkout when preserving the working tree's generated artifacts matters. The retained `evidence/lean/rebuild.py` is the exact execution record for this recovery and contains its original workspace locations. The commands above are the portable setup instructions. This recovery needed approved host execution for the native Lean launcher; it did not alter Lean source to accommodate the restricted launcher.

## Rerun the available campaigns

The validation runner copies source into a new external snapshot, creates separate logs for every command, and retains an input manifest. Mutation-producing checks write into the snapshot. Each invocation requires a new snapshot and evidence directory.

```bash
python3 scripts/validate_runtime036.py \
  --python "$RCPH_RUNTIME/python311/bin/python" \
  --snapshot "$RCPH_RUNTIME/source311-experiments" \
  --evidence "$RCPH_RUNTIME/checks311-experiments" \
  --graphviz-bin "$RCPH_RUNTIME/graphviz/bin" --phase experiments
python3 scripts/validate_runtime036.py \
  --python "$RCPH_RUNTIME/python311/bin/python" \
  --snapshot "$RCPH_RUNTIME/source311-tests" \
  --evidence "$RCPH_RUNTIME/checks311-tests" \
  --graphviz-bin "$RCPH_RUNTIME/graphviz/bin" --phase tests
```

Repeat with the Python 3.12 interpreter and distinct `312` paths. The experiment phase runs the control audit, reusable-framework verifier, pre-experiment candidate verification, complete `run_all.py`, frozen feature 033 replay and verifier, and feature 034 verifier. The test phase runs the complete pytest suite with JUnit counts. A feature 033 replay uses its declared tolerances; passing is not a claim that all floating-point leaves are byte-identical. Neither matrix can replay feature 035 without the original missing files.

Run the required SDD/content verifiers and feature AEE scripts as listed in `.github/workflows/ci.yml`, with the chosen environment's `bin` directory on `PATH`. For this recovery, the independent governance receipt contains all 27 baseline commands and their actual outputs. Run `python scripts/run_framework036_aee.py` for this engineering feature's four governance checkpoints. AEE governance assessments are separate from scientific correctness or runtime execution evidence.

## Docker and CI repair

The original Dockerfile installed `requirements-dev.txt` before copying `packages/constraint-research`, although the requirements contain an editable reference to that path. The repaired Dockerfile copies the package first. Both Docker and CI now install the complete matching hash lock, then install the frozen requirements with their version constraints, `--no-build-isolation` and `--no-deps`. Thus the local package uses the already locked build backend.

CI explicitly selects Python 3.11.17 and 3.12.15. Spec Kit's CI installation uses the immutable source installer. The staged-install receipt reproduces the missing-package failure and the corrected installation boundary. This environment has no Docker daemon, so the staged receipt does not claim a built or executed container image; the Docker base image and apt layer remain outside the Python hash lock.

## Evidence and remaining publication boundary

`validation-summary.json` and `convergence.md` record actual retained results. Historical failed attempts remain available with their corrections. The new changeset consists of these installers, locks, runtime regression tests, engineering specifications and receipts, plus a patch for the four small edits to existing files. It requires the identified baseline; it is not a standalone copy of the private source repository.

Local checks and publication of a download do not merge source changes or satisfy the source repository's current-head CI gate. All broader scientific reconstruction targets remain open, and the loss of feature 035 raw/source artifacts remains explicit.
