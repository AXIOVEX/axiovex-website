# Discriminating studies 035: executed findings and remaining inputs

## Outcome and scope

The first four implementable items in the committed next-study queue have been executed. All **50 checks recorded in the study results passed**: 17 interface checks, 12 closure checks, 8 process checks and 13 design/holdout checks. NS03-A09 additionally requires source integrity, which the coordinating runner enforces separately from the eight NS03 in-result checks. Their results establish exact properties of the declared finite systems and identify missing candidate inputs. They supply **zero physical measurements, zero new Lean theorems and zero reconstruction-target closures**. All 14 broad targets remain open.

The prior chat's exact final wording could not be recovered. The continuation therefore follows the explicit NS01–NS09 queue in [the unchanged feature-033 contract](PAIR_CONVERGENCE_CONTRACT_033.json), recovered from main revision `8409f6506bd7c96ab44e44770537e349f1fcfdd1`. All 1,031 repository blobs were verified against that remote tree before reuse. The already merged feature-033/034 work was preserved.

| Study | Declared domain | Executed finding | Consequence for the research programme |
|---|---|---|---|
| NS01: prediction interface | 64 existing candidate compositions, 14 controls, 30 preparation/word traces | Every existing composition lacks an executable interface; typed and semantic controls behaved as registered | Concrete dynamics and observation maps must precede a candidate prediction or test |
| NS02: controlled closure and scale composition | 8 models, 4 admitted intervention sets, 32 configurations | 17 configurations preserve the coarse record; 15 need a finer state, including one failure visible only under joint variation | Separate control/environment checks can miss an interaction; scale composition must retain weighting information |
| NS03: full process compatibility | 512 parity-family cases plus an iid calibration control | Every family case passes pair-only checks; 64 fit a full process and 448 do not | Pairwise agreement is insufficient for a common history under the stated causal semantics |
| NS04: prospective design benchmark | 70 designs, 4 mechanism targets, 4 joint nuisance values, 2 held-out settings | All alternatives choose the same design, with exact worst-pair separation 1 under the correct model | This benchmark demonstrates implementation consistency but supplies no performance advantage for the richer design rule |

Primary evidence is the complete [scientific result](../../results/discrimination035/studies.json), its immutable [history](../../results/discrimination035/history/), the [source freeze](../../specs/035-discriminating-studies/preregistrations/freeze.json), and the separate [execution record](../../results/discrimination035/execution.json). Reproduction of these records checks implementation continuity; it does not create an independent physical observation.

## NS01: a name or a mechanism list is not yet a prediction

The reusable auditor requires explicit typed entities, states, preparations, controls, environment, dynamics, composition rules, a record projection, parameters with units, an observation horizon and a supported prediction engine. This implementation supports one deliberately limited finite deterministic adapter. Declaring a unit is checked structurally; the auditor is not a general dimensional-analysis or theorem-proving system.

All **64** existing catalogue compositions lack the required executable maps. Their **32 proposed / 32 rejected** dispositions and original identifiers remain unchanged, and all remain `not_ready`. “Missing interface” is a diagnosis of the supplied record, not a refutation of every physical mechanism that could later be specified under that name.

The 14 controls distinguish executable, missing, invalid, unsupported, explicitly circular and semantically unresolved submissions. Two valid representations of the same bit system agree with a separate parity-of-toggle calculation on every word of length zero through three, from either initial state: **30 preparation/word cases**. Additional software controls reject malformed schema versions, duplicate identifiers, invalid probabilities, bad transitions and corrupted workflow receipts.

The important semantic boundary is explicit. A claim that imports its desired physical target into a premise is blocked as a core derivation. A clean dependency graph still receives `semantic_review_required` when it purports to derive a physical target without a checked argument. A known physical law can instead be registered openly as an external comparator. This distinction prevents a schema or naming convention from silently certifying physical independence.

The proposed decompression/gravity bridge receives a concrete missing-input report. It still needs an operational source variable; primitive dynamics; a source and coupling law; sector observation maps; units and shared parameters; boundary conditions; and a common comparator with a joint uncertainty model. No new force law was assigned during this study.

## NS02: what the coarse record must retain

The supplied system contains three bits `(a,b,c)`. Its record is their mean, `(a+b+c)/3`, and its update is

`(a,b,c) -> (b,c,a XOR alpha*u XOR beta*e XOR gamma*u*e)`.

The three coefficients range over all eight binary combinations. The control `u` and environment label `e` are known admitted intervention labels. Each model is evaluated at baseline, with control variation alone, environment variation alone, and joint variation. These are dimensionless finite definitions, not proposed physical equations.

| Admitted interventions | Models whose four-valued mean remains sufficient | Models needing all eight distinct states |
|---|---:|---:|
| Baseline only | 8 | 0 |
| Control variation only | 4 | 4 |
| Environment variation only | 4 | 4 |
| Joint control and environment | 1 | 7 |
| Total configurations | 17 | 15 |

For model **M01**, only the interaction coefficient is nonzero. Control-only and environment-only tests both preserve the coarse description, because the product `u*e` vanishes in each separate test. Joint variation exposes the missing information. States `001` and `100` both initially read `1/3`; one joint action `(u,e)=(1,1)` produces records `2/3` and `0`. The same coarse starting record therefore cannot determine the next record under the full intervention set.

The refinement is certified two ways. An iterative transition-stability computation is checked against every partition refining the original readout partition: **25 partitions per configuration, 800 total**. A separate encoded-state implementation agrees on **26,112 distinct configuration/state/action-word queries**, covering lengths zero through four. The longest shortest distinguishing word among separated equal-record pairs has length two. Transition stability gives an exact quotient certificate for this finite transition system; it does not prove an analogous result for continuous states or unspecified dynamics.

The scale-composition control exposes a separate information loss. For the bits `0,0,1`, the direct mean is `1/3`. Averaging the first two bits and then averaging that result with the third gives `1/2`; averaging the last two first gives `1/4`. The intermediate groups have different sizes, so treating both group means equally changes the answer. Retaining `(sum,count)` restores `1/3` on either route. The registered enumeration finds **12 disagreements in 16 state/route comparisons** for the naive rule and none for the repaired rule.

These results specify what is sufficient in this supplied model. They do not show that an observer can infer the required latent state from earlier coarse records. Distinguishability under a future intervention and reconstructibility from past observations remain different questions.

## NS03: pairwise consistency can conceal a contradiction

This study explicitly assumes a finite classical process, a shared preparation, jointly accessible nondisturbing records, and four symbolic times. Action `a` occurs before the third record; action `b` occurs before the fourth. The response table must therefore share its earlier entries across choices made later.

The tested family fixes two triple parities,

`X0 XOR X1 XOR X2 = f(a,b)` and

`X1 XOR X2 XOR X3 = g(a,b)`,

together with pair records. There are 16 Boolean choices for each of `f` and `g`, and two endpoint prescriptions, giving **512 family cases**. The implementation also retains a separate iid calibration case. It examines the full declared 256-response-table domain for each case, for **131,328 case/assignment examinations** in total.

Every family case admits a process reproducing its pair records alone. Adding the required triples changes the result:

| Full-record outcome | Family cases | Certificate |
|---|---:|---|
| Compatible | 64 | Explicit exact probability law reproducing every required record |
| Incompatible: shared-past parity | 384 | A value before action `b` would have to change with a future choice |
| Incompatible: endpoint marginal | 64 | The triple constraints exclude an endpoint event that the requested endpoint law assigns probability `1/4` |

The certificate categories use the preregistered priority rule; they are not a claim that the underlying failure causes are mutually exclusive. The iid calibration control is compatible, so the total is **65 compatible and 448 incompatible**, with no unresolved case. An independent verifier checks exact marginals and binary-parity implications without importing the primary implementation. Deliberately corrupted witnesses, flipped parities, erased forbidden mass, duplicated past states and omitted higher-order records are rejected.

A particularly small contradiction sets both triple parities to zero. XORing the two equations forces `X0=X3`. An independent uniform endpoint record nevertheless assigns positive probability to `X0!=X3`; no full process can meet both requirements. Pair tests alone do not expose this conflict.

The Markov comparison gives another clear boundary. Uniform adjacent pair kernels produce iid triples with cell probability `1/8`, while a parity-constrained triple assigns either zero or `1/4`. Their exact total variation distance is `1/2`. The adjacent kernels therefore do not determine the higher-order law without an additional Markov premise.

This is a complete decision within the registered parity family. It is not a general marginal-feasibility solver, a quantum reconstruction, a derivation of time, or an assertion that every physical system obeys the supplied classical joint-record assumptions.

## NS04: a valid benchmark with no demonstrated design advantage

The benchmark declares four mechanism targets, four jointly allowed gain/offset nuisance settings, and an inert binary label. This gives **16 predictive worlds and 32 labelled worlds**. The same nuisance choice applies across all settings; no prior over nuisance values is imposed. A finite equilibrium law, quantizer, exposure rule and retention policy supply exact transcript probabilities.

Two calibration settings and six probe settings form the menu. Each design selects four settings, giving **70 possible designs**. The objective maximizes the minimum exact total variation distance across **96 cross-target world pairs**. The experiment-selection stage evaluates five scoring rules: the complete model, nominal calibration, omitted feedback, omitted exposure and omitted selection. Trigger-only and full-retention acquisition variants are also checked. Their chosen designs are all evaluated under the same correct audited model.

The selection was persisted with its hash, source-freeze identity and timestamp before a separate child evaluated either held-out setting. There was no holdout refitting. Independently coded Gaussian elimination, retention-branch enumeration and common-probability-mass calculations verify the equilibrium laws, transcript probabilities and separation scores. The data-processing controls confirm that the specified discarding operations do not increase discrimination.

**Every scoring/acquisition alternative selected `C0,C1,P0,P1`.** The correct audited worst-pair total variation is exactly **1**, its maximum possible value. The complete scoring rule has **53 tied optimal designs out of 70**; the declared lexicographic rule selects the first. Other variants have 53, 54 or 62 tied optima, but the same first design.

This result supplies **no superiority finding** for the more elaborate design rule. The menu is easy enough for all variants to select a perfectly separating design. In particular, the selected probes use zero feedback and short exposure, so they do not challenge the omitted-feedback or omitted-exposure scorers through their final chosen settings. A harder design comparison would require a new prospective protocol with an unsaturated tradeoff; changing this study after seeing the tie would destroy its original comparison.

For the selected design, every possible observed transcript identifies a single predictive world in this finite family. The target abstention probability is zero before and after the holdout, and the prospective held-out total variation diameter is zero. The holdouts therefore verify the declared prediction calculation but add no target discrimination here. The inert label remains unidentifiable: each exact observable-law class still contains its two label variants. The implementation preserves that ambiguity instead of reporting a uniquely recovered labelled mechanism.

These findings concern the declared finite menu, nuisance set and law. The audit randomization supplies the probabilities; no fundamental probability law or empirical uncertainty budget is derived.

## What remains to be supplied

[The separate queue disposition](NEXT_STUDY_DISPOSITION_035.json) records the completed scoped computations without rewriting the original proposal.

| Next study | Present gate | Input that would make progress concrete |
|---|---|---|
| NS05: exact bridge-premise challenge | Missing candidate premises | One actual candidate argument with explicit primitive assumptions, bridges and target conclusion |
| NS06: shared cross-sector predictions | Missing equations and projections | A source/dynamics/coupling model, shared parameter registry, units, boundary conditions and observation maps for the compared sectors |
| NS07: reduction and limit order | Missing candidate and limit contract | Explicit reductions, parameter limits, topology/domain, boundary conditions and quantitative error or convergence criteria |
| NS08: apparatus/nuisance calibration | Missing empirical inputs | An identified apparatus, raw reference/calibration records, environment measurements and measured joint uncertainty model |
| NS09: prospective physical comparison | Missing predictions and data | Actual numerical candidate/comparator predictions and a reviewed untouched-data protocol using an adequate apparatus model |

The next candidate-specific step is to instantiate the NS01 interface with one concrete proposed mechanism. The finite studies provide checks to apply to that mechanism; they do not supply its missing equations. Repeating more arbitrary finite models cannot by itself discharge these gates.

## Reproduction and closure state

The original source freeze contained 27 files and was written before the first registered execution. The first campaign passed every recorded check. Its selected-design receipt precedes its first holdout child, and its original exact replay passed. All original source identities, outcomes, execution records and selection receipts are retained in [the first-execution archive](../../results/discrimination035-first-execution/) and [the original freeze archive](../../specs/035-discriminating-studies/preregistrations/history/freeze-before-packaging.json).

A later historical-integration check found that feature 033 inventories every top-level Python module in the reusable package. Adding the new interface module introduced one extra inventory key. The historical replay found no out-of-tolerance scientific difference; it rejected the changed inventory. The complete first diagnostic remains [available](../../results/pair033/replay-failure-1a47adc3057bd9c260f7420ed9385ea1b0376d0547e15975e52cd4170cde8b78.json).

The independently reviewed [packaging amendment](../../specs/035-discriminating-studies/preregistrations/packaging-amendment.json) moved the new module byte-for-byte into a subpackage with the same import API. No old source, protocol, result or comparison rule changed. The amended 35-file freeze explicitly states that outcomes were already known. Verification under that layout reproduced the **entire four-study result array exactly**, as recorded in [the equivalence receipt](../../specs/035-discriminating-studies/evidence/packaging-equivalence.json). This was a packaging verification replay, not a fresh prospective holdout experiment.

| Identity | First registered execution | Current packaged verification |
|---|---|---|
| Scientific run | `b717f76fbdfe3a76cc242d6a94a379a39d6f003ecc8b075cff36d7c24ce96d39` | `668086d3b297077364df001ab755c42f64a490b5df1d13d2656eadcae8495109` |
| Source freeze | `94284abb2b0d042500f703e633918aa747ee573b8ab52e3e464c5ec555dcb178` | `942fad5aea206644cfd112972fc7dda271b1efdf71cae438ec09ec714a051960` |

The different run identities bind the different source paths; they do not represent different scientific findings. Actual stage timings and fixed 45/60-second caps remain separate from deterministic scientific content. The preservation verifier checks 73 original artifact identities and all 14 open targets.

The full experiment runner passed. The complete Python 3.12 suite passed **289 tests with no failures or skips** before the layout amendment. After the byte-identical move, **79 focused tests** passed, including a new regression for the historical inventory. Both the current feature-035 exact replay and the historical feature-033 replay/verifier passed after the correction. Provenance/content, SDD, candidate-snapshot and available historical feature/AEE gates passed. The failed initial historical replay and its subsequent passing resolution are both retained. Python 3.11 and pinned Lean 4.33.1 are unavailable locally.

Use `python scripts/experiment_discrimination035.py --check` and `python scripts/verify_discrimination035.py` to verify the packaged studies. The exact original study arrays can also be compared directly with the first-execution archive. Full project validation additionally includes `python scripts/run_all.py`, `python -m pytest`, the historical feature gates, and the pinned Lean build.

Actual command outputs and timings are recorded in [the validation receipt](../../specs/035-discriminating-studies/evidence/validation.json); feature closure is recorded in [convergence](../../specs/035-discriminating-studies/convergence.md). Publication remains blocked by automatic approval review pending explicit user authorization for upload to the existing private repository. No study result has been published or merged. Required Python 3.11/3.12, Lean and current-head CI still gate final repository closure.

## Background attribution

The finite experiments and their outputs are original supplied-model artifacts of this campaign. Background on action-conditional predictive state representations is registered to Littman, Sutton and Singh, [Predictive Representations of State](https://proceedings.neurips.cc/paper/2001/hash/1e4d36177d71bbb3558e43af9577d70e-Abstract.html). Measurement-uncertainty context is registered to [NIST TN 1297, section 2](https://www.nist.gov/pml/nist-technical-note-1297/nist-tn-1297-2-classification-components-uncertainty). Neither source provides RCPH dynamics or independent experimental validation of these finite models. See [the source register](../../provenance/discrimination035_sources.json).
