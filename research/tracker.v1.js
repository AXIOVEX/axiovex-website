  /* Spec 024 — program tracker rendering. The verdict board, the registered
     predictions, and the archived releases each render from ONE data array
     below; filter-chip counts are computed from the board array. Content:
     specs/024-research-hub-tracker-remodel/tracker-content.md (approved
     2026-10-13). Snapshot date: October 22, 2026. */
  var STUDIES = [
    { line: "Study 011", osf: "J6PF9", title: "The cooperative-phenotype claim", outcome: "noeffect", pill: "No effect found",
      meaning: "We claimed that measured traits and profiles — beyond the game's payoffs — would improve predictions of who cooperates, by a margin fixed in advance. On both adequate datasets the improvement missed the margin, and the claim stands demoted.",
      boundary: "A real ranking signal exists in the data — the fuller model ranks players well — but not in the form or strength the claim required; the study-level track met its own bar, but was supporting evidence only by design." },
    { line: "Study 012", osf: "V8HCY", title: "A cooperation-game pattern", outcome: "noeffect", pill: "No effect found",
      meaning: "A pattern reported in earlier cooperation-game data did not appear when we tested it on the shared dataset (the gap was 0.012, against a bar of 0.05 fixed in advance).",
      boundary: "The claim stands demoted, not merely unproven." },
    { line: "Study 018", osf: "GH27R", title: "The pooled perception claim", outcome: "rejected", pill: "Rejected",
      meaning: "Our first strong idea about seeing — that how reportable an experience is tracks how redundantly its record is spread across brain regions — failed its registered test in its pooled form, and that form is retired.",
      boundary: "The within-person form of the same idea was never the thing tested here; see the next card." },
    { line: "Study 018, contrast form", osf: "GH27R", title: "The surviving version", outcome: null, offscale: true, pill: "No verdict — still live",
      meaning: "The within-person contrast form of the record-redundancy idea survived the audit of the program's whole history untested: in the record it sits at even odds (0.50), and no verdict has ever been taken on it.",
      boundary: "Unjudged is not supported; it is next in line under the consciousness front below, behind a pilot gate." },
    { line: "Study 019", osf: "GDN2R", title: "The basis-selectivity claim", outcome: "rejected", pill: "Rejected",
      meaning: "We claimed the record texture lives in the coherences that one kind of squeezing — pinching, in the pointer basis — does not touch, so it should survive pinching even though dephasing destroyed it. Instead pinching destroyed the texture on every one of the 132 configurations, at the first dose tried: the texture is not selective about which coherence it needs.",
      boundary: "The death came by the record's onset sliding until the criterion could no longer be met, not by the plateau shrinking in place; the result is scoped to this model family." },
    { line: "Study 020", osf: "2C9YV", title: "The within-branch claim", outcome: "rejected", pill: "Rejected",
      meaning: "We claimed each branch of the system carries the record on its own, so deleting only the coherence between the branches would cost nothing. It cost the record in 83 of 132 configurations — the between-branch coherence is load-bearing.",
      boundary: "Where the record survived, it survived in place — its onset never moved. The coherence permits the record; it does not position it." },
    { line: "Study 021", osf: "4R9WK", title: "The gradual-blend claim", outcome: "rejected", pill: "Rejected",
      meaning: "Between the one-shot and the endlessly cycling versions of the early-universe model, we claimed the texture would blend gradually as the redraw chance rose. It switched instead — step-shaped on all eight configurations, gradual on none.",
      boundary: "The switch is located at the first nonzero step; a finer scale could place it more precisely, but no gradual blend exists at the scale tested." },
    { line: "Study 022", osf: "NGE74", title: "The gradual-fading claim", outcome: "rejected", pill: "Rejected",
      meaning: "We claimed the one-shot pattern would fade gradually as disorder weakened toward the orderly limit. It barely changed at all (the pooled movement was 0.002, far under the no-response line of 0.05 fixed in advance), and the curves were non-monotone on all eight configurations: the pattern does not draw its strength from disorder.",
      boundary: "Scoped to this model class and the range tested; the test was built so that this blindness, if present, would be visible." },
    { line: "Study 023", osf: "DY7U6", title: "The mixing-strength claim", outcome: "confirmed", pill: "Confirmed",
      meaning: "We turned the dynamics' flip couplings from a quarter of their strength to double, and the record texture did not degrade, thin out, or move — at any dose. The texture is a property of how the system mixes, not of one lucky strength.",
      boundary: "Confirmed on this substrate family. Which connections carry the record is a different question — Study 033 took it up and could not separate the candidates." },
    { line: "Study 024", osf: "67CR9", title: "The boundary counting law", outcome: "confirmed", pill: "Confirmed",
      meaning: "Count the connections crossing a region's boundary and the count grows by an exact law — with the size of the boundary, not the amount inside it. The measured exponent sat on the predicted value at every scale (0.5126, inside the registered band around one-half), and the law's coefficient matched its prediction as well.",
      boundary: "The law is confirmed inside this model. Gravity's version needs one extra rule — a limit on what a boundary can carry — which is an open premise this study did not test (see the framework section)." },
    { line: "Study 025", osf: "8UYJG", title: "The plateau-height claim", outcome: "rejected", pill: "Rejected",
      meaning: "Building on Study 023, we claimed the record's plateau height would rise gradually with flip strength. Instead the height was already at its maximum at every dose — a total rise of zero. There was no gradual rise to find.",
      boundary: "A saturation result — the measure had nowhere to rise to. It retires the graded-height claim; Study 023's survival result is untouched." },
    { line: "Study 026", osf: "SR86P", title: "The single-step death claim", outcome: "rejected", pill: "Rejected",
      meaning: "On Study 020's records, we claimed deaths would concentrate in a single step at one shared threshold. The deaths were early but spread out, falling short of both registered concentration lines (the largest single step was 0.45, against a 0.50 line).",
      boundary: "Front-loaded is not the claimed threshold — the record dies early, but not in one step." },
    { line: "Study 027", osf: "PJE5M", title: "The brain-recording perception test", outcome: "inconclusive", pill: "Inconclusive",
      meaning: "The test data could not carry the measurement — only 1 of 40 recordings was usable at the standard fixed in advance, so no fair verdict could be taken.",
      boundary: "The claim stands unjudged, not falsified; the failure was in the dataset's readability, and the consciousness front below exists to fix exactly that. (Registration of record — the final version; two earlier versions are also public.)" },
    { line: "Study 028", osf: "B8SKX", title: "Petz recovery: the dephasing limit", outcome: "confirmed", pill: "Confirmed",
      meaning: "The Petz map is the standard operation for undoing a noisy quantum process. From the mathematics alone we derived the exact dephasing level at which recovery stops working, then computed it — the computation landed on the derived level (0.8857288966 computed, against 0.8857288967 derived).",
      boundary: "A derived-then-computed match inside this model family; it certifies the map of where recovery fails, not any physical device." },
    { line: "Study 029", osf: "YRCNX", title: "Petz recovery: how the shortfall grows", outcome: "confirmed", pill: "Confirmed",
      meaning: "We derived that the recovery's shortfall would grow gradually as noise rises, not in a cliff. The computed curve rose steadily (total rise 1.53), with no single step carrying the growth.",
      boundary: "As Study 028 — the map, inside this model family, not a device." },
    { line: "Study 030", osf: "JRHUA", title: "Petz recovery: the depolarizing limit", outcome: "confirmed", pill: "Confirmed",
      meaning: "For a second kind of noise — depolarizing, random errors in every direction — the computation located the failure point exactly where the derivation had put it (0.0212428102, against 0.02124281011 derived).",
      boundary: "As Study 028." },
    { line: "Study 031", osf: "R5Y2G", title: "Petz recovery: the widening gap", outcome: "confirmed", pill: "Confirmed",
      meaning: "The gap between the damaged state and its recovery was derived to widen gradually under depolarizing noise. It did — a steady rise (0.292), with the largest single step carrying about half: graded, as derived.",
      boundary: "The first submission of this registration failed in the archive and was replaced; the registration listed is the replacement of record." },
    { line: "Study 032", osf: "Q8TMG", title: "Petz recovery: the ensemble profile", outcome: "confirmed", pill: "Confirmed",
      meaning: "Across an ensemble of disordered systems, we derived the whole shape of how recovery violations thin out as the noise grows. The campaign reproduced the derived shape count for count — 1,024 draws at each of five amplitudes, matching at every point.",
      boundary: "Its public registration is the re-registration of record dated 2026-10-12 (see the releases below); the original submission stands as a duplicate and is not the record." },
    { line: "Study 033", osf: "C5RJM", title: "Which connections carry the record", outcome: "noeffect", pill: "No effect found",
      meaning: "Every rearrangement of the flip couplings — weaker, tree-shaped, re-paired, one family switched off entirely — left the record in place on all 36 configurations. At the level this test was built to judge, no special carrier showed up, and the claim stands demoted.",
      boundary: "One guard measurement did move — switching off the z-type couplings shifted where the record starts, on every configuration. The carriers could not be separated here. That onset signal is what the onset study above chased; it closed unjudged, and its successor has since answered the question — the onset is held by the filled channel, not by the family filling it." },
    { line: "Study 034", osf: "YWRE8", title: "What holds the record's onset in place", outcome: "inconclusive", pill: "Inconclusive",
      meaning: "It removed one family of couplings — the ones that flip pairs of spins together — on fresh examples, to test whether that family is what holds the record's starting point where it is. On every example that finished, removing it moved the starting point earlier (11 of 12), and no other removal moved it at all. But all six of the largest examples were killed by the computing environment hours in, before producing any result. Under the rules fixed in advance, that sample was too incomplete to judge: the claim stands unjudged — neither confirmed nor refuted.",
      boundary: "What sent the kills is not established; the pattern fits the machine running out of memory, but that is consistency, not proof, and the study's record says so. A second check added one clean fact: removing the family moves where the record starts without weakening how strongly it stands. The question was registered again the day this study closed — the next card is its successor." },
    { line: "Study 037", osf: "Q6FU9", title: "What holds the record's onset in place — asked again", outcome: "confirmed", pill: "Confirmed",
      meaning: "The same question as the card above, asked again on fresh examples — and this time every one of the eighteen examples finished, including all six at the largest size, the ones the first asking lost. Removing the pair-flipping couplings moved the record's starting point earlier in 17 of 18 examples, and the move deepened with size: one step at the smaller sizes, two at the largest, three in a single case. Then the decisive test: the pair-flipping couplings were replaced, in turn, by two entirely different families — one flipping four spins at once, keeping the family's even-flip pattern; one flipping three, breaking it — each at the same count and the same total strength as the family removed. Both held the starting point exactly where it was, in every example. What holds the onset is not which couplings fill the channel that links pairs of spins, and not the pattern they follow: it is that the channel is filled to its capacity — a slot any suitable coupling can occupy. Of the three explanations registered before the run, exactly one predicted this pattern, and it is the one the data matched.",
      boundary: "Confirmed inside this model family, at the sizes run. The study settles which property of the couplings does the holding — it does not explain why a filled channel sets the depth at all. It also cannot yet separate what 'capacity' means: the substitutes matched the original family in count and in total strength at once, so whether the slot's capacity is the count, the strength, or the two together is untested, and whether the deepening continues past the largest size run is unmeasured. A registered secondary check adds one clean fact: the interventions move where the record starts without thinning how strongly it stands — the record's height reading was flat under every intervention at every size." },
    { line: "Study 038", osf: "NBWKE", title: "Boundary counting in a discrete spacetime model (2+1 dimensions)", outcome: "confirmed", pill: "Confirmed",
      meaning: "The earlier separator study asked whether the layer of points straddling a region's boundary grows with the boundary's size rather than with the region's bulk, in a sprinkled model with one space dimension. This study asked the same question with two space dimensions — and asked it in a stronger form. Points were scattered at random into a diamond-shaped region of flat spacetime, keeping only which points can influence which. The region was cut at its waist, the widest slice its own shape selects, and the counted layer was the points just below that cut with nothing above them in the lower half, together with the points just above it with nothing below them in the upper half. A derivation completed before the test predicted the count exactly, including a rim correction that still lowers the measured ratio below its very-large-size limit by about 5% even at the largest size run. The test therefore judged the measurements against the exact prediction for each size, not against the limit. All 72 examples were valid — 24, 20, 16, and 12 across the four sizes. The measured ratios followed the predictions within 0.8% at every size; at the largest size the measured ratio was 1.6603 against the exact finite-size prediction 1.6715. The growth exponent was 0.6890, inside the registered support band around two-thirds. Before the campaign, an independent brute-force counter agreed exactly with the production counter on 16 test examples, and an anchor run at the smallest campaign size reproduced the predicted ratio. During the campaign, the rival counts behaved as derived on the same examples: links crossing the cut grew with exponent 1.3520, and all causal relations grew with exponent 2.0019. The boundary layer was the only count following the boundary law.",
      boundary: "Confirmed for this model, at the waist slice, in two space dimensions and one time dimension. It does not show that physical gravity works this way: connecting this count to gravity would require an extra premise that this study did not test and that remains openly listed. The count is not identified with entropy, and no gravitational coefficient is claimed. Other slices through the same region were not measured, so whether a tilted slice of equal area would carry an equal expected count remains open. The limiting constant, 1.7587, was approached along the predicted finite-size path, not measured directly. The derivation was re-derived by a second analytic route and checked by high-precision numerical calculation; a separate blind computer engine asked to reproduce it failed its own known-answer control, so it cast no vote, and no independent outside derivation has yet reproduced it. The registration is public: osf.io/nbwke (DOI 10.17605/OSF.IO/NBWKE). A separate timing pilot was also registered in advance (DOI 10.17605/OSF.IO/CXZVR); it measured timings and memory only, and its samples were excluded from this study." }
  ];

  var PREDICTIONS = [
    { kicker: "Prediction · The record-redundancy contrast", live: true,
      title: "Within a person, reportability tracks the redundancy of the record",
      body: "Within a person, the reportability of a faint experience tracks the redundancy profile of its record across separate brain regions — a sharper claim than the pooled form Study 018 retired. <strong>Falsifier:</strong> a registered test on data that passes the pilot gate below, in which the contrast does not appear at the margin fixed in advance.",
      status: "Live — unjudged", statusClass: "pill pill-inconclusive",
      notes: [
        { date: "2026-10-12", text: "The pooled form of this idea was rejected under Study 018; the contrast form was never verdict-bearing in that study and survives it." },
        { date: "2026-10-13", text: "The consciousness line was reactivated. This prediction may not be frozen for its test until the dataset pilot gate passes." },
        { date: "2026-10-21", text: "The first readability pilot has run and failed its gate — in that dataset, where a faint stimulus appeared could be read clearly in too few people — so this prediction still cannot be frozen for its test. The claim was not tested and stays unjudged. A second pilot, on a dataset that records a report of seeing on every trial, is running." },
        { date: "2026-10-21", text: "The second readability pilot has run and also failed its gate — what a faint stimulus was could be read clearly in 20 of 35 people, short of the 30 required, and the typical clear reading fell short of the 0.60 bar — so this prediction still cannot be frozen for its test. The claim was not tested and stays unjudged. Three public datasets have now been audited as arenas for it, and none currently provides a workable one." }
      ] },
    { kicker: "Prediction · The physical leg (Study 014's protocol)", live: false,
      title: "In a physical system, the record texture will show the derived dose pattern",
      body: "In a physical system — a nitrogen-vacancy center in diamond, where quantum states can be prepared and read one at a time — the record texture will show the dose pattern the models derive, under the conditions written into the registered protocol (<a href=\"https://doi.org/10.17605/OSF.IO/7N42J\" target=\"_blank\" rel=\"noopener\">registration 7N42J</a>). <strong>Falsifier:</strong> the protocol's three registered kill conditions — if the physical record fails them, the bridge from the toy models to the laboratory dies.",
      status: "Pending — unplayed", statusClass: "pill pill-offscale",
      notes: [
        { date: "2026-10-02", text: "Registered publicly; a laboratory inquiry was sent the same day." },
        { date: "2026-10-13", text: "Still waiting on a laboratory partner. The registration's window runs to October 2027." }
      ] }
  ];

  var RELEASES = [
    { name: "Program parent — all registered studies", href: "https://osf.io/nerxz/", label: "osf.io/nerxz", note: "the public parent project holding the whole series" },
    { name: "Study 011 registration", doi: "J6PF9", note: "do measured traits improve prediction of cooperative choices?" },
    { name: "Study 012 registration", doi: "V8HCY", note: "protocol variables in cooperation decisions — a preregistered reanalysis" },
    { name: "Study 018 registration", doi: "GH27R", note: "redundancy of the neural record in near-threshold seeing" },
    { name: "Study 019 registration", doi: "GDN2R", note: "is the record texture basis-selective? pinching vs dephasing" },
    { name: "Study 020 registration", doi: "2C9YV", note: "which coherence carries the record? cross-branch ablation" },
    { name: "Study 021 registration", doi: "4R9WK", note: "graded or threshold? one-shot to cyclic, interpolated (replacement of record — the original submission failed in the archive)" },
    { name: "Study 022 registration", doi: "NGE74", note: "does the one-shot law degrade gradually toward the orderly limit? (replacement of record, as Study 021)" },
    { name: "Study 023 registration", doi: "DY7U6", note: "is the record texture robust to flip-coupling strength?" },
    { name: "Study 024 registration", doi: "67CR9", note: "boundary or volume? a separator counting law" },
    { name: "Study 025 registration", doi: "8UYJG", note: "does plateau height build monotonically with flip coupling?" },
    { name: "Study 026 registration", doi: "SR86P", note: "is plateau death under ablation a threshold event? (registration of record — an earlier submission is dead and never listed)" },
    { name: "Study 027 registration", doi: "PJE5M", note: "redundancy of orientation information and reports of seeing (registration of record — final version; earlier versions CA6KD and RA8T7 are also public)" },
    { name: "Study 028 registration", doi: "B8SKX", note: "a sharp dephasing onset for a recovery bound" },
    { name: "Study 029 registration", doi: "YRCNX", note: "a graded dose–response of the recovery deficit" },
    { name: "Study 030 registration", doi: "JRHUA", note: "a sharp restoration threshold under depolarizing noise" },
    { name: "Study 031 registration", doi: "R5Y2G", note: "a graded monotone dose–response of the recovery gap (replacement of record, as Study 021)" },
    { name: "Study 032 registration", doi: "Q8TMG", note: "a graded dilution of a recovery-bound violation (re-registration of record, 2026-10-12; the original submission is a duplicate, not the record)" },
    { name: "Study 033 registration", doi: "C5RJM", note: "what carries the record texture's robustness to flip coupling?" },
    { name: "Study 034 registration", doi: "YWRE8", note: "what holds the record's onset in place?" },
    { name: "Study 037 registration", doi: "Q6FU9", note: "what holds the record's onset in place — the same question, asked again on fresh configurations" },
    { name: "Study 038 registration", doi: "NBWKE", note: "boundary counting in a discrete spacetime model (2+1 dimensions)" },
    { name: "Study 038 timing pilot", doi: "CXZVR", note: "timing and memory measurements only; no verdict; its samples were excluded from Study 038" }
  ];

  function renderBoard() {
    var grid = document.getElementById("board-grid");
    var html = "";
    STUDIES.forEach(function (s, i) {
      var pillClass = s.offscale ? "pill pill-offscale" : "pill pill-" + s.outcome;
      html += '<article class="study-card" data-idx="' + i + '">'
        + '<div class="card-top"><p class="card-title">' + s.title + '</p>'
        + '<span class="' + pillClass + '">' + s.pill + '</span></div>'
        + '<p class="study-line">' + s.line + ' · registration ' + s.osf + ' · <a href="https://doi.org/10.17605/OSF.IO/' + s.osf + '" target="_blank" rel="noopener">DOI ↗</a></p>'
        + '<p class="card-meaning">' + s.meaning + '</p>'
        + '<p class="card-boundary"><strong>Boundary:</strong> ' + s.boundary + '</p>'
        + '</article>';
    });
    grid.innerHTML = html;
  }

  var FILTERS = [
    { key: "all", label: "All findings" },
    { key: "confirmed", label: "Confirmed" },
    { key: "rejected", label: "Rejected" },
    { key: "noeffect", label: "No effect found" },
    { key: "inconclusive", label: "Inconclusive" },
    { key: "running", label: "Still running" },
    { key: "offscale", label: "Off the scale" }
  ];
  function countFor(key) {
    if (key === "all") return STUDIES.length;
    if (key === "running") return STUDIES.filter(function (s) { return !!s.running; }).length;
    if (key === "offscale") return STUDIES.filter(function (s) { return !!s.offscale; }).length;
    return STUDIES.filter(function (s) { return s.outcome === key; }).length;
  }
  function matches(s, key) {
    if (key === "all") return true;
    if (key === "running") return !!s.running;
    if (key === "offscale") return !!s.offscale;
    return s.outcome === key;
  }
  function renderChips() {
    var box = document.getElementById("board-chips");
    var html = "";
    FILTERS.forEach(function (f, i) {
      html += '<button type="button" class="chip" data-filter="' + f.key + '" aria-pressed="' + (i === 0 ? "true" : "false") + '">' + f.label + ' · ' + countFor(f.key) + '</button>';
    });
    box.innerHTML = html;
    box.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".chip");
      if (!btn) return;
      box.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
      btn.setAttribute("aria-pressed", "true");
      var key = btn.getAttribute("data-filter");
      document.querySelectorAll("#board-grid .study-card").forEach(function (card) {
        var s = STUDIES[Number(card.getAttribute("data-idx"))];
        card.hidden = !matches(s, key);
      });
    });
  }

  function renderPredictions() {
    var grid = document.getElementById("pred-grid");
    var html = "";
    PREDICTIONS.forEach(function (p) {
      html += '<article class="pred-card ' + (p.live ? "live" : "pending") + '">'
        + '<p class="pred-kicker">' + p.kicker + '</p>'
        + '<p class="pred-title">' + p.title + '</p>'
        + '<p class="pred-body">' + p.body + '</p>'
        + '<p style="margin:0 0 4px"><span class="' + p.statusClass + '">' + p.status + '</span></p>'
        + '<div class="pred-notes"><h3>Dated status notes</h3><ul>'
        + p.notes.map(function (n) { return '<li><strong>' + n.date + '</strong> — ' + n.text + '</li>'; }).join("")
        + '</ul></div></article>';
    });
    grid.innerHTML = html;
  }

  function renderReleases() {
    var list = document.getElementById("rel-list");
    var html = "";
    RELEASES.forEach(function (r) {
      var link = r.doi
        ? '<a class="rel-doi" href="https://doi.org/10.17605/OSF.IO/' + r.doi + '" target="_blank" rel="noopener">10.17605/OSF.IO/' + r.doi + ' ↗</a>'
        : '<a class="rel-doi" href="' + r.href + '" target="_blank" rel="noopener">' + r.label + ' ↗</a>';
      html += '<div class="rel-row"><span class="rel-name">' + r.name + '</span>' + link + '<span class="rel-note">' + r.note + '</span></div>';
    });
    list.innerHTML = html;
  }

  renderBoard();
  renderChips();
  renderPredictions();
  renderReleases();
