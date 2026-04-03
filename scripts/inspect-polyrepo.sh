#!/usr/bin/env bash
# inspect-polyrepo.sh — poly-repo simulation: each app inspected in isolation
# Demonstrates that the inspector works identically for co-located or distributed apps.
# Usage: bash scripts/inspect-polyrepo.sh [--app shell|catalog|checkout] [--depth direct|local-graph]
set -euo pipefail

DEPTH="${DEPTH:-local-graph}"
TARGET_APP="${APP:-all}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app) TARGET_APP="$2"; shift 2 ;;
    --depth) DEPTH="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

inspect_app() {
  local app="$1"
  local app_dir="apps/$app"

  echo ""
  echo "============================================"
  echo " Poly-repo inspection: $app"
  echo " (simulating independent repository)"
  echo "============================================"

  # Simulate: copy manifest to a temp location as if downloaded from CI artifact
  local tmp_dir
  tmp_dir=$(mktemp -d)
  cp "$app_dir/project-manifest.json" "$tmp_dir/project-manifest.json"

  npx @mf-toolkit/shared-inspector \
    --project "$app_dir" \
    --depth "$DEPTH" \
    --manifest "$tmp_dir/project-manifest.json" \
    --output json

  rm -rf "$tmp_dir"
}

if [[ "$TARGET_APP" == "all" ]]; then
  for app in shell catalog checkout; do
    inspect_app "$app"
  done
else
  inspect_app "$TARGET_APP"
fi

echo ""
echo "Poly-repo inspection complete."
