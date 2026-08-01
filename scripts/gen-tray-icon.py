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

# 16pt canvas, @2x for Retina. The mark fills it edge to edge (PADDING = 0), so
# 16pt here is a 16pt glyph — not the 14pt one an earlier 16pt canvas produced
# by also reserving padding. Neighbours run 18pt (ChatGPT, Claude); this sits a
# notch under them on purpose, because the wide 「∧」 reads bigger than a round
# or square glyph of the same nominal height.
SIZES = [("trayTemplate.png", 16), ("trayTemplate@2x.png", 32)]

# The brand icon is a coloured mark on a WHITE ground, so the mark is what's
# DARK. Anything at/above this luma is background and becomes transparent.
# Used for both the silhouette and the bbox, so the crop matches the shape.
LUMA_BACKGROUND = 200

# The source is an app icon: the mark occupies ~58% of a square canvas, the rest
# is padding sized for a rounded-rect app tile. Downscaling that whole canvas to
# 16px spends 40% of the height on nothing and leaves hairline strokes. Crop to
# the mark first, then rescale so it fills the menu-bar slot the way every other
# icon up there does.
#
# The mark is wider than it is tall, so height is the binding dimension: fitting
# it into a square box by its width would leave the glyph short and floating.
# It's scaled to fill the canvas HEIGHT (minus padding) and allowed to run the
# full width, which is what makes it read at menu-bar size.
#
# No padding: macOS already insets the tray image within the menu-bar item, so
# padding baked into the PNG shrinks the glyph twice — which is how a 16pt
# canvas used to yield a 14pt mark. Sizing is controlled by the canvas alone
# (see SIZES), never by padding.
PADDING = 0

# Anti-aliasing is applied ONCE, by the final downscale — never to the alpha
# afterwards. Thresholding at full resolution first makes the mark a hard
# silhouette, so shrinking it leaves solid black inside and softens only the
# outline. The previous approach scaled first and derived alpha from the
# result's luma: since the brand mark is a light mint/teal gradient, that never
# reached opaque anywhere, and the menu bar rendered the whole glyph as grey
# mush (mean alpha 174/255, 3 of 77 pixels actually solid).


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


def silhouette(img: Image.Image) -> Image.Image:
    """Hard black-on-transparent mask of the mark, at the source's resolution."""
    px = img.load()
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    mask_px = mask.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if int(0.299 * r + 0.587 * g + 0.114 * b) < LUMA_BACKGROUND:
                mask_px[x, y] = 255
    return mask


def main() -> int:
    if not os.path.exists(SRC):
        print(f"missing source icon: {SRC}", file=sys.stderr)
        return 1

    src = Image.open(SRC).convert("RGBA")
    # Threshold BEFORE scaling: a hard silhouette downscales to solid black with
    # an anti-aliased edge, whereas scaling first and thresholding after leaves
    # every pixel semi-transparent.
    mask = silhouette(src).crop(mark_bbox(src))

    for name, size in SIZES:
        inner_h = size - 2 * PADDING
        # Height-bound: preserve the aspect ratio, let the width fall where it
        # may (the mark is wider than tall, and the extra width is what gives it
        # presence next to neighbouring menu-bar icons).
        inner_w = max(1, round(mask.width * inner_h / mask.height))
        if inner_w > size:  # never overflow the canvas
            inner_w, inner_h = size, max(1, round(mask.height * size / mask.width))
        alpha = mask.resize((inner_w, inner_h), Image.LANCZOS)
        # LANCZOS rings: it overshoots at hard edges, leaving a halo of alpha
        # 1-27 a pixel or two outside the glyph. Invisible on white, a grey
        # smudge on a dark menu bar. Anything under ~10% coverage isn't edge
        # anti-aliasing, it's ringing.
        alpha = alpha.point(lambda p: 0 if p < 26 else p)

        out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        # Colour is always black; the mask alone carries the shape, so macOS can
        # tint it for light/dark menu bars.
        out.paste(Image.new("RGBA", (inner_w, inner_h), (0, 0, 0, 255)), ((size - inner_w) // 2, (size - inner_h) // 2), alpha)

        path = os.path.join(OUT_DIR, name)
        out.save(path)
        vals = [p for p in alpha.getdata() if p > 0]
        solid = sum(1 for p in vals if p >= 250)
        print(f"wrote {path} ({size}x{size}, mark {inner_w}x{inner_h}px, {solid}/{len(vals)} solid px)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
