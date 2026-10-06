/**
 * Builds every number the film shows by running the app's REAL scoring + analytics engine.
 * Inputs are fictional (the app's own demo meal templates and demo goals); outputs are whatever the
 * engine returns. Run from the repository root:  npx tsx video/scripts/build-fixtures.ts
 * Writes video/src/fixtures/film.json.
 */
import { writeFileSync } from "node:fs";
import { addWeeks, format, parseISO } from "date-fns";
import { scoreDay, scoreMeal, scoreWeek, SCORE_WEIGHTS, type ConfidenceLevel, type NutritionTotals } from "../../src/lib/scoring";
import { aggregatePeriod, generateInsights } from "../../src/lib/analytics";
import { DEMO_GOAL_VALUES } from "../../src/lib/demo/build-demo-data";
import { createPublicDemoSnapshot, getPublicDemoDayData, getPublicDemoPeriodDataset } from "../../src/lib/demo/public-demo-data";
import { goalForLocalDate } from "../../src/lib/data/mappers";
import { formatDayHeading, mealDetail } from "../../src/lib/data/day";
import { weekRange } from "../../src/lib/dates/timezone";
import { formatAmount } from "../../src/lib/format/number";

const g = DEMO_GOAL_VALUES;
const goals = {
  calorieTarget: g.calorie_target, proteinTargetG: g.protein_target_g, carbsTargetG: g.carbs_target_g,
  fatTargetG: g.fat_target_g, fiberTargetG: g.fiber_target_g, waterTargetMl: g.water_target_ml,
  stepTarget: g.step_target, weeklyWorkoutTarget: g.weekly_workout_target,
};

// The app's own demo meal templates (src/lib/demo/build-demo-data.ts → baseMeals).
const MEALS = {
  yogurt: { title: "Greek yogurt, berries and oats", calories: 420, proteinG: 32, carbsG: 50, fatG: 10, fiberG: 8 },
  bowl: { title: "Chicken rice bowl with vegetables", calories: 680, proteinG: 55, carbsG: 72, fatG: 18, fiberG: 9 },
  shake: { title: "Protein shake and banana", calories: 320, proteinG: 35, carbsG: 32, fatG: 8, fiberG: 5 },
  salmon: { title: "Salmon, potatoes and greens", calories: 720, proteinG: 48, carbsG: 60, fatG: 28, fiberG: 10 },
  // Yesterday's breakfast (fictional sample, only shown in Recent meals).
  eggs: { title: "Eggs, avocado and toast", calories: 510, proteinG: 26, carbsG: 38, fatG: 28, fiberG: 8 },
} as const;
type MealKey = keyof typeof MEALS;

const mealScore = (k: MealKey) => {
  const m = MEALS[k];
  return scoreMeal({ calories: m.calories, proteinG: m.proteinG, carbsG: m.carbsG, fatG: m.fatG, fiberG: m.fiberG, waterMl: null, steps: null }, goals).score;
};
const detail = (k: MealKey) => mealDetail({ calories: MEALS[k].calories, protein_g: MEALS[k].proteinG, quantity: 1 });

function totals(meals: MealKey[], waterMl: number, steps: number): NutritionTotals {
  const t = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
  for (const k of meals) {
    t.calories += MEALS[k].calories; t.proteinG += MEALS[k].proteinG; t.carbsG += MEALS[k].carbsG;
    t.fatG += MEALS[k].fatG; t.fiberG += MEALS[k].fiberG;
  }
  return { ...t, waterMl, steps };
}

function day(meals: MealKey[], waterMl: number, steps: number) {
  const r = scoreDay(totals(meals, waterMl, steps), goals);
  return {
    score: r.score, roundedScore: r.score == null ? null : Math.round(r.score), grade: r.grade,
    confidence: r.confidence, summary: r.summary,
    metrics: r.metrics.map((m) => ({
      id: m.id, label: m.label, weight: m.weight, unit: m.unit, actual: m.actual, target: m.target,
      score: m.score, roundedScore: m.score == null ? null : Math.round(m.score), configured: m.configured, available: m.available,
      // Strings exactly as ProgressCard / ScoreDetailsDialog format them.
      ofTarget: m.actual != null && m.target != null ? `${formatAmount(m.actual, m.unit)} of ${formatAmount(m.target, m.unit)}` : null,
      slashTarget: m.actual != null && m.target != null ? `${formatAmount(m.actual, m.unit)} / ${formatAmount(m.target, m.unit)}` : null,
      status: m.actual == null || m.target == null ? null
        : m.actual > m.target ? { label: `${formatAmount(m.actual - m.target, m.unit)} over target`, tone: m.actual / m.target > 1.1 ? "rose" : "amber" }
        : m.actual === m.target ? { label: "Target met", tone: "emerald" }
        : { label: `${formatAmount(m.target - m.actual, m.unit)} remaining`, tone: "muted" },
    })),
  };
}

const ALL: MealKey[] = ["yogurt", "bowl", "shake", "salmon"];
const STEPS = 8600;
const before = day(ALL, 1750, STEPS); // after "Log again" on salmon, before +500 water
const after = day(ALL, 2250, STEPS); // after +500 water

const localDate = "2026-10-06";
const timeline = [
  { time: "8:15 AM", title: MEALS.yogurt.title, detail: detail("yogurt"), score: Math.round(mealScore("yogurt") ?? 0) },
  { time: "9:30 AM", title: "water", detail: "750 ml · 0 kcal", score: null },
  { time: "1:10 PM", title: MEALS.bowl.title, detail: detail("bowl"), score: Math.round(mealScore("bowl") ?? 0) },
  { time: "2:30 PM", title: "water", detail: "1000 ml · 0 kcal", score: null },
  { time: "4:30 PM", title: MEALS.shake.title, detail: detail("shake"), score: Math.round(mealScore("shake") ?? 0) },
  { time: "6:00 PM", title: "running", detail: "45 min", score: null },
  { time: "6:45 PM", title: "steps", detail: `${STEPS.toLocaleString("en-US")} steps`, score: null },
  { time: "7:15 PM", title: MEALS.salmon.title, detail: detail("salmon"), score: Math.round(mealScore("salmon") ?? 0), isNew: true },
];
// /log/food "Recent meals": latest five meal logs, newest first (yesterday's salmon dinner is 4th).
const recentMeals = [
  { title: MEALS.shake.title, detail: detail("shake") },
  { title: MEALS.bowl.title, detail: detail("bowl") },
  { title: MEALS.yogurt.title, detail: detail("yogurt") },
  { title: MEALS.salmon.title, detail: detail("salmon"), target: true },
  { title: MEALS.eggs.title, detail: detail("eggs") },
];

// Weekly review: the public demo dataset exactly as /demo/weekly builds it, with "now" pinned.
const snapshot = createPublicDemoSnapshot(new Date("2026-10-07T03:00:00.000Z")); // Oct 6, 21:00 Mexico City
const current = weekRange("2026-09-28");
const previous = weekRange(format(addWeeks(parseISO(current.start), -1), "yyyy-MM-dd"));
const dataset = getPublicDemoPeriodDataset(snapshot, current.start, current.end);
const previousDataset = getPublicDemoPeriodDataset(snapshot, previous.start, previous.end);
const reviewDays = dataset.reviews.flatMap((review) => review.score == null ? [] : [{ score: review.score, coverageRatio: review.coverage_ratio, confidence: review.confidence as ConfidenceLevel }]);
const analytics = aggregatePeriod(dataset.days, dataset.meals);
const priorAnalytics = aggregatePeriod(previousDataset.days, previousDataset.meals);
const activeGoal = goalForLocalDate(dataset.goals, current.end);
const weekScore = scoreWeek(reviewDays, analytics.workoutCount, activeGoal?.weekly_workout_target ?? null);
const insights = generateInsights(dataset.days, dataset.meals, previousDataset, 5);
const sourceTotal = Object.values(analytics.sourceCounts).reduce((sum, count) => sum + count, 0);

const week = {
  title: `${format(parseISO(current.start), "MMM d")}–${format(parseISO(current.end), "MMM d, yyyy")}`,
  score: weekScore.score, roundedScore: weekScore.score == null ? null : Math.round(weekScore.score),
  grade: weekScore.grade, confidence: weekScore.confidence,
  sufficientDays: weekScore.sufficientlyCompleteDays, coverageRatio: weekScore.coverageRatio,
  chartPoints: dataset.days.map((d) => ({ label: format(parseISO(d.localDate), "EEE"), value: d.score })),
  trackedDays: analytics.trackedDays, completedDays: analytics.completedDays, mealsLogged: sourceTotal,
  workoutCount: analytics.workoutCount,
  hitRates: { protein: analytics.proteinHitRate, fiber: analytics.fiberHitRate, water: analytics.hydrationHitRate, steps: analytics.stepHitRate },
  sourceCounts: Object.entries(analytics.sourceCounts).sort((a, b) => b[1] - a[1]),
  timing: analytics.firstMealTime ? { first: analytics.firstMealTime, final: analytics.finalMealTime, late: analytics.lateMealCount, lateRate: analytics.lateMealRate } : null,
  averages: {
    calories: analytics.averageCalories, protein: analytics.averageProteinG, water: analytics.averageWaterMl, steps: analytics.averageSteps,
    prior: { calories: priorAnalytics.averageCalories, protein: priorAnalytics.averageProteinG, water: priorAnalytics.averageWaterMl, steps: priorAnalytics.averageSteps },
  },
  insights: insights.map((i) => ({ id: i.id, title: i.title, message: i.message, category: i.category, confidence: i.confidence })),
};

// Fidelity reference only: the public demo's Oct 6 day, to diff the rebuild against the real screenshot.
const demoDay = getPublicDemoDayData(snapshot, "2026-10-06");
const demoLive = scoreDay(demoDay.totals, demoDay.goals);
const fidelity = {
  heading: formatDayHeading(demoDay.localDate),
  score: demoDay.review?.score ?? null, grade: demoDay.review?.grade ?? null, confidence: demoDay.review?.confidence ?? null,
  summary: demoDay.review?.generated_summary ?? null,
  metrics: demoLive.metrics.map((m) => ({
    id: m.id, label: m.label, weight: m.weight, unit: m.unit, actual: m.actual, target: m.target, score: m.score,
    roundedScore: m.score == null ? null : Math.round(m.score), configured: m.configured, available: m.available,
    ofTarget: m.actual != null && m.target != null ? `${formatAmount(m.actual, m.unit)} of ${formatAmount(m.target, m.unit)}` : null,
    slashTarget: m.actual != null && m.target != null ? `${formatAmount(m.actual, m.unit)} / ${formatAmount(m.target, m.unit)}` : null,
    status: m.actual == null || m.target == null ? null
      : m.actual > m.target ? { label: `${formatAmount(m.actual - m.target, m.unit)} over target`, tone: m.actual / m.target > 1.1 ? "rose" : "amber" }
      : m.actual === m.target ? { label: "Target met", tone: "emerald" }
      : { label: `${formatAmount(m.target - m.actual, m.unit)} remaining`, tone: "muted" },
  })),
  timeline: demoDay.timeline.map((t) => ({ time: t.timeLabel, title: t.title, detail: t.detail, score: t.score == null ? null : Math.round(t.score) })),
};

const film = {
  generatedBy: "video/scripts/build-fixtures.ts (real Intake scoring + analytics engine; fictional inputs)",
  weights: SCORE_WEIGHTS,
  goals,
  day: { localDate, heading: formatDayHeading(localDate), before, after, timeline, recentMeals },
  week,
  fidelity,
};
writeFileSync(new URL("../src/fixtures/film.json", import.meta.url), JSON.stringify(film, null, 2) + "\n");
console.log("before", before.roundedScore, before.grade, "| after", after.roundedScore, after.grade, "| week", week.roundedScore, week.grade);
console.log(after.metrics.map((m) => `${m.label} ${m.roundedScore} w${m.weight}`).join(" · "));
console.log(week.insights.map((i) => `${i.title}: ${i.message}`).join("\n"));
