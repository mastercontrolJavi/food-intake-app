import { mean } from "./statistics";
import type { AnalyticsDay, AnalyticsMeal, PeriodAnalytics } from "./types";

function hitRate(days: AnalyticsDay[], actual: (day: AnalyticsDay) => number | null, target: (day: AnalyticsDay) => number | null): number | null {
  const known = days.filter((day) => actual(day) != null && target(day) != null && (target(day) ?? 0) > 0);
  return known.length ? known.filter((day) => (actual(day) ?? 0) >= (target(day) ?? 0)).length / known.length : null;
}

export function aggregatePeriod(days: AnalyticsDay[], meals: AnalyticsMeal[]): PeriodAnalytics {
  const trackedDays = new Set([...days.map((day) => day.localDate), ...meals.map((meal) => meal.localDate)]).size;
  const sourceCounts = meals.reduce<Record<string, number>>((counts, meal) => {
    const source = meal.sourceType ?? "unspecified";
    counts[source] = (counts[source] ?? 0) + 1;
    return counts;
  }, {});

  return {
    trackedDays,
    completedDays: days.filter((day) => day.completed).length,
    sufficientlyCompleteDays: days.filter((day) => day.confidence !== "insufficient").length,
    averageCalories: mean(days.map((day) => day.calories)),
    averageProteinG: mean(days.map((day) => day.proteinG)),
    averageWaterMl: mean(days.map((day) => day.waterMl)),
    averageSteps: mean(days.map((day) => day.steps)),
    proteinHitRate: hitRate(days, (day) => day.proteinG, (day) => day.proteinTargetG),
    fiberHitRate: hitRate(days, (day) => day.fiberG, (day) => day.fiberTargetG),
    hydrationHitRate: hitRate(days, (day) => day.waterMl, (day) => day.waterTargetMl),
    stepHitRate: hitRate(days, (day) => day.steps, (day) => day.stepTarget),
    workoutCount: days.reduce((total, day) => total + day.workoutCount, 0),
    sourceCounts,
    takeoutPerTrackedDay: trackedDays ? (sourceCounts.takeout ?? 0) / trackedDays : 0,
    restaurantPerTrackedDay: trackedDays ? (sourceCounts.restaurant ?? 0) / trackedDays : 0,
    lateMealCount: meals.filter((meal) => meal.isLate).length,
    lateMealRate: meals.length ? meals.filter((meal) => meal.isLate).length / meals.length : null,
    firstMealTime: meals.length ? meals.map((meal) => meal.eatenLocalTime).sort()[0] : null,
    finalMealTime: meals.length ? meals.map((meal) => meal.eatenLocalTime).sort().at(-1) ?? null : null,
    caloricDrinkCalories: days.reduce((total, day) => total + day.caloricDrinkCalories, 0),
  };
}
