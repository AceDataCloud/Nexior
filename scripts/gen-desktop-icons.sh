#!/bin/bash
# Regenerate the desktop app icons (build/icon.icns + build/icon.ico) from the
# iOS 1024² brand icon. Run from anywhere; requires macOS (iconutil/sips) + npx.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
[ -f "$SRC" ] || { echo "missing source $SRC"; exit 1; }

mkdir -p build
# macOS dock icons need ~10% transparent margin + squircle; iOS source is full-
# bleed. Pad to 824 content in a 1024 canvas with rounded corners. (Windows .ico
# stays full-bleed — built straight from $SRC below.)
python3 - "$SRC" <<'PY'
import sys; from PIL import Image, ImageDraw
s=Image.open(sys.argv[1]).convert("RGBA").resize((824,824),Image.LANCZOS)
m=Image.new("L",(824,824),0); ImageDraw.Draw(m).rounded_rectangle([0,0,824,824],radius=185,fill=255); s.putalpha(m)
c=Image.new("RGBA",(1024,1024),(0,0,0,0)); c.paste(s,(100,100),s); c.save("build/icon.png")
PY

# --- macOS .icns ---
ICONSET=$(mktemp -d)/icon.iconset
mkdir -p "$ICONSET"
for s in 16 32 128 256 512; do
  sips -z "$s" "$s" build/icon.png --out "$ICONSET/icon_${s}x${s}.png" >/dev/null
  d=$((s * 2))
  sips -z "$d" "$d" build/icon.png --out "$ICONSET/icon_${s}x${s}@2x.png" >/dev/null
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
