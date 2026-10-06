import type React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { WeeklyLowerPage, type Mark } from "../components/app/pages";
import { Camera, frameRect, mixCam, pageToScreen, union, type CameraState } from "../components/film/camera";
import { RingWatermark, Stage } from "../components/film/stage";
import { bandMask, uiMask, type Orientation } from "../layout";
import { usePageRects } from "../lib/measure";
import { EASE_OUT, tween } from "../lib/motion";
import { sceneBeat, sceneWindow } from "../timing";

/**
 * Scene 5 (beats 32–40): the weekly review's evidence. 16:9 frames the score trend, tracking coverage
 * and the first pattern insight; 9:16 frames the Pattern insights card large so the insight sentence is
 * readable on a phone for its full reading time.
 */
const BOX = {
  landscape: { x: 190, y: 110, w: 2180, h: 1240 },
  portrait: { x: 60, y: 600, w: 1320, h: 1500 },
} as const;

export function Patterns({ orientation }: { orientation: Orientation }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { durationInFrames } = sceneWindow("patterns");
  const portrait = orientation === "portrait";
  const { rootRef, ref, rects } = usePageRects(["chart", "coverage", "insights", "firstInsight"] as const);
  let cam: CameraState = { x: 700, y: 500, s: 2 };
  let cam0: CameraState | undefined;
  let style: React.CSSProperties = { opacity: tween(frame, 0, 10, 0, 1, EASE_OUT), ...uiMask(orientation, false) };
  if (rects) {
    const area = portrait
      ? { x: rects.insights.x, y: rects.insights.y, w: rects.insights.w, h: rects.firstInsight.y + rects.firstInsight.h + 14 - rects.insights.y }
      : union(rects.chart, rects.coverage, { ...rects.firstInsight, h: rects.firstInsight.h + 8 });
    const a = frameRect(area, BOX[orientation], width, height);
    cam0 = a;
    const b = { ...a, y: a.y + 5, s: a.s * 1.015 };
    cam = mixCam(a, b, frame / durationInFrames); // slow constant drift
    if (portrait) {
      const top = pageToScreen(cam, width, height, 0, rects.insights.y)[1];
      const bottom = pageToScreen(cam, width, height, 0, rects.firstInsight.y + rects.firstInsight.h + 10)[1];
      style = { ...style, ...bandMask(orientation, false, top, bottom) };
    }
  }
  const chartReveal = tween(frame, 6, 78, 0, 1, EASE_OUT);
  const insight0 = tween(frame, sceneBeat("patterns", 32.5) - 6, sceneBeat("patterns", 32.5) + 14, 0, 1, EASE_OUT);
  return (
    <Stage>
      <RingWatermark orientation={orientation} cam={cam0 ? cam : undefined} cam0={cam0} />
      <AbsoluteFill style={style}>
        <Camera cam={cam}>
          <WeeklyLowerPage orientation={orientation} rootRef={rootRef} mark={ref as Mark} chartReveal={chartReveal} insightReveal={[insight0, 1, 1]} />
        </Camera>
      </AbsoluteFill>
    </Stage>
  );
}
