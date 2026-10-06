import { useRef } from "react";
import type React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { TodayPage, type Mark } from "../components/app/pages";
import { ScoreDialog } from "../components/app/score-dialog";
import { Camera, frameRect, mixCam, pageToScreen, type CameraState } from "../components/film/camera";
import { Cursor, pressAt } from "../components/film/cursor";
import { KineticText } from "../components/film/kinetic";
import { angleOf, SEGMENTS, WeightRing } from "../components/film/ring";
import { Stage } from "../components/film/stage";
import { bandMask, STAGE, WATERMARK_ALPHA, type Orientation } from "../layout";
import { AFTER_METRICS, DAY, TIMELINE } from "../lib/fixtures";
import { usePageRects, type Rect } from "../lib/measure";
import { EASE_IN_OUT, EASE_OUT, heroSpring, lerp, quad, tween, uiSpring } from "../lib/motion";
import { sceneBeat, sceneWindow } from "../timing";
import { glassHole, heroCardCamera, TODAY_KEYS, type TodayRects } from "./Water";

/**
 * Scene 4 (beats 20–32) — the film's one orchestrated moment.
 * Beat 20: "Why this score?" opens the real breakdown dialog (rows populated, exactly as in the app)
 * while the weight ring leaves its watermark spot and settles beside it around the score.
 * Beats 21.4–23.1: segment by segment, the ring lights and a copy of the segment flies into its row,
 * landing beside "Weight NN%", which glows briefly. Beat 24: the result glows; headline at 24.5.
 * The ring stays, fully lit, through the end of the scene.
 */
const RING_MOVE = 44;
const FIRE0 = 52;
const FIRE_STEP = 10;
const FLIGHT = 30;
const RESULT = sceneBeat("hero", 24);
const HEADLINE = sceneBeat("hero", 24.5);

const HERO_RING = {
  landscape: { cx: 660, cy: 940, size: 620 },
  portrait: { cx: 330, cy: 545, size: 430 },
} as const;
const DIALOG_BOX = {
  landscape: { x: 1330, y: 96, w: 1080, h: 1248 },
  portrait: { x: 60, y: 830, w: 1320, h: 1390 },
} as const;
const VIEWPORT_HEIGHT = { landscape: 900, portrait: 844 } as const;

export function Hero({ orientation }: { orientation: Orientation }) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const { durationInFrames } = sceneWindow("hero");
  const portrait = orientation === "portrait";
  const weightEls = useRef<(HTMLElement | null)[]>([]);
  const { rootRef, ref, rects } = usePageRects(TODAY_KEYS);
  // The dialog lives in its own layer (same camera, same page origin) so the travelling ring can pass
  // between the blurred page and the dialog.
  const dlg = usePageRects(["dialog"] as const, { weights: weightEls });
  const weights = dlg.listRects.weights;

  // Camera: score card → dialog, flat (no tilt) so landing points map exactly; then a slow drift.
  let cam: CameraState = { x: 720, y: 400, s: 2 };
  if (rects && dlg.rects && weights?.length) {
    const from = heroCardCamera(rects as unknown as TodayRects, orientation, width, height);
    const d = dlg.rects.dialog;
    const area = portrait ? { x: d.x, y: weights[0].y - 44, w: d.w, h: d.y + d.h - (weights[0].y - 44) } : d;
    const to = frameRect(area, DIALOG_BOX[orientation], width, height);
    const settle = { ...to, s: to.s * 1.01, y: to.y - 2 };
    cam = mixCam(mixCam(from, to, tween(frame, 0, 56, 0, 1, EASE_IN_OUT)), settle, tween(frame, 56, durationInFrames, 0, 1, (t) => t));
  }

  // The ring: from the watermark spot to its place beside the dialog.
  const wm = STAGE[orientation].watermark;
  const hr = HERO_RING[orientation];
  const m = tween(frame, 0, RING_MOVE, 0, 1, EASE_IN_OUT);
  const ring = { cx: lerp(wm.cx, hr.cx, m), cy: lerp(wm.cy, hr.cy, m), size: lerp(wm.size, hr.size, tween(frame, 0, RING_MOVE - 6, 0, 1, EASE_OUT)) };
  const fire = SEGMENTS.map((_, i) => FIRE0 + i * FIRE_STEP);
  const land = fire.map((f) => f + FLIGHT);
  const lit = fire.map((f) => tween(frame, f - 2, f + 8));
  const centre = tween(frame, RING_MOVE - 8, RING_MOVE + 12);
  const weightTint = land.map((l) => tween(frame, l - 4, l + 4) * (1 - tween(frame, l + 30, l + 64, 0, 1, EASE_IN_OUT)));
  const resultTint = tween(frame, RESULT - 6, RESULT + 6) * (1 - tween(frame, RESULT + 54, RESULT + 96, 0, 1, EASE_IN_OUT));

  const open = uiSpring(frame, fps, 0, 14);
  const press = pressAt(frame, 0);
  const vh = VIEWPORT_HEIGHT[orientation];
  const score = DAY.after.roundedScore ?? 0;
  // 9:16 frames the rows only: the band starts at the first row's top edge (label top − 36 css px).
  const rowsTop = portrait && weights?.length ? pageToScreen(cam, width, height, 0, weights[0].y - 34)[1] : undefined;
  const layerMask = bandMask(orientation, false, rowsTop, undefined, 18) as React.CSSProperties;

  return (
    <Stage>
      <AbsoluteFill style={layerMask}>
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
              contentStyle: { filter: `blur(${4 * open}px)` },
              overlay: (
                <>
                  {/* DialogOverlay: fixed inset-0 bg-black/10 backdrop-blur-xs */}
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.1)", opacity: open }} />
                </>
              ),
            }}
          />
          {rects && <Cursor x={rects.why.cx - 30} y={rects.why.cy + 3} press={press} opacity={1 - tween(frame, 8, 22, 0, 1, EASE_IN_OUT)} />}
        </Camera>
      </AbsoluteFill>

      {/* Lighting: a soft scrim under the ring and headline so they never fight the blurred dashboard. */}
      <AbsoluteFill
        style={{
          background: portrait
            ? "linear-gradient(to bottom, var(--background) 0%, color-mix(in oklab, var(--background) 92%, transparent) 26%, transparent 33%)"
            : "linear-gradient(to right, var(--background) 0%, color-mix(in oklab, var(--background) 90%, transparent) 34%, transparent 52%)",
          opacity: open * 0.95,
        }}
      />

      <WeightRing
        size={ring.size}
        highlight={lit}
        baseAlpha={lerp(WATERMARK_ALPHA, 0.42, m)}
        strokeWidth={lerp(2.2, 2.6, m)}
        style={{
          left: ring.cx - ring.size / 2,
          top: ring.cy - ring.size / 2,
          // For the first frames the ring still sits behind the translucent score card, as in scene 3.
          clipPath: frame < 8 && rects ? holeClip(ring, glassHole(rects.hero, cam, width, height)) : undefined,
        }}
        center={
          <div style={{ textAlign: "center", opacity: centre, transform: `translateY(${(1 - centre) * 10}px)` }}>
            <div className="number-tabular" style={{ fontFamily: "Geist, sans-serif", fontWeight: 600, letterSpacing: "-0.025em", fontSize: hr.size * 0.27, lineHeight: 1, color: "var(--foreground)" }}>
              {score}
            </div>
            <div style={{ fontFamily: "Geist, sans-serif", fontSize: hr.size * (portrait ? 0.07 : 0.045), color: "var(--muted-foreground)", marginTop: hr.size * 0.02 }}>out of 100</div>
          </div>
        }
      />


      {/* Dialog layer (above the ring): DialogContent fixed-centred in the device viewport. */}
      <AbsoluteFill style={layerMask}>
        <Camera cam={cam}>
          <div ref={dlg.rootRef} style={{ position: "relative", width: portrait ? 390 : 1440, height: vh }}>
                  {/* DialogContent is fixed-centred in the device viewport; grid-centring keeps offsets measurable. */}
            <div style={{ position: "absolute", left: 0, top: 0, width: portrait ? 390 : 1440, height: vh, display: "grid", placeItems: "center" }}>
              <div ref={dlg.ref("dialog")} className="dark" style={{ width: portrait ? 358 : 384, transform: `scale(${0.95 + 0.05 * open})`, opacity: open }}>
                <div className="text-foreground antialiased">
                  <ScoreDialog
                    metrics={AFTER_METRICS}
                    score={score}
                    weightTint={weightTint}
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

      {/* Segment copies in flight: the only motion-blurred move in the film. */}
      {rects && weights?.length ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <CameraMotionBlur samples={8} shutterAngle={160}>
            <FlyingSegments frame={frame} fps={fps} fire={fire} land={land} ring={{ cx: hr.cx, cy: hr.cy, radius: (hr.size / 200) * 88, strokeWidth: (hr.size / 200) * 2.6 }} cam={cam} weights={weights} width={width} height={height} />
          </CameraMotionBlur>
        </AbsoluteFill>
      ) : null}

      <div style={{ position: "absolute", left: portrait ? 620 : 190, top: portrait ? 400 : 250 }}>
        <KineticText
          frame={frame}
          enter={HEADLINE}
          exit={durationInFrames - 6}
          fontSize={portrait ? 92 : 118}
          lines={[{ text: "Every point," }, { text: "explained.", color: "var(--primary)" }]}
        />
      </div>
    </Stage>
  );
}

function holeClip(ring: { cx: number; cy: number; size: number }, h: { x: number; y: number; w: number; h: number; r: number }) {
  const left = ring.cx - ring.size / 2;
  const top = ring.cy - ring.size / 2;
  const x = h.x - left;
  const y = h.y - top;
  const r = Math.min(h.r, h.w / 2, h.h / 2);
  const s = ring.size;
  return `path(evenodd, "M0 0 H${s} V${s} H0 Z M${x + r} ${y} H${x + h.w - r} A${r} ${r} 0 0 1 ${x + h.w} ${y + r} V${y + h.h - r} A${r} ${r} 0 0 1 ${x + h.w - r} ${y + h.h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h.h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z")`;
}

function FlyingSegments({
  frame,
  fps,
  fire,
  land,
  ring,
  cam,
  weights,
  width,
  height,
}: {
  frame: number;
  fps: number;
  fire: number[];
  land: number[];
  ring: { cx: number; cy: number; radius: number; strokeWidth: number };
  cam: CameraState;
  weights: Rect[];
  width: number;
  height: number;
}) {
  const N = 20;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {SEGMENTS.map((seg, i) => {
        const label = weights[i];
        if (!label || frame < fire[i]) return null;
        const fadeOut = tween(frame, land[i] + 2, land[i] + 14, 0, 1, EASE_IN_OUT);
        if (fadeOut >= 1) return null;
        // Travel uses the film's single overshoot spring; the shape morph is monotone and early.
        const travel = heroSpring(frame, fps, fire[i]);
        const morph = tween(frame, fire[i], fire[i] + 18, 0, 1, EASE_OUT);
        // Target: a short line just left of the row's "Weight NN%" label, length ∝ weight.
        const lineLen = seg.weight * 2.2;
        const right = pageToScreen(cam, width, height, label.x - 8, label.cy);
        const left = pageToScreen(cam, width, height, label.x - 8 - lineLen, label.cy);
        const arcPts: [number, number][] = [];
        const linePts: [number, number][] = [];
        for (let k = 0; k < N; k++) {
          const u = k / (N - 1);
          const a = angleOf(seg.start + seg.length * u);
          arcPts.push([ring.cx + Math.cos(a) * ring.radius, ring.cy + Math.sin(a) * ring.radius]);
          linePts.push([lerp(left[0], right[0], u), lerp(left[1], right[1], u)]);
        }
        const centroid = (pts: [number, number][]) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length] as [number, number];
        const c0 = centroid(arcPts);
        const c1 = centroid(linePts);
        const dx = c1[0] - c0[0];
        const dy = c1[1] - c0[1];
        const ctrl: [number, number] = [(c0[0] + c1[0]) / 2 + dy * 0.18, (c0[1] + c1[1]) / 2 - dx * 0.18];
        const c = quad(c0, ctrl, c1, travel);
        const d = arcPts
          .map((p, k) => {
            const q = linePts[k];
            const x = c[0] + lerp(p[0] - c0[0], q[0] - c1[0], morph);
            const y = c[1] + lerp(p[1] - c0[1], q[1] - c1[1], morph);
            return `${k === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
          })
          .join(" ");
        return (
          <path
            key={seg.id}
            d={d}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={lerp(ring.strokeWidth, 2.5 * cam.s, morph)}
            strokeLinecap="round"
            opacity={1 - fadeOut}
          />
        );
      })}
    </svg>
  );
}
