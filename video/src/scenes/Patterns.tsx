import type React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { WeeklyLowerPage, type Mark } from "../components/app/pages";
import { Camera, frameRect, mixCam, pageToScreen, type CameraState } from "../components/film/camera";
import { RingCaption } from "../components/film/kinetic";
import { Stage } from "../components/film/stage";
import { bandMask, UI_BOX, type Orientation } from "../layout";
import { usePageRects } from "../lib/measure";
import { EASE_IN_OUT, tween } from "../lib/motion";
import { sceneBeat, sceneWindow } from "../timing";

/**
 * Scene 5 (beats 32–40): the weekly review's evidence. The cut lands on the finished review (score
 * trend, coverage, first pattern insight) and the camera pushes slowly toward the insight, which is about
 * water — so the caption ring lights its water segment.
 */
export function Patterns({ orientation }: { orientation: Orientation }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { durationInFrames } = sceneWindow("patterns");
  const portrait = orientation === "portrait";
  const { rootRef, ref, rects } = usePageRects(["chart", "coverage", "insights", "firstInsight"] as const);
  let cam: CameraState = { x: 700, y: 500, s: 2 };
  let style: React.CSSProperties = bandMask(orientation, true);
  if (rects) {
    // 9:16: box bottom raised so the next insight lands in the feathered band below the safe area.
    const box = portrait ? { ...UI_BOX.portrait, h: 1440 } : UI_BOX[orientation];
    const insightBottom = rects.firstInsight.y + rects.firstInsight.h + 14;
    // Open on the week (16:9: the whole trend + coverage row; 9:16: coverage above the card), then push
    // toward the evidence. Both framings sit on the box's bottom edge, so the next insight stays outside it.
    const wide = portrait
      ? { x: rects.insights.x, y: rects.insights.y - 160, w: rects.insights.w, h: insightBottom - (rects.insights.y - 160) }
      : { x: rects.chart.x, y: rects.chart.y, w: rects.insights.w, h: insightBottom - rects.chart.y };
    const close = { x: rects.insights.x, y: rects.insights.y, w: rects.insights.w, h: insightBottom - rects.insights.y };
    const a = frameRect(wide, box, width, height, 4, "bottom");
    const b = frameRect(close, box, width, height, 4, "bottom");
    cam = mixCam(a, b, tween(frame, 0, durationInFrames, 0, 1, EASE_IN_OUT));
    const bottom = pageToScreen(cam, width, height, 0, insightBottom - 4)[1];
    style = bandMask(orientation, true, undefined, bottom);
  }
  const water = tween(frame, 26, 40);
  return (
    <Stage>
      <AbsoluteFill style={style}>
        <Camera cam={cam}>
          <WeeklyLowerPage orientation={orientation} rootRef={rootRef} mark={ref as Mark} chartReveal={1} insightReveal={[1, 1, 1]} />
        </Camera>
      </AbsoluteFill>
      <RingCaption
        frame={frame}
        orientation={orientation}
        text="Patterns, only with evidence."
        enter={sceneBeat("patterns", 32.25)}
        exit={durationInFrames + 20}
        highlight={[0, 0, 0, 0, 0, water, 0]}
      />
    </Stage>
  );
}
