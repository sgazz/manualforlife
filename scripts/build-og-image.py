#!/usr/bin/env python3
"""
Render shared Open Graph image (1200×630) for Manualfor.life ecosystem.
Requires: scripts/fonts/CormorantGaramond[wght].ttf (from Google Fonts OFL).
Run from repo root: python3 scripts/build-og-image.py
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "og" / "og-ecosystem.png"
FONT = ROOT / "scripts" / "fonts" / "CormorantGaramond[wght].ttf"

W, H = 1200, 630
BG = "#f8f5f0"
TEXT = "#1f1a17"
MUTED = "#6f675f"


def main() -> int:
    if not FONT.is_file():
        print(f"Missing font: {FONT}", file=sys.stderr)
        return 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    font_title = ImageFont.truetype(str(FONT), 96)
    font_sub = ImageFont.truetype(str(FONT), 40)

    title = "Manualfor.life"
    lines = [
        "A place where people leave one thought",
        "that changed their life.",
    ]

    title_bb = draw.textbbox((0, 0), title, font=font_title)
    title_w = title_bb[2] - title_bb[0]
    title_h = title_bb[3] - title_bb[1]

    sub_heights = []
    sub_widths = []
    for line in lines:
        bb = draw.textbbox((0, 0), line, font=font_sub)
        sub_heights.append(bb[3] - bb[1])
        sub_widths.append(bb[2] - bb[0])
    gap = 14
    block_h = title_h + 56 + sum(sub_heights) + gap * (len(lines) - 1)
    y0 = (H - block_h) // 2

    tx = (W - title_w) // 2
    draw.text((tx, y0), title, font=font_title, fill=TEXT)

    y = y0 + title_h + 56
    for line, sw, sh in zip(lines, sub_widths, sub_heights):
        draw.text(((W - sw) // 2, y), line, font=font_sub, fill=MUTED)
        y += sh + gap

    img.save(OUT, format="PNG", optimize=True)
    print("Wrote:", OUT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
