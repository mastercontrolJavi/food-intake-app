import type { ConfidenceLevel } from "./types";

export function confidenceFromCoverage(coverageRatio: number): ConfidenceLevel {
  if (!Number.isFinite(coverageRatio) || coverageRatio < 0.35) return "insufficient";
  if (coverageRatio < 0.55) return "low";
  if (coverageRatio < 0.8) return "medium";
  return "high";
}
