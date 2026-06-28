#!/bin/bash
# Regenerate the desktop app icons (build/icon.icns + build/icon.ico) from the
# iOS 1024² brand icon. Run from anywhere; requires macOS (iconutil/sips) + npx.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
[ -f "$SRC" ] || { echo "missing source $SRC"; exit 1; }

mkdir -p build
cp "$SRC" build/icon.png

# --- macOS .icns ---
ICONSET=$(mktemp -d)/icon.iconset
mkdir -p "$ICONSET"
for s in 16 32 128 256 512; do
  sips -z "$s" "$s" "$SRC" --out "$ICONSET/icon_${s}x${s}.png" >/dev/null
  d=$((s * 2))
  sips -z "$d" "$d" "$SRC" --out "$ICONSET/icon_${s}x${s}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o build/icon.icns

# --- Windows .ico (multi-resolution) ---
ICOTMP=$(mktemp -d)
ARGS=()
for s in 16 24 32 48 64 128 256; do
  sips -z "$s" "$s" "$SRC" --out "$ICOTMP/$s.png" >/dev/null
  ARGS+=("$ICOTMP/$s.png")
done
npx --yes png-to-ico "${ARGS[@]}" >build/icon.ico

echo "=== results ==="
ls -la build/icon.icns build/icon.ico build/icon.png
file build/icon.icns build/icon.ico
