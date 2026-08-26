import { MEAL_SCORE_WEIGHTS } from "./constants";
import { confidenceFromCoverage } from "./confidence";
import { feedbackForMetrics, directionFor } from "./feedback";
import { gradeFromScore } from "./grade";
import { scoreCarbs, scoreFat, scoreFiber, scoreProtein } from "./metrics";
import type { GoalTargets, NutritionTotals, ScoreMetric, ScoreResult } from "./types";
import { weightedAverageKnown } from "./weighted";

export function scoreMeal(meal: NutritionTotals, goals: GoalTargets): ScoreResult {
  const calorieShare = meal.calories != null && goals.calorieTarget != null && goals.calorieTarget > 0
    ? meal.calories / goals.calorieTarget
    : null;

  const makeMetric = (
    id: ScoreMetric["id"], label: string, actual: number | null,
    dailyTarget: number | null, weight: number, scorer: (a: number | null, t: number | null) => number | null,
  ): ScoreMetric => {
    const target = calorieShare != null && dailyTarget != null ? dailyTarget * calorieShare : null;
    const configured = dailyTarget != null && dailyTarget > 0;
    const available = target != null && target > 0 && actual != null && actual >= 0;
    return {
      id, label, actual, target, weight, configured, available, unit: "g",
      score: available ? scorer(actual, target) : null,
      direction: directionFor(actual, target),
    };
  };

  const metrics = [
    makeMetric("proteinG", "Protein", meal.proteinG, goals.proteinTargetG, MEAL_SCORE_WEIGHTS.protein, scoreProtein),
    makeMetric("fiberG", "Fiber", meal.fiberG, goals.fiberTargetG, MEAL_SCORE_WEIGHTS.fiber, scoreFiber),
    makeMetric("carbsG", "Carbohydrates", meal.carbsG, goals.carbsTargetG, MEAL_SCORE_WEIGHTS.carbs, scoreCarbs),
    makeMetric("fatG", "Fat", meal.fatG, goals.fatTargetG, MEAL_SCORE_WEIGHTS.fat, scoreFat),
  ];
  const weighted = weightedAverageKnown(metrics);
  const confidence = confidenceFromCoverage(weighted.coverageRatio);
  const feedback = feedbackForMetrics(metrics);
  return {
    ...weighted, metrics, confidence,
    grade: confidence === "insufficient" ? null : gradeFromScore(weighted.score),
    ...feedback,
  };
}
