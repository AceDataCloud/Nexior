#!/usr/bin/env python3
"""
Regenerate build/icon.ico from build/icon.png so Windows renders the taskbar /
title-bar / installer icons with a transparent background (matching macOS).

The old pipeline in gen-desktop-icons.sh built the .ico directly from the raw
1024² iOS AppIcon source, which is full-bleed and opaque — producing a solid
white square on Windows. This script uses build/icon.png (which the macOS half
of the shell script already renders with a padded, rounded-corner alpha) as
the single source of truth, so the .ico inherits the same transparency.

Runs cross-platform (needs only Pillow); safe to call locally or from CI.

    python3 scripts/gen-windows-icon.py
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "build" / "icon.png"
OUT = ROOT / "build" / "icon.ico"

# Windows multi-resolution ICO layers. Explorer picks the closest match per
# scale; 16/24/32/48 cover 100–150 % DPI title bars, 64/128/256 cover taskbar
# and Alt-Tab thumbnails.
SIZES = [16, 24, 32, 48, 64, 128, 256]


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"missing {SRC} — run scripts/gen-desktop-icons.sh first")
    src = Image.open(SRC).convert("RGBA")
    if src.size != (1024, 1024):
        # Not fatal: Pillow's ICO writer resamples anyway; just note it.
        print(f"note: source is {src.size}, expected (1024, 1024)")
    src.save(OUT, format="ICO", sizes=[(s, s) for s in SIZES])
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes, layers={SIZES})")


if __name__ == "__main__":
    main()
