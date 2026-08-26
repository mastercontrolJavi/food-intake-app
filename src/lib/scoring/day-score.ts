import { SCORE_WEIGHTS } from "./constants";
import { confidenceFromCoverage } from "./confidence";
import { feedbackForMetrics, directionFor } from "./feedback";
import { gradeFromScore } from "./grade";
import { scoreActivity, scoreCalories, scoreCarbs, scoreFat, scoreFiber, scoreHydration, scoreProtein } from "./metrics";
import type { GoalTargets, NutritionTotals, ScoreMetric, ScoreResult } from "./types";
import { weightedAverageKnown } from "./weighted";

function metric(
  id: ScoreMetric["id"],
  label: string,
  weight: number,
  actual: number | null,
  target: number | null,
  unit: string,
  scorer: (actual: number | null, target: number | null) => number | null,
): ScoreMetric {
  const configured = target != null && Number.isFinite(target) && target > 0;
  const available = configured && actual != null && Number.isFinite(actual) && actual >= 0;
  return {
    id, label, weight, actual, target, unit, configured, available,
    score: available ? scorer(actual, target) : null,
    direction: directionFor(actual, target),
  };
}

export function scoreDay(totals: NutritionTotals, goals: GoalTargets): ScoreResult {
  const metrics: ScoreMetric[] = [
    metric("calories", "Calories", SCORE_WEIGHTS.calories, totals.calories, goals.calorieTarget, " kcal", scoreCalories),
    metric("proteinG", "Protein", SCORE_WEIGHTS.protein, totals.proteinG, goals.proteinTargetG, "g", scoreProtein),
    metric("fiberG", "Fiber", SCORE_WEIGHTS.fiber, totals.fiberG, goals.fiberTargetG, "g", scoreFiber),
    metric("carbsG", "Carbohydrates", SCORE_WEIGHTS.carbs, totals.carbsG, goals.carbsTargetG, "g", scoreCarbs),
    metric("fatG", "Fat", SCORE_WEIGHTS.fat, totals.fatG, goals.fatTargetG, "g", scoreFat),
    metric("waterMl", "Water", SCORE_WEIGHTS.water, totals.waterMl, goals.waterTargetMl, "ml", scoreHydration),
    metric("steps", "Steps", SCORE_WEIGHTS.steps, totals.steps, goals.stepTarget, "steps", scoreActivity),
  ];
  const weighted = weightedAverageKnown(metrics);
  const confidence = confidenceFromCoverage(weighted.coverageRatio);
  const feedback = feedbackForMetrics(metrics);

  return {
    ...weighted,
    metrics,
    confidence,
    grade: confidence === "insufficient" ? null : gradeFromScore(weighted.score),
    ...feedback,
  };
}
