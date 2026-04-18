#!/usr/bin/env python3
"""
Render Open Graph image (1200×630) for Manualfor.life social previews.
Requires: scripts/fonts/CormorantGaramond[wght].ttf (from Google Fonts OFL).
Run from repo root: python3 scripts/build-og-image.py
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "og" / "og-share.png"
FONT = ROOT / "scripts" / "fonts" / "CormorantGaramond[wght].ttf"

W, H = 1200, 630
# Warm paper — aligned with theme-reflection / landing
BG = "#faf7f2"
TEXT = "#3f2a1d"
BRAND = "#6b4a2c"


def main() -> int:
    if not FONT.is_file():
        print(f"Missing font: {FONT}", file=sys.stderr)
        return 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    font_quote = ImageFont.truetype(str(FONT), 68)
    font_brand = ImageFont.truetype(str(FONT), 30)

    quote_lines = [
        "One thought",
        "can travel further",
        "than we do.",
    ]
    brand = "Manualfor.life"

    line_gap = 10
    quote_heights: list[int] = []
    quote_widths: list[int] = []
    for line in quote_lines:
        bb = draw.textbbox((0, 0), line, font=font_quote)
        quote_heights.append(bb[3] - bb[1])
        quote_widths.append(bb[2] - bb[0])

    brand_bb = draw.textbbox((0, 0), brand, font=font_brand)
    brand_w = brand_bb[2] - brand_bb[0]
    brand_h = brand_bb[3] - brand_bb[1]

    quote_block_h = sum(quote_heights) + line_gap * (len(quote_lines) - 1)
    gap_quote_brand = 52
    total_h = quote_block_h + gap_quote_brand + brand_h
    y0 = (H - total_h) // 2

    y = y0
    for line, sw, sh in zip(quote_lines, quote_widths, quote_heights):
        draw.text(((W - sw) // 2, y), line, font=font_quote, fill=TEXT)
        y += sh + line_gap

    y += gap_quote_brand - line_gap
    draw.text(((W - brand_w) // 2, y), brand, font=font_brand, fill=BRAND)

    img.save(OUT, format="PNG", optimize=True)
    print("Wrote:", OUT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
