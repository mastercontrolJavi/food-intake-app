import type React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { LogFoodPage, TodayPage, type Mark } from "../components/app/pages";
import { Camera, frameRect, mixCam, pageToScreen, type CameraState } from "../components/film/camera";
import { Cursor, cursorPosition, pressAt } from "../components/film/cursor";
import { RingCaption } from "../components/film/kinetic";
import { Stage } from "../components/film/stage";
import { bandMask, STAGE, UI_BOX, uiMask, type Orientation } from "../layout";
import { BEFORE_METRICS, DAY, TIMELINE } from "../lib/fixtures";
import { usePageRects } from "../lib/measure";
import { EASE_IN_OUT, EASE_OUT, tween } from "../lib/motion";
import { sceneBeat, sceneWindow } from "../timing";

// Tap on the half-beat, cut on beat 7: the new timeline row then holds 3 s (its detail line needs 2.8 s).
const CLICK = sceneBeat("log", 6.5);
const CUT = sceneBeat("log", 7);

/** The five nutrition segments (calories, protein, fiber, carbs, fat) light up when a meal is logged. */
export function mealHighlight(frame: number, click: number) {
  return [0, 1, 2, 3, 4, 5, 6].map((i) =>
    i <= 4 ? tween(frame, click + 2 + i * 3, click + 14 + i * 3) * (1 - tween(frame, click + 70, click + 110, 0, 1, EASE_IN_OUT)) : 0,
  );
}

/** Scene 2 (beats 5–11): one tap on "Log again", then the new timeline row. */
export function LogAgain({ orientation }: { orientation: Orientation }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = sceneWindow("log");
  const highlight = mealHighlight(frame, CLICK);
  return (
    <Stage>
      <Sequence durationInFrames={CUT} layout="none">
        <LogPart orientation={orientation} />
      </Sequence>
      <Sequence from={CUT} layout="none">
        <TimelinePart orientation={orientation} />
      </Sequence>
      {/* The ring stays up through the cut: scene 3 continues it in the same spot. */}
      <RingCaption
        frame={frame}
        orientation={orientation}
        text="Log again in one tap."
        enter={sceneBeat("log", 5.5)}
        exit={Math.min(durationInFrames, sceneBeat("log", 11.5))}
        highlight={highlight}
      />
    </Stage>
  );
}

function LogPart({ orientation }: { orientation: Orientation }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { rootRef, ref, rects } = usePageRects(["recent", "reusable", "target", "header"] as const);
  const box = UI_BOX[orientation];
  let cam: CameraState = { x: 720, y: 400, s: 2 };
  let cursor: [number, number] = [0, 0];
  if (rects) {
    const area = orientation === "landscape"
      ? { x: rects.recent.x, y: rects.recent.y, w: rects.reusable.x + rects.reusable.w - rects.recent.x, h: rects.recent.h }
      : rects.recent;
    const a = { ...frameRect(area, box, width, height), rx: 0, ry: 0 };
    const b = { ...a, x: a.x + 6, y: a.y + 4, s: a.s * 1.02 };
    cam = mixCam(a, b, frame / CUT); // slow constant drift
    const t = rects.target;
    cursor = cursorPosition(frame, [{ from: [t.cx + 210, t.cy + 120], to: [t.cx + 4, t.cy + 2], start: 4, end: CLICK - 8 }]);
  }
  const press = pressAt(frame, CLICK);
  const enter = 1; // hard cut on the beat: land on content, no fade
  // The page header sits right above the cards; fade it out just above the card's top edge.
  const top = rects ? pageToScreen(cam, width, height, rects.recent.x, rects.recent.y)[1] : undefined;
  const style: React.CSSProperties = { opacity: enter, ...bandMask(orientation, true, top) };
  return (
    <AbsoluteFill style={style}>
      <Camera cam={cam}>
        <LogFoodPage orientation={orientation} rootRef={rootRef} mark={ref as Mark} pressDepth={press} />
        {rects && <Cursor x={cursor[0]} y={cursor[1]} press={press} opacity={tween(frame, 0, 8)} />}
      </Camera>
    </AbsoluteFill>
  );
}

function TimelinePart({ orientation }: { orientation: Orientation }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { rootRef, ref, rects } = usePageRects(["timeline", "newRow"] as const);
  const box = UI_BOX[orientation];
  let cam: CameraState = { x: 720, y: 1200, s: 2 };
  if (rects) {
    const row = rects.newRow;
    // Frame the last rows of the timeline, weighted to the new row's title and meal score.
    const area = orientation === "landscape"
      ? { x: rects.timeline.x, y: row.y - 170, w: 780, h: row.h + 180 }
      : { x: rects.timeline.x, y: row.y - 250, w: rects.timeline.w, h: row.h + 270 };
    const a = frameRect(area, box, width, height);
    const b = { ...a, x: a.x + 6, s: a.s * 1.04 };
    cam = mixCam(a, b, frame / 180); // slow push through the hold
  }
  const reveal = tween(frame, 2, 18, 0, 1, EASE_OUT);
  return (
    <AbsoluteFill style={{ ...uiMask(orientation, true) }}>
      <Camera cam={cam}>
        <TodayPage
          orientation={orientation}
          rootRef={rootRef}
          mark={ref as Mark}
          state={{
            metrics: BEFORE_METRICS,
            hero: { ringScore: DAY.before.score ?? 0, displayScore: DAY.before.roundedScore ?? 0, grade: DAY.before.grade ?? "—", confidence: DAY.before.confidence, summary: DAY.before.summary },
            timeline: TIMELINE,
            newEntryReveal: reveal,
          }}
        />
      </Camera>
    </AbsoluteFill>
  );
}

