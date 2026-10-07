import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { KineticText } from "../components/film/kinetic";
import { IntakeDial } from "../components/film/ring";
import { Stage } from "../components/film/stage";
import type { Orientation } from "../layout";
import { EASE_IN_OUT, EASE_OUT, lerp, tween } from "../lib/motion";
import { sceneBeat } from "../timing";

/**
 * Scene 6 (beats 40–50): cut on the beat to the IntakeDial, centred, its weight ring still lit from the
 * hero. The ring cools to the dial's resting grey while the inner arcs and plate draw in with the login
 * panel's own CSS timing (globals.css: arcs 1.4 s from 240 ms + 140 ms each; plate 0.8 s from 0.7 s).
 * On beat 42 the dial steps aside for the wordmark (16:9 left, 9:16 up); tagline on 43, URL on 44.
 */
const ms = (t: number) => Math.round((t / 1000) * 60);
const ARC_START = [0, 1, 2].map((i) => ms(240 + i * 140));
const ARC_DUR = ms(1400);
const CSS_EASE_OUT = Easing.bezier(0, 0, 0.58, 1);

export function Resolve({ orientation }: { orientation: Orientation }) {
  const frame = useCurrentFrame();
  const portrait = orientation === "portrait";
  const arcDraw = ARC_START.map((a) => tween(frame, a, a + ARC_DUR, 0, 1, EASE_OUT));
  const plate = tween(frame, ms(700), ms(1500), 0, 1, CSS_EASE_OUT);
  const ringTint = 1 - tween(frame, 12, 84, 0, 1, EASE_IN_OUT);
  const lockupAt = sceneBeat("resolve", 42);
  const lockup = tween(frame, lockupAt, lockupAt + 22, 0, 1, EASE_OUT);
  const url = tween(frame, sceneBeat("resolve", 44), sceneBeat("resolve", 44) + 20, 0, 1, EASE_OUT);
  // The step aside starts half a beat early so the dial has cleared the words' space as they fade up.
  const aside = tween(frame, sceneBeat("resolve", 41.5), sceneBeat("resolve", 42.5), 0, 1, EASE_IN_OUT);

  const rest = portrait ? { size: 860, cx: 720, cy: 960 } : { size: 740, cx: 800, cy: 720 };
  const centred = portrait ? { cx: 720, cy: 1220 } : { cx: 1280, cy: 720 };
  const dial = { size: rest.size, cx: lerp(centred.cx, rest.cx, aside), cy: lerp(centred.cy, rest.cy, aside) };
  const words = portrait
    ? { left: 0, right: 0, top: 1530, align: "center" as const }
    : { left: 1320, top: 512, align: "left" as const };

  return (
    <Stage>
      {/* Accessory pass (round 3): no camera drift — the dial's step aside is the scene's only move; the lockup then holds still. */}
      <AbsoluteFill>
        <IntakeDial size={dial.size} arcDraw={arcDraw} plate={plate} ringTint={ringTint} style={{ left: dial.cx - dial.size / 2, top: dial.cy - dial.size / 2 }} />
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
