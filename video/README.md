# Intake — product film (Remotion)

A 30-second, 2K, 60 fps product film for Intake, built in code from the app's own tokens, components
and scoring engine. Self-contained: nothing here is imported by the app, and the app's code, config and
dependencies are untouched.

| Composition | Size | FPS | Frames |
|---|---|---|---|
| `Film16x9` (master) | 2560 × 1440 | 60 | 1800 |
| `Film9x16` (social, re-staged) | 1440 × 2560 | 60 | 1800 |

## Run

```bash
cd video
npm ci
npm run studio            # interactive preview (Remotion Studio)
npm run typecheck
```

## Render

```bash
npm run render:16x9       # out/film-16x9-2k60.mp4   (H.264, CRF 16, yuv420p)
npm run render:9x16       # out/film-9x16-2k60.mp4
npm run render:master     # out/film-16x9-master.mov (ProRes 422 HQ)
npm run render            # all three
npm run preview           # out/preview-animatic.mp4 (1280×720, 30 fps)
npm run cover             # out/cover/intake-film-cover-{16x9,4x3}.{png,jpg} (portfolio cover stills)
```

Set `REMOTION_CONCURRENCY` to change parallelism (default 3). The config uses the machine's
pre-installed headless Chromium when present, otherwise Remotion downloads its own.

## Swap the music (one command)

Drop a track at `public/audio/track.mp3` and re-render — `src/Soundtrack.tsx` picks it up automatically
instead of the generated bed:

```bash
cp ~/my-track.mp3 public/audio/track.mp3 && npm run render
```

The edit is cut to **100 BPM** (36 frames per beat). Use a track near 100 BPM; if its first downbeat
isn't at 0:00, set `PICKUP_FRAMES` in `src/timing.ts` to that frame — scene lengths are in beats and
never change. UI click volumes are in `src/Soundtrack.tsx` (keep them ≥ 12 dB under the music).

To regenerate the fallback bed and click: `npm run audio` (needs Python 3 + numpy).

## Data

Every number on screen comes from the app's real scoring/analytics engine, run on fictional inputs:

```bash
npm run fixtures          # runs ../src/lib/scoring + analytics → src/fixtures/film.json
```

## Layout of this folder

```
AUDIT.md CONCEPT.md DECISIONS.md PROGRESS.md TIMING.md REPORT.md   process docs
audit/screens/            real-app screenshots (q90 JPEG)
public/fonts, public/audio
scripts/                  fixtures, audio, stills, contact sheets, strip, timing report, app capture
src/
  timing.ts layout.ts Film.tsx Soundtrack.tsx Root.tsx styles.css
  components/ui           app primitives copied verbatim (card, button, badge, …)
  components/app          app screens rebuilt with the app's class strings
  components/film         camera, cursor, kinetic type, weight ring, stage
  scenes/                 Hook, LogAgain, Water, Hero, Patterns, Resolve
  fixtures/film.json      engine output
out/                      renders, stills, contact sheets, strips
```

`root-typecheck-shim.d.ts` exists only for the app's root `tsconfig` (which globs `**/*.ts`): it keeps
`next build` green on machines without `video/node_modules`.

Remotion is free for individuals and companies up to 3 people; larger companies need a Remotion
company license (remotion.dev/license).
