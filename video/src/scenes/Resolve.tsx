import { AbsoluteFill, useCurrentFrame } from "remotion";
import { KineticText } from "../components/film/kinetic";
import { IntakeDial } from "../components/film/ring";
import { Stage } from "../components/film/stage";
import type { Orientation } from "../layout";
import { EASE_OUT, tween } from "../lib/motion";
import { sceneBeat, sceneWindow } from "../timing";

/**
 * Scene 6 (beats 40–50): cut to the IntakeDial at rest, staged like the app's login panel (mark on the
 * left, words on the right; the complete
 * dial at rest). Then wordmark, tagline, URL.
 */

export function Resolve({ orientation }: { orientation: Orientation }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = sceneWindow("resolve");
  const portrait = orientation === "portrait";
  // Accessory pass: the cut lands on the complete dial at rest (no replay of the login draw-in).
  const arcDraw = [1, 1, 1];
  const plate = 1;
  const lockup = tween(frame, sceneBeat("resolve", 42), sceneBeat("resolve", 42) + 22, 0, 1, EASE_OUT);
  const url = tween(frame, sceneBeat("resolve", 44), sceneBeat("resolve", 44) + 20, 0, 1, EASE_OUT);
  const drift = 1 + 0.012 * (frame / durationInFrames);

  const dial = portrait ? { size: 860, cx: 720, cy: 960 } : { size: 740, cx: 800, cy: 720 };
  const words = portrait
    ? { left: 0, right: 0, top: 1530, align: "center" as const }
    : { left: 1320, top: 512, align: "left" as const };

  return (
    <Stage>
      <AbsoluteFill style={{ transform: `scale(${drift})`, transformOrigin: "50% 50%" }}>
        <IntakeDial size={dial.size} arcDraw={arcDraw} plate={plate} style={{ left: dial.cx - dial.size / 2, top: dial.cy - dial.size / 2 }} />
        <div style={{ position: "absolute", left: words.left, right: portrait ? 0 : undefined, top: words.top, textAlign: words.align }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: portrait ? 26 : 24,
              opacity: lockup,
              transform: `translateY(${(1 - lockup) * 16}px)`,
            }}
          >
            {/* App wordmark: font-semibold tracking-tight (the dial is the mark, so the tile is dropped) */}
            <span style={{ fontFamily: "Geist, sans-serif", fontWeight: 600, letterSpacing: "-0.025em", fontSize: portrait ? 132 : 128, lineHeight: 1, color: "var(--foreground)" }}>Intake</span>
          </div>
          <KineticText
            frame={frame}
            enter={sceneBeat("resolve", 43)}
            fontSize={portrait ? 76 : 80}
            align={words.align}
            style={{ marginTop: portrait ? 40 : 44, fontWeight: 500 }}
            lines={[{ text: "Track with intention." }]}
          />
          <div
            style={{
              marginTop: portrait ? 40 : 44,
              fontFamily: "Geist, sans-serif",
              fontWeight: 500,
              fontSize: portrait ? 40 : 38,
              color: "var(--muted-foreground)",
              opacity: url,
              transform: `translateY(${(1 - url) * 10}px)`,
            }}
          >
            intake.javiertpadilla.com
          </div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
}
