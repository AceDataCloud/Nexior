#!/usr/bin/env python3
"""Regenerate the brand app icons for desktop (build/icon.png / icon.ico / icon.icns).

Source of truth: src/assets/images/logo.png (horizontal "A + ceData" logo with
a fully transparent background). We crop out just the "A" glyph, upscale it,
and centre it in a 1024x1024 transparent canvas — no white square underneath.

Cross-platform: pure Python + Pillow. Run from anywhere:
    python3 scripts/gen-brand-icons.py

Delegates .ico generation to `scripts/gen-windows-icon.py` (multi-layer ICO
with all standard Windows sizes 16..256).
"""

from __future__ import annotations

import os
import subprocess
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_SRC = os.path.join(ROOT, "src", "assets", "images", "logo.png")
BUILD_DIR = os.path.join(ROOT, "build")

# Empirically-determined bbox of the "A" glyph within the horizontal logo.
# The gap between "A" and "ceData" starts at x=128 (fully-transparent column
# runs 128..133), so we crop x=0..128 and then tighten to opaque bbox.
A_CROP = (0, 0, 128, 143)

# Content size in the 1024×1024 icon canvas. Leaving ~10% padding on all sides
# matches modern desktop-icon convention (Windows 11 / macOS Big Sur+).
CANVAS = 1024
CONTENT_MAX = 820


def build_icon_png() -> str:
    logo = Image.open(LOGO_SRC).convert("RGBA")
    a_region = logo.crop(A_CROP)
    tight = a_region.crop(a_region.getbbox())
    tw, th = tight.size

    ratio = min(CONTENT_MAX / tw, CONTENT_MAX / th)
    nw, nh = int(round(tw * ratio)), int(round(th * ratio))
    resized = tight.resize((nw, nh), Image.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(resized, ((CANVAS - nw) // 2, (CANVAS - nh) // 2), resized)

    out = os.path.join(BUILD_DIR, "icon.png")
    canvas.save(out, format="PNG")
    print(f"wrote {out} ({os.path.getsize(out)} bytes, {CANVAS}x{CANVAS} RGBA, transparent bg)")
    return out


def build_icns(icon_png_path: str) -> None:
    """Pillow ICNS write. macOS Dock icons need a white rounded-rect badge
    behind the glyph (Big Sur+ convention). Windows .ico stays transparent
    (built separately from the raw build/icon.png by gen-windows-icon.py)."""
    from PIL import ImageDraw

    try:
        img = Image.open(icon_png_path).convert("RGBA")
        # White rounded squircle badge sized to the content area
        badge = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
        draw = ImageDraw.Draw(badge)
        margin = (CANVAS - CONTENT_MAX) // 2
        draw.rounded_rectangle(
            [margin, margin, CANVAS - margin, CANVAS - margin],
            radius=185,
            fill=(255, 255, 255, 255),
        )
        badge.alpha_composite(img)
        out = os.path.join(BUILD_DIR, "icon.icns")
        badge.save(out, format="ICNS")
        print(f"wrote {out} ({os.path.getsize(out)} bytes, white badge for macOS)")
    except (OSError, ValueError) as exc:
        print(f"WARN: could not write icon.icns via Pillow: {exc}", file=sys.stderr)
        print("      rebuild it on macOS via scripts/gen-desktop-icons.sh.", file=sys.stderr)


def build_ico() -> None:
    script = os.path.join(ROOT, "scripts", "gen-windows-icon.py")
    subprocess.check_call([sys.executable, script])


def main() -> None:
    if not os.path.isfile(LOGO_SRC):
        raise SystemExit(f"missing brand source: {LOGO_SRC}")
    os.makedirs(BUILD_DIR, exist_ok=True)
    icon_png = build_icon_png()
    build_icns(icon_png)
    build_ico()


if __name__ == "__main__":
    main()
