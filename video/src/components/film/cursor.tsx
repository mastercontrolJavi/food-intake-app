import { EASE_IN_OUT, quad, tween } from "../../lib/motion";

/**
 * Realistic arrow cursor living in page (css px) space, so it scales with the camera like a screen
 * recording. Moves along a curved quadratic path with camera easing; presses (scale .86) on click.
 */
export type CursorMove = { from: [number, number]; to: [number, number]; start: number; end: number; bend?: number };

export function cursorPosition(frame: number, moves: CursorMove[]): [number, number] {
  let pos = moves[0].from;
  for (const m of moves) {
    if (frame < m.start) break;
    const t = tween(frame, m.start, m.end, 0, 1, EASE_IN_OUT);
    const mid: [number, number] = [(m.from[0] + m.to[0]) / 2, (m.from[1] + m.to[1]) / 2];
    const dx = m.to[0] - m.from[0];
    const dy = m.to[1] - m.from[1];
    const bend = m.bend ?? 0.18;
    const ctrl: [number, number] = [mid[0] - dy * bend, mid[1] + dx * bend];
    pos = quad(m.from, ctrl, m.to, t);
  }
  return pos;
}

/** 0..1 press depth around a click frame (down 4 f, up 8 f). */
export function pressAt(frame: number, click: number) {
  if (frame < click - 4 || frame > click + 8) return 0;
  return frame <= click ? tween(frame, click - 4, click, 0, 1, EASE_IN_OUT) : 1 - tween(frame, click, click + 8, 0, 1, EASE_IN_OUT);
}

export function Cursor({ x, y, press = 0, opacity = 1, size = 22 }: { x: number; y: number; press?: number; opacity?: number; size?: number }) {
  const s = 1 - press * 0.14;
  return (
    <svg
      width={size}
      height={size * 1.45}
      viewBox="0 0 22 32"
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-3px, -2px) scale(${s})`,
        transformOrigin: "3px 2px",
        opacity,
        overflow: "visible",
        filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,.45))",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <path d="M3 2 L3 25 L8.6 19.6 L12.4 28.6 L16.2 27 L12.5 18.2 L20 18.2 Z" fill="#fff" stroke="#111" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
