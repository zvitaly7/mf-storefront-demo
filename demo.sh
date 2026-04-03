#!/usr/bin/env bash
# ============================================================
#  mf-storefront-demo — demo runner
#
#  Runs @mf-toolkit/shared-inspector on all three scenarios
#  and prints real output from the tool.
#
#  Usage:
#    bash demo.sh                  # all scenarios
#    bash demo.sh --scenario 2     # one scenario
#    bash demo.sh --app catalog    # one app across all scenarios
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MF_CLI="node $ROOT/node_modules/@mf-toolkit/shared-inspector/dist/cli.js"

BOLD='\033[1m'
DIM='\033[2m'
CYAN='\033[0;36m'
RESET='\033[0m'

SCENARIO_FILTER=""
APP_FILTER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --scenario) SCENARIO_FILTER="$2"; shift 2 ;;
    --app)      APP_FILTER="$2";      shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

separator() { echo -e "${DIM}────────────────────────────────────────────────────${RESET}"; }
header()    { echo -e "\n${BOLD}${CYAN}$1${RESET}"; separator; }

inspect_app() {
  local app_dir="$1"
  local app_name="$2"
  local kind="$3"

  echo -e "\n  ${BOLD}$app_name${RESET}"
  $MF_CLI \
    --source  "$app_dir/src" \
    --shared  "$app_dir/shared-config.json" \
    --name    "$app_name" \
    --kind    "$kind" \
    --write-manifest \
    --output-dir "$app_dir" \
    2>&1 | sed 's/^/  /'
}

run_federation() {
  local scenario_dir="$1"
  local manifests=()
  for app_dir in "$scenario_dir"/apps/*/; do
    [[ -f "${app_dir}project-manifest.json" ]] && manifests+=("${app_dir}project-manifest.json")
  done
  [[ ${#manifests[@]} -eq 0 ]] && return

  echo -e "\n${BOLD}  Federation analysis${RESET}"
  separator
  $MF_CLI federation "${manifests[@]}" 2>&1 | sed 's/^/  /'
}

run_scenario() {
  local num="$1"
  local dir="$2"
  local label="$3"
  local scenario_path="$ROOT/scenarios/$dir"

  header "Scenario $num — $label"

  for app_dir in "$scenario_path"/apps/*/; do
    [[ -d "$app_dir" ]] || continue
    local app_name
    app_name=$(basename "$app_dir")
    [[ -n "$APP_FILTER" && "$app_name" != "$APP_FILTER" ]] && continue
    local kind
    kind=$([ "$app_name" = "shell" ] && echo "host" || echo "remote")
    inspect_app "$app_dir" "$app_name" "$kind"
  done

  [[ -z "$APP_FILTER" ]] && run_federation "$scenario_path"
}

echo -e "\n${BOLD}  mf-storefront-demo${RESET}"
echo -e "${DIM}  @mf-toolkit/shared-inspector v$(node -e "process.stdout.write(require('$ROOT/node_modules/@mf-toolkit/shared-inspector/package.json').version)")${RESET}"

declare -A LABELS=(
  [1]="1-healthy:Healthy Baseline"
  [2]="2-drift:Configuration Drift"
  [3]="3-federation-issues:Federation Issues"
)

for num in 1 2 3; do
  IFS=: read -r dir label <<< "${LABELS[$num]}"
  [[ -n "$SCENARIO_FILTER" && "$SCENARIO_FILTER" != "$num" ]] && continue
  run_scenario "$num" "$dir" "$label"
done

echo ""
separator
echo -e "${DIM}  bash demo.sh --scenario 2   focus on one scenario${RESET}"
echo -e "${DIM}  bash demo.sh --app catalog   compare one app across all scenarios${RESET}"
echo ""
