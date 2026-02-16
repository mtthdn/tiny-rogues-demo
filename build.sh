#!/usr/bin/env bash
# Build tiny-rogues-demo — exports graph data from CUE and prepares static files
#
# Usage: bash ~/tiny-rogues-demo/build.sh
#
# Prerequisites: cue v0.15.3, quicue.ca symlinked at cue.mod/pkg/quicue.ca

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Tiny Rogues Graph Demo Build ==="

echo "Validating Mod Pipeline..."
cue vet ./modding/

echo "Validating Build Data..."
cue vet ./builddata/

echo "Exporting Mod Pipeline viz..."
cue export ./modding/ -e viz --out json > "${SCRIPT_DIR}/modding.json"

echo "Exporting Build Data viz..."
cue export ./builddata/ -e viz --out json > "${SCRIPT_DIR}/builddata.json"

echo "Exporting Mod Pipeline summary..."
cue export ./modding/ -e summary --out json > "${SCRIPT_DIR}/modding-summary.json"

echo "Exporting Build Data summary..."
cue export ./builddata/ -e summary --out json > "${SCRIPT_DIR}/builddata-summary.json"

echo ""
echo "Build complete. Files:"
ls -lh "${SCRIPT_DIR}"/*.json "${SCRIPT_DIR}"/index.html 2>/dev/null || true
echo ""
echo "Preview: python3 -m http.server -d ${SCRIPT_DIR} 8084"
echo "Deploy:  bash ${SCRIPT_DIR}/deploy.sh"
