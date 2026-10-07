"""
Builds the film's final stereo mix exactly as src/Soundtrack.tsx plays it (bed at volume 1 with a linear
fade over the last 90 frames; UI clicks at the same frames and volumes) and remuxes it into rendered MP4s
without touching the video stream. Used once to correct the first 2K renders after the click timing fix;
a fresh `npm run render:*` produces the same mix on its own.

  python3 scripts/mix-audio.py out/tmp/mix.wav [video.mp4 ...]
"""
import math
import os
import subprocess
import sys
import wave

import numpy as np

SR, FPS, FRAMES = 48000, 60, 1800
ROOT = os.path.join(os.path.dirname(__file__), "..")
FPB = 36  # frames per beat (src/timing.ts)
CLICKS = [(round(6.5 * FPB), 0.07), (14 * FPB, 0.12), (20 * FPB - 2, 0.3)]  # src/Soundtrack.tsx


def load(path):
    with wave.open(path) as w:
        return np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").reshape(-1, 2).astype(np.float64) / 32767


track = os.path.join(ROOT, "public/audio/track.mp3")
if os.path.exists(track):
    sys.exit("track.mp3 present: re-render with npm run render instead (this helper mirrors the generated bed).")
bed = load(os.path.join(ROOT, "public/audio/generated-bed.wav"))
click = load(os.path.join(ROOT, "public/audio/click.wav"))
n = SR * FRAMES // FPS
mix = np.zeros((n, 2))
mix[: min(n, len(bed))] = bed[:n]
fade0, fade1 = int((FRAMES - 90) / FPS * SR), n
mix[fade0:fade1] *= np.linspace(1, 0, fade1 - fade0)[:, None]
for frame, vol in CLICKS:
    i = int(round(frame / FPS * SR))
    seg = click[: n - i] * vol
    mix[i : i + len(seg)] += seg
peak = 20 * math.log10(np.abs(mix).max())
out = sys.argv[1]
os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
print(f"mix peak {peak:.2f} dBFS -> {out}")
for video in sys.argv[2:]:
    tmp = video + ".remux.mp4"
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", video, "-i", out, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-movflags", "+faststart", tmp])
    os.replace(tmp, video)
    print("remuxed", video)
