import { isWeekend, parseISO } from "date-fns";
import { mean, median, percentChange } from "./statistics";
import type { AnalyticsDay, AnalyticsMeal, PatternInsight, PeriodAnalytics } from "./types";

const confidenceForSample = (sample: number, medium: number, high: number): PatternInsight["confidence"] => sample >= high ? "high" : sample >= medium ? "medium" : "low";

export function proteinPattern(days: AnalyticsDay[]): PatternInsight | null {
  const known = days.filter((day) => day.proteinG != null && day.proteinTargetG != null && day.proteinTargetG > 0);
  if (known.length < 4) return null;
  const met = known.filter((day) => (day.proteinG ?? 0) >= (day.proteinTargetG ?? 0)).length;
  const rate = met / known.length;
  if (rate >= 0.8) return { id: "protein_consistency", category: "nutrition", direction: "positive", confidence: confidenceForSample(known.length, 4, 10), priority: 82, title: "Protein consistency", message: `You reached your protein target on ${met} of ${known.length} sufficiently tracked days.`, evidence: { metDays: met, trackedDays: known.length, rate } };
  if (rate < 0.5) return { id: "protein_opportunity", category: "nutrition", direction: "negative", confidence: confidenceForSample(known.length, 4, 10), priority: 88, title: "Protein target opportunity", message: `Protein was below your configured target on ${known.length - met} of ${known.length} tracked days.`, evidence: { metDays: met, trackedDays: known.length, rate } };
  return null;
}

export function hydrationPattern(days: AnalyticsDay[]): PatternInsight | null {
  const known = days.filter((day) => day.waterMl != null && day.waterTargetMl != null && day.waterTargetMl > 0);
  if (known.length < 4) return null;
  const met = known.filter((day) => (day.waterMl ?? 0) >= (day.waterTargetMl ?? 0)).length;
  const rate = met / known.length;
  if (rate >= 0.8) return { id: "hydration_consistency", category: "hydration", direction: "positive", confidence: confidenceForSample(known.length, 4, 10), priority: 78, title: "Water target consistency", message: `You reached your water target on ${met} of ${known.length} tracked days.`, evidence: { metDays: met, trackedDays: known.length, rate } };
  if (rate < 0.5) return { id: "hydration_opportunity", category: "hydration", direction: "negative", confidence: confidenceForSample(known.length, 4, 10), priority: 86, title: "Water target opportunity", message: `Water intake was below your configured target on ${known.length - met} of ${known.length} tracked days.`, evidence: { metDays: met, trackedDays: known.length, rate } };
  return null;
}

export function restaurantVsHomePattern(meals: AnalyticsMeal[]): PatternInsight | null {
  const restaurant = meals.filter((meal) => meal.sourceType === "restaurant" && meal.calories != null).map((meal) => meal.calories!);
  const home = meals.filter((meal) => meal.sourceType === "home" && meal.calories != null).map((meal) => meal.calories!);
  if (restaurant.length < 5 || home.length < 5) return null;
  const restaurantMedian = median(restaurant)!;
  const homeMedian = median(home)!;
  const difference = restaurantMedian - homeMedian;
  if (homeMedian <= 0 || difference < 150 || difference / homeMedian < 0.2) return null;
  return { id: "restaurant_calorie_difference", category: "behavior", direction: "neutral", confidence: confidenceForSample(Math.min(restaurant.length, home.length), 5, 10), priority: 66, title: "Restaurant meal difference", message: `Your logged restaurant meals had a median ${Math.round(difference)} more calories than home meals in this period.`, evidence: { restaurantMeals: restaurant.length, homeMeals: home.length, restaurantMedianCalories: restaurantMedian, homeMedianCalories: homeMedian, difference } };
}

export function weekendPattern(days: AnalyticsDay[]): PatternInsight | null {
  const known = days.filter((day) => day.calories != null);
  const weekend = known.filter((day) => isWeekend(parseISO(day.localDate)));
  const weekday = known.filter((day) => !isWeekend(parseISO(day.localDate)));
  if (weekday.length < 4 || weekend.length < 2) return null;
  const weekendCalories = median(weekend.map((day) => day.calories!))!;
  const weekdayCalories = median(weekday.map((day) => day.calories!))!;
  const change = percentChange(weekendCalories, weekdayCalories);
  const weekendScore = mean(weekend.map((day) => day.score));
  const weekdayScore = mean(weekday.map((day) => day.score));
  const scoreDifference = weekendScore != null && weekdayScore != null ? weekendScore - weekdayScore : null;
  if ((change == null || Math.abs(change) < 0.15) && (scoreDifference == null || Math.abs(scoreDifference) < 7)) return null;
  const higher = weekendCalories >= weekdayCalories;
  return { id: "weekend_weekday_difference", category: "behavior", direction: "neutral", confidence: confidenceForSample(known.length, 6, 14), priority: 58, title: "Weekend pattern", message: `Weekend tracked calories were ${higher ? "higher" : "lower"} than weekdays in this period (${Math.round(weekendCalories)} vs ${Math.round(weekdayCalories)} median).`, evidence: { weekendDays: weekend.length, weekdayDays: weekday.length, weekendMedianCalories: weekendCalories, weekdayMedianCalories: weekdayCalories, scoreDifference } };
}

export function lateEatingPattern(meals: AnalyticsMeal[], trackedDays: number): PatternInsight | null {
  const known = meals.filter((meal) => meal.calories != null);
  if (trackedDays < 4 || known.length < 6) return null;
  const totalCalories = known.reduce((total, meal) => total + meal.calories!, 0);
  const lateCalories = known.filter((meal) => meal.isLate).reduce((total, meal) => total + meal.calories!, 0);
  const rate = totalCalories > 0 ? lateCalories / totalCalories : 0;
  const lateMealCount = known.filter((meal) => meal.isLate).length;
  if (rate < 0.3) return null;
  return { id: "late_eating_share", category: "behavior", direction: "neutral", confidence: confidenceForSample(known.length, 6, 14), priority: 62, title: "Meals after your cutoff", message: `${Math.round(rate * 100)}% of tracked meal calories were logged after your configured cutoff.`, evidence: { trackedDays, knownMeals: known.length, lateMealCount, lateCalories, totalCalories, rate } };
}

export function caloricDrinksPattern(days: AnalyticsDay[]): PatternInsight | null {
  const known = days.filter((day) => day.calories != null);
  if (known.length < 4) return null;
  const drinkCalories = known.reduce((total, day) => total + day.caloricDrinkCalories, 0);
  const totalCalories = known.reduce((total, day) => total + (day.calories ?? 0), 0);
  const rate = totalCalories > 0 ? drinkCalories / totalCalories : 0;
  if (drinkCalories <= 0 || rate < 0.05) return null;
  return { id: "caloric_drinks", category: "behavior", direction: "neutral", confidence: confidenceForSample(known.length, 4, 10), priority: 54, title: "Calories from drinks", message: `Caloric drinks contributed ${Math.round(rate * 100)}% of tracked calories in this period.`, evidence: { trackedDays: known.length, drinkCalories, totalCalories, rate } };
}

export function activityAssociationPattern(days: AnalyticsDay[]): PatternInsight | null {
  const known = days.filter((day) => day.score != null && day.steps != null && day.stepTarget != null && day.stepTarget > 0);
  const active = known.filter((day) => (day.steps ?? 0) >= (day.stepTarget ?? 0));
  const comparison = known.filter((day) => (day.steps ?? 0) < (day.stepTarget ?? 0));
  if (active.length < 4 || comparison.length < 4) return null;
  const activeScore = mean(active.map((day) => day.score))!;
  const comparisonScore = mean(comparison.map((day) => day.score))!;
  const difference = activeScore - comparisonScore;
  if (Math.abs(difference) < 5) return null;
  return { id: "activity_score_association", category: "activity", direction: difference > 0 ? "positive" : "neutral", confidence: confidenceForSample(Math.min(active.length, comparison.length), 4, 10), priority: 56, title: "Activity and daily alignment", message: `Days meeting your step target coincided with scores ${Math.abs(Math.round(difference))} points ${difference > 0 ? "higher" : "lower"} on average.`, evidence: { activeDays: active.length, comparisonDays: comparison.length, activeAverageScore: activeScore, comparisonAverageScore: comparisonScore, difference } };
}

export function takeoutTrendPattern(current: PeriodAnalytics, previous: PeriodAnalytics): PatternInsight | null {
  if (current.trackedDays < 4 || previous.trackedDays < 4) return null;
  const change = percentChange(current.takeoutPerTrackedDay, previous.takeoutPerTrackedDay);
  const weeklyDifference = (current.takeoutPerTrackedDay - previous.takeoutPerTrackedDay) * 7;
  if (change == null || change < 0.25 || weeklyDifference < 1) return null;
  return { id: "takeout_frequency_increase", category: "behavior", direction: "neutral", confidence: confidenceForSample(Math.min(current.trackedDays, previous.trackedDays), 4, 10), priority: 60, title: "Takeout frequency changed", message: `Takeout increased from ${previous.sourceCounts.takeout ?? 0} to ${current.sourceCounts.takeout ?? 0} logged meals versus the prior comparable period.`, evidence: { currentCount: current.sourceCounts.takeout ?? 0, previousCount: previous.sourceCounts.takeout ?? 0, currentTrackedDays: current.trackedDays, previousTrackedDays: previous.trackedDays, relativeChange: change, weeklyDifference } };
}

export function generateInsights(days: AnalyticsDay[], meals: AnalyticsMeal[], previous?: { days: AnalyticsDay[]; meals: AnalyticsMeal[] }, limit = 6): PatternInsight[] {
  const currentAggregate = aggregateForTrend(days, meals);
  const candidates = [
    proteinPattern(days), hydrationPattern(days), restaurantVsHomePattern(meals), weekendPattern(days),
    lateEatingPattern(meals, currentAggregate.trackedDays), caloricDrinksPattern(days), activityAssociationPattern(days),
    previous ? takeoutTrendPattern(currentAggregate, aggregateForTrend(previous.days, previous.meals)) : null,
  ].filter((insight): insight is PatternInsight => insight != null);
  const confidenceBonus = { low: 0, medium: 8, high: 16 };
  return candidates.sort((a, b) => (b.priority + confidenceBonus[b.confidence]) - (a.priority + confidenceBonus[a.confidence])).slice(0, limit);
}

function aggregateForTrend(days: AnalyticsDay[], meals: AnalyticsMeal[]): PeriodAnalytics {
  const sourceCounts = meals.reduce<Record<string, number>>((counts, meal) => {
    const source = meal.sourceType ?? "unspecified";
    counts[source] = (counts[source] ?? 0) + 1;
    return counts;
  }, {});
  const trackedDays = new Set([...days.map((day) => day.localDate), ...meals.map((meal) => meal.localDate)]).size;
  return {
    trackedDays, completedDays: days.filter((day) => day.completed).length,
    sufficientlyCompleteDays: days.filter((day) => day.confidence !== "insufficient").length,
    averageCalories: mean(days.map((day) => day.calories)), averageProteinG: mean(days.map((day) => day.proteinG)),
    averageWaterMl: mean(days.map((day) => day.waterMl)), averageSteps: mean(days.map((day) => day.steps)),
    proteinHitRate: null, fiberHitRate: null, hydrationHitRate: null, stepHitRate: null,
    workoutCount: days.reduce((sum, day) => sum + day.workoutCount, 0), sourceCounts,
    takeoutPerTrackedDay: trackedDays ? (sourceCounts.takeout ?? 0) / trackedDays : 0,
    restaurantPerTrackedDay: trackedDays ? (sourceCounts.restaurant ?? 0) / trackedDays : 0,
    lateMealCount: meals.filter((meal) => meal.isLate).length,
    lateMealRate: meals.length ? meals.filter((meal) => meal.isLate).length / meals.length : null,
    firstMealTime: meals.length ? meals.map((meal) => meal.eatenLocalTime).sort()[0] : null,
    finalMealTime: meals.length ? meals.map((meal) => meal.eatenLocalTime).sort().at(-1) ?? null : null,
    caloricDrinkCalories: days.reduce((sum, day) => sum + day.caloricDrinkCalories, 0),
  };
}
