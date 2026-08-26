import { eachDayOfInterval, format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";
import { dayRangeUtc } from "@/lib/dates/timezone";
import type { AnalyticsDay, AnalyticsMeal } from "@/lib/analytics";
import { goalForLocalDate, goalRowToTargets } from "./mappers";
import { totalsFromLogs } from "./day";

export type PeriodDataset = {
  days: AnalyticsDay[];
  meals: AnalyticsMeal[];
  reviews: Tables<"daily_reviews">[];
  goals: Tables<"user_goals">[];
};

export async function getPeriodDataset(
  supabase: SupabaseClient<Database>, userId: string, timezone: string, startDate: string, endDate: string,
): Promise<PeriodDataset> {
  const start = dayRangeUtc(startDate, timezone).start;
  const end = dayRangeUtc(endDate, timezone).end;
  const [goalsResult, mealsResult, hydrationResult, activityResult, reviewsResult, statusResult] = await Promise.all([
    supabase.from("user_goals").select("*").eq("user_id", userId).lte("effective_from", endDate).or(`effective_until.is.null,effective_until.gt.${startDate}`).order("effective_from"),
    supabase.from("meal_logs").select("*").eq("user_id", userId).gte("eaten_at", start.toISOString()).lt("eaten_at", end.toISOString()).order("eaten_at"),
    supabase.from("hydration_logs").select("*").eq("user_id", userId).gte("consumed_at", start.toISOString()).lt("consumed_at", end.toISOString()),
    supabase.from("activity_logs").select("*").eq("user_id", userId).gte("occurred_at", start.toISOString()).lt("occurred_at", end.toISOString()),
    supabase.from("daily_reviews").select("*").eq("user_id", userId).gte("local_date", startDate).lte("local_date", endDate),
    supabase.from("day_status").select("*").eq("user_id", userId).gte("local_date", startDate).lte("local_date", endDate),
  ]);
  for (const result of [goalsResult, mealsResult, hydrationResult, activityResult, reviewsResult, statusResult]) if (result.error) throw result.error;
  const goals = goalsResult.data ?? [];
  const mealsRows = mealsResult.data ?? [];
  const hydrationRows = hydrationResult.data ?? [];
  const activityRows = activityResult.data ?? [];
  const reviews = reviewsResult.data ?? [];
  const statuses = statusResult.data ?? [];

  const dates = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) }).map((date) => format(date, "yyyy-MM-dd"));
  const days = dates.flatMap<AnalyticsDay>((localDate) => {
    const meals = mealsRows.filter((row) => formatInTimeZone(row.eaten_at, timezone, "yyyy-MM-dd") === localDate);
    const hydration = hydrationRows.filter((row) => formatInTimeZone(row.consumed_at, timezone, "yyyy-MM-dd") === localDate);
    const activity = activityRows.filter((row) => formatInTimeZone(row.occurred_at, timezone, "yyyy-MM-dd") === localDate);
    const review = reviews.find((row) => row.local_date === localDate);
    const status = statuses.find((row) => row.local_date === localDate);
    if (!meals.length && !hydration.length && !activity.length && !review && !status) return [];
    const targets = goalRowToTargets(goalForLocalDate(goals, localDate));
    const totals = totalsFromLogs(meals, hydration, activity);
    return [{
      localDate, score: review?.score ?? null, confidence: (review?.confidence as AnalyticsDay["confidence"] | undefined) ?? "insufficient",
      completed: status?.completed ?? false, calories: totals.calories, proteinG: totals.proteinG,
      proteinTargetG: targets.proteinTargetG, fiberG: totals.fiberG, fiberTargetG: targets.fiberTargetG,
      waterMl: totals.waterMl, waterTargetMl: targets.waterTargetMl,
      steps: totals.steps, stepTarget: targets.stepTarget,
      workoutCount: activity.filter((entry) => entry.activity_type !== "steps" && (entry.duration_minutes ?? 0) > 0).length,
      caloricDrinkCalories: hydration.filter((drink) => !["water", "sparkling_water"].includes(drink.drink_type)).reduce((sum, drink) => sum + (drink.calories ?? 0), 0),
    }];
  });

  const meals: AnalyticsMeal[] = mealsRows.map((meal) => {
    const localDate = formatInTimeZone(meal.eaten_at, timezone, "yyyy-MM-dd");
    const goal = goalForLocalDate(goals, localDate);
    const time = formatInTimeZone(meal.eaten_at, timezone, "HH:mm");
    return { id: meal.id, localDate, sourceType: meal.source_type, calories: meal.calories, proteinG: meal.protein_g, eatenLocalTime: time, isLate: goal?.late_meal_time ? time >= goal.late_meal_time.slice(0, 5) : false };
  });
  return { days, meals, reviews, goals };
}
