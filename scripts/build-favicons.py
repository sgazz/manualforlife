#!/usr/bin/env python3
"""
Build production favicon assets from public/brand/favicon-source.png.

Single source of truth for manualfor.life (landing) and app.manualfor.life (Next).
Square masters use the full 1024×1024 canvas (no extra shrink). Non-square sources
are letterboxed to a square, then scaled into an inner box with ~16% side padding.
Run from repo root: python3 scripts/build-favicons.py
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "brand" / "favicon-source.png"
BRAND = ROOT / "public" / "brand"
PUBLIC = ROOT / "public"
APP = ROOT / "app"

MASTER = 1024
SIDE_PADDING_FRAC = 0.16
INNER = max(1, int(round(MASTER * (1 - 2 * SIDE_PADDING_FRAC))))

BG = (248, 245, 240, 255)


def build_master_1024(im: Image.Image) -> Image.Image:
    """1024×1024 RGBA master on warm beige; preserves final square artwork 1:1."""
    im = im.convert("RGBA")
    w, h = im.size
    out = Image.new("RGBA", (MASTER, MASTER), BG)

    if w == h:
        # Canonical square brand asset → use full canvas (same pixels at 1024×1024).
        fg = ImageOps.contain(im, (MASTER, MASTER), method=Image.Resampling.LANCZOS)
    else:
        fg = ImageOps.contain(im, (INNER, INNER), method=Image.Resampling.LANCZOS)

    ox = (MASTER - fg.width) // 2
    oy = (MASTER - fg.height) // 2
    out.alpha_composite(fg, (ox, oy))
    return out


def downscale(master: Image.Image, size: int) -> Image.Image:
    """Resize master to output size; light sharpen on tiny pixels."""
    out = master.resize((size, size), Image.Resampling.LANCZOS)
    if size <= 32:
        out = out.filter(
            ImageFilter.UnsharpMask(radius=0.45, percent=125, threshold=1)
        )
    if size <= 16:
        out = out.filter(
            ImageFilter.UnsharpMask(radius=0.35, percent=105, threshold=0)
        )
    return out


def main() -> int:
    if not SOURCE.is_file():
        print(f"Missing source: {SOURCE}", file=sys.stderr)
        return 1

    BRAND.mkdir(parents=True, exist_ok=True)
    master = build_master_1024(Image.open(SOURCE))

    sizes = {
        "favicon-16x16.png": 16,
        "favicon-32x32.png": 32,
        "apple-touch-icon.png": 180,
        "android-chrome-192x192.png": 192,
        "android-chrome-512x512.png": 512,
    }
    for name, px in sizes.items():
        downscale(master, px).save(BRAND / name, format="PNG", optimize=True)

    i16 = downscale(master, 16)
    i32 = downscale(master, 32)
    i32.save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(32, 32), (16, 16)],
        append_images=[i16],
    )

    downscale(master, 512).save(APP / "icon.png", format="PNG", optimize=True)

    print("Wrote:", PUBLIC / "favicon.ico")
    for name in sizes:
        print("Wrote:", BRAND / name)
    print("Wrote:", APP / "icon.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
