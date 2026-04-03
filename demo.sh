#!/usr/bin/env bash
# ============================================================
#  mf-storefront-demo — interactive demo runner
#  Usage: bash demo.sh
#         bash demo.sh --scenario 1   (run a specific scenario)
#         bash demo.sh --app catalog  (inspect a single app across all scenarios)
# ============================================================
set -euo pipefail

# ---- colours -----------------------------------------------
BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'

SCENARIOS=(
  "1-healthy:Healthy Baseline"
  "2-drift:Configuration Drift"
  "3-federation-issues:Federation Issues"
)

SCENARIO_FILTER=""
APP_FILTER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --scenario) SCENARIO_FILTER="$2"; shift 2 ;;
    --app)      APP_FILTER="$2";      shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# ---- helpers -----------------------------------------------
separator() { echo -e "${DIM}────────────────────────────────────────────────────${RESET}"; }
header()    { echo -e "\n${BOLD}${CYAN}$1${RESET}"; separator; }

score_color() {
  local score="$1"
  if   [[ "$score" -ge 90 ]]; then echo -e "${GREEN}${score}/100${RESET}"
  elif [[ "$score" -ge 60 ]]; then echo -e "${YELLOW}${score}/100${RESET}"
  else                              echo -e "${RED}${score}/100${RESET}"
  fi
}

inspect_app() {
  local app_path="$1"
  local app_name
  app_name=$(basename "$app_path")

  local manifest="$app_path/project-manifest.json"
  if [[ ! -f "$manifest" ]]; then
    echo -e "  ${DIM}skipping $app_name — no manifest${RESET}"
    return
  fi

  local abs_manifest
  abs_manifest="$(pwd)/$manifest"

  local overall
  overall=$(node -e "const m=require('$abs_manifest'); process.stdout.write(String(m.scores.overall))" 2>/dev/null || echo "?")

  printf "  %-12s  score: %s\n" "$app_name" "$(score_color "$overall")"

  # surface issues from manifest
  node -e "
    const m = require('$abs_manifest');
    const issues = [...(m.driftIssues || []), ...(m.federationIssues || [])];
    issues.forEach(i => {
      const icon = i.severity === 'HIGH' ? '  \u2717' : '  \u26a0';
      console.log(icon + ' [' + i.severity + '] ' + i.package + ': ' + (i.description || i.type));
    });
  " 2>/dev/null || true
}

run_federation_analysis() {
  local scenario_dir="$1"
  local manifests=()
  for app_dir in "$scenario_dir"/apps/*/; do
    [[ -f "${app_dir}project-manifest.json" ]] && manifests+=("${app_dir}project-manifest.json")
  done

  echo ""
  echo -e "  ${BOLD}Federation-level analysis:${RESET}"

  # write manifest paths to temp file, then read in node
  local tmp_list
  tmp_list=$(mktemp)
  for m in "${manifests[@]}"; do echo "$(pwd)/$m" >> "$tmp_list"; done

  node -e "
    const fs = require('fs');
    const paths = fs.readFileSync('$tmp_list', 'utf-8').trim().split('\n').filter(Boolean);
    const ms = paths.map(p => require(p));
    const issues = ms.flatMap(m => m.federationIssues || []);
    if (issues.length === 0) {
      console.log('  \u2713 No cross-MF conflicts detected');
    } else {
      issues.forEach(i => {
        const icon = i.severity === 'HIGH' ? '  \u2717' : '  \u26a0';
        console.log(icon + ' [' + i.severity + '] ' + i.package + ': ' + i.description);
      });
    }
    const fedScores = ms.map(m => m.scores && m.scores.federation).filter(Boolean);
    if (fedScores.length) {
      const min = Math.min(...fedScores);
      const icon = min >= 90 ? '\u2713' : min >= 60 ? '\u26a0' : '\u2717';
      console.log('  ' + icon + ' Lowest federation score: ' + min + '/100');
    }
    fs.unlinkSync('$tmp_list');
  " 2>/dev/null || true
}

run_scenario() {
  local entry="$1"
  local dir="${entry%%:*}"
  local label="${entry##*:}"

  local scenario_path="scenarios/$dir"
  [[ -d "$scenario_path" ]] || return

  header "Scenario $dir — $label"

  for app_dir in "$scenario_path"/apps/*/; do
    [[ -d "$app_dir" ]] || continue
    local app_name
    app_name=$(basename "$app_dir")
    [[ -n "$APP_FILTER" && "$app_name" != "$APP_FILTER" ]] && continue
    inspect_app "$app_dir"
  done

  [[ -z "$APP_FILTER" ]] && run_federation_analysis "$scenario_path"
}

# ---- main --------------------------------------------------
echo ""
echo -e "${BOLD}  mf-storefront-demo${RESET}"
echo -e "${DIM}  shared-inspector demonstration across 3 real-world scenarios${RESET}"
echo ""

if [[ -n "$SCENARIO_FILTER" ]]; then
  for entry in "${SCENARIOS[@]}"; do
    dir="${entry%%:*}"
    num="${dir%%-*}"
    [[ "$num" == "$SCENARIO_FILTER" ]] && run_scenario "$entry"
  done
else
  for entry in "${SCENARIOS[@]}"; do
    run_scenario "$entry"
  done
fi

echo ""
separator
echo -e "${DIM}  Tip: bash demo.sh --scenario 2   to focus on a single scenario${RESET}"
echo -e "${DIM}       bash demo.sh --app catalog   to compare one app across all scenarios${RESET}"
echo ""
