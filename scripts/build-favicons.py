#!/usr/bin/env python3
"""
Build production favicon assets from public/brand/favicon-source.png.

Single source of truth for manualfor.life (landing) and app.manualfor.life (Next).
Square masters use the full 1024×1024 canvas (no extra shrink). Non-square sources
are letterboxed to a square, then scaled into an inner box with ~16% side padding.

Outputs:
  public/favicon.ico
  public/brand/favicon-16x16.png, favicon-32x32.png
  public/brand/apple-touch-icon.png (180)
  public/brand/icon-192.png, icon-512.png
  public/brand/icon-512-maskable.png (512, extra safe-zone for purpose: maskable)
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

MASTER = 1024
SIDE_PADDING_FRAC = 0.16
INNER = max(1, int(round(MASTER * (1 - 2 * SIDE_PADDING_FRAC))))

# Warm beige — brand shell (matches layout themeColor)
BG = (248, 245, 240, 255)

# Maskable: keep monogram inside ~58% of edge so circle crops stay clean
MASKABLE_INNER_FRAC = 0.58


def build_master_1024(im: Image.Image) -> Image.Image:
    """1024×1024 RGBA master on warm beige; preserves final square artwork 1:1."""
    im = im.convert("RGBA")
    w, h = im.size
    out = Image.new("RGBA", (MASTER, MASTER), BG)

    if w == h:
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


def build_maskable_512(master: Image.Image) -> Image.Image:
    """512×512 with tighter inset monogram for Android maskable / adaptive icons."""
    size = 512
    out = Image.new("RGBA", (size, size), BG)
    inner = max(1, int(round(size * MASKABLE_INNER_FRAC)))
    fg = ImageOps.contain(master, (inner, inner), method=Image.Resampling.LANCZOS)
    ox = (size - fg.width) // 2
    oy = (size - fg.height) // 2
    out.alpha_composite(fg, (ox, oy))
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
        "icon-192.png": 192,
        "icon-512.png": 512,
    }
    for name, px in sizes.items():
        downscale(master, px).save(BRAND / name, format="PNG", optimize=True)

    build_maskable_512(master).save(
        BRAND / "icon-512-maskable.png", format="PNG", optimize=True
    )

    i16 = downscale(master, 16)
    i32 = downscale(master, 32)
    i32.save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(32, 32), (16, 16)],
        append_images=[i16],
    )

    print("Wrote:", PUBLIC / "favicon.ico")
    for name in sizes:
        print("Wrote:", BRAND / name)
    print("Wrote:", BRAND / "icon-512-maskable.png")

    legacy = [
        BRAND / "android-chrome-192x192.png",
        BRAND / "android-chrome-512x512.png",
    ]
    for path in legacy:
        if path.is_file():
            path.unlink()
            print("Removed legacy:", path)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
