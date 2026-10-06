"""
Synthesizes the film's music bed and UI click, locked to the 100 BPM grid in src/timing.ts.

  python3 scripts/make-audio.py            -> public/audio/generated-bed.wav, public/audio/click.wav

Used only when public/audio/track.mp3 is absent (brief §0.5 fallback: build to a generated track).
Structure (beats; 1 beat = 0.6 s):
  0–8    sparse plucks (Dmaj9 colours)
  8–20   + soft pad, quiet kick on 1 & 3, hats from beat 12
  16–20  filtered swell into the hero hit
  20     hero hit (kick + sub + chord bloom)
  20–32  full groove
  32–40  lighter
  40     groove drops; sustained resolve chord
  43     single pluck (tagline)
  47.5–50 fade out
Master peaks are normalised to -1.5 dBFS.
"""
import math
import os
import wave

import numpy as np

SR = 48000
BPM = 100
BEAT = 60.0 / BPM
DUR = 30.0
N = int(SR * DUR)
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
rng = np.random.default_rng(7)


def t_of(beat):
    return beat * BEAT


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env_adsr(n, a, d, s, r, sustain_len):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    s_n = max(0, int(sustain_len * SR) - a_n - d_n)
    e = np.concatenate([
        np.linspace(0, 1, max(a_n, 1), endpoint=False),
        np.linspace(1, s, max(d_n, 1), endpoint=False),
        np.full(s_n, s),
        np.linspace(s, 0, max(r_n, 1)),
    ])
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))


def one_pole_lp(x, cutoff):
    a = math.exp(-2 * math.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def add(buf, start_s, sig, gain=1.0, pan=0.0):
    i0 = int(start_s * SR)
    if i0 >= N:
        return
    sig = sig[: N - i0]
    l = math.cos((pan + 1) * math.pi / 4)
    r = math.sin((pan + 1) * math.pi / 4)
    buf[i0 : i0 + len(sig), 0] += sig * gain * l
    buf[i0 : i0 + len(sig), 1] += sig * gain * r


def pluck(freq, length=1.6, bright=0.35):
    n = int(length * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * freq * t) + bright * np.sin(2 * np.pi * 2 * freq * t) * np.exp(-t * 9) + 0.12 * np.sin(2 * np.pi * 3 * freq * t) * np.exp(-t * 14)
    e = np.exp(-t * 3.2) * (1 - np.exp(-t * 900))
    return body * e


def pad(freqs, length, attack=0.5, release=1.2):
    n = int((length + release) * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.0, 0.12):
            ff = f * 2 ** (det / 12)
            s += np.sin(2 * np.pi * ff * t + rng.uniform(0, 6.28)) + 0.18 * np.sin(2 * np.pi * 2 * ff * t)
    s /= len(freqs) * 3
    s = one_pole_lp(s, 1800)
    return s * env_adsr(n, attack, 0.3, 0.85, release, length)


def kick(level=1.0, length=0.45):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = 46 + 70 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7.5) * level


def sub(freq, length=2.4):
    n = int(length * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * 1.4) * (1 - np.exp(-t * 200))


def hat(length=0.05):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    x = x - one_pole_lp(x, 6500)  # high-pass
    return x * np.exp(-t * 90)


def swell(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    out = np.zeros(n)
    acc = 0.0
    for i in range(n):  # sweeping low-pass 300 Hz -> 5 kHz
        c = 300 * (5000 / 300) ** (t[i] / length)
        a = math.exp(-2 * math.pi * c / SR)
        acc = (1 - a) * x[i] + a * acc
        out[i] = acc
    return out * (t / length) ** 2.2


# Harmony: D major, one chord per bar (4 beats).
CHORDS = [
    [50, 57, 61, 64, 66],  # Dmaj9   (D A C# E F#)
    [47, 54, 57, 61, 62],  # Bm9     (B F# A C# D)
    [43, 50, 54, 57, 61],  # Gmaj9   (G D F# A C#)
    [45, 52, 57, 59, 64],  # A6/9    (A E A B E)
]

music = np.zeros((N, 2))

# Pads: bars from beat 8 to 40 (8 bars), then the resolve chord from beat 40.
for bar in range(2, 10):
    chord = CHORDS[bar % 4]
    add(music, t_of(bar * 4), pad([midi(n) for n in chord[1:]], 4 * BEAT + 0.2), gain=0.21 if bar < 5 else 0.26)
add(music, t_of(40), pad([midi(n) for n in [57, 61, 64, 66, 69]], DUR - t_of(40) - 1.0, attack=0.25, release=1.0), gain=0.24)
add(music, t_of(40), sub(midi(38), 6.0), gain=0.32)

# Plucks: sparse in the hook, an eighth-note arpeggio once the groove is in, sparse again after 32.
for b2 in range(0, 80):  # eighth notes up to beat 40
    beat = b2 / 2
    bar = int(beat // 4)
    chord = CHORDS[bar % 4]
    tone = chord[[2, 3, 4, 3][b2 % 4]] + 12
    if beat < 8:
        if b2 % 3 != 0:
            continue
        g = 0.13
    elif beat < 20:
        g = 0.07 if b2 % 2 else 0.1
    elif beat < 32:
        g = 0.085 if b2 % 2 else 0.12
    else:
        if b2 % 2:
            continue
        g = 0.08
    add(music, t_of(beat), pluck(midi(tone)), gain=g, pan=-0.35 if b2 % 2 else 0.35)
add(music, t_of(43), pluck(midi(78), 2.6, 0.2), gain=0.16)  # tagline
add(music, t_of(43), pluck(midi(73), 2.6, 0.2), gain=0.1, pan=0.3)

# Kick on 1 & 3 (beats 8–40), hats on off-beats (12–40, thinner after 32).
for beat in range(8, 40, 2):
    add(music, t_of(beat), kick(0.36 if beat < 20 else 0.44))
for b2 in range(24, 80):
    if b2 % 2 == 1:
        add(music, t_of(b2 / 2), hat(), gain=0.05 if b2 < 64 else 0.035, pan=0.25)

# Swell into the hero hit, then the hit itself on beat 20.
add(music, t_of(16), swell(4 * BEAT), gain=0.11)
add(music, t_of(20), kick(1.0, 0.7))
add(music, t_of(20), sub(midi(38), 3.0), gain=0.38)
add(music, t_of(20), pad([midi(n) for n in [62, 66, 69, 73, 76]], 2.0, attack=0.02, release=1.6), gain=0.18)

# Gentle fade over the last 1.5 s (Remotion also applies the same fade at playback).
fade_start = int((DUR - 1.5) * SR)
music[fade_start:] *= np.linspace(1, 0, N - fade_start)[:, None] ** 1.5

# Master: soft clip + normalise to -1.5 dBFS.
music = np.tanh(music * 1.4) / np.tanh(1.4)
peak = np.abs(music).max()
music *= (10 ** (-1.5 / 20)) / peak


def write(path, data):
    data = np.clip(data, -1, 1)
    pcm = (data * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


os.makedirs(OUT, exist_ok=True)
write(os.path.join(OUT, "generated-bed.wav"), music)

# UI click: a soft, short tick (filtered transient + small body), stereo.
n = int(0.07 * SR)
t = np.arange(n) / SR
noise = rng.standard_normal(n)
tick = (noise - one_pole_lp(noise, 2500)) * np.exp(-t * 260) * 0.6 + np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 180) * 0.5 + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 60) * 0.35
tick /= np.abs(tick).max()
click = np.stack([tick, tick], axis=1) * 0.9
write(os.path.join(OUT, "click.wav"), click)


def rms_db(x):
    return 20 * math.log10(max(1e-9, float(np.sqrt(np.mean(np.square(x))))))


print("bed peak dBFS", round(20 * math.log10(np.abs(music).max()), 2), "| bed RMS dBFS", round(rms_db(music), 2))
print("click RMS dBFS (at file gain)", round(rms_db(click), 2))
