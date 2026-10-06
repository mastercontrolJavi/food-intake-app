# Progress

**Current phase:** E — Final motion and render

## Done
- **Phase A — Audit** ✅ Gate A: purpose 5 · tokens 5 · screens 4 · aha 5.
- **Phase B — Creative direction** ✅ CONCEPT.md rev 2. Critic rev1 3·2·3·3·3 → 4 serious fixed. Gate B: 4 · 4 · 4 · 5 · 4.
- **Phase C — Storyboard stills** ✅
  - Remotion project (Tailwind 4.3.3, app class strings verbatim, container-query breakpoints, Geist via delayRender, fixtures from the real engine, beat grid).
  - Fidelity: rebuilt demo Today vs real screenshot, mean abs diff 0.4–3.0/255.
  - All six scenes built in 16:9 and 9:16; stills `out/stills/gateC/`, sheets `out/stills/contact-*-gateC.jpg`.
  - Critic C (fresh subagent): 4 · 2 · 3 · 3 · 3; serious issues (tilt softness, hero) fixed; see DECISIONS.md.
  - Gate C after 3 fix rounds (self, stills viewed): tokens 5 · crisp 5 · hierarchy 4 · 9:16 re-staged & safe 5 · not a template 4.
  - Audio: generated 100 BPM bed + click (`scripts/make-audio.py`), clicks 13.9–14.7 dB under music; Soundtrack.tsx wired.
  - App safety: root `tsc` passes with/without video deps; root `eslint video` clean.

## Phase D — Animatic ✅
- Animatic v1 rendered and strip reviewed → pacing fixes (S2/S3 cut → beat 12, Log-again tap 6.5 / cut 7, +500 on beat 14 with 1.5 s hold, hero cadence 14 f).
- TIMING.md (generated): all 19 text lines pass readability; all cuts 0 frames from the beat.
- Watermark parallax wired (Water referenced to closing camera; Patterns to opening camera).
- Final animatic `out/preview-animatic.mp4` (1280×720, 30 fps, 900 frames, AAC). Strip at exact 0.5 s: `out/animatic-strip-{1,2}.jpg`.
- **Gate D** ✅ readability 5 (19/19 pass) · cuts on beat 5 (all 0 f) · pacing 4 · reads muted 4.

## Phase E (in progress)
- Done: hard cuts on content; accessory removals (chart draw-on, dial draw-in); ProRes pixel-format fix; tsx dev dep; stills `out/stills/gateE/`.
- Critic E: studio 3 · smooth 3 · hero 2 · banned 4. Rebuild in progress (see DECISIONS Phase E):
  1. CaptionRing (small complete ring + caption) replaces watermark in S2/S3/S5; S5 caption "Patterns, only with evidence."
  2. Hero v3: page fades out; caption ring grows into labelled hero ring (motion blur); per half-beat: segment + label + dialog row light, centre counts up by weighted contribution (fixtures `contributions`); ring pulse (overshoot); result glow; headline beat 25.5; 9:16 whole dialog.
  3. Feathered (≥160 px) masks; timeline larger type + push; weekly push; end-card wordmark > tagline; 9:16 cursor start.
- Then: re-render Gate E stills, view, score; final renders (render:16x9, render:9x16, render:master); ffprobe; REPORT.md; PR.

## Open issues
- None blocking.
