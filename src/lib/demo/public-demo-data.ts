import { addDays, eachDayOfInterval, format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { AnalyticsDay, AnalyticsMeal } from "@/lib/analytics";
import type { DayPageData, TimelineItem } from "@/lib/data/day";
import { mealDetail, totalsFromLogs } from "@/lib/data/day";
import { goalForLocalDate, goalRowToTargets, type GoalRow } from "@/lib/data/mappers";
import type { PeriodDataset } from "@/lib/data/period";
import { localDateInTimezone } from "@/lib/dates/timezone";
import { buildDemoDataset, DEMO_GOAL_VALUES } from "@/lib/demo/build-demo-data";
import type { ConfidenceLevel } from "@/lib/scoring";
import type { Tables } from "@/types/database";

export const PUBLIC_DEMO_TIMEZONE = "America/Mexico_City";
export const PUBLIC_DEMO_DAY_COUNT = 70;

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_GOAL_ID = "00000000-0000-4000-8000-000000000002";

export type PublicDemoSnapshot = {
  startDate: string;
  endDate: string;
  timezone: string;
  profile: Tables<"profiles">;
  goals: Tables<"user_goals">[];
  meals: Tables<"meal_logs">[];
  hydration: Tables<"hydration_logs">[];
  activity: Tables<"activity_logs">[];
  statuses: Tables<"day_status">[];
  reviews: Tables<"daily_reviews">[];
  measurements: Tables<"body_measurements">[];
};

export function createPublicDemoSnapshot(now = new Date()): PublicDemoSnapshot {
  const endDate = localDateInTimezone(now, PUBLIC_DEMO_TIMEZONE);
  const startDate = format(addDays(parseISO(endDate), -(PUBLIC_DEMO_DAY_COUNT - 1)), "yyyy-MM-dd");
  const timestamp = `${endDate}T12:00:00.000Z`;
  const goal: GoalRow = {
    id: DEMO_GOAL_ID,
    user_id: DEMO_USER_ID,
    effective_from: startDate,
    effective_until: null,
    created_at: timestamp,
    ...DEMO_GOAL_VALUES,
  };
  const dataset = buildDemoDataset({
    userId: DEMO_USER_ID,
    timezone: PUBLIC_DEMO_TIMEZONE,
    endDate,
    goal,
    dayCount: PUBLIC_DEMO_DAY_COUNT,
  });
  const profile: Tables<"profiles"> = {
    id: DEMO_USER_ID,
    display_name: "Alex Morgan",
    timezone: PUBLIC_DEMO_TIMEZONE,
    preferred_unit_system: "metric",
    height_cm: 178,
    goal_weight_kg: 80,
    created_at: timestamp,
    updated_at: timestamp,
  };
  const meals = dataset.meals.map((row, index) => ({
    nutrition_external_id: null,
    quantity: 1,
    created_at: timestamp,
    updated_at: timestamp,
    ...row,
    id: row.id ?? `demo-meal-${index}`,
  })) as Tables<"meal_logs">[];
  const hydration = dataset.hydration.map((row, index) => ({
    created_at: timestamp,
    updated_at: timestamp,
    ...row,
    id: row.id ?? `demo-hydration-${index}`,
  })) as Tables<"hydration_logs">[];
  const activity = dataset.activity.map((row, index) => ({
    distance_km: null,
    estimated_calories_burned: null,
    created_at: timestamp,
    updated_at: timestamp,
    ...row,
    id: row.id ?? `demo-activity-${index}`,
  })) as Tables<"activity_logs">[];
  const statuses = dataset.statuses.map((row, index) => ({
    created_at: timestamp,
    updated_at: timestamp,
    ...row,
    id: row.id ?? `demo-status-${index}`,
  })) as Tables<"day_status">[];
  const reviews = dataset.reviews.map((row, index) => ({
    is_stale: false,
    updated_at: timestamp,
    ...row,
    id: row.id ?? `demo-review-${index}`,
  })) as Tables<"daily_reviews">[];
  const measurements = dataset.measurements.map((row, index) => ({
    created_at: timestamp,
    ...row,
    id: row.id ?? `demo-measurement-${index}`,
  })) as Tables<"body_measurements">[];

  return {
    startDate,
    endDate,
    timezone: PUBLIC_DEMO_TIMEZONE,
    profile,
    goals: [goal],
    meals,
    hydration,
    activity,
    statuses,
    reviews,
    measurements,
  };
}

export function clampPublicDemoDate(snapshot: PublicDemoSnapshot, requested?: string): string {
  if (!requested || !/^\d{4}-\d{2}-\d{2}$/.test(requested)) return snapshot.endDate;
  return requested >= snapshot.startDate && requested <= snapshot.endDate ? requested : snapshot.endDate;
}

export function getPublicDemoDayData(snapshot: PublicDemoSnapshot, localDate = snapshot.endDate): DayPageData {
  const meals = snapshot.meals.filter((row) => formatInTimeZone(row.eaten_at, snapshot.timezone, "yyyy-MM-dd") === localDate);
  const hydration = snapshot.hydration.filter((row) => formatInTimeZone(row.consumed_at, snapshot.timezone, "yyyy-MM-dd") === localDate);
  const activity = snapshot.activity.filter((row) => formatInTimeZone(row.occurred_at, snapshot.timezone, "yyyy-MM-dd") === localDate);
  const goal = goalForLocalDate(snapshot.goals, localDate);
  const timeline: TimelineItem[] = [
    ...meals.map((meal) => ({
      id: meal.id,
      kind: "meal" as const,
      occurredAt: meal.eaten_at,
      timeLabel: formatInTimeZone(meal.eaten_at, snapshot.timezone, "h:mm a"),
      title: meal.title,
      detail: mealDetail(meal),
      score: meal.meal_score,
      href: "/demo",
    })),
    ...hydration.map((drink) => ({
      id: drink.id,
      kind: "hydration" as const,
      occurredAt: drink.consumed_at,
      timeLabel: formatInTimeZone(drink.consumed_at, snapshot.timezone, "h:mm a"),
      title: drink.drink_type.replaceAll("_", " "),
      detail: `${drink.volume_ml} ml${drink.calories != null ? ` · ${Math.round(drink.calories)} kcal` : ""}`,
      score: null,
      href: "/demo",
    })),
    ...activity.map((entry) => ({
      id: entry.id,
      kind: "activity" as const,
      occurredAt: entry.occurred_at,
      timeLabel: formatInTimeZone(entry.occurred_at, snapshot.timezone, "h:mm a"),
      title: entry.activity_type.replaceAll("_", " "),
      detail: [entry.duration_minutes != null ? `${entry.duration_minutes} min` : null, entry.steps != null ? `${entry.steps.toLocaleString()} steps` : null].filter(Boolean).join(" · "),
      score: null,
      href: "/demo",
    })),
  ].sort((a, b) => parseISO(a.occurredAt).getTime() - parseISO(b.occurredAt).getTime());

  return {
    localDate,
    timezone: snapshot.timezone,
    profile: snapshot.profile,
    goal,
    goals: goalRowToTargets(goal),
    meals,
    hydration,
    activity,
    review: snapshot.reviews.find((row) => row.local_date === localDate) ?? null,
    status: snapshot.statuses.find((row) => row.local_date === localDate) ?? null,
    totals: totalsFromLogs(meals, hydration, activity),
    timeline,
  };
}

export function getPublicDemoPeriodDataset(snapshot: PublicDemoSnapshot, startDate: string, endDate: string): PeriodDataset {
  const dates = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) }).map((date) => format(date, "yyyy-MM-dd"));
  const mealsRows = snapshot.meals.filter((row) => {
    const date = formatInTimeZone(row.eaten_at, snapshot.timezone, "yyyy-MM-dd");
    return date >= startDate && date <= endDate;
  });
  const reviews = snapshot.reviews.filter((row) => row.local_date >= startDate && row.local_date <= endDate);
  const days = dates.flatMap<AnalyticsDay>((localDate) => {
    const meals = mealsRows.filter((row) => formatInTimeZone(row.eaten_at, snapshot.timezone, "yyyy-MM-dd") === localDate);
    const hydration = snapshot.hydration.filter((row) => formatInTimeZone(row.consumed_at, snapshot.timezone, "yyyy-MM-dd") === localDate);
    const activity = snapshot.activity.filter((row) => formatInTimeZone(row.occurred_at, snapshot.timezone, "yyyy-MM-dd") === localDate);
    const review = reviews.find((row) => row.local_date === localDate);
    const status = snapshot.statuses.find((row) => row.local_date === localDate);
    if (!meals.length && !hydration.length && !activity.length && !review && !status) return [];
    const targets = goalRowToTargets(goalForLocalDate(snapshot.goals, localDate));
    const totals = totalsFromLogs(meals, hydration, activity);
    return [{
      localDate,
      score: review?.score ?? null,
      confidence: (review?.confidence as ConfidenceLevel | undefined) ?? "insufficient",
      completed: status?.completed ?? false,
      calories: totals.calories,
      proteinG: totals.proteinG,
      proteinTargetG: targets.proteinTargetG,
      fiberG: totals.fiberG,
      fiberTargetG: targets.fiberTargetG,
      waterMl: totals.waterMl,
      waterTargetMl: targets.waterTargetMl,
      steps: totals.steps,
      stepTarget: targets.stepTarget,
      workoutCount: activity.filter((entry) => entry.activity_type !== "steps" && (entry.duration_minutes ?? 0) > 0).length,
      caloricDrinkCalories: hydration.filter((drink) => !["water", "sparkling_water"].includes(drink.drink_type)).reduce((sum, drink) => sum + (drink.calories ?? 0), 0),
    }];
  });
  const meals: AnalyticsMeal[] = mealsRows.map((meal) => {
    const localDate = formatInTimeZone(meal.eaten_at, snapshot.timezone, "yyyy-MM-dd");
    const goal = goalForLocalDate(snapshot.goals, localDate);
    const time = formatInTimeZone(meal.eaten_at, snapshot.timezone, "HH:mm");
    return {
      id: meal.id,
      localDate,
      sourceType: meal.source_type,
      calories: meal.calories,
      proteinG: meal.protein_g,
      eatenLocalTime: time,
      isLate: goal?.late_meal_time ? time >= goal.late_meal_time.slice(0, 5) : false,
    };
  });
  return { days, meals, reviews, goals: snapshot.goals };
}

export function getPublicDemoMeasurements(snapshot: PublicDemoSnapshot, startDate: string, endDate: string) {
  return snapshot.measurements.filter((measurement) => {
    const date = formatInTimeZone(measurement.measured_at, snapshot.timezone, "yyyy-MM-dd");
    return date >= startDate && date <= endDate;
  });
}
