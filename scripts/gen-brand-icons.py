#!/usr/bin/env python3
"""Regenerate the brand app icons for desktop (build/icon.png / icon.ico / icon.icns).

Source of truth: ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
(the full 1024² AceData brand icon used by iOS).

- macOS .icns: padded squircle with white badge background.
- Windows .ico: transparent background (icon only, no badge).
- build/icon.png: intermediate used by .ico generation (transparent).

Cross-platform: pure Python + Pillow. Run from anywhere:
    python3 scripts/gen-brand-icons.py

Delegates .ico generation to `scripts/gen-windows-icon.py` (multi-layer ICO
with all standard Windows sizes 16..256).
"""

from __future__ import annotations

import os
import subprocess
import sys

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IOS_ICON_SRC = os.path.join(
    ROOT, "ios", "App", "App", "Assets.xcassets",
    "AppIcon.appiconset", "AppIcon-512@2x.png",
)
BUILD_DIR = os.path.join(ROOT, "build")

CANVAS = 1024
CONTENT = 824  # ~10% margin on each side
RADIUS = 185


def build_icon_png() -> str:
    """Build transparent icon.png for Windows .ico (no badge, transparent bg)."""
    src = Image.open(IOS_ICON_SRC).convert("RGBA").resize((CONTENT, CONTENT), Image.LANCZOS)
    # Apply rounded-corner mask so the icon shape matches macOS squircle style
    mask = Image.new("L", (CONTENT, CONTENT), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, CONTENT, CONTENT], radius=RADIUS, fill=255)
    src.putalpha(mask)

    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    offset = (CANVAS - CONTENT) // 2
    canvas.paste(src, (offset, offset), src)

    out = os.path.join(BUILD_DIR, "icon.png")
    canvas.save(out, format="PNG")
    print(f"wrote {out} ({os.path.getsize(out)} bytes, {CANVAS}x{CANVAS} RGBA, transparent bg)")
    return out


def build_icns(icon_png_path: str) -> None:
    """macOS .icns with white badge behind the brand icon (Big Sur+ convention)."""
    try:
        img = Image.open(icon_png_path).convert("RGBA")
        badge = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
        draw = ImageDraw.Draw(badge)
        margin = (CANVAS - CONTENT) // 2
        draw.rounded_rectangle(
            [margin, margin, CANVAS - margin, CANVAS - margin],
            radius=RADIUS,
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
    if not os.path.isfile(IOS_ICON_SRC):
        raise SystemExit(f"missing brand source: {IOS_ICON_SRC}")
    os.makedirs(BUILD_DIR, exist_ok=True)
    icon_png = build_icon_png()
    build_icns(icon_png)
    build_ico()


if __name__ == "__main__":
    main()
