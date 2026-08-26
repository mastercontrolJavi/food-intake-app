import { clampScore } from "./interpolation";
import type { ScoreMetric, WeightedScore } from "./types";

export function weightedAverageKnown(metrics: ScoreMetric[]): WeightedScore {
  const configured = metrics.filter((metric) => metric.configured && metric.weight > 0);
  const available = configured.filter(
    (metric) => metric.available && metric.score != null && Number.isFinite(metric.score),
  );
  const totalPossibleWeight = configured.reduce((sum, metric) => sum + metric.weight, 0);
  const availableWeight = available.reduce((sum, metric) => sum + metric.weight, 0);
  const coverageRatio = totalPossibleWeight > 0 ? availableWeight / totalPossibleWeight : 0;

  if (availableWeight === 0) {
    return { score: null, availableWeight, totalPossibleWeight, coverageRatio };
  }

  const score = available.reduce(
    (sum, metric) => sum + (metric.score ?? 0) * (metric.weight / availableWeight),
    0,
  );

  return {
    score: clampScore(score),
    availableWeight,
    totalPossibleWeight,
    coverageRatio,
  };
}
