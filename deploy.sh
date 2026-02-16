#!/usr/bin/env bash
# Build and deploy tiny-rogues-demo to quique.ca
#
# Usage: bash ~/tiny-rogues-demo/deploy.sh
#
# Steps:
#   1. Validates CUE schemas (both scenarios)
#   2. Exports graph JSON
#   3. Pushes static files to container 612 via tulip
#
# Prerequisites: SSH access to tulip (172.20.1.10)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Build (validates + exports JSON)
bash "${SCRIPT_DIR}/build.sh"

# Deploy to container 612 (Caddy) on tulip
echo ""
echo "Deploying to quique.ca/tiny-rogues-demo/..."
ssh tulip "pct exec 612 -- mkdir -p /var/www/quique.ca/tiny-rogues-demo/"
for f in index.html editor.html explore.html explore.js screenshots.html mod-data.json modding.json builddata.json modding-summary.json builddata-summary.json; do
    tmp="/tmp/trdemo_${f}"
    ssh tulip "cat > ${tmp}" < "${SCRIPT_DIR}/${f}"
    ssh tulip "pct push 612 ${tmp} /var/www/quique.ca/tiny-rogues-demo/${f} && rm ${tmp}"
    echo "  ${f} deployed"
done

echo ""
echo "Live at https://quique.ca/tiny-rogues-demo/"
echo "  Mod Pipeline: https://quique.ca/tiny-rogues-demo/#modding"
echo "  Build Data:   https://quique.ca/tiny-rogues-demo/#builddata"
echo "  Mod Editor:   https://quique.ca/tiny-rogues-demo/editor.html"
echo "  Explore API:  https://quique.ca/tiny-rogues-demo/explore.html"
