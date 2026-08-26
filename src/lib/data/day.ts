import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dayRangeUtc, localDateInTimezone } from "@/lib/dates/timezone";
import { goalRowToTargets } from "./mappers";
import type { Database, Tables } from "@/types/database";
import type { NutritionTotals } from "@/lib/scoring";

export type TimelineItem = {
  id: string;
  kind: "meal" | "hydration" | "activity";
  occurredAt: string;
  timeLabel: string;
  title: string;
  detail: string;
  score: number | null;
  href: string;
};

export type DayPageData = {
  localDate: string;
  timezone: string;
  profile: Tables<"profiles">;
  goal: Tables<"user_goals"> | null;
  goals: ReturnType<typeof goalRowToTargets>;
  meals: Tables<"meal_logs">[];
  hydration: Tables<"hydration_logs">[];
  activity: Tables<"activity_logs">[];
  review: Tables<"daily_reviews"> | null;
  status: Tables<"day_status"> | null;
  totals: NutritionTotals;
  timeline: TimelineItem[];
};

export async function ensureProfile(supabase: SupabaseClient<Database>, userId: string) {
  const { data: existing, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (existing) return existing;
  const { data, error: insertError } = await supabase.from("profiles").upsert({ id: userId, timezone: "UTC" }, { onConflict: "id" }).select("*").single();
  if (insertError) throw insertError;
  return data;
}

export async function getGoalForDate(supabase: SupabaseClient<Database>, userId: string, localDate: string) {
  const { data, error } = await supabase.from("user_goals").select("*")
    .eq("user_id", userId).lte("effective_from", localDate)
    .or(`effective_until.is.null,effective_until.gt.${localDate}`)
    .order("effective_from", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

function sumComplete<T>(rows: T[], getter: (row: T) => number | null): number | null {
  if (!rows.length) return null;
  const values = rows.map(getter);
  if (values.some((value) => value == null)) return null;
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

export function totalsFromLogs(
  meals: Tables<"meal_logs">[], hydration: Tables<"hydration_logs">[], activity: Tables<"activity_logs">[],
): NutritionTotals {
  const mealCalories = sumComplete(meals, (meal) => meal.calories);
  const drinkCalories = hydration.map((drink) => {
    if (drink.calories != null) return drink.calories;
    return ["water", "sparkling_water"].includes(drink.drink_type) ? 0 : null;
  });
  const drinksKnown = drinkCalories.every((value) => value != null);
  const hasCalories = meals.length > 0 || hydration.some((drink) => !["water", "sparkling_water"].includes(drink.drink_type));
  const calories = hasCalories && mealCalories !== null && drinksKnown
    ? mealCalories + drinkCalories.reduce<number>((sum, value) => sum + (value ?? 0), 0)
    : hasCalories && meals.length === 0 && drinksKnown
      ? drinkCalories.reduce<number>((sum, value) => sum + (value ?? 0), 0)
      : null;
  const qualifyingWater = hydration.filter((drink) => ["water", "sparkling_water"].includes(drink.drink_type));
  const stepEntries = activity.filter((entry) => entry.steps != null);
  return {
    calories,
    proteinG: sumComplete(meals, (meal) => meal.protein_g),
    carbsG: sumComplete(meals, (meal) => meal.carbs_g),
    fatG: sumComplete(meals, (meal) => meal.fat_g),
    fiberG: sumComplete(meals, (meal) => meal.fiber_g),
    waterMl: qualifyingWater.length ? qualifyingWater.reduce((sum, drink) => sum + drink.volume_ml, 0) : null,
    steps: stepEntries.length ? stepEntries.reduce((sum, entry) => sum + (entry.steps ?? 0), 0) : null,
  };
}

export async function getDayPageData(supabase: SupabaseClient<Database>, userId: string, localDate?: string): Promise<DayPageData> {
  const profile = await ensureProfile(supabase, userId);
  const date = localDate ?? localDateInTimezone(new Date(), profile.timezone);
  const { start, end } = dayRangeUtc(date, profile.timezone);
  const [goal, mealsResult, hydrationResult, activityResult, reviewResult, statusResult] = await Promise.all([
    getGoalForDate(supabase, userId, date),
    supabase.from("meal_logs").select("*").eq("user_id", userId).gte("eaten_at", start.toISOString()).lt("eaten_at", end.toISOString()).order("eaten_at"),
    supabase.from("hydration_logs").select("*").eq("user_id", userId).gte("consumed_at", start.toISOString()).lt("consumed_at", end.toISOString()).order("consumed_at"),
    supabase.from("activity_logs").select("*").eq("user_id", userId).gte("occurred_at", start.toISOString()).lt("occurred_at", end.toISOString()).order("occurred_at"),
    supabase.from("daily_reviews").select("*").eq("user_id", userId).eq("local_date", date).maybeSingle(),
    supabase.from("day_status").select("*").eq("user_id", userId).eq("local_date", date).maybeSingle(),
  ]);
  for (const result of [mealsResult, hydrationResult, activityResult, reviewResult, statusResult]) if (result.error) throw result.error;
  const meals = mealsResult.data ?? [];
  const hydration = hydrationResult.data ?? [];
  const activity = activityResult.data ?? [];
  const timeline: TimelineItem[] = [
    ...meals.map((meal) => ({ id: meal.id, kind: "meal" as const, occurredAt: meal.eaten_at, timeLabel: formatInTimeZone(meal.eaten_at, profile.timezone, "h:mm a"), title: meal.title, detail: [meal.calories != null ? `${Math.round(meal.calories)} kcal` : null, meal.protein_g != null ? `${Math.round(meal.protein_g)}g protein` : null].filter(Boolean).join(" · ") || "Nutrition not entered", score: meal.meal_score, href: `/log/food?id=${meal.id}` })),
    ...hydration.map((drink) => ({ id: drink.id, kind: "hydration" as const, occurredAt: drink.consumed_at, timeLabel: formatInTimeZone(drink.consumed_at, profile.timezone, "h:mm a"), title: drink.drink_type.replaceAll("_", " "), detail: `${drink.volume_ml} ml${drink.calories != null ? ` · ${Math.round(drink.calories)} kcal` : ""}`, score: null, href: `/log/water?id=${drink.id}` })),
    ...activity.map((entry) => ({ id: entry.id, kind: "activity" as const, occurredAt: entry.occurred_at, timeLabel: formatInTimeZone(entry.occurred_at, profile.timezone, "h:mm a"), title: entry.activity_type.replaceAll("_", " "), detail: [entry.duration_minutes != null ? `${entry.duration_minutes} min` : null, entry.steps != null ? `${entry.steps.toLocaleString()} steps` : null].filter(Boolean).join(" · "), score: null, href: `/log/activity?id=${entry.id}` })),
  ].sort((a, b) => parseISO(a.occurredAt).getTime() - parseISO(b.occurredAt).getTime());
  return { localDate: date, timezone: profile.timezone, profile, goal, goals: goalRowToTargets(goal), meals, hydration, activity, review: reviewResult.data, status: statusResult.data, totals: totalsFromLogs(meals, hydration, activity), timeline };
}

export function formatDayHeading(localDate: string): string {
  return format(new Date(`${localDate}T12:00:00`), "EEEE, MMMM d");
}
