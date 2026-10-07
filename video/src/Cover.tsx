import { useRef } from "react";
import type React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ScoreDialog } from "./components/app/score-dialog";
import { Camera, frameRect, type CameraState } from "./components/film/camera";
import { KineticText } from "./components/film/kinetic";
import { IntakeDial, SEGMENTS, WeightRing } from "./components/film/ring";
import { Stage } from "./components/film/stage";
import { AFTER_METRICS, DAY } from "./lib/fixtures";
import { usePageRects } from "./lib/measure";
import { ensureFonts } from "./theme/fonts";

ensureFonts();

/**
 * Portfolio cover: the film's hero moment as a single still. Every element is the film's own —
 * the lit weight ring at 95, the real "Transparent score breakdown" dialog with its rows lit, the hero
 * line and the Intake lockup — on the app's dark stage. Same fictional sample data as the film.
 */
export type CoverLayout = "16x9" | "4x3";

const LAYOUT = {
  "16x9": {
    lockup: { left: 190, top: 140, dial: 76, word: 56 },
    headline: { left: 190, top: 270, size: 134 },
    ring: { cx: 770, cy: 1010, size: 590, label: 31 },
    // Dialog fitted to this height, right edge on the right margin.
    dialog: { top: 110, height: 1220, right: 2370 },
  },
  "4x3": {
    lockup: { left: 150, top: 140, dial: 76, word: 56 },
    headline: { left: 150, top: 280, size: 132 },
    ring: { cx: 700, cy: 1170, size: 680, label: 34 },
    dialog: { top: 300, height: 1360, right: 2250 },
  },
} as const;

// Settled hero state: every segment drawn on, rows and labels lit at the film's resting 70 %.
const LIT = SEGMENTS.map(() => 0.7);
const DRAWN = SEGMENTS.map(() => 1);

export function Cover({ layout }: { layout: CoverLayout }) {
  const { width, height } = useVideoConfig();
  const l = LAYOUT[layout];
  const weightEls = useRef<(HTMLElement | null)[]>([]);
  const { rootRef, ref, rects } = usePageRects(["dialog"] as const, { weights: weightEls });
  let cam: CameraState = { x: 720, y: 450, s: 2 };
  if (rects) {
    const d = rects.dialog;
    const fit = frameRect(d, { x: 0, y: l.dialog.top, w: width, h: l.dialog.height }, width, height);
    cam = { ...fit, x: d.x + d.w - (l.dialog.right - width / 2) / fit.s };
  }
  const score = DAY.after.roundedScore ?? 0;
  const r = l.ring;

  return (
    <Stage>
      {/* The real breakdown dialog, framed whole on the right. */}
      <AbsoluteFill>
        <Camera cam={cam}>
          <div ref={rootRef} style={{ position: "relative", width: 1440, height: 900 }}>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
              <div ref={ref("dialog")} className="dark" style={{ width: 384 }}>
                <div className="text-foreground antialiased">
                  <ScoreDialog
                    metrics={AFTER_METRICS}
                    score={score}
                    rowLight={LIT}
                    weightTint={LIT}
                    resultTint={1}
                    weightRefs={weightEls as React.MutableRefObject<(HTMLDivElement | null)[]>}
                    className="max-w-none sm:max-w-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </Camera>
      </AbsoluteFill>

      {/* Lockup: the brand dial and wordmark. */}
      <div style={{ position: "absolute", left: l.lockup.left, top: l.lockup.top, display: "flex", alignItems: "center", gap: 22 }}>
        <div style={{ position: "relative", width: l.lockup.dial, height: l.lockup.dial }}>
          <IntakeDial size={l.lockup.dial} style={{ left: 0, top: 0 }} />
        </div>
        <span style={{ fontFamily: "Geist, sans-serif", fontWeight: 600, letterSpacing: "-0.025em", fontSize: l.lockup.word, lineHeight: 1, color: "var(--foreground)" }}>
          Intake
        </span>
        <span style={{ width: 2, height: l.lockup.word * 0.8, marginLeft: 8, marginRight: 8, background: "color-mix(in oklab, var(--foreground) 18%, transparent)" }} />
        <span style={{ fontFamily: "Geist, sans-serif", fontWeight: 500, letterSpacing: "-0.01em", fontSize: l.lockup.word * 0.82, lineHeight: 1, color: "var(--muted-foreground)" }}>
          Product film
        </span>
      </div>

      {/* The film's hero line. */}
      <div style={{ position: "absolute", left: l.headline.left, top: l.headline.top }}>
        <KineticText frame={1000} enter={0} fontSize={l.headline.size} lines={[{ text: "Every point," }, { text: "explained.", color: "var(--primary)" }]} />
      </div>

      {/* The signature: the weight ring, every segment drawn on, summing to 95. */}
      <WeightRing
        size={r.size}
        drawOn={DRAWN}
        drawWidth={4.7}
        baseAlpha={0.42}
        strokeWidth={2.6}
        labels={{ opacity: 1, fontSize: r.label, radius: 106, highlight: LIT }}
        style={{ left: r.cx - r.size / 2, top: r.cy - r.size / 2 }}
        center={
          <div style={{ textAlign: "center" }}>
            <div className="number-tabular" style={{ fontFamily: "Geist, sans-serif", fontWeight: 600, letterSpacing: "-0.025em", fontSize: r.size * 0.27, lineHeight: 1, color: "var(--foreground)" }}>
              {score}
            </div>
            <div style={{ fontFamily: "Geist, sans-serif", fontSize: r.size * 0.045, color: "var(--muted-foreground)", marginTop: r.size * 0.02 }}>out of 100</div>
          </div>
        }
      />
    </Stage>
  );
}
