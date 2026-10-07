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
 * trend and/or coverage above the first pattern insight) and the camera pushes slowly in. The insight is
 * about water, so the caption ring lights its water segment.
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
    const box = UI_BOX[orientation];
    // The whole evidence block, one slow push (it starts from a slightly smaller framing and ends filling
    // the box, so nothing ever slides under the caption): 16:9 the trend + coverage row above the first
    // insight; 9:16 (mobile stack) the coverage card above it.
    const blockTop = portrait ? rects.coverage.y : rects.chart.y;
    const insightBottom = rects.firstInsight.y + rects.firstInsight.h + 10;
    const block = { x: rects.insights.x, y: blockTop, w: rects.insights.w, h: insightBottom - blockTop };
    const inset = portrait ? 120 : 90;
    const a = frameRect(block, { ...box, y: box.y + inset, h: box.h - inset }, width, height, 4, "bottom");
    const b = frameRect(block, box, width, height, 4, "bottom");
    cam = mixCam(a, b, tween(frame, 0, durationInFrames, 0, 1, EASE_IN_OUT));
    // Fades in the gaps: above the block (24 css px) and below the first insight (12 css px).
    const y = (py: number) => pageToScreen(cam, width, height, 0, py)[1];
    style = bandMask(orientation, true, y(blockTop), y(rects.firstInsight.y + rects.firstInsight.h), [20 * cam.s, 10 * cam.s]);
  }
  const captionIn = sceneBeat("patterns", 32.2);
  const water = tween(frame, captionIn + 16, captionIn + 30);
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
        enter={captionIn}
        exit={durationInFrames + 20}
        highlight={[0, 0, 0, 0, 0, water, 0]}
      />
    </Stage>
  );
}
