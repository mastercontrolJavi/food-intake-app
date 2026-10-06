import { useRef } from "react";
import type React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { TodayPage, type Mark } from "../components/app/pages";
import { ScoreDialog } from "../components/app/score-dialog";
import { Camera, frameRect, mixCam, type CameraState } from "../components/film/camera";
import { Cursor, pressAt } from "../components/film/cursor";
import { KineticText } from "../components/film/kinetic";
import { SEGMENTS, WeightRing } from "../components/film/ring";
import { Stage } from "../components/film/stage";
import { bandMask, captionRingCentre, uiMask, type Orientation } from "../layout";
import { AFTER_METRICS, DAY, TIMELINE } from "../lib/fixtures";
import { usePageRects } from "../lib/measure";
import { EASE_IN_OUT, EASE_OUT, heroSpring, lerp, tween, uiSpring } from "../lib/motion";
import { sceneBeat, sceneWindow } from "../timing";
import { heroCardCamera, TODAY_KEYS, type TodayRects } from "./Water";

/**
 * Scene 4 (beats 20–32) — the film's one orchestrated moment.
 *  Beat 20     "Why this score?" opens the real breakdown dialog; the dashboard falls away, and the small
 *              caption ring grows into a large, labelled weight ring beside the dialog (motion-blurred move).
 *  Beats 21.7–24.7, every half-beat: one segment, its label and its dialog row light together, and the
 *              ring's centre adds that metric's weighted contribution (score × weight ÷ available weight —
 *              the engine's formula) — 0 → 30 → 50 → 58 → 63 → 69 → 82 → 95.
 *  Beat 25     The sum completes: the ring settles with the film's single overshoot; "95 / 100" glows.
 *  Beat 25.5   "Every point, explained."
 */
const TRAVEL = 44;
const LIGHT0 = 60;
const STEP = 18;
const LIGHT = SEGMENTS.map((_, i) => LIGHT0 + i * STEP);
const COMPLETE = LIGHT[LIGHT.length - 1] + 14;
const HEADLINE = sceneBeat("hero", 25.5);

const HERO_RING = {
  landscape: { cx: 700, cy: 900, size: 600, labelSize: 32 },
  portrait: { cx: 720, cy: 470, size: 380, labelSize: 0 }, // 9:16: no labels — too small to hold seven
} as const;
/** 9:16: after the sum completes, labels give way and the ring steps left for the headline. */
const PORTRAIT_RING_END = { cx: 300, cy: 470 };
const DIALOG_BOX = {
  landscape: { x: 1330, y: 96, w: 1080, h: 1248 },
  portrait: { x: 60, y: 720, w: 1320, h: 1440 },
} as const;
const VIEWPORT_HEIGHT = { landscape: 900, portrait: 844 } as const;

export function Hero({ orientation }: { orientation: Orientation }) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const { durationInFrames } = sceneWindow("hero");
  const portrait = orientation === "portrait";
  const weightEls = useRef<(HTMLElement | null)[]>([]);
  const { rootRef, ref, rects } = usePageRects(TODAY_KEYS);
  const dlg = usePageRects(["dialog"] as const, { weights: weightEls });

  // Camera: score card → whole dialog, then a slow push through the hold.
  let cam: CameraState = { x: 720, y: 400, s: 2 };
  if (rects && dlg.rects) {
    const from = heroCardCamera(rects as unknown as TodayRects, orientation, width, height);
    const to = frameRect(dlg.rects.dialog, DIALOG_BOX[orientation], width, height);
    const push = { ...to, s: to.s * 1.025 };
    cam = mixCam(mixCam(from, to, tween(frame, 0, 56, 0, 1, EASE_IN_OUT)), push, tween(frame, 56, durationInFrames, 0, 1, (t) => t));
  }

  // The dashboard falls away as the dialog opens (no duplicate score behind the breakdown).
  const open = uiSpring(frame, fps, 0, 14);
  const pageOut = tween(frame, 0, 26, 0, 1, EASE_IN_OUT);
  const press = pressAt(frame, 0);

  // Lighting + count-up.
  const lit = LIGHT.map((l) => tween(frame, l - 2, l + 6, 0, 1, EASE_OUT));
  const settle = 1 - tween(frame, COMPLETE + 10, COMPLETE + 44, 0, 1, EASE_IN_OUT);
  const rowLight = lit.map((v) => v * settle);
  const contributions = DAY.after.contributions;
  const sum = contributions.reduce((acc, c, i) => acc + c * tween(frame, LIGHT[i], LIGHT[i] + 12, 0, 1, EASE_OUT), 0);
  const resultTint = tween(frame, COMPLETE - 4, COMPLETE + 6) * (1 - tween(frame, COMPLETE + 70, COMPLETE + 110, 0, 1, EASE_IN_OUT));
  const pulse = 1 + 0.04 * heroSpring(frame, fps, COMPLETE);

  // Ring: grows out of the caption ring (shared element), then holds.
  const start = captionRingCentre(orientation);
  const hr = HERO_RING[orientation];
  const m = tween(frame, 0, TRAVEL, 0, 1, EASE_IN_OUT);
  const step = portrait ? tween(frame, COMPLETE + 4, COMPLETE + 36, 0, 1, EASE_IN_OUT) : 0;
  const ring = {
    cx: lerp(lerp(start.cx, hr.cx, m), PORTRAIT_RING_END.cx, step),
    cy: lerp(lerp(start.cy, hr.cy, m), PORTRAIT_RING_END.cy, step),
    size: lerp(start.size, hr.size, m) * pulse,
  };
  const labelsOpacity = portrait ? 0 : tween(frame, TRAVEL - 10, TRAVEL + 10);
  const centre = tween(frame, TRAVEL - 6, TRAVEL + 10);
  const vh = VIEWPORT_HEIGHT[orientation];
  const score = DAY.after.roundedScore ?? 0;

  const ringNode = (
    <WeightRing
      size={ring.size}
      highlight={lit}
      baseAlpha={0.42}
      strokeWidth={lerp(3.4, 2.6, m)}
      labels={portrait ? undefined : { opacity: labelsOpacity, fontSize: hr.labelSize, radius: 106, highlight: lit }}
      style={{ left: ring.cx - ring.size / 2, top: ring.cy - ring.size / 2 }}
      center={
        <div style={{ textAlign: "center", opacity: centre }}>
          <div className="number-tabular" style={{ fontFamily: "Geist, sans-serif", fontWeight: 600, letterSpacing: "-0.025em", fontSize: hr.size * 0.27, lineHeight: 1, color: "var(--foreground)" }}>
            {Math.round(sum)}
          </div>
          <div style={{ fontFamily: "Geist, sans-serif", fontSize: hr.size * (portrait ? 0.07 : 0.045), color: "var(--muted-foreground)", marginTop: hr.size * 0.02 }}>out of 100</div>
        </div>
      }
    />
  );

  return (
    <Stage>
      {/* The dashboard the click came from, dissolving. */}
      <AbsoluteFill style={{ ...(uiMask(orientation, true) as React.CSSProperties), opacity: 1 - pageOut }}>
        <Camera cam={cam}>
          <TodayPage
            orientation={orientation}
            rootRef={rootRef}
            mark={ref as Mark}
            state={{
              metrics: AFTER_METRICS,
              timeline: TIMELINE,
              hero: {
                ringScore: DAY.after.score ?? 0,
                displayScore: score,
                grade: DAY.after.grade ?? "—",
                confidence: DAY.after.confidence,
                summary: DAY.after.summary,
                whyPressed: press,
              },
              contentStyle: { filter: `blur(${6 * pageOut}px)` },
            }}
          />
          {rects && <Cursor x={rects.why.cx - 30} y={rects.why.cy + 3} press={press} />}
        </Camera>
      </AbsoluteFill>

      {/* The breakdown dialog (DialogContent is fixed-centred in the device viewport). */}
      <AbsoluteFill style={bandMask(orientation, false) as React.CSSProperties}>
        <Camera cam={cam}>
          <div ref={dlg.rootRef} style={{ position: "relative", width: portrait ? 390 : 1440, height: vh }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: portrait ? 390 : 1440, height: vh, display: "grid", placeItems: "center" }}>
              <div ref={dlg.ref("dialog")} className="dark" style={{ width: portrait ? 358 : 384, transform: `scale(${0.95 + 0.05 * open})`, opacity: open }}>
                <div className="text-foreground antialiased">
                  <ScoreDialog
                    metrics={AFTER_METRICS}
                    score={score}
                    rowLight={rowLight}
                    weightTint={rowLight}
                    resultTint={resultTint}
                    weightRefs={weightEls as React.MutableRefObject<(HTMLDivElement | null)[]>}
                    className="max-w-none sm:max-w-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </Camera>
      </AbsoluteFill>

      {/* The signature ring: the hero's one motion-blurred move is its growth out of the caption ring. */}
      <AbsoluteFill>{frame <= TRAVEL + 2 ? <CameraMotionBlur samples={8} shutterAngle={180}>{ringNode}</CameraMotionBlur> : ringNode}</AbsoluteFill>

      <div style={{ position: "absolute", left: portrait ? 540 : 190, top: portrait ? 375 : 230 }}>
        <KineticText
          frame={frame}
          enter={HEADLINE}
          exit={durationInFrames - 6}
          fontSize={portrait ? 84 : 118}
          lines={[{ text: "Every point," }, { text: "explained.", color: "var(--primary)" }]}
        />
      </div>
    </Stage>
  );
}
