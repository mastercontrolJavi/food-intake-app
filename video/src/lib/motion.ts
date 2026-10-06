import { Easing, interpolate, spring } from "remotion";

/** Entrances (brief §3) — also the app's own dial-draw curve in globals.css. */
export const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
/** Camera and hero moves (brief §3). */
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

/** Clamped interpolation of a frame over [start, end] into [from, to]. */
export function tween(frame: number, start: number, end: number, from = 0, to = 1, easing: (t: number) => number = EASE_OUT) {
  if (end <= start) return frame >= end ? to : from;
  return interpolate(frame, [start, end], [from, to], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/** Fade in over [a, a+inDur], hold, fade out over [b-outDur, b]. */
export function window01(frame: number, a: number, b: number, inDur = 12, outDur = 12) {
  return Math.min(tween(frame, a, a + inDur), 1 - tween(frame, b - outDur, b, 0, 1, EASE_IN_OUT));
}

/** UI spring: critically damped, never overshoots (brief §3). */
export function uiSpring(frame: number, fps: number, delay = 0, durationInFrames?: number) {
  return spring({ frame: frame - delay, fps, config: { damping: 200, stiffness: 120, mass: 1 }, durationInFrames });
}

/** The single permitted overshoot: used only for the hero segments landing (never text). */
export function heroSpring(frame: number, fps: number, delay = 0) {
  return spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 90, mass: 0.9 } });
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Quadratic Bézier point. */
export function quad(p0: [number, number], p1: [number, number], p2: [number, number], t: number): [number, number] {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
}

/** Piecewise keyframes with per-segment easing (EASE_IN_OUT by default). */
export type Key<T extends Record<string, number>> = { f: number } & T;
export function keyframes<T extends Record<string, number>>(frame: number, keys: Key<T>[], easing = EASE_IN_OUT): T {
  const sorted = [...keys].sort((a, b) => a.f - b.f);
  const strip = (k: Key<T>) => Object.fromEntries(Object.entries(k).filter(([key]) => key !== "f")) as unknown as T;
  if (frame <= sorted[0].f) return strip(sorted[0]);
  const last = sorted[sorted.length - 1];
  if (frame >= last.f) return strip(last);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (frame >= a.f && frame <= b.f) {
      const t = easing((frame - a.f) / (b.f - a.f));
      const out: Record<string, number> = {};
      for (const key of Object.keys(a)) {
        if (key === "f") continue;
        out[key] = lerp(a[key as keyof T] as number, b[key as keyof T] as number, t);
      }
      return out as T;
    }
  }
  return strip(last);
}
