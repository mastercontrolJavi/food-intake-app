import type { RatioPoint } from "./constants";

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function scorePiecewiseRatio(
  actual: number | null | undefined,
  target: number | null | undefined,
  points: RatioPoint[],
): number | null {
  if (actual == null || target == null || !Number.isFinite(actual) || !Number.isFinite(target) || target <= 0 || actual < 0 || points.length === 0) {
    return null;
  }

  const ordered = [...points].sort((a, b) => a[0] - b[0]);
  const ratio = actual / target;
  if (ratio <= ordered[0][0]) return clampScore(ordered[0][1]);
  if (ratio >= ordered.at(-1)![0]) return clampScore(ordered.at(-1)![1]);

  for (let index = 1; index < ordered.length; index += 1) {
    const left = ordered[index - 1];
    const right = ordered[index];
    if (ratio <= right[0]) {
      const span = right[0] - left[0];
      const progress = span === 0 ? 0 : (ratio - left[0]) / span;
      return clampScore(left[1] + progress * (right[1] - left[1]));
    }
  }

  return clampScore(ordered.at(-1)![1]);
}
