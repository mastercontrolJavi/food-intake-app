/**
 * Gate D evidence: readability and cut/beat tables, computed from the same timing constants and easing
 * functions the scenes use. A text counts as legible on frames where its opacity is ≥ 0.6.
 *   cd video && npx tsx scripts/timing-report.ts   → writes TIMING.md
 */
import { writeFileSync } from "node:fs";
import { EASE_IN_OUT, EASE_OUT, tween } from "../src/lib/motion";
import { beat, DURATION_IN_FRAMES, FPS, FRAMES_PER_BEAT, sceneBeat, sceneWindow, type SceneName } from "../src/timing";

type Item = { scene: SceneName; text: string; words: number; opacity: (f: number) => number; kind: "display" | "caption" | "ui-read" };

const abs = (scene: SceneName, f: number) => sceneWindow(scene).from + f;
// KineticText: word k of the block starts at enter + delay + k*3, 20-frame EASE_OUT; block exits over 14 frames.
const kinetic = (enter: number, lastWordIndex: number, exit: number | null) => (f: number) =>
  Math.min(tween(f, enter + lastWordIndex * 3, enter + lastWordIndex * 3 + 20, 0, 1, EASE_OUT), exit == null ? 1 : 1 - tween(f, exit - 14, exit, 0, 1, EASE_IN_OUT));
const caption = (enter: number, exit: number) => (f: number) => Math.min(tween(f, enter, enter + 18, 0, 1, EASE_OUT), 1 - tween(f, exit - 14, exit, 0, 1, EASE_IN_OUT));
const span = (a: number, b: number, fadeIn = 10) => (f: number) => (f < a || f > b ? 0 : tween(f, a, a + fadeIn, 0, 1, EASE_OUT));

const hookD = sceneWindow("hook").durationInFrames;
const heroD = sceneWindow("hero").durationInFrames;
const logD = sceneWindow("log").durationInFrames;
const waterClick = sceneBeat("water", 14);
const panStart = waterClick + 90;
const scoreUpdate = panStart + 54;

const items: Item[] = [
  { scene: "hook", text: "Your day scored 95.", words: 4, kind: "display", opacity: kinetic(12, 3, hookD - 10) },
  { scene: "hook", text: "Why?", words: 1, kind: "display", opacity: kinetic(12 + 18, 4, hookD - 10) },
  { scene: "hook", text: "Ring labels (e.g. “Calories 30%”)", words: 2, kind: "ui-read", opacity: (f) => Math.min(tween(f, 26, 42), 1 - tween(f, hookD - 30, hookD - 14, 0, 1, EASE_IN_OUT)) },
  { scene: "hook", text: "95 / out of 100", words: 3, kind: "ui-read", opacity: (f) => Math.min(tween(f, 8, 28), 1 - tween(f, hookD - 26, hookD - 12, 0, 1, EASE_IN_OUT)) },
  { scene: "log", text: "Log again in one tap.", words: 5, kind: "caption", opacity: caption(sceneBeat("log", 5.2), logD) },
  { scene: "log", text: "“Log again” (button tapped)", words: 2, kind: "ui-read", opacity: span(0, sceneBeat("log", 7), 1) },
  { scene: "log", text: "New row title: Salmon, Potatoes And Greens", words: 4, kind: "ui-read", opacity: (f) => (f < sceneBeat("log", 7) ? 0 : tween(f, sceneBeat("log", 7) + 2, sceneBeat("log", 7) + 18, 0, 1, EASE_OUT)) },
  { scene: "log", text: "New row detail: 720 kcal · 48 g protein · Meal score 90", words: 8, kind: "ui-read", opacity: (f) => (f < sceneBeat("log", 7) ? 0 : tween(f, sceneBeat("log", 7) + 2, sceneBeat("log", 7) + 18, 0, 1, EASE_OUT)) },
  { scene: "water", text: "Graded against goals you choose.", words: 5, kind: "caption", opacity: caption(sceneBeat("water", 12.2), sceneBeat("water", 19.5)) },
  { scene: "water", text: "2,250 ml of 2,800 ml (after +500)", words: 5, kind: "ui-read", opacity: span(waterClick + 3, panStart + 27, 1) },
  { scene: "water", text: "95 · A (score card; counts 93 → 95 once the pan settles)", words: 2, kind: "ui-read", opacity: span(scoreUpdate + 6, sceneWindow("water").durationInFrames, 1) },
  { scene: "hero", text: "Transparent score breakdown (+ 7 rows, result)", words: 8, kind: "ui-read", opacity: span(12, heroD, 8) },
  { scene: "hero", text: "Every point, explained.", words: 3, kind: "display", opacity: kinetic(sceneBeat("hero", 21.5), 2, heroD - 6) },
  { scene: "patterns", text: "Pattern insights · Deterministic observations with explicit evidence thresholds.", words: 8, kind: "ui-read", opacity: span(0, sceneWindow("patterns").durationInFrames, 1) },
  { scene: "patterns", text: "Insight title: Water target opportunity (+ badges Hydration · Moderate evidence)", words: 3, kind: "ui-read", opacity: span(0, sceneWindow("patterns").durationInFrames, 1) },
  { scene: "patterns", text: "Insight message: Water intake was below your configured target on 4 of 7 tracked days.", words: 13, kind: "ui-read", opacity: span(0, sceneWindow("patterns").durationInFrames, 1) },
  { scene: "patterns", text: "Patterns, only with evidence.", words: 4, kind: "caption", opacity: caption(sceneBeat("patterns", 32.2), sceneWindow("patterns").durationInFrames + 20) },
  { scene: "hero", text: "Ring centre count-up → 95 / out of 100 (final value)", words: 3, kind: "ui-read", opacity: (f) => (f >= 60 + 6 * 18 + 12 ? 1 : 0) },
  { scene: "resolve", text: "Intake", words: 1, kind: "ui-read", opacity: (f) => tween(f, sceneBeat("resolve", 42), sceneBeat("resolve", 42) + 22, 0, 1, EASE_OUT) },
  { scene: "resolve", text: "Track with intention.", words: 3, kind: "display", opacity: kinetic(sceneBeat("resolve", 43), 2, null) },
  { scene: "resolve", text: "intake.javiertpadilla.com", words: 1, kind: "ui-read", opacity: (f) => tween(f, sceneBeat("resolve", 44), sceneBeat("resolve", 44) + 20, 0, 1, EASE_OUT) },
];

const fmt = (frames: number) => (frames / FPS).toFixed(2);
let readRows = "| # | Scene | Text | Words | Legible (abs frames) | On screen (s) | Minimum (s) | Pass |\n|---|---|---|---|---|---|---|---|\n";
let allPass = true;
items.forEach((it, i) => {
  const d = sceneWindow(it.scene).durationInFrames;
  const frames: number[] = [];
  for (let f = 0; f < d; f++) if (it.opacity(f) >= 0.6) frames.push(f);
  const first = frames[0];
  const last = frames[frames.length - 1];
  const dur = frames.length;
  const min = 0.4 + 0.3 * it.words;
  const pass = dur / FPS >= min;
  allPass &&= pass;
  readRows += `| ${i + 1} | ${it.scene} | ${it.text} | ${it.words} | ${abs(it.scene, first)}–${abs(it.scene, last)} | ${fmt(dur)} | ${min.toFixed(1)} | ${pass ? "✅" : "❌"} |\n`;
});

const cuts: { label: string; frame: number }[] = [
  { label: "1 Hook → 2 Log again", frame: sceneWindow("log").from },
  { label: "2a Recent meals → 2b Timeline (internal cut)", frame: sceneWindow("log").from + sceneBeat("log", 7) },
  { label: "2 Log again → 3 Water", frame: sceneWindow("water").from },
  { label: "3 Water → 4 Hero (click + hero hit)", frame: sceneWindow("hero").from },
  { label: "5 Patterns", frame: sceneWindow("patterns").from },
  { label: "6 Resolve", frame: sceneWindow("resolve").from },
  { label: "SFX click: Log again (half-beat 6.5, eighth-note)", frame: beat(6.5) },
  { label: "SFX click: +500", frame: beat(14) },
  { label: "End of film", frame: DURATION_IN_FRAMES },
];
let cutRows = "| Cut / hit | Frame | Nearest beat | Beat frame | Offset (frames) | Pass (≤ 1) |\n|---|---|---|---|---|---|\n";
let cutsPass = true;
for (const c of cuts) {
  const n = c.label.includes("half-beat") ? Math.round(c.frame / (FRAMES_PER_BEAT / 2)) / 2 : Math.round(c.frame / FRAMES_PER_BEAT);
  const off = c.frame - beat(n);
  const pass = Math.abs(off) <= 1;
  cutsPass &&= pass;
  cutRows += `| ${c.label} | ${c.frame} | ${n} | ${beat(n)} | ${off} | ${pass ? "✅" : "❌"} |\n`;
}

const md = `# Timing report (Gate D)

Generated by \`scripts/timing-report.ts\` from \`src/timing.ts\` and the scenes' own easing constants.
Grid: ${(60 * FPS) / FRAMES_PER_BEAT} BPM, ${FRAMES_PER_BEAT} frames per beat at ${FPS} fps. Legible = opacity ≥ 0.6.
Readability minimum = 0.4 s + 0.3 s × words (brief §2.6).

## Readability — ${allPass ? "all pass" : "FAILURES"}

${readRows}
## Cuts vs beats — ${cutsPass ? "all on the beat" : "FAILURES"}

${cutRows}
Final frame holds from frame ${sceneWindow("resolve").from + sceneBeat("resolve", 44) + 12} (URL legible) to ${DURATION_IN_FRAMES}: ${fmt(DURATION_IN_FRAMES - (sceneWindow("resolve").from + sceneBeat("resolve", 44) + 12))} s (≥ 2.5 s required).
`;
writeFileSync(new URL("../TIMING.md", import.meta.url), md);
console.log(allPass && cutsPass ? "ALL PASS" : "FAILURES — see TIMING.md");
