/**
 * Beat grid. Every cut and the hero hit are expressed in beats, so the film stays locked to the music.
 * 100 BPM @ 60 fps = exactly 36 frames per beat. To use a different track, keep it near 100 BPM and set
 * PICKUP_FRAMES to the frame of its first downbeat — scene lengths in beats never change.
 */
export const FPS = 60;
export const BPM = 100;
export const FRAMES_PER_BEAT = (FPS * 60) / BPM; // 36
export const PICKUP_FRAMES = 0;
export const DURATION_IN_FRAMES = 1800; // 30 s

/** Absolute frame of beat n (may be fractional beats, e.g. 5.5). */
export const beat = (n: number) => Math.round(PICKUP_FRAMES + n * FRAMES_PER_BEAT);
/** Duration in frames of a span of n beats. */
export const beats = (n: number) => Math.round(n * FRAMES_PER_BEAT);

/** Scene boundaries (in beats). Cuts happen exactly on these. */
export const SCENES = {
  hook: { from: 0, to: 5 },
  log: { from: 5, to: 12 },
  water: { from: 12, to: 20 },
  hero: { from: 20, to: 32 },
  patterns: { from: 32, to: 40 },
  resolve: { from: 40, to: 50 },
} as const;

export type SceneName = keyof typeof SCENES;

/** Sequence props for a scene: absolute start frame and duration (last scene ends at DURATION_IN_FRAMES). */
export function sceneWindow(name: SceneName) {
  const s = SCENES[name];
  const from = name === "hook" ? 0 : beat(s.from);
  const to = name === "resolve" ? DURATION_IN_FRAMES : beat(s.to);
  return { from, durationInFrames: to - from };
}

/** Frame of beat n relative to the start of a scene. */
export const sceneBeat = (name: SceneName, n: number) => beat(n) - sceneWindow(name).from;
