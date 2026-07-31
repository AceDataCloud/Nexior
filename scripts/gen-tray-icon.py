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

# The source is an app icon: the mark occupies ~58% of a square canvas, the rest
# is padding sized for a rounded-rect app tile. Downscaling that whole canvas to
# 16px spends 40% of the height on nothing and leaves hairline strokes. Crop to
# the mark first, then rescale so it fills the menu-bar slot the way every other
# icon up there does.
#
# 1px of breathing room top/bottom, per Apple's menu-bar guidance — enough to
# not collide with the bar edges, small enough that the glyph still reads.
PADDING = 1

# Anti-aliased downscaling turns a solid mark into mostly-translucent pixels,
# which the menu bar renders as grey mush. The source mark is also a light
# gradient (mint/teal), so raw luma-derived alpha never approaches opaque. The
# coverage map is therefore normalized — the mark's own darkest pixel becomes
# fully opaque — giving a 16px glyph the weight a hand-drawn one would have.
GAMMA = 0.65


def mark_bbox(img: Image.Image) -> tuple[int, int, int, int]:
    """Bounding box of the actual mark, ignoring the app-tile padding."""
    px = img.load()
    w, h = img.size
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if int(0.299 * r + 0.587 * g + 0.114 * b) < LUMA_BACKGROUND:
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
    if min_x > max_x or min_y > max_y:
        raise SystemExit("no mark found in source icon — luma threshold wrong?")
    return min_x, min_y, max_x + 1, max_y + 1


def coverage(img: Image.Image) -> list[float]:
    """Per-pixel 'how much mark is here', 0..1, before normalization."""
    px = img.load()
    w, h = img.size
    out = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            luma = int(0.299 * r + 0.587 * g + 0.114 * b)
            out.append(0.0 if a == 0 or luma >= LUMA_BACKGROUND else (a / 255) * (1 - luma / LUMA_BACKGROUND))
    return out


def main() -> int:
    if not os.path.exists(SRC):
        print(f"missing source icon: {SRC}", file=sys.stderr)
        return 1

    src = Image.open(SRC).convert("RGBA")
    # Crop to the mark, then pad back to a square so the aspect ratio survives
    # the resize (a non-square crop scaled into a square box would stretch it).
    mark = src.crop(mark_bbox(src))
    side = max(mark.size)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(mark, ((side - mark.width) // 2, (side - mark.height) // 2))

    for name, size in SIZES:
        scale = size // 16
        inner = size - 2 * PADDING * scale
        icon = square.resize((inner, inner), Image.LANCZOS)
        cov = coverage(icon)
        peak = max(cov) or 1.0

        out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        out_px = out.load()
        offset = (size - inner) // 2
        for i, c in enumerate(cov):
            if c <= 0:
                continue
            # Normalize to the mark's own peak, then gamma-lift so mid-coverage
            # edge pixels stay legible instead of fading to grey.
            alpha = min(255, int(255 * ((c / peak) ** GAMMA)))
            out_px[i % inner + offset, i // inner + offset] = (0, 0, 0, alpha)

        path = os.path.join(OUT_DIR, name)
        out.save(path)
        solid = sum(1 for i, c in enumerate(cov) if c > 0 and (c / peak) ** GAMMA > 0.78)
        print(f"wrote {path} ({size}x{size}, mark {inner}px, {solid} solid px)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
