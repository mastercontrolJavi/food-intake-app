/**
 * Orientation-specific staging. 16:9 is the master; 9:16 is re-staged (never cropped) with every text
 * and key UI element inside the safe band y ∈ [260, 2260].
 */
export type Orientation = "landscape" | "portrait";

export const SAFE_PORTRAIT = { top: 260, bottom: 2260 };

export const STAGE = {
  landscape: {
    width: 2560,
    height: 1440,
    hookRing: { cx: 1800, cy: 730, size: 940 },
    hookText: { left: 190, top: 560, fontSize: 112 },
    watermark: { cx: 2140, cy: 1010, size: 1560 },
    caption: { left: 190, top: 112, fontSize: 46 },
  },
  portrait: {
    width: 1440,
    height: 2560,
    hookRing: { cx: 720, cy: 1010, size: 940 },
    hookText: { left: 0, top: 1700, fontSize: 118 },
    watermark: { cx: 1260, cy: 2250, size: 2100 },
    caption: { left: 0, top: 300, fontSize: 52 },
  },
} as const;

export const WATERMARK_ALPHA = 0.15;

/** Screen box UI is framed into while a caption occupies the top band. */
export const UI_BOX = {
  landscape: { x: 190, y: 250, w: 2180, h: 1100 },
  portrait: { x: 60, y: 640, w: 1320, h: 1520 },
} as const;
/** Screen box for UI when no caption is showing. */
export const UI_BOX_FULL = {
  landscape: { x: 160, y: 120, w: 2240, h: 1200 },
  portrait: { x: 90, y: 300, w: 1260, h: 1900 },
} as const;

/**
 * Screen-space fade applied to the UI layer while a caption is up, so page content never sits under
 * caption text (a camera/lighting choice; the UI itself is untouched).
 */
const EDGES = "linear-gradient(to right, transparent 0px, black 120px, black calc(100% - 120px), transparent 100%)";
const EDGES_V = "linear-gradient(to bottom, transparent 0px, black 90px, black calc(100% - 90px), transparent 100%)";

export const CAPTION_MASK = {
  landscape: "linear-gradient(to bottom, transparent 0px, transparent 215px, black 300px, black 100%)",
  // 9:16 also keeps the bottom 300 px clear (safe band ends at y = 2260).
  portrait: "linear-gradient(to bottom, transparent 0px, transparent 500px, black 630px, black 2150px, transparent 2260px)",
} as const;
const SAFE_V_PORTRAIT = "linear-gradient(to bottom, transparent 0px, transparent 260px, black 340px, black 2160px, transparent 2260px)";

/** Style for a UI layer: soft frame edges (+ caption band when a caption is up; 9:16 clipped to the safe band). */
export function uiMask(orientation: Orientation, caption: boolean) {
  const vertical = caption ? CAPTION_MASK[orientation] : orientation === "portrait" ? SAFE_V_PORTRAIT : EDGES_V;
  const images = `${vertical}, ${EDGES}`;
  return { maskImage: images, WebkitMaskImage: images, maskComposite: "intersect", WebkitMaskComposite: "source-in" } as const;
}

/**
 * UI-layer mask that shows only a vertical band of the frame: fades out just above `top` and just below
 * `bottom` (screen px, from measured element edges), on top of the orientation's caption/safe-band rules.
 * Keeps stray fragments of neighbouring UI from peeking into a framing.
 */
export function bandMask(orientation: Orientation, caption: boolean, top?: number, bottom?: number, feather = 52) {
  const base = uiMask(orientation, caption);
  const t = top ?? -1000;
  const b = bottom ?? 10000;
  const band = `linear-gradient(to bottom, transparent 0px, transparent ${Math.max(0, t - 4 - feather)}px, black ${Math.max(1, t - 4)}px, black ${b + 4}px, transparent ${b + 4 + feather}px)`;
  return { ...base, maskImage: `${band}, ${base.maskImage}`, WebkitMaskImage: `${band}, ${base.WebkitMaskImage}` };
}
