#!/bin/bash
# Regenerate the desktop app icons (build/icon.png / icon.ico / icon.icns).
#
# Source of truth: src/assets/images/logo.png (transparent horizontal brand
# logo). We extract the "A" glyph and centre it on a 1024×1024 transparent
# canvas — no white square underneath. Runs cross-platform via Python + Pillow.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 scripts/gen-brand-icons.py

echo "=== results ==="
ls -la build/icon.icns build/icon.ico build/icon.png
