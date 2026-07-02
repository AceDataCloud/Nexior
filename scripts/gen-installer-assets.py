#!/usr/bin/env python3
"""
Regenerate the NSIS installer's branding bitmaps:
  build/installer-header.bmp   (150 x 57,  24-bit BMP) — wizard top strip
  build/installer-sidebar.bmp  (164 x 314, 24-bit BMP) — welcome / finish left

Both composite the AceData squircle icon (build/icon.png) onto a subtle brand
gradient. NSIS' classic UI requires 24-bit uncompressed BMP; Pillow's default
"BMP" writer emits exactly that when the source mode is RGB.

Run once whenever build/icon.png or the brand palette changes:
    python3 scripts/gen-installer-assets.py
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ICON = ROOT / "build" / "icon.png"
HEADER_OUT = ROOT / "build" / "installer-header.bmp"
SIDEBAR_OUT = ROOT / "build" / "installer-sidebar.bmp"

# AceData brand palette (from the Nexior CSS custom properties). A vertical
# gradient from a deep slate top to a lighter slate bottom reads as "premium"
# without competing with the app's own theming.
BG_TOP = (13, 25, 45)  # #0d192d — deep slate
BG_BOT = (35, 58, 96)  # #233a60 — lighter slate


def gradient(width: int, height: int, top: tuple[int, int, int], bot: tuple[int, int, int]) -> Image.Image:
    """Vertical linear gradient. Each row is a 1-pixel-tall solid image
    pasted at the correct y offset — one Pillow call per row instead of
    width*height putpixel calls (cheap, no numpy dep)."""
    img = Image.new("RGB", (width, height))
    for y in range(height):
        t = y / max(height - 1, 1)
        r = int(top[0] * (1 - t) + bot[0] * t)
        g = int(top[1] * (1 - t) + bot[1] * t)
        b = int(top[2] * (1 - t) + bot[2] * t)
        row = Image.new("RGB", (width, 1), (r, g, b))
        img.paste(row, (0, y))
    return img


def paste_icon_centered(bg: Image.Image, icon: Image.Image, box: tuple[int, int, int, int]) -> None:
    """Alpha-composite `icon` centered inside `box` on `bg` (in place)."""
    left, top, right, bottom = box
    bw, bh = right - left, bottom - top
    ratio = min(bw / icon.width, bh / icon.height)
    w = max(1, int(icon.width * ratio))
    h = max(1, int(icon.height * ratio))
    resized = icon.resize((w, h), Image.LANCZOS)
    x = left + (bw - w) // 2
    y = top + (bh - h) // 2
    bg.paste(resized, (x, y), resized)


def render_header(icon: Image.Image) -> Image.Image:
    # NSIS header is 150x57 with the wizard title / subtitle rendered on the
    # right by NSIS itself, so anchor the icon on the left half.
    bg = gradient(150, 57, BG_TOP, BG_BOT)
    paste_icon_centered(bg, icon, box=(6, 4, 55, 53))
    return bg


def render_sidebar(icon: Image.Image) -> Image.Image:
    # NSIS sidebar is 164x314 shown on Welcome + Finish pages. Icon top,
    # empty space below (NSIS writes no text over sidebar).
    bg = gradient(164, 314, BG_TOP, BG_BOT)
    paste_icon_centered(bg, icon, box=(12, 24, 152, 172))
    return bg


def main() -> None:
    if not ICON.exists():
        raise SystemExit(f"missing {ICON} — run scripts/gen-desktop-icons.sh first")
    icon = Image.open(ICON).convert("RGBA")
    render_header(icon).save(HEADER_OUT, format="BMP")
    render_sidebar(icon).save(SIDEBAR_OUT, format="BMP")
    print(f"wrote {HEADER_OUT} ({HEADER_OUT.stat().st_size} bytes)")
    print(f"wrote {SIDEBAR_OUT} ({SIDEBAR_OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
