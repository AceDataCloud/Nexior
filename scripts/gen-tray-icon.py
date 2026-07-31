#!/usr/bin/env python3
"""Generate build/trayTemplate.png (+@2x) — the macOS menu-bar icon.

macOS "template" images must be black-on-transparent: the system derives the
visible colour itself, inverting for dark menu bars and dimming when the app is
inactive. Shipping a coloured icon here looks wrong in half the system themes,
so the brand mark is flattened to alpha rather than recoloured.

Source of truth is the same brand icon the app uses; only its silhouette
survives.

    python3 scripts/gen-tray-icon.py
"""

from __future__ import annotations

import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(
    ROOT, "ios", "App", "App", "Assets.xcassets",
    "AppIcon.appiconset", "AppIcon-512@2x.png",
)
OUT_DIR = os.path.join(ROOT, "build")

# 16pt is the macOS menu-bar convention; @2x covers Retina.
SIZES = [("trayTemplate.png", 16), ("trayTemplate@2x.png", 32)]

# The brand icon is a coloured mark on a WHITE ground, so the mark is what's
# DARK. Anything at/above this luma is background and becomes transparent.
LUMA_BACKGROUND = 230


def main() -> int:
    if not os.path.exists(SRC):
        print(f"missing source icon: {SRC}", file=sys.stderr)
        return 1

    src = Image.open(SRC).convert("RGBA")
    for name, size in SIZES:
        icon = src.resize((size, size), Image.LANCZOS)
        out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        src_px = icon.load()
        out_px = out.load()
        for y in range(size):
            for x in range(size):
                r, g, b, a = src_px[x, y]
                if a == 0:
                    continue
                luma = int(0.299 * r + 0.587 * g + 0.114 * b)
                # Opacity carries the shape; colour is always black so macOS can
                # tint it. Darker source pixel = more opaque mark.
                if luma >= LUMA_BACKGROUND:
                    continue
                alpha = min(255, int(a * (1 - luma / LUMA_BACKGROUND)))
                out_px[x, y] = (0, 0, 0, alpha)
        path = os.path.join(OUT_DIR, name)
        out.save(path)
        print(f"wrote {path} ({size}x{size})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
