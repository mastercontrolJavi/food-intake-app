# Brief (verbatim copy of the commissioning prompt, kept on disk for re-reading and for the critic)

You are three people at once: a senior product manager who knows what this app is for and who it serves, a senior motion designer from a high-end studio (the bar is Apple, Linear, Stripe, and Arc launch films), and a senior front-end engineer who builds the film in code.

Your job: audit this app, understand its design system and its best moments, then build a 30-second, 2K, 60fps product film that makes it look as good as it really is.

You run this fully autonomously, start to finish. Do not stop to ask for approval. You make every creative and technical decision yourself, review your own work against the quality gates below, and fix it until it passes. The person who started you will only look at the finished film.

## 0. How you operate autonomously
### 0.1 Decide, don't ask
When a choice comes up, pick the option that best serves the definition of done (§9) and record it in /video/DECISIONS.md as one line: decision, reason, alternative rejected.
If information is missing, make the strongest reasonable assumption, record it, and continue.
Prefer the simpler option when two are equally good.
### 0.2 Keep state on disk, not in memory
This is a long job. Your conversation context will get compacted and you will lose details. To protect quality:
Keep /video/PROGRESS.md updated after every step: current phase, what's done, what's next, open issues.
Before starting each phase, re-read this brief's §0, §2, §3, and §9, plus AUDIT.md, DECISIONS.md, and PROGRESS.md. Never rely on remembering them.
If you resume after an interruption, read PROGRESS.md first and continue from where it says.
### 0.3 Self-review loop (replaces human approval)
Every phase ends with a gate. At each gate:
Produce the evidence the gate asks for (stills, renders, tables).
Look at the actual images with your image-reading tool. Never judge a frame you haven't viewed.
Score it against the gate's rubric, 1–5 per item.
Any item below 4 → fix it, regenerate the evidence, and score again.
Maximum 3 fix rounds per gate. If an item still scores below 4 after 3 rounds, pick the best version, log why in DECISIONS.md, and move on. Never loop forever.
Write the final scores into PROGRESS.md.
### 0.4 Independent critic (fresh eyes)
At gates B, C, and E, spawn a separate subagent that has not seen your work in progress. Give it only: this brief, AUDIT.md, and the stills or frames to review. Ask it to act as a skeptical creative director and return the top 5 problems, ranked, against §2 and §9. Fix every problem it rates serious; log the ones you reject and why. This keeps you from grading your own homework.
### 0.5 When you're blocked
Only these count as blockers: the app cannot be run or rendered at all, a required font has no license-safe source, or the machine cannot render video. For each, use the fallback and keep going:
App won't run: use seed/mock/demo mode; if none, rebuild screens from code and existing screenshots, and mark them in AUDIT.md.
Font missing: use the closest free equivalent on Google Fonts and log it.
No music: generate a click track and build to it; timing stays configurable.
Render fails: reduce concurrency (--concurrency=2), retry; if still failing, render 1080p60 previews and note the 2K command for later. Stop only if no fallback works. Then write exactly what's blocked and what's needed into PROGRESS.md.
### 0.6 Safety rails
Work only inside /video. Never modify the app's code, config, or dependencies.
Commit /video to a branch named motion-film after each phase. Never merge, never push to main, never force-push.
Never run destructive commands outside /video.

## 1. Specs
| Composition | Size | FPS | Length |
|---|---|---|---|
| Film16x9 (master) | 2560×1440 | 60 | 30s = 1800 frames |
| Film9x16 (social) | 1440×2560 | 60 | 30s, re-staged, not cropped |

9:16 safe area: all text and key UI inside the middle 1440×2000 (top 260px and bottom 300px clear).
Design UI natively at 2K. Never render small and upscale.
Export: H.264 MP4 at CRF 16 (yuv420p), plus a ProRes 422 HQ master of 16:9 if the machine can.

## 2. Non-negotiable rules
1. Tool: Remotion 4 (React + TypeScript) in a self-contained /video with its own package.json.
2. Frame-driven animation only: useCurrentFrame, interpolate, spring, Sequence, Series, TransitionSeries. No CSS transitions, no Framer Motion, no timers.
3. Real UI only. Rebuild the app's real screens pixel-faithfully from its own tokens, fonts, and components. No stock footage, no AI-generated video, no device mockups with reflections, no laptop renders.
4. Truth. Every feature, label, and screen in the film exists in the code. Sample data looks realistic but is never presented as real usage stats.
5. Banned: lens flares, glitch, light leaks, particle bursts, RGB split, whoosh on every cut, bouncy overshoot on text, typewriter headlines, spinning 3D logos, gradient blobs, emoji, "AI sparkle" imagery.
6. Readability: every line of text holds at least 0.4s + 0.3s per word.
7. One signature element drawn from the app's own identity (logo, core interaction, or data shape), threaded through the whole film. All boldness goes there; everything else stays quiet and precise.
8. One orchestrated hero moment (the "aha"). All other motion answers an action or holds still.

## 3. Visual language defaults (adapt to the app's system)
- Palette and type: exactly the app's own tokens from the audit.
- Easing: entrances bezier(0.22, 1, 0.36, 1); camera and hero moves bezier(0.65, 0, 0.35, 1). UI springs with no overshoot; overshoot allowed once, on the hero moment.
- Camera: one Camera wrapper, perspective ~2800px, animated translate/scale, tilts max 6°, slow constant drift. Never faster than the content.
- Depth: real surface colors, one floating shadow for raised layers, optional brand texture at low opacity parallaxing at ~30% of camera speed.
- Motion blur: CameraMotionBlur on at most two fast moves.
- Cursor: realistic arrow on eased curved paths, slight press on click, UI scenes only.
- Kinetic type: large display type for 2–3 statements max. Words rise ~16px with a fade, staggered 3 frames; lines exit whole.

## 4. Phase A — Audit
Product: read README, docs, landing copy, routes. Write: one-sentence purpose, who it's for, the before → after transformation, and the 3–5 core features ranked by how impressive they look on screen.
Design system: extract colors (hex), typefaces and weights, type scale, spacing, radii, shadows, icons, existing motion, logo file paths, and where tokens live.
Run the app: install, start, click through the main flows like a first-time user, screenshot every key screen at desktop width (and mobile if mobile-first). Use fallbacks from §0.5 if it won't run.
Pick: the 3 best-looking moments, the 1 "aha" moment, and anything unfinished to avoid.
Save everything in /video/AUDIT.md with screenshot paths and a list of safe vs unsafe copy claims.
Gate A rubric (each ≥4): purpose is clear to a stranger · tokens are complete and match the running app · every key screen is captured · the "aha" moment is defensible.

## 5. Phase B — Creative direction
Concept: one concept only. Title, one-line idea, emotional arc, signature element and how it threads every scene, headline line, closing tagline (short, true, sentence case).
Storyboard: a 30s scene table (# | time | beat | on screen | motion | text):
- 0–3s hook: the problem or the most striking visual. The viewer wants more by second 2.
- 3–24s product: 3–4 scenes of real UI, each showing a feature doing something. The "aha" gets the most time and the hero animation.
- 24–30s resolve: signature element → logo → tagline → URL; final frame holds ≥2.5s.
Sound plan: tempo 90–110 BPM; use /video/public/audio/track.mp3 if present, else a generated click. timing.ts with a beat(n) helper; every cut and hero hit on a beat (use a short pickup at the start rather than changing scene lengths). SFX subtle and ≥12 dB under music; fade out over the last 1.5s; peaks below −1 dBFS.
Save as /video/CONCEPT.md.
Gate B rubric (each ≥4): a muted viewer understands the app by second 10 · the hook earns second 2 · the signature element is distinctive to this app, not generic · every scene shows real, existing features · nothing in it would fit any other product. Run the independent critic.

## 6. Phase C — Storyboard stills
Set up Remotion: tokens mirroring the app, fonts (block render until loaded with delayRender), fixtures, timing.
Build each scene's key frame in 16:9 and 9:16.
Render one still per scene (two for the hero) with npx remotion still; assemble contact sheets.
Log every change from the storyboard and why in DECISIONS.md.
Gate C rubric (each ≥4), judged by viewing the stills: matches the app's tokens exactly · type and hairlines crisp at 2K · composition has clear hierarchy and breathing room · 9:16 is truly re-staged with text in the safe area · nothing looks like a template. Run the independent critic.

## 7. Phase D — Animatic
Full 30s with blocking motion and audio.
Render a 30fps 16:9 preview to /video/out/preview-animatic.mp4.
Extract a frame every 0.5s and view them as a strip.
Produce two tables: every text line vs. its readability minimum, and every cut vs. the nearest beat.
Gate D rubric (each ≥4): every text passes readability · every cut lands within 1 frame of a beat · pacing has no dead spots or rushed moments in the frame strip · the story reads in order with sound off.

## 8. Phase E — Final motion and render
Apply final easing, springs, camera, parallax, cursor paths, shared-element morphs, motion blur.
Re-stage 9:16.
Render stills at the first frame of every scene, the hero peak, and the last frame, at full 2K. View each.
Render deliverables to /video/out/ (also add these as package.json scripts):
```bash
npx remotion render Film16x9 out/film-16x9-2k60.mp4 --codec=h264 --crf=16
npx remotion render Film9x16 out/film-9x16-2k60.mp4 --codec=h264 --crf=16
npx remotion render Film16x9 out/film-16x9-master.mov --codec=prores --prores-profile=hq
```
Verify outputs with ffprobe: correct resolution, 60fps, 1800 frames, audio present.
Gate E rubric (each ≥4): looks like a high-end studio made it · motion is smooth with no jank or popping · the hero moment lands · no banned effect anywhere · output specs verified. Run the independent critic on the final frames. Then do the "remove one accessory" pass: name three things that could go without losing meaning, remove them, re-render.

## 9. Definition of done
- A stranger understands what the app does by second 10, sound off.
- Every screen is real, matches the app's tokens, and shows a real feature.
- The signature element is one visible thread from first scene to logo.
- Exactly one orchestrated hero moment.
- No banned effect from §2.5.
- Every text passes readability; every cut lands on a beat.
- 9:16 re-staged, all text in the safe area.
- Native 2560×1440 and 1440×2560 at 60fps, verified by ffprobe.
- All gates passed (or exceptions logged), and the critic's serious issues fixed.

## 10. Final report
When done, write /video/REPORT.md and print a short summary:
- Output file paths and specs.
- The concept in one line.
- Gate scores.
- Key decisions and assumptions (top 5 from DECISIONS.md).
- Anything you couldn't do and why.
- How to swap in a new music track and re-render (one command).
