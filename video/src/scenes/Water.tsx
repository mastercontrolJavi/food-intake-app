import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TodayPage, type Mark } from "../components/app/pages";
import { Camera, frameRect, mixCam, pageToScreen, union, type CameraState } from "../components/film/camera";
import { Cursor, cursorPosition, pressAt } from "../components/film/cursor";
import { Caption } from "../components/film/kinetic";
import { RingWatermark, Stage } from "../components/film/stage";
import { bandMask, STAGE, UI_BOX, type Orientation } from "../layout";
import { AFTER_METRICS, BEFORE_METRICS, DAY, TIMELINE } from "../lib/fixtures";
import { usePageRects, type Rect } from "../lib/measure";
import { EASE_IN_OUT, EASE_OUT, tween } from "../lib/motion";
import { sceneBeat, sceneWindow } from "../timing";

export const WATER_CLICK = sceneBeat("water", 13);
const PAN_START = WATER_CLICK + 26;
const PAN_END = PAN_START + 54;
export const SCORE_UPDATE = PAN_END - 6;

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
  const st = STAGE[orientation];
  const portrait = orientation === "portrait";
  const { rootRef, ref, rects } = usePageRects(TODAY_KEYS);

  let cam: CameraState = { x: 720, y: 600, s: 2 };
  let cursor: [number, number] = [0, 0];
  let bandTop: number | undefined;
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
    if (orientation === "portrait") {
      const topA = pageToScreen(cam, width, height, 0, rects.water.y - 20)[1];
      const topB = pageToScreen(cam, width, height, 0, rects.hero.y)[1];
      bandTop = topA + (topB - topA) * panT;
    }
    const p = rects.plus500;
    const w = rects.why;
    cursor = cursorPosition(frame, [
      { from: [p.cx - 260, p.cy + 190], to: [p.cx + 24, p.cy + 9], start: 2, end: WATER_CLICK - 8 },
      { from: [p.cx + 24, p.cy + 9], to: [w.cx - 30, w.cy + 3], start: SCORE_UPDATE + 60, end: durationInFrames - 4, bend: -0.12 },
    ]);
  }

  const press = pressAt(frame, WATER_CLICK);
  const clicked = frame >= WATER_CLICK + 3;
  const waterActual = clicked ? 1750 + 500 * tween(frame, WATER_CLICK + 3, WATER_CLICK + 24, 0, 1, EASE_OUT) : 1750;
  const updated = frame >= SCORE_UPDATE;
  const sweep = tween(frame, SCORE_UPDATE, SCORE_UPDATE + 16, 0, 1, EASE_OUT);
  const ringScore = (DAY.before.score ?? 0) + ((DAY.after.score ?? 0) - (DAY.before.score ?? 0)) * sweep;
  const summaryT = tween(frame, SCORE_UPDATE, SCORE_UPDATE + 10, 0, 1, EASE_IN_OUT);
  const waterHighlight = tween(frame, WATER_CLICK + 2, WATER_CLICK + 14) * (1 - tween(frame, WATER_CLICK + 80, WATER_CLICK + 130, 0, 1, EASE_IN_OUT));

  return (
    <Stage>
      <RingWatermark orientation={orientation} highlight={[0, 0, 0, 0, 0, waterHighlight, 0]} holes={rects ? [glassHole(rects.hero, cam, width, height)] : []} />
      <AbsoluteFill style={{ ...bandMask(orientation, true, bandTop) }}>
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
                displayScore: updated ? DAY.after.roundedScore ?? 0 : DAY.before.roundedScore ?? 0,
                grade: DAY.after.grade ?? "—",
                confidence: DAY.after.confidence,
                summary: (
                  <span style={{ display: "grid" }}>
                    <span style={{ gridArea: "1 / 1", opacity: 1 - summaryT }}>{DAY.before.summary}</span>
                    <span style={{ gridArea: "1 / 1", opacity: summaryT }}>{DAY.after.summary}</span>
                  </span>
                ),
              },
            }}
          />
          {rects && <Cursor x={cursor[0]} y={cursor[1]} press={press} />}
        </Camera>
      </AbsoluteFill>
      <Caption
        frame={frame}
        text="Graded against goals you choose."
        enter={sceneBeat("water", 11.5)}
        exit={sceneBeat("water", 19.5)}
        fontSize={st.caption.fontSize}
        style={{ position: "absolute", left: st.caption.left, right: portrait ? 0 : undefined, top: st.caption.top, textAlign: portrait ? "center" : "left" }}
      />
    </Stage>
  );
}
