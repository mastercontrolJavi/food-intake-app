import type React from "react";
import { EASE_IN_OUT, EASE_OUT, tween } from "../../lib/motion";
import { STAGE, type Orientation } from "../../layout";
import { WeightRing } from "./ring";

/**
 * Display statements (brief §3): words rise 16px with a fade, staggered 3 frames; lines exit whole.
 * No overshoot, no typewriter. Geist semibold, tight tracking — the app's heading style.
 */
export type KineticLine = { text: string; color?: string; delay?: number };

export function KineticText({
  frame,
  lines,
  enter,
  exit,
  fontSize,
  lineHeight = 1.06,
  align = "left",
  style,
  rise = 16,
}: {
  frame: number;
  lines: KineticLine[];
  enter: number;
  exit?: number;
  fontSize: number;
  lineHeight?: number;
  align?: "left" | "center";
  style?: React.CSSProperties;
  rise?: number;
}) {
  const offsets = lines.map((_, li) => lines.slice(0, li).reduce((n, l) => n + l.text.split(" ").length, 0));
  const exitT = exit == null ? 0 : tween(frame, exit - 14, exit, 0, 1, EASE_IN_OUT);
  return (
    <div
      style={{
        fontFamily: "Geist, sans-serif",
        fontWeight: 600,
        letterSpacing: "-0.025em",
        fontSize,
        lineHeight,
        textAlign: align,
        color: "var(--foreground)",
        opacity: 1 - exitT,
        transform: `translateY(${-exitT * 10}px)`,
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
    >
      {lines.map((line, li) => {
        const words = line.text.split(" ");
        return (
          <div key={li} style={{ color: line.color, whiteSpace: "nowrap" }}>
            {words.map((word, wi) => {
              const start = enter + (line.delay ?? 0) + (offsets[li] + wi) * 3;
              const t = tween(frame, start, start + 20, 0, 1, EASE_OUT);
              return (
                <span key={wi} style={{ display: "inline-block", opacity: t, transform: `translateY(${(1 - t) * rise}px)`, marginRight: wi < words.length - 1 ? "0.24em" : 0 }}>
                  {word}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/** Quiet caption (eyebrow scale): fades + 8px rise in, fades out whole. */
export function Caption({
  frame,
  text,
  enter,
  exit,
  fontSize = 44,
  style,
}: {
  frame: number;
  text: string;
  enter: number;
  exit: number;
  fontSize?: number;
  style?: React.CSSProperties;
}) {
  const tIn = tween(frame, enter, enter + 18, 0, 1, EASE_OUT);
  const tOut = tween(frame, exit - 14, exit, 0, 1, EASE_IN_OUT);
  return (
    <div
      style={{
        fontFamily: "Geist, sans-serif",
        fontWeight: 500,
        fontSize,
        letterSpacing: "-0.005em",
        color: "var(--primary)",
        opacity: tIn * (1 - tOut),
        transform: `translateY(${(1 - tIn) * 8}px)`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {text}
    </div>
  );
}

/**
 * Caption with the signature ring beside it: a small, complete weight ring (never behind UI) whose
 * segments light for the metrics the on-screen action touches. The ring may outlive the text
 * (`ringExit`), so it can hand off to the next scene or grow into the hero ring.
 */
export function RingCaption({
  frame,
  orientation,
  text,
  enter,
  exit,
  ringEnter = enter,
  ringExit,
  highlight,
}: {
  frame: number;
  orientation: Orientation;
  text: string;
  enter: number;
  exit: number;
  ringEnter?: number;
  ringExit?: number;
  highlight?: number[];
}) {
  const c = STAGE[orientation].caption;
  const ringIn = ringEnter <= 0 ? 1 : tween(frame, ringEnter, ringEnter + 18, 0, 1, EASE_OUT);
  const ringOut = ringExit == null ? 0 : tween(frame, ringExit - 14, ringExit, 0, 1, EASE_IN_OUT);
  return (
    <div style={{ position: "absolute", left: c.left, top: c.cy, transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: c.ring * 0.32 }}>
      <div style={{ position: "relative", width: c.ring, height: c.ring, opacity: ringIn * (1 - ringOut) }}>
        <WeightRing size={c.ring} highlight={highlight} baseAlpha={0.42} strokeWidth={3.4} style={{ left: 0, top: 0 }} />
      </div>
      <Caption frame={frame} text={text} enter={enter} exit={exit} fontSize={c.fontSize} />
    </div>
  );
}
