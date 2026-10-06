# CONCEPT — "Every point, explained."

*Revision 2: rewritten after the Gate B independent critic. As-built timing changes from Phases C–D (hero choreography, beats 6.5/7/12/14/25) are logged in DECISIONS.md; TIMING.md holds the final schedule.*

## The idea
**Title:** Every point, explained.

**One line:** Intake's brand mark *is* its scoring formula — seven ring segments sized 30/20/8/6/6/15/15 —
so the film opens on that ring labelled around today's score, asks "why?", and answers by opening the
real score into the seven weighted parts that produced it.

**Emotional arc:** curiosity ("your day scored 93 — why?") → action (log again, add water — seconds) →
clarity (the score moves, graded against goals you chose) → understanding (every point accounted for) →
trust over time (a pattern, only with evidence) → calm intention (Track with intention).

**Signature element — the Weight Ring.** The outer ring of the app's own `IntakeDial`
(`src/components/intake-dial.tsx`): seven segments whose lengths are the real `SCORE_WEIGHTS`
(calories 30 · protein 20 · fiber 8 · carbs 6 · fat 6 · water 15 · steps 15, 2.4-unit gaps).
The hook **labels** each segment, so the meaning (length = weight) is on screen in the first two
seconds instead of only in this document. The ring always lives in camera/screen space — it is never
composited onto a UI card, and never becomes new UI.

| Scene | How the ring threads it |
|-------|------------------------|
| 1 Hook | Draws itself around a big tabular **93**, each segment labelled ("Calories 30%" … "Steps 15%"). |
| 2 Log again | Labels fade; the ring settles to a fixed screen position at ~18 % opacity behind the UI (parallax 30 % of camera). On **Log again** the five nutrition segments brighten in order — a meal touches exactly those weights. |
| 3 Water | On **+500** the water segment brightens. |
| 4 Hero | On **Why this score?** the seven segments lift off the ring and fly to the dialog; each lands beside its row's "Weight NN%" label and dissolves into it — nothing stays on as invented UI. |
| 5 Patterns | Fixed watermark again behind the weekly review. |
| 6 Resolve | Cut on the beat to the complete IntakeDial at rest, exactly as on the login panel; the lockup, tagline and URL fade in. No morph chain. |

**Headline line (hero):** Every point, explained.
**Closing tagline:** Track with intention. *(the app's own login-footer line)*
**URL:** intake.javiertpadilla.com

Display statements (3): "Your day scored 93. / Why?" · "Every point, explained." · "Track with intention."
Quiet captions (eyebrow scale): "Log again in one tap." · "Graded against goals you choose."

## Data (fictional sample, computed by the real engine — `scripts/build-fixtures.ts`)
Goals = the app's demo goal values (2,200 kcal · 160 g protein · 240 g carbs · 70 g fat · 30 g fiber ·
2,800 ml water · 10,000 steps). Day: Tuesday, October 6 — yogurt bowl, chicken rice bowl, protein shake
(earlier), salmon dinner logged via **Log again**, 1,750 ml water, 8,600 steps → **93 · A · high
confidence** (live). **+500 ml** → 2,250 ml → **95 · A**. Summary text comes from the real
`feedback.ts`. Weekly scene uses the public demo dataset's Sep 28–Oct 4 week and its first real insight.
Nothing is presented as real usage.

## Timing grid
100 BPM → 1 beat = 0.6 s = **36 frames @ 60 fps**; 30 s = 50 beats. `beat(n) = PICKUP_FRAMES + n × 36`
(`PICKUP_FRAMES = 0` for the generated bed). Cuts: beats **5 · 8 (internal) · 11 · 20 · 32 · 40**.

## Storyboard (30 s)

| # | Time | Beats | Beat (story) | On screen | Motion | Text (read budget) |
|---|------|-------|--------------|-----------|--------|--------------------|
| 1 | 0.0–3.0 | 0–5 | **Hook** — a score you can't see inside | `#09120c` + the app's body glow. Big tabular **93** / "out of 100" (score-ring typography). The Weight Ring draws around it clockwise (4 f stagger, mostly drawn by f 40); a small label sits outside each segment: Calories 30% · Protein 20% · Fiber 8% · Carbohydrates 6% · Fat 6% · Water 15% · Steps 15%. | Segment draw bezier(.22,1,.36,1); slow camera push 1.00→1.03. | "Your day scored 93." in at f 12, "Why?" (primary green) at f 40; both out whole at f 168 (2.6 s ≥ 1.6 s / 2.1 s ≥ 0.7 s). Labels f 30–150 (2.0 s ≥ 1.0 s). |
| 2 | 3.0–6.6 | 5–11 | **Log again** — a meal in one tap | Rebuilt `/log/food` (from `log/food/page.tsx`): "What did you eat?" + **Recent meals** card ("One tap creates a new independent log."): Salmon, potatoes and greens · Protein shake and banana · Chicken rice bowl with vegetables · Greek yogurt, berries and oats, each with **Log again**. Cursor taps Log again on Salmon (beat 7). **Cut on beat 8** to the Today timeline: new row "7:15 PM · Salmon, Potatoes And Greens · 720 kcal · 48 g protein · Meal score 90" settles in, framed on the title and meal score. Ring: 5 nutrition segments brighten on the tap. | Cursor on an eased curve, press on click; row enters with entrance ease, no overshoot. | Caption "Log again in one tap." beats 5.5–10.5 (3.0 s ≥ 1.9 s). Row title + "Meal score 90" visible 1.8 s (≥ 1.6 s). Calorie/protein detail = texture. |
| 3 | 6.6–12.0 | 11–20 | **Water** — the day responds | Signed-in Today (dark): Quick actions card ("Designed for a few seconds, not a few minutes.", +250 / +500 / +750, Log food, Drink, Activity, Finish day) beside the Daily targets Water row. Cursor taps **+500** on beat 13: Water "1,750 ml of 2,800 ml" → "2,250 ml of 2,800 ml", bar 63 % → 80 %, "1,050 ml remaining" → "550 ml remaining". Camera glides to the liquid-glass score card: ring sweeps **93 → 95**, grade A, "Live alignment". Ring: water segment brightens. | Press; bar grows (entrance ease); camera pan bezier(.65,0,.35,1); then hold. | Caption "Graded against goals you choose." beats 11.5–19.5 (4.8 s ≥ 1.9 s). Water numbers hold 3 s; score holds 2.4 s. Summary paragraph = texture. |
| 4 | 12.0–19.2 | 20–32 | **HERO — "Why this score?"** | Click **Why this score?** on beat 20. Real dialog opens (overlay `bg-black/10` + `backdrop-blur-xs`, fade + zoom-in-95): "Transparent score breakdown". The seven ring segments lift off the watermark ring, straighten in flight, and each lands beside its row's **Weight NN%**, dissolving into the label as the row resolves: Calories 99/100 · Weight 30% … Steps 91/100 · Weight 15%. "Normalized result **95 / 100**" resolves on beat 26. | The single orchestrated move: camera push-in (bezier .65,0,.35,1, tilt ≤ 4°, flat during the flight), segments on curved paths, 3 f stagger, landing spring with the film's only overshoot (on the shapes, never on text). CameraMotionBlur on the flight (fast move 1 of 1). | Dialog title in at beat 20.5 (6.6 s on screen). Each row ≥ 4.6 s. Result ≥ 3.6 s. Headline "Every point, explained." beats 26–31.5 (3.3 s ≥ 1.3 s). |
| 5 | 19.2–24.0 | 32–40 | **Patterns** — over a week | Weekly review (Sep 28–Oct 4, 2026), framed on the lower half of the real page: Daily score trend chart (Mon→Sun, Saturday dip) beside Tracking coverage (7 tracked days · 7 finished days · 27 meals logged · 2 workouts), and below them the Pattern insights card, cropped to its first insight: **Water target opportunity** — "Water intake was below your configured target on 4 of 7 tracked days." [Hydration] [Moderate evidence]. | Chart stroke draws (entrance ease); slow drift. | Insight visible beats 32.5–40 (4.5 s ≥ 4.3 s). No caption (the card's own header carries "explicit evidence thresholds"). |
| 6 | 24.0–30.0 | 40–50 | **Resolve** | Cut on beat 40 to the complete IntakeDial at rest (ring + 3 arcs + plate + UtensilsCrossed), as on the login panel. Beat 42: app lockup (primary tile + "Intake") fades up beneath it. Beat 43: tagline. Beat 44: URL. Final frame complete at 26.4 s and holds 3.6 s. | Fades and 16 px rises only (entrance ease). Nothing moves after 26.4 s except a slow constant camera drift. | "Track with intention." beats 43→50 (4.2 s ≥ 1.3 s) · "intake.javiertpadilla.com" beats 44→50 (3.6 s ≥ 0.7 s). |

The product section (3–24 s) has four real-UI scenes, each a feature doing something; the hero gets
7.2 s, the most of any scene. Sound off, by 10 s a stranger has seen: "a score built from Calories /
Protein / Water / Steps… → a meal logged in one tap → water added and the score rising, graded against
goals you choose."

## 9:16 re-stage (1440 × 2560, safe band y 260–2260)
Not a crop of 16:9: the real **mobile** layouts (`< sm`/`< lg` breakpoints: stacked cards, full-width
buttons) framed as cards inside the safe band; the fixed mobile top bar and bottom nav are simply out of
frame (camera crop, not edited).
1. Ring + 93 centred at y≈1,020 (diameter 1,000); "Your day scored 93. / Why?" below at y≈1,700–1,950.
2. Caption at y≈330; Recent meals card (mobile, one column) at 3.0×.
3. Caption at y≈330; Quick actions card, then camera pans to the stacked score card.
4. Headline at y≈300–420; mobile dialog at 2.6× (≈1,000 × 1,720) beneath it, inside the band.
5. Chart card then the first insight card, stacked.
6. Dial centred; lockup, tagline, URL stacked beneath.

## Sound plan
- **Music:** `public/audio/track.mp3` if present; otherwise `public/audio/generated-bed.wav`,
  synthesized by `scripts/make-audio.py` at **100 BPM**, D major: sparse plucks (beats 0–8) → soft pad +
  quiet kick on 1 & 3 + hats (8–20) → filtered swell into the hero hit on **beat 20** → full groove
  (20–32) → lighter (32–40) → groove drops, sustained resolve chord on **beat 40**, one pluck on beat 43
  (tagline).
- **timing.ts:** `BPM`, `FPS`, `FRAMES_PER_BEAT = 36`, `PICKUP_FRAMES`, `beat(n)`. Every cut and the hero
  hit are expressed in beats.
- **SFX:** soft UI click on Log again (beat 7), +500 (beat 13), Why this score? (beat 20). Each ≥ 12 dB
  under the music bed. No whooshes.
- **Master:** fade out over the last 1.5 s (frames 1710–1800); peaks ≤ −1.5 dBFS (verified with ffmpeg
  `astats`).
