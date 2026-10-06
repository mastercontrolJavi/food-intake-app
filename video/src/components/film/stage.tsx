import type React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { STAGE, WATERMARK_ALPHA, type Orientation } from "../../layout";
import type { CameraState } from "./camera";
import { WeightRing } from "./ring";

/**
 * Screen-space backdrop: the app's dark body colour and its primary glow (globals.css body rule),
 * sized for a 2K frame. Everything else sits on top.
 */
export function Stage({ children }: { children?: React.ReactNode }) {
  const { width } = useVideoConfig();
  const glow = width * 0.42;
  return (
    <AbsoluteFill className="dark" style={{ backgroundColor: "var(--background)" }}>
      <AbsoluteFill
        style={{
          backgroundColor: "var(--background)",
          backgroundImage: `radial-gradient(circle at 15% 0%, color-mix(in oklab, var(--primary) 7%, transparent), transparent ${glow}px)`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
}

/**
 * The signature ring as a fixed screen-space watermark behind the UI. It parallaxes at 30 % of the
 * camera's screen motion (brief §3) relative to the scene's opening camera, and segments brighten to
 * primary when the action on screen touches their metric.
 */
export function RingWatermark({
  orientation,
  cam,
  cam0,
  highlight,
  hidden,
  opacity = 1,
  holes = [],
}: {
  orientation: Orientation;
  cam?: CameraState;
  cam0?: CameraState;
  highlight?: number[];
  hidden?: boolean[];
  opacity?: number;
  /** Screen-space rounded rects the ring must not show through (translucent liquid-glass cards). */
  holes?: { x: number; y: number; w: number; h: number; r: number }[];
}) {
  const w = STAGE[orientation].watermark;
  let dx = 0;
  let dy = 0;
  let ds = 1;
  if (cam && cam0) {
    dx = -(cam.x - cam0.x) * cam.s * 0.3;
    dy = -(cam.y - cam0.y) * cam.s * 0.3;
    ds = 1 + (cam.s / cam0.s - 1) * 0.3;
  }
  const size = w.size * ds;
  const left = w.cx - size / 2 + dx;
  const top = w.cy - size / 2 + dy;
  const clip = holes.length
    ? `path(evenodd, "M0 0 H${size} V${size} H0 Z ${holes
        .map((h) => {
          const x = h.x - left;
          const y = h.y - top;
          const r = Math.min(h.r, h.w / 2, h.h / 2);
          return `M${x + r} ${y} H${x + h.w - r} A${r} ${r} 0 0 1 ${x + h.w} ${y + r} V${y + h.h - r} A${r} ${r} 0 0 1 ${x + h.w - r} ${y + h.h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h.h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;
        })
        .join(" ")}")`
    : undefined;
  return (
    <WeightRing
      size={size}
      highlight={highlight}
      hidden={hidden}
      baseAlpha={WATERMARK_ALPHA}
      strokeWidth={2.2}
      style={{ left, top, opacity, clipPath: clip }}
    />
  );
}

/** Screen-space geometry of the watermark (used by the hero to lift segments off it). */
export function watermarkGeometry(orientation: Orientation, cam?: CameraState, cam0?: CameraState) {
  const w = STAGE[orientation].watermark;
  let dx = 0;
  let dy = 0;
  let ds = 1;
  if (cam && cam0) {
    dx = -(cam.x - cam0.x) * cam.s * 0.3;
    dy = -(cam.y - cam0.y) * cam.s * 0.3;
    ds = 1 + (cam.s / cam0.s - 1) * 0.3;
  }
  const size = w.size * ds;
  return { cx: w.cx + dx, cy: w.cy + dy, radius: (size / 200) * 88, strokeWidth: (size / 200) * 2.2 };
}
