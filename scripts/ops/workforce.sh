#!/usr/bin/env bash
set -euo pipefail
mkdir -p ops-output
root="$PWD"
source_dir="$root/workforce-source"
trap 'rc=$?; if [ "$rc" -ne 0 ]; then printf "\nStudy execution failed (exit %s). Inspect logs; no release or article was published.\n" "$rc" | tee -a "$root/ops-output/report.md" >> "$GITHUB_STEP_SUMMARY"; fi' EXIT
printf '# Workforce evidence cycle\n\n' > ops-output/report.md
git -C "$source_dir" rev-parse HEAD > ops-output/workforce-source-commit.txt
printf 'Source commit: %s\n\n' "$(cat ops-output/workforce-source-commit.txt)" >> ops-output/report.md
cp "$source_dir/.env.example" "$source_dir/.env"
# A fresh aggregate-only volume is used; no private local evidence is uploaded.
printf '\nBLS_API_KEY=%s\n' "${BLS_API_KEY:-}" >> "$source_dir/.env"
chmod 600 "$source_dir/.env"
cd "$source_dir"
export REPORT_SOURCE_COMMIT="$(git rev-parse HEAD)"
# reports.py reads GITHUB_SHA first; override the website SHA with research SHA.
export GITHUB_SHA="$REPORT_SOURCE_COMMIT"
export MIJOBS_EVIDENCE_VOLUME="website-workforce-$GITHUB_RUN_ID"
python scripts/reports.py build-image 2>&1 | tee "$root/ops-output/study-build-image.log"
docker run --rm --env-file .env \
  --mount "type=volume,src=$MIJOBS_EVIDENCE_VOLUME,dst=/data" \
  michigan-workforce-reports:local mijobs init-db 2>&1 | tee "$root/ops-output/study-init.log"
for command in collect analyze build; do
  python scripts/reports.py "$command" 2>&1 | tee "$root/ops-output/study-$command.log"
done
python scripts/reviewed_evidence.py 2>&1 | tee "$root/ops-output/reviewed-edition-check.log"
cp reports/current-edition.json "$root/ops-output/current-edition.json"
cp -R output/pdf "$root/ops-output/study-reports"
cp reports/2026-09-13-job-continuity/analysis-snapshot.json "$root/ops-output/"
cp reports/2026-09-13-job-continuity/data-reanalysis.md "$root/ops-output/"
docker run --rm \
  --mount "type=volume,src=$MIJOBS_EVIDENCE_VOLUME,dst=/data,readonly" \
  --mount "type=bind,src=$root/ops-output,dst=/out" \
  michigan-workforce-reports:local sh -c \
  'cp -R /data/artifacts /out/collected-artifacts && chown -R "$1:$2" /out/collected-artifacts' \
  sh "$(id -u)" "$(id -g)"
cd "$root"
node scripts/fetch-geo.mjs laus 2>&1 | tee ops-output/geo-refresh.log
cp -R data/geo ops-output/geo
cat >> ops-output/report.md <<'EOF'
Study collect/analyze/build and existing reviewed-edition verification completed.
Outputs are review artifacts, not a new reviewed edition or published release.

Editorial gates still required: confirm the intended data month in every source;
review all Michigan WARN notices since the prior cycle; check cause claims;
compare prior boards; inspect each PDF page; review static QCEW/IPEDS/PSEO vintages
and PSEO coverage; prepare the article and LinkedIn text per spec 007/blog-format.md.
The dated reviewed edition can remain older than the live collector output.

Use data-month naming (September data -> October 29 draft, October 30 publication).
The LAUS fetcher can retain last-good data with exit 0; inspect geo-refresh.log
and each file's vintage. No article, research release or LinkedIn post was published.
EOF
cat ops-output/report.md >> "$GITHUB_STEP_SUMMARY"
