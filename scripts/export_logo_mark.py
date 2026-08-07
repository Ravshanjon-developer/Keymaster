"""Rasterize docs/brand/logo-mark.svg to PNG sizes (Segoe UI on Windows)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
TEAL = (26, 107, 99)  # #1a6b63
INK = (15, 23, 42)
WHITE = (255, 255, 255)


def draw_logo(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), WHITE + (255,))
    draw = ImageDraw.Draw(img)
    s = size / 120.0
    radius = int(28 * s)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=WHITE)

    def scale(v: float) -> int:
        return int(round(v * s))

    stroke = max(2, int(round(2.4 * s)))
    k = [scale(32), scale(36), scale(58), scale(62)]
    m = [scale(58), scale(62), scale(84), scale(88)]
    draw.rounded_rectangle(k, radius=scale(5), outline=TEAL, width=stroke)
    draw.rounded_rectangle(m, radius=scale(5), outline=TEAL, width=stroke)
    draw.line(
        [(scale(58), scale(62)), (scale(58), scale(58)), (scale(62), scale(58)), (scale(62), scale(62))],
        fill=TEAL,
        width=stroke,
    )

    font_size = max(10, int(round(18 * s)))
    font_paths = [
        Path("C:/Windows/Fonts/segoeuib.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf"),
    ]
    font = ImageFont.load_default()
    for fp in font_paths:
        if fp.is_file():
            font = ImageFont.truetype(str(fp), font_size)
            break

    draw.text((scale(41), scale(38)), "K", fill=INK, font=font)
    draw.text((scale(67), scale(64)), "M", fill=INK, font=font)
    return img


def main() -> None:
    brand = ROOT / "docs" / "brand"
    public = ROOT / "frontend" / "public"
    brand.mkdir(parents=True, exist_ok=True)
    public.mkdir(parents=True, exist_ok=True)

    for size, name in [(120, "keymaster-oauth-logo-120x120.png"), (180, "logo-mark.png"), (32, "favicon.png")]:
        out = public / name if name != "keymaster-oauth-logo-120x120.png" else brand / name
        draw_logo(size).convert("RGB").save(out, "PNG")
        print(out)


if __name__ == "__main__":
    main()
