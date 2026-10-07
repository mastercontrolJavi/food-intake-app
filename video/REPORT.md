# Intake — product film: final report

## Deliverables

| File | Spec (verified with ffprobe) |
|---|---|
| `out/film-16x9-2k60.mp4` | 2560×1440 · 60/1 fps · 1800 frames · 30.0 s · H.264 High, CRF 16, yuv420p · AAC-LC 48 kHz stereo · 12.8 MB · audio peak −2.4 dBFS, −20.9 LUFS integrated |
| `out/film-9x16-2k60.mp4` | __SPEC_9__ |
| `out/film-16x9-master.mov` | __SPEC_MOV__ |
| `out/preview-animatic.mp4` | 1280×720 · 30 fps · 900 frames · H.264 + AAC (Phase D animatic) |

Stills: `out/stills/gateE/` (first frame of every scene, hero mid/complete/peak, last frame, both
orientations) and contact sheets `out/stills/contact-{16x9,9x16}-gateE.jpg`. Frame strip of the animatic:
`out/animatic-strip-{1,2}.jpg`.

## The concept in one line
**"Every point, explained."** Intake's brand mark is its scoring formula (seven ring segments sized 30/20/8/6/6/15/15),
so the film asks why a day scored 95 and answers by lighting each weight with its row while the ring counts
up, contribution by contribution, from 0 to 95.

## Structure (100 BPM, 36 frames per beat; every cut on a beat — see TIMING.md)

| Beats | Time | Scene |
|---|---|---|
| 0–5 | 0.0–3.0 s | Hook: labelled weight ring draws on; "Your day scored 95. / Why?" |
| 5–12 | 3.0–7.2 s | Log again: Recent meals → tap (half-beat 6.5; the caption ring's five nutrition segments light) → cut on 7 to the new timeline row |
| 12–20 | 7.2–12.0 s | +500 ml: water bar grows (water segment lights), camera settles on the score card, which counts 93 → 95 — "Graded against goals you choose." |
| 20–32 | 12.0–19.2 s | **Hero:** "Why this score?" → the dialog opens as the dashboard recedes; the score ring becomes the weight ring; "Every point, explained." (21.5); segments draw on with their rows while the centre counts 0 → 95 |
| 32–40 | 19.2–24.0 s | Weekly review evidence block (16:9 trend + coverage; 9:16 coverage) over "Water target opportunity" — "Patterns, only with evidence." |
| 40–50 | 24.0–30.0 s | IntakeDial lands lit, cools to grey as its arcs draw in (the login panel's timing), steps aside → Intake · Track with intention. · intake.javiertpadilla.com (complete at 26.6 s, holds 3.4 s still) |

## Gate scores

| Gate | Independent critic | Final (after fixes) |
|---|---|---|
| A — Audit | — | purpose 5 · tokens 5 · screens 4 · aha 5 |
| B — Concept | 3 · 2 · 3 · 3 · 3 (4 serious, all fixed) | muted-by-10s 4 · hook 4 · distinctive 4 · real features 5 · product-specific 4 |
| C — Stills | 4 · 2 · 3 · 3 · 3 (serious: tilt softness, hero — fixed) | tokens 5 · crisp 5 · hierarchy 4 · 9:16 5 · not a template 4 |
| D — Animatic | — | readability 5 (all lines pass) · cuts on beat 5 (all 0 frames) · pacing 4 · reads muted 4 |
| E — Final | pass 1: 3 · 3 · 2 · 4; pass 2: 3 · 3 · 3 · 4; pass 3 (on the rendered MP4): studio 3 · smooth 3 · hero 4 · banned 5 · specs 5 | __FINAL_E__ |

Fidelity check: the rebuilt Today screen vs the real app screenshot (dark, 1440 px @2x) differs by a mean
of 0.4–3.0 / 255 per pixel. Every layout measurement waits for Geist to load (a fallback-font measurement had
silently pushed the weekly insight's evidence sentence out of frame in pre-final renders; fixed in round 3).

## Key decisions (top 5 — full log in DECISIONS.md)
1. **Every number is engine output.** `scripts/build-fixtures.ts` runs the app's own scoring and analytics on
   fictional inputs (the app's demo meals and goals); the hero's count-up adds each metric's
   score × weight ÷ available weight — the engine's formula — and lands exactly on 95.42 → "95".
2. **Real UI by construction.** The app's Tailwind 4.3.3 class strings and shadcn primitives are reused
   verbatim; responsive breakpoints are re-bound to a container query on an emulated device viewport so
   the same markup lays out as desktop (16:9) or mobile (9:16) — 9:16 is a true re-stage, not a crop.
3. **Signature = the IntakeDial weight ring**, threaded as: labelled hook ring → caption ring that arrives with
   each caption and lights the weights the action touches → the dashboard's score ring becoming the weight
   ring in the hero → the brand dial, which lands still lit and cools to grey. All boldness lives there; UI
   motion only answers taps.
4. **Hero rebuilt three times on critic feedback** (shards → flying copies → draw-on + count-up). The final
   version shows the thesis literally: each segment draws on with its row, and the score assembles itself.
   The dialog sits on its own plane (as the app's fixed modal does), so it is never cropped while opening.
5. **Dark theme, Geist, 100 BPM grid with generated music bed** (no track supplied); app untouched —
   `video/root-typecheck-shim.d.ts` keeps the app's `next build` type-check green, and the root ESLint run
   over `/video` is clean.

Assumptions: the authenticated screens (Recent meals, Quick actions) were rebuilt from component code
because they can't be reached without an account; all film data is fictional sample data and is never
presented as usage statistics; the branch is `claude/wizardly-newton-kymfyu` (the environment only allows
pushing that branch) instead of `motion-film`.

## What I couldn't do, and why
- **Real music:** no `public/audio/track.mp3` was provided, so the bed is synthesized (`scripts/make-audio.py`)
  on the 100 BPM grid. It's tasteful, but it's a placeholder for a licensed track.
- **ProRes master in git:** the `.mov` is ~__MOV_SIZE__ — over GitHub's file limit — so it's rendered locally,
  git-ignored, and reproducible with `npm run render:master`.
- **Click-throughs of authenticated flows:** no Supabase credentials; the public `/demo` was used for every
  screenshot and the rebuild was pixel-diffed against it.
- **Liquid-glass displacement filter and backdrop blur** are omitted (invisible at film scale over an
  already-blurred glow, very expensive to render).

## Swap in a new music track and re-render (one command)
```bash
cd video && cp /path/to/track.mp3 public/audio/track.mp3 && npm run render
```
`src/Soundtrack.tsx` uses `track.mp3` automatically when present. Pick a track near 100 BPM; if its first
downbeat isn't at 0:00, set `PICKUP_FRAMES` in `src/timing.ts`. UI click volumes live in `src/Soundtrack.tsx`.
