#!/usr/bin/env bash
# inspect-all.sh — monorepo mode: inspect all apps from the repo root
# Usage: bash scripts/inspect-all.sh [--depth direct|local-graph] [--threshold <score>]
set -euo pipefail

DEPTH="${DEPTH:-local-graph}"
THRESHOLD="${THRESHOLD:-80}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --depth) DEPTH="$2"; shift 2 ;;
    --threshold) THRESHOLD="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

APPS=("shell" "catalog" "checkout")
FAILED=()

echo "============================================"
echo " MF Storefront — Monorepo Inspection"
echo " depth: $DEPTH  |  threshold: $THRESHOLD"
echo "============================================"

for app in "${APPS[@]}"; do
  echo ""
  echo "--- Inspecting: $app ---"
  npx @mf-toolkit/shared-inspector \
    --project "apps/$app" \
    --depth "$DEPTH" \
    --threshold "$THRESHOLD" \
    --output json \
    | tee "apps/$app/.inspection-result.json" \
    || FAILED+=("$app")
done

echo ""
echo "============================================"
echo " Federation-level analysis"
echo "============================================"
npx @mf-toolkit/shared-inspector federation \
  --manifests "apps/shell/project-manifest.json" \
             "apps/catalog/project-manifest.json" \
             "apps/checkout/project-manifest.json" \
  --output json \
  | tee .federation-result.json \
  || FAILED+=("federation")

if [[ ${#FAILED[@]} -gt 0 ]]; then
  echo ""
  echo "FAILED: ${FAILED[*]}"
  exit 1
fi

echo ""
echo "All inspections passed."
