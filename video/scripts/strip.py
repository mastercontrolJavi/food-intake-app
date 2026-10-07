"""Exact frame strip: one frame every 0.5 s, labelled with its true timestamp.
  python3 scripts/strip.py out/preview-animatic.mp4 out/animatic-strip   -> out/animatic-strip-{1,2}.jpg
"""
import glob
import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

src, outdir = sys.argv[1], sys.argv[2]
os.makedirs(outdir, exist_ok=True)
for f in glob.glob(os.path.join(outdir, "*.jpg")):
    os.remove(f)
fps_str = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "json", src]))["streams"][0]["r_frame_rate"]
num, den = map(int, fps_str.split("/"))
step = round(num / den / 2)  # frames per 0.5 s
subprocess.check_call(["ffmpeg", "-v", "error", "-i", src, "-vf", f"select='not(mod(n\\,{step}))',scale=640:-1", "-vsync", "0", "-q:v", "3", os.path.join(outdir, "s%03d.jpg")])
files = sorted(glob.glob(os.path.join(outdir, "s*.jpg")))
font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
for part, chunk in enumerate([files[:30], files[30:]]):
    if not chunk:
        continue
    im0 = Image.open(chunk[0])
    tw, th = 400, int(400 * im0.height / im0.width)
    cols = 6 if im0.width > im0.height else 10
    if im0.width < im0.height:
        tw, th = 200, int(200 * im0.height / im0.width)
    sheet = Image.new("RGB", (cols * (tw + 8) + 8, ((len(chunk) + cols - 1) // cols) * (th + 30) + 8), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(chunk):
        idx = files.index(f)
        r, c = divmod(i, cols)
        x, y = 8 + c * (tw + 8), 8 + r * (th + 30)
        sheet.paste(Image.open(f).resize((tw, th)), (x, y + 24))
        d.text((x, y + 2), f"{idx * 0.5:.1f}s", fill=(230, 230, 230), font=font)
    sheet.save(f"{outdir}-{part + 1}.jpg", quality=85)
print(len(files), "frames")
