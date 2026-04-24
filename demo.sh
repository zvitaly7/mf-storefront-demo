#!/usr/bin/env bash
# ============================================================
#  mf-storefront-demo — demo runner
#
#  Runs @mf-toolkit/shared-inspector on all scenarios and
#  prints real output from the tool.
#
#  Usage:
#    bash demo.sh                  # all scenarios + extras
#    bash demo.sh --scenario 2     # one scenario
#    bash demo.sh --app catalog    # one app across all scenarios
#    bash demo.sh --depth          # depth comparison only
#    bash demo.sh --ci-gate        # CI gate demonstration only
#    bash demo.sh --bridge         # mf-bridge integration diff only
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MF_CLI="node $ROOT/node_modules/@mf-toolkit/shared-inspector/dist/cli.js"

BOLD='\033[1m'
DIM='\033[2m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
RESET='\033[0m'

SCENARIO_FILTER=""
APP_FILTER=""
DEPTH_ONLY=false
CI_GATE_ONLY=false
BRIDGE_ONLY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --scenario)  SCENARIO_FILTER="$2"; shift 2 ;;
    --app)       APP_FILTER="$2";      shift 2 ;;
    --depth)     DEPTH_ONLY=true;      shift   ;;
    --ci-gate)   CI_GATE_ONLY=true;    shift   ;;
    --bridge)    BRIDGE_ONLY=true;     shift   ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

separator() { echo -e "${DIM}────────────────────────────────────────────────────${RESET}"; }
header()    { echo -e "\n${BOLD}${CYAN}$1${RESET}"; separator; }
subheader() { echo -e "\n${BOLD}${YELLOW}$1${RESET}"; }

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

run_depth_comparison() {
  header "Depth Comparison — barrel pattern analysis"

  local catalog_dir="$ROOT/scenarios/1-healthy/apps/catalog"

  echo -e "  Catalog imports lodash only through a barrel re-export chain:"
  echo -e "${DIM}    ProductList.tsx → ./utils → utils/index.ts → ./format → utils/format.ts${RESET}"
  echo -e "${DIM}                                                              ↓${RESET}"
  echo -e "${DIM}                                                    ./vendor → utils/vendor.ts${RESET}"
  echo -e "${DIM}                                                              ↓${RESET}"
  echo -e "${DIM}                                             export { chunk, orderBy } from 'lodash'${RESET}"

  subheader "  --depth direct  (regex scan only — re-exports skipped)"
  $MF_CLI \
    --source "$catalog_dir/src" \
    --shared "$catalog_dir/shared-config.json" \
    --name catalog --kind remote \
    --depth direct \
    --write-manifest --output-dir /tmp/mf-demo-depth-direct \
    2>&1 | sed 's/^/  /'
  resolved_direct=$(python3 -c "import json; d=json.load(open('/tmp/mf-demo-depth-direct/project-manifest.json')); print(', '.join(d['usage']['resolvedPackages']))" 2>/dev/null || echo "n/a")
  echo -e "  ${DIM}resolvedPackages: $resolved_direct${RESET}"

  subheader "  --depth local-graph  (follows re-exports — default)"
  $MF_CLI \
    --source "$catalog_dir/src" \
    --shared "$catalog_dir/shared-config.json" \
    --name catalog --kind remote \
    --depth local-graph \
    --write-manifest --output-dir /tmp/mf-demo-depth-graph \
    2>&1 | sed 's/^/  /'
  resolved_graph=$(python3 -c "import json; d=json.load(open('/tmp/mf-demo-depth-graph/project-manifest.json')); print(', '.join(d['usage']['resolvedPackages']))" 2>/dev/null || echo "n/a")
  echo -e "  ${DIM}resolvedPackages: $resolved_graph${RESET}"

  echo -e "\n  ${DIM}lodash is absent in --depth direct (re-export skipped) and present in --depth local-graph${RESET}"
  echo -e "  ${DIM}In scenario 3, shell shares lodash — that ghost share is only detectable once${RESET}"
  echo -e "  ${DIM}the federation analyzer sees catalog actually uses it (local-graph surfaces it).${RESET}"
}

run_bridge_comparison() {
  header "MF Bridge — host/remote wiring diff"

  local before="$ROOT/scenarios/1-healthy/apps/shell/src/App.tsx"
  local after_app="$ROOT/scenarios/5-mf-bridge/apps/shell/src/App.tsx"
  local after_checkout="$ROOT/scenarios/5-mf-bridge/apps/shell/src/features/Checkout.tsx"
  local remote_entry="$ROOT/scenarios/5-mf-bridge/apps/checkout/src/entry.ts"

  subheader "  Before — raw React.lazy + Suspense (scenarios/1-healthy)"
  echo -e "${DIM}    $before${RESET}"
  sed -n '1,20p' "$before" | sed 's/^/    /'

  subheader "  After — MFBridgeLazy (scenarios/5-mf-bridge)"
  echo -e "${DIM}    $after_app${RESET}"
  sed -n '1,20p' "$after_app" | sed 's/^/    /'

  subheader "  Host wrapper — typed props, fallback, retries, events"
  echo -e "${DIM}    $after_checkout${RESET}"
  cat "$after_checkout" | sed 's/^/    /'

  subheader "  Remote entry — createMFEntry (emit + onCommand)"
  echo -e "${DIM}    $remote_entry${RESET}"
  cat "$remote_entry" | sed 's/^/    /'

  subheader "  What the bridge replaces"
  echo -e "    ${DIM}- manual React.lazy + Suspense wrappers per remote${RESET}"
  echo -e "    ${DIM}- hand-written error boundaries for remote load failures${RESET}"
  echo -e "    ${DIM}- ad-hoc retry logic and loading-state tracking${RESET}"
  echo -e "    ${DIM}- global emitters or window singletons for remote events${RESET}"
  echo -e "    ${DIM}- untyped 'catalog/ProductList' declarations.d.ts stubs${RESET}"

  echo -e "\n  ${BOLD}Per-app inspector scores (scenario 5 stays healthy)${RESET}"
  separator
  for app_dir in "$ROOT/scenarios/5-mf-bridge"/apps/*/; do
    [[ -d "$app_dir" ]] || continue
    local app_name
    app_name=$(basename "$app_dir")
    local kind
    kind=$([ "$app_name" = "shell" ] && echo "host" || echo "remote")
    inspect_app "$app_dir" "$app_name" "$kind"
  done
  run_federation "$ROOT/scenarios/5-mf-bridge"
}

run_ci_gate() {
  header "CI Gate — federation-gate.ts"

  local gate="$ROOT/node_modules/.bin/ts-node $ROOT/scripts/federation-gate.ts"
  # Verify ts-node is available
  if [[ ! -x "$ROOT/node_modules/.bin/ts-node" ]]; then
    echo "  ts-node not found — run: npm install"
    return
  fi

  subheader "  Scenario 1 with threshold 90 — expected: PASS"
  $gate --scenario 1 --min-score 90 2>&1 | sed 's/^/  /' || true

  subheader "  Scenario 2 with threshold 90 — expected: FAIL (catalog: 60, checkout: 84)"
  $gate --scenario 2 --min-score 90 2>&1 | sed 's/^/  /' || true

  subheader "  Scenario 4 with threshold 90 — expected: FAIL (all CRITICAL)"
  $gate --scenario 4 --min-score 90 2>&1 | sed 's/^/  /' || true
}

echo -e "\n${BOLD}  mf-storefront-demo${RESET}"
echo -e "${DIM}  @mf-toolkit/shared-inspector v$(node -e "process.stdout.write(require('$ROOT/node_modules/@mf-toolkit/shared-inspector/package.json').version)")${RESET}"

if $DEPTH_ONLY; then
  run_depth_comparison
  echo ""
  exit 0
fi

if $CI_GATE_ONLY; then
  run_ci_gate
  echo ""
  exit 0
fi

if $BRIDGE_ONLY; then
  run_bridge_comparison
  echo ""
  exit 0
fi

declare -A LABELS=(
  [1]="1-healthy:Healthy Baseline"
  [2]="2-drift:Configuration Drift"
  [3]="3-federation-issues:Federation Issues"
  [4]="4-critical:Critical — Everything Wrong"
  [5]="5-mf-bridge:MF Bridge Integration"
)

for num in 1 2 3 4 5; do
  IFS=: read -r dir label <<< "${LABELS[$num]}"
  [[ -n "$SCENARIO_FILTER" && "$SCENARIO_FILTER" != "$num" ]] && continue
  if [[ "$num" == "5" ]]; then
    run_bridge_comparison
  else
    run_scenario "$num" "$dir" "$label"
  fi
done

if [[ -z "$SCENARIO_FILTER" && -z "$APP_FILTER" ]]; then
  run_depth_comparison
  run_ci_gate
fi

echo ""
separator
echo -e "${DIM}  bash demo.sh --scenario 2      focus on one scenario${RESET}"
echo -e "${DIM}  bash demo.sh --app catalog      compare one app across all scenarios${RESET}"
echo -e "${DIM}  bash demo.sh --depth            barrel depth comparison only${RESET}"
echo -e "${DIM}  bash demo.sh --ci-gate          CI gate demonstration only${RESET}"
echo -e "${DIM}  bash demo.sh --bridge           mf-bridge integration diff only${RESET}"
echo ""
