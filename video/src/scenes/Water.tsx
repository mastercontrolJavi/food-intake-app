import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TodayPage, type Mark } from "../components/app/pages";
import { Camera, frameRect, mixCam, pageToScreen, union, type CameraState } from "../components/film/camera";
import { Cursor, cursorPosition, pressAt } from "../components/film/cursor";
import { RingCaption } from "../components/film/kinetic";
import { Stage } from "../components/film/stage";
import { bandMask, UI_BOX, type Orientation } from "../layout";
import { AFTER_METRICS, BEFORE_METRICS, DAY, TIMELINE } from "../lib/fixtures";
import { usePageRects, type Rect } from "../lib/measure";
import { EASE_IN_OUT, EASE_OUT, tween } from "../lib/motion";
import { sceneBeat, sceneWindow } from "../timing";

export const WATER_CLICK = sceneBeat("water", 14);
// Hold on the water bar long enough to read the new total, then glide to the score card.
const PAN_START = WATER_CLICK + 90; // new total stays in frame ≥ 1.9 s (5 words)
const PAN_END = PAN_START + 54;
// The score moves only once the camera has settled on the card (93 → 94 → 95 with the ring sweep).
export const SCORE_UPDATE = PAN_END;
export const CAPTION_IN = sceneBeat("water", 12.2);

export const TODAY_KEYS = ["hero", "ring", "why", "targets", "water", "quick", "plus500", "timeline"] as const;
export type TodayRects = Record<(typeof TODAY_KEYS)[number], Rect>;

/** Framing of the liquid-glass score card — shared by the end of scene 3 and the start of the hero. */
export function heroCardCamera(rects: TodayRects, orientation: Orientation, width: number, height: number): CameraState {
  const box = UI_BOX[orientation];
  return frameRect(rects.hero, box, width, height);
}

/** Screen rect of a liquid-glass card, so the watermark never shows through it. */
export function glassHole(r: Rect, cam: CameraState, width: number, height: number) {
  const [x, y] = pageToScreen(cam, width, height, r.x, r.y);
  return { x, y, w: r.w * cam.s, h: r.h * cam.s, r: 24 * cam.s };
}

/** Scene 3 (beats 11–20): +500 ml, the water bar grows, the live score moves 93 → 95. */
export function Water({ orientation }: { orientation: Orientation }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { durationInFrames } = sceneWindow("water");
  const { rootRef, ref, rects } = usePageRects(TODAY_KEYS);

  let cam: CameraState = { x: 720, y: 600, s: 2 };
  let cursor: [number, number] = [0, 0];
  let band: { top: number; bottom: number; ft: number; fb: number } | undefined;
  if (rects) {
    const box = UI_BOX[orientation];
    // Whole cards only: Daily targets + Quick actions (desktop); Water row → Quick actions (mobile stack).
    const a0 = frameRect(
      orientation === "landscape"
        ? union(rects.targets, rects.quick)
        : { x: rects.quick.x, y: rects.water.y - 20, w: rects.quick.w, h: rects.quick.y + rects.quick.h - rects.water.y + 30 },
      box,
      width,
      height,
    );
    const a1 = { ...a0, x: a0.x - 4, s: a0.s * 1.015 };
    const b = heroCardCamera(rects as TodayRects, orientation, width, height);
    const drift = mixCam(a0, a1, tween(frame, 0, PAN_START, 0, 1, (t) => t));
    const panT = tween(frame, PAN_START, PAN_END, 0, 1, EASE_IN_OUT);
    cam = mixCam(drift, b, panT);
    // Show exactly the framed components; fades sit in the gaps around them and follow the pan.
    const y = (py: number) => pageToScreen(cam, width, height, 0, py)[1];
    const landscape = orientation === "landscape";
    const aTop = landscape ? y(rects.targets.y) : y(rects.water.y);
    const aBottom = y(landscape ? Math.max(rects.targets.y + rects.targets.h, rects.quick.y + rects.quick.h) : rects.quick.y + rects.quick.h);
    const bTop = landscape ? y(rects.hero.y - 84) : y(rects.hero.y);
    const bBottom = y(rects.hero.y + rects.hero.h);
    const mix = (p: number, q: number) => p + (q - p) * panT;
    band = { top: mix(aTop, bTop), bottom: mix(aBottom, bBottom), ft: (landscape ? 20 : 26) * cam.s, fb: 20 * cam.s };
    const p = rects.plus500;
    const w = rects.why;
    cursor = cursorPosition(frame, [
      { from: orientation === "portrait" ? [p.cx + 140, p.cy - 120] : [p.cx - 260, p.cy + 190], to: [p.cx + 24, p.cy + 9], start: 2, end: WATER_CLICK - 8 },
      { from: [p.cx + 24, p.cy + 9], to: [w.cx - 30, w.cy + 3], start: SCORE_UPDATE + 6, end: durationInFrames - 4, bend: -0.12 },
    ]);
  }

  const press = pressAt(frame, WATER_CLICK);
  const clicked = frame >= WATER_CLICK + 3;
  const waterActual = clicked ? 1750 + 500 * tween(frame, WATER_CLICK + 3, WATER_CLICK + 24, 0, 1, EASE_OUT) : 1750;
  const updated = frame >= SCORE_UPDATE;
  const sweep = tween(frame, SCORE_UPDATE, SCORE_UPDATE + 16, 0, 1, EASE_OUT);
  const ringScore = (DAY.before.score ?? 0) + ((DAY.after.score ?? 0) - (DAY.before.score ?? 0)) * sweep;
  const before = DAY.before.roundedScore ?? 0;
  const after = DAY.after.roundedScore ?? 0;
  const displayScore = updated ? Math.round(before + (after - before) * sweep) : before;
  // Summary swaps sequentially (old text out, then new text in) so the two never overlap.
  const summaryOut = tween(frame, SCORE_UPDATE, SCORE_UPDATE + 8, 0, 1, EASE_IN_OUT);
  const summaryIn = tween(frame, SCORE_UPDATE + 8, SCORE_UPDATE + 18, 0, 1, EASE_OUT);
  const ringExit = sceneBeat("water", 19.5);
  const waterHighlight = tween(frame, WATER_CLICK + 2, WATER_CLICK + 14) * (1 - tween(frame, ringExit - 26, ringExit - 2, 0, 1, EASE_IN_OUT));

  return (
    <Stage>
      <AbsoluteFill style={band ? bandMask(orientation, true, band.top, band.bottom, [band.ft, band.fb]) : bandMask(orientation, true)}>
        <Camera cam={cam}>
          <TodayPage
            orientation={orientation}
            rootRef={rootRef}
            mark={ref as Mark}
            state={{
              metrics: clicked ? AFTER_METRICS : BEFORE_METRICS,
              waterActual,
              plus500Press: press,
              timeline: TIMELINE,
              hero: {
                ringScore,
                displayScore,
                grade: DAY.after.grade ?? "—",
                confidence: DAY.after.confidence,
                summary: (
                  <span style={{ display: "grid" }}>
                    <span style={{ gridArea: "1 / 1", opacity: 1 - summaryOut }}>{DAY.before.summary}</span>
                    <span style={{ gridArea: "1 / 1", opacity: summaryIn }}>{DAY.after.summary}</span>
                  </span>
                ),
              },
            }}
          />
          {rects && <Cursor x={cursor[0]} y={cursor[1]} press={press} />}
        </Camera>
      </AbsoluteFill>
      {/* Ring continued from scene 2 through the cut; it leaves with its caption before the hero. */}
      <RingCaption
        frame={frame}
        orientation={orientation}
        text="Graded against goals you choose."
        enter={CAPTION_IN}
        exit={ringExit}
        ringEnter={0}
        ringExit={ringExit}
        highlight={[0, 0, 0, 0, 0, waterHighlight, 0]}
        pulseAt={WATER_CLICK + 2}
      />
    </Stage>
  );
}
