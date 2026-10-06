# Progress

**Current phase:** D — Animatic (next)

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

## Next (Phase D)
1. Render 30 fps 16:9 preview → `out/preview-animatic.mp4`.
2. Frame strip every 0.5 s; readability table; cut-vs-beat table → Gate D.

## Open issues
- None blocking.
