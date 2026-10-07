import type React from "react";
import { UtensilsCrossed } from "lucide-react";
import { WEIGHT_SEGMENTS } from "../../lib/fixtures";

/**
 * The signature element: the outer ring of the app's IntakeDial (src/components/intake-dial.tsx).
 * Same geometry — viewBox 200, radius 88, pathLength 100, 2.4-unit gaps, rotated -90° — so every
 * segment's length is its real scoring weight.
 */
export const CENTER = 100;
export const RING_RADIUS = 88;
export const SEGMENT_GAP = 2.4;

export const SEGMENTS = (() => {
  let start = 0;
  return WEIGHT_SEGMENTS.map((s) => {
    const seg = { ...s, start, length: Math.max(s.weight - SEGMENT_GAP, 0.5) };
    start += s.weight;
    return seg;
  });
})();

/** Angle in radians (0 = +x axis, clockwise positive in screen space) of a ring percentage. */
export const angleOf = (pct: number) => ((-90 + pct * 3.6) * Math.PI) / 180;
export const midPct = (i: number) => SEGMENTS[i].start + SEGMENTS[i].length / 2;

export function WeightRing({
  size,
  draw,
  highlight,
  hidden,
  color = "var(--foreground)",
  baseAlpha = 0.35,
  highlightColor = "var(--primary)",
  strokeWidth = 2.5,
  labels,
  center,
  style,
  drawOn,
  drawWidth = 5,
}: {
  size: number;
  draw?: number[];
  highlight?: number[];
  hidden?: boolean[];
  color?: string;
  baseAlpha?: number;
  highlightColor?: string;
  strokeWidth?: number;
  labels?: { opacity: number; radius?: number; fontSize: number; highlight?: number[] };
  center?: React.ReactNode;
  style?: React.CSSProperties;
  /** 0..1 per segment: a thick primary stroke drawn along the segment (the login dial's draw gesture). */
  drawOn?: number[];
  /** Stroke width of the draw-on overlay, in the 200-unit viewBox. */
  drawWidth?: number;
}) {
  const scale = size / 200;
  return (
    <div style={{ position: "absolute", width: size, height: size, ...style }}>
      <svg viewBox="0 0 200 200" width={size} height={size} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`} fill="none" strokeLinecap="round">
          {SEGMENTS.map((seg, i) => {
            if (hidden?.[i]) return null;
            const d = Math.max(0, Math.min(1, draw?.[i] ?? 1));
            if (d <= 0) return null;
            const h = Math.max(0, Math.min(1, highlight?.[i] ?? 0));
            const len = seg.length * d;
            return (
              <circle
                key={seg.id}
                cx={CENTER}
                cy={CENTER}
                r={RING_RADIUS}
                pathLength={100}
                stroke={h > 0 ? `color-mix(in oklab, ${highlightColor} ${h * 100}%, color-mix(in oklab, ${color} ${baseAlpha * 100}%, transparent))` : `color-mix(in oklab, ${color} ${baseAlpha * 100}%, transparent)`}
                strokeWidth={strokeWidth}
                strokeDasharray={`${len} ${100 - len}`}
                strokeDashoffset={-seg.start}
              />
            );
          })}
          {drawOn &&
            SEGMENTS.map((seg, i) => {
              const d = Math.max(0, Math.min(1, drawOn[i] ?? 0));
              if (d <= 0) return null;
              const len = seg.length * d;
              return (
                <circle
                  key={`${seg.id}-on`}
                  cx={CENTER}
                  cy={CENTER}
                  r={RING_RADIUS}
                  pathLength={100}
                  stroke="var(--primary)"
                  strokeWidth={drawWidth}
                  strokeDasharray={`${len} ${100 - len}`}
                  strokeDashoffset={-seg.start}
                />
              );
            })}
        </g>
      </svg>
      {labels &&
        labels.opacity > 0 &&
        SEGMENTS.map((seg, i) => {
          const a = angleOf(midPct(i));
          const r = (labels.radius ?? 101) * scale;
          const x = size / 2 + Math.cos(a) * r;
          const y = size / 2 + Math.sin(a) * r;
          return (
            <div
              key={seg.id}
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: `translate(${-50 + 50 * Math.cos(a)}%, ${-50 + 50 * Math.sin(a)}%)`,
                whiteSpace: "nowrap",
                fontFamily: "Geist, sans-serif",
                fontWeight: 500,
                fontSize: labels.fontSize,
                lineHeight: 1,
                color: labels.highlight?.[i] ? `color-mix(in oklab, var(--primary) ${Math.round(labels.highlight[i] * 100)}%, var(--muted-foreground))` : "var(--muted-foreground)",
                opacity: labels.opacity,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {seg.label}{" "}
              <span style={{ color: labels.highlight?.[i] ? `color-mix(in oklab, var(--primary) ${Math.round(labels.highlight[i] * 100)}%, var(--foreground))` : "var(--foreground)" }}>{seg.weight}%</span>
            </div>
          );
        })}
      {center && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>{center}</div>
      )}
    </div>
  );
}

/** Illustrative inner arcs of the brand mark — the same constants as the app's IntakeDial. */
const PROGRESS_ARCS = [
  { id: "nutrition", radius: 72, value: 86, width: 6, alpha: 1 },
  { id: "hydration", radius: 57, value: 68, width: 5, alpha: 0.45 },
  { id: "movement", radius: 42, value: 92, width: 4, alpha: 0.25 },
] as const;

/** Full IntakeDial (ring + arcs + plate + UtensilsCrossed) in the dark theme, as on the login panel. */
export function IntakeDial({
  size,
  arcDraw = [1, 1, 1],
  plate = 1,
  ringTint = 0,
  style,
}: {
  size: number;
  arcDraw?: number[];
  plate?: number;
  /** 0..1: outer segments lit in primary (1) → the dial's resting foreground/35 (0). */
  ringTint?: number;
  style?: React.CSSProperties;
}) {
  const t = Math.max(0, Math.min(1, ringTint));
  const ringStroke = t > 0
    ? `color-mix(in oklab, var(--primary) ${t * 100}%, color-mix(in oklab, var(--foreground) 35%, transparent))`
    : "color-mix(in oklab, var(--foreground) 35%, transparent)";
  return (
    <div style={{ position: "absolute", width: size, height: size, display: "grid", placeItems: "center", ...style }}>
      <svg viewBox="0 0 200 200" width={size} height={size} style={{ gridArea: "1 / 1" }}>
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`} fill="none" strokeLinecap="round">
          {SEGMENTS.map((seg) => (
            <circle
              key={seg.id}
              cx={CENTER}
              cy={CENTER}
              r={RING_RADIUS}
              pathLength={100}
              stroke={ringStroke}
              strokeWidth={2.5}
              strokeDasharray={`${seg.length} ${100 - seg.length}`}
              strokeDashoffset={-seg.start}
            />
          ))}
          {PROGRESS_ARCS.map((arc, i) => {
            const v = arc.value * Math.max(0, Math.min(1, arcDraw[i] ?? 1));
            return (
              <g key={arc.id}>
                <circle cx={CENTER} cy={CENTER} r={arc.radius} stroke="color-mix(in oklab, var(--foreground) 7%, transparent)" strokeWidth={arc.width} />
                {v > 0 && (
                  <circle
                    cx={CENTER}
                    cy={CENTER}
                    r={arc.radius}
                    pathLength={100}
                    stroke={`color-mix(in oklab, var(--primary) ${arc.alpha * 100}%, transparent)`}
                    strokeWidth={arc.width}
                    strokeDasharray={`${v} ${100 - v}`}
                  />
                )}
              </g>
            );
          })}
        </g>
        <circle
          cx={CENTER}
          cy={CENTER}
          r={26}
          fill="color-mix(in oklab, var(--primary) 10%, transparent)"
          stroke="color-mix(in oklab, var(--primary) 30%, transparent)"
          strokeWidth={1.5}
          opacity={plate}
        />
      </svg>
      <UtensilsCrossed
        aria-hidden
        strokeWidth={1.5}
        style={{ gridArea: "1 / 1", width: size * 0.15, height: size * 0.15, color: "var(--primary)", opacity: plate }}
      />
    </div>
  );
}
