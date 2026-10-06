import type React from "react";
import { useVideoConfig } from "remotion";

/**
 * The film's one camera. A "page" (an app screen laid out in css px) is placed so that page point
 * (x, y) sits at the frame centre, scaled by `s`. Optional small tilts (≤ 6°, brief §3) rotate about the
 * frame centre under a 2800px perspective. With rx = ry = 0 the mapping is exact and invertible, which
 * the hero relies on to land ring segments on real dialog rows.
 */
export type CameraState = { x: number; y: number; s: number; rx?: number; ry?: number };

export function pageToScreen(cam: CameraState, width: number, height: number, px: number, py: number): [number, number] {
  return [width / 2 + (px - cam.x) * cam.s, height / 2 + (py - cam.y) * cam.s];
}

export function Camera({ cam, children, style }: { cam: CameraState; children: React.ReactNode; style?: React.CSSProperties }) {
  const { width, height } = useVideoConfig();
  const rx = Math.max(-6, Math.min(6, cam.rx ?? 0));
  const ry = Math.max(-6, Math.min(6, cam.ry ?? 0));
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 2800, perspectiveOrigin: "50% 50%", overflow: "hidden", ...style }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "50% 50%",
          transform: rx || ry ? `rotateX(${rx}deg) rotateY(${ry}deg)` : undefined,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: "0 0",
            transform: `translate(${width / 2}px, ${height / 2}px) scale(${cam.s}) translate(${-cam.x}px, ${-cam.y}px)`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** Camera that fits page rect `r` into screen rect `box` (both px), centred. */
export function frameRect(
  r: { x: number; y: number; w: number; h: number },
  box: { x: number; y: number; w: number; h: number },
  frameW: number,
  frameH: number,
  maxScale = 4,
): CameraState {
  const s = Math.min(box.w / r.w, box.h / r.h, maxScale);
  const rcx = r.x + r.w / 2;
  const rcy = r.y + r.h / 2;
  const bcx = box.x + box.w / 2;
  const bcy = box.y + box.h / 2;
  return { x: rcx - (bcx - frameW / 2) / s, y: rcy - (bcy - frameH / 2) / s, s };
}

/** Union of page rects. */
export function union(...rs: { x: number; y: number; w: number; h: number }[]) {
  const x = Math.min(...rs.map((r) => r.x));
  const y = Math.min(...rs.map((r) => r.y));
  const x2 = Math.max(...rs.map((r) => r.x + r.w));
  const y2 = Math.max(...rs.map((r) => r.y + r.h));
  return { x, y, w: x2 - x, h: y2 - y };
}

export function mixCam(a: CameraState, b: CameraState, t: number): CameraState {
  const l = (p: number, q: number) => p + (q - p) * t;
  return { x: l(a.x, b.x), y: l(a.y, b.y), s: l(a.s, b.s), rx: l(a.rx ?? 0, b.rx ?? 0), ry: l(a.ry ?? 0, b.ry ?? 0) };
}
