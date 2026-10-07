"""Assemble stills into a labelled contact sheet.  python3 scripts/contact-sheet.py out.jpg cols thumbW img1 [img2 ...]"""
import sys
from PIL import Image, ImageDraw, ImageFont

out, cols, thumb_w, *files = sys.argv[1:]
cols, thumb_w = int(cols), int(thumb_w)
ims = [Image.open(f).convert("RGB") for f in files]
w0, h0 = ims[0].size
th = int(thumb_w * h0 / w0)
pad, label_h = 16, 34
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (thumb_w + pad) + pad, rows * (th + label_h + pad) + pad), (24, 24, 24))
draw = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
except OSError:
    font = ImageFont.load_default()
for i, (im, f) in enumerate(zip(ims, files)):
    r, c = divmod(i, cols)
    x = pad + c * (thumb_w + pad)
    y = pad + r * (th + label_h + pad)
    sheet.paste(im.resize((thumb_w, th), Image.LANCZOS), (x, y + label_h))
    draw.text((x, y + 6), f.split("/")[-1].rsplit(".", 1)[0], fill=(220, 220, 220), font=font)
sheet.save(out, quality=88)
print(out, sheet.size)
