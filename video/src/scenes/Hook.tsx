import { AbsoluteFill, useCurrentFrame } from "remotion";
import { KineticText } from "../components/film/kinetic";
import { SEGMENTS, WeightRing } from "../components/film/ring";
import { Stage } from "../components/film/stage";
import { STAGE, type Orientation } from "../layout";
import { DAY } from "../lib/fixtures";
import { EASE_IN_OUT, EASE_OUT, tween } from "../lib/motion";
import { sceneWindow } from "../timing";

/**
 * Scene 1 (beats 0–5): the weight ring draws itself around today's score, each segment labelled with
 * its real weight, and the film asks why.
 */
export function Hook({ orientation }: { orientation: Orientation }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = sceneWindow("hook");
  const st = STAGE[orientation];
  const score = DAY.after.roundedScore; // the end-of-day score the hero explains

  // Ring: 3-frame stagger, mostly drawn by frame 40, complete by ~50.
  const draw = SEGMENTS.map((_, i) => tween(frame, 4 + i * 3, 30 + i * 3, 0, 1, EASE_OUT));
  // Write-on: each segment draws in primary and cools to the brand mark's neutral as it settles.
  const ink = SEGMENTS.map((_, i) => (frame < 4 + i * 3 ? 0 : 1 - tween(frame, 26 + i * 3, 64 + i * 3, 0, 1, EASE_IN_OUT)));
  const labels = Math.min(tween(frame, 26, 42), 1 - tween(frame, durationInFrames - 30, durationInFrames - 14, 0, 1, EASE_IN_OUT));
  const centre = Math.min(tween(frame, 8, 28), 1 - tween(frame, durationInFrames - 26, durationInFrames - 12, 0, 1, EASE_IN_OUT));
  // Slow constant push (brief §3: never faster than the content).
  const push = 1 + 0.03 * (frame / durationInFrames);
  const r = st.hookRing;
  const portrait = orientation === "portrait";

  return (
    <Stage>
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: `${r.cx}px ${r.cy}px` }}>
        <WeightRing
          size={r.size}
          draw={draw}
          highlight={ink}
          strokeWidth={2.6}
          baseAlpha={0.42}
          labels={{ opacity: labels, fontSize: portrait ? 42 : 34, radius: 104 }}
          style={{ left: r.cx - r.size / 2, top: r.cy - r.size / 2 }}
          center={
            <div style={{ textAlign: "center", opacity: centre, transform: `translateY(${(1 - centre) * 12}px)` }}>
              <div
                className="number-tabular"
                style={{ fontFamily: "Geist, sans-serif", fontWeight: 600, letterSpacing: "-0.025em", fontSize: r.size * 0.27, lineHeight: 1, color: "var(--foreground)" }}
              >
                {score}
              </div>
              <div style={{ fontFamily: "Geist, sans-serif", fontSize: r.size * 0.036, color: "var(--muted-foreground)", marginTop: r.size * 0.02 }}>out of 100</div>
            </div>
          }
        />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: portrait ? 0 : st.hookText.left,
          right: portrait ? 0 : undefined,
          top: st.hookText.top,
          transform: portrait ? undefined : "translateY(-50%)",
        }}
      >
        <KineticText
          frame={frame}
          enter={12}
          exit={durationInFrames - 10}
          fontSize={st.hookText.fontSize}
          align={portrait ? "center" : "left"}
          lines={[
            { text: `Your day scored ${score}.` },
            { text: "Why?", color: "var(--primary)", delay: 18 },
          ]}
        />
      </div>
    </Stage>
  );
}
