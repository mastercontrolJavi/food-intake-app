import { addDays, format, parseISO } from "date-fns";
import { zonedDateTimeToUtc } from "@/lib/dates/timezone";
import { goalRowToTargets, type GoalRow } from "@/lib/data/mappers";
import { SCORING_ALGORITHM_VERSION, scoreDay, scoreMeal, type NutritionTotals } from "@/lib/scoring";
import type { Database, Json } from "@/types/database";

type Insert<Table extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][Table]["Insert"];

export const DEMO_MARKER = "intake-demo:v1";

export const DEMO_GOAL_VALUES = {
  primary_goal: "maintain",
  calorie_target: 2200,
  protein_target_g: 160,
  carbs_target_g: 240,
  fat_target_g: 70,
  fiber_target_g: 30,
  sodium_limit_mg: 2300,
  added_sugar_limit_g: 36,
  water_target_ml: 2800,
  step_target: 10000,
  weekly_workout_target: 4,
  late_meal_time: "20:00",
} as const;

const round = (value: number) => Math.round(value * 10) / 10;
const asJson = (value: unknown): Json => JSON.parse(JSON.stringify(value)) as Json;

type MealTemplate = {
  title: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  hour: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

const baseMeals: MealTemplate[] = [
  { title: "Greek yogurt, berries and oats", mealType: "breakfast", hour: "08:15", calories: 420, proteinG: 32, carbsG: 50, fatG: 10, fiberG: 8 },
  { title: "Chicken rice bowl with vegetables", mealType: "lunch", hour: "13:10", calories: 680, proteinG: 55, carbsG: 72, fatG: 18, fiberG: 9 },
  { title: "Salmon, potatoes and greens", mealType: "dinner", hour: "19:15", calories: 720, proteinG: 48, carbsG: 60, fatG: 28, fiberG: 10 },
  { title: "Protein shake and banana", mealType: "snack", hour: "16:30", calories: 320, proteinG: 35, carbsG: 32, fatG: 8, fiberG: 5 },
];

export type DemoDataset = {
  meals: Insert<"meal_logs">[];
  hydration: Insert<"hydration_logs">[];
  activity: Insert<"activity_logs">[];
  statuses: Insert<"day_status">[];
  reviews: Insert<"daily_reviews">[];
  measurements: Insert<"body_measurements">[];
  customFoods: Insert<"custom_foods">[];
  savedMeals: Insert<"saved_meals">[];
};

export function buildDemoDataset({ userId, timezone, endDate, goal, dayCount = 35 }: {
  userId: string;
  timezone: string;
  endDate: string;
  goal: GoalRow;
  dayCount?: number;
}): DemoDataset {
  const normalizedDayCount = Math.max(1, Math.floor(dayCount));
  const targets = goalRowToTargets(goal);
  const meals: Insert<"meal_logs">[] = [];
  const hydration: Insert<"hydration_logs">[] = [];
  const activity: Insert<"activity_logs">[] = [];
  const statuses: Insert<"day_status">[] = [];
  const reviews: Insert<"daily_reviews">[] = [];
  const measurements: Insert<"body_measurements">[] = [];

  for (let offset = normalizedDayCount - 1; offset >= 0; offset -= 1) {
    const localDate = format(addDays(parseISO(endDate), -offset), "yyyy-MM-dd");
    const sequence = normalizedDayCount - 1 - offset;
    const weekend = [0, 6].includes(new Date(`${localDate}T12:00:00`).getDay());
    const lowAdherence = sequence % 9 === 3 || sequence % 11 === 5;
    const factor = lowAdherence ? 0.83 : sequence % 7 === 1 ? 1.08 : 0.98 + (sequence % 4) * 0.015;
    const dayTemplates = lowAdherence ? baseMeals.slice(0, 3) : baseMeals;
    let totals: NutritionTotals = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, waterMl: 0, steps: 0 };

    dayTemplates.forEach((template, index) => {
      const restaurantMeal = weekend && index === 2;
      const takeoutMeal = sequence % 8 === 2 && index === 1;
      const fastFoodMeal = sequence % 13 === 4 && index === 2;
      const mealFactor = restaurantMeal ? factor * 1.2 : fastFoodMeal ? factor * 1.28 : factor;
      const dinnerLate = index === 2 && sequence % 5 === 0;
      const nutrition = {
        calories: round(template.calories * mealFactor),
        proteinG: round(template.proteinG * (restaurantMeal || fastFoodMeal ? factor * 0.88 : factor)),
        carbsG: round(template.carbsG * mealFactor),
        fatG: round(template.fatG * (restaurantMeal || fastFoodMeal ? mealFactor * 1.15 : mealFactor)),
        fiberG: round(template.fiberG * (restaurantMeal || fastFoodMeal ? factor * 0.72 : factor)),
        waterMl: null,
        steps: null,
      };
      const scored = scoreMeal(nutrition, targets);
      const sourceType = restaurantMeal ? "restaurant" : takeoutMeal ? "takeout" : fastFoodMeal ? "fast_food" : "home";
      meals.push({
        user_id: userId,
        eaten_at: zonedDateTimeToUtc(`${localDate}T${dinnerLate ? "21:20" : template.hour}`, timezone).toISOString(),
        meal_type: template.mealType,
        source_type: sourceType,
        title: restaurantMeal ? "Restaurant dinner plate" : takeoutMeal ? "Takeout chicken bowl" : fastFoodMeal ? "Fast-food dinner" : template.title,
        raw_description: template.title,
        restaurant_name: restaurantMeal ? "Demo Bistro" : takeoutMeal ? "Demo Kitchen" : fastFoodMeal ? "Demo Grill" : null,
        portion_description: "1 serving",
        calories: nutrition.calories,
        protein_g: nutrition.proteinG,
        carbs_g: nutrition.carbsG,
        fat_g: nutrition.fatG,
        fiber_g: nutrition.fiberG,
        sodium_mg: round((restaurantMeal || fastFoodMeal ? 850 : 430) * mealFactor),
        added_sugar_g: template.mealType === "snack" ? 5 : 2,
        nutrition_source: "manual",
        nutrition_confidence: "high",
        meal_score: scored.score,
        score_breakdown: asJson(scored.metrics),
        notes: DEMO_MARKER,
      });
      totals = {
        ...totals,
        calories: (totals.calories ?? 0) + nutrition.calories,
        proteinG: (totals.proteinG ?? 0) + nutrition.proteinG,
        carbsG: (totals.carbsG ?? 0) + nutrition.carbsG,
        fatG: (totals.fatG ?? 0) + nutrition.fatG,
        fiberG: (totals.fiberG ?? 0) + nutrition.fiberG,
      };
    });

    const waterTotal = lowAdherence ? 1500 + (sequence % 3) * 200 : 2500 + (sequence % 4) * 200;
    ["09:30", "14:30", "19:00"].forEach((hour, index) => {
      const volume = index < 2 ? Math.floor(waterTotal / 3) : waterTotal - Math.floor(waterTotal / 3) * 2;
      hydration.push({ user_id: userId, consumed_at: zonedDateTimeToUtc(`${localDate}T${hour}`, timezone).toISOString(), drink_type: index === 2 && sequence % 10 === 4 ? "sparkling_water" : "water", volume_ml: volume, calories: 0, notes: DEMO_MARKER });
    });
    if (sequence % 6 === 2) {
      hydration.push({ user_id: userId, consumed_at: zonedDateTimeToUtc(`${localDate}T12:20`, timezone).toISOString(), drink_type: "juice", volume_ml: 300, calories: 140, notes: DEMO_MARKER });
      totals.calories = (totals.calories ?? 0) + 140;
    }
    totals.waterMl = waterTotal;

    const steps = lowAdherence ? 4200 + sequence * 31 : 8400 + (sequence % 6) * 650;
    activity.push({ user_id: userId, occurred_at: zonedDateTimeToUtc(`${localDate}T20:30`, timezone).toISOString(), activity_type: "steps", steps, notes: DEMO_MARKER });
    totals.steps = steps;
    if (sequence % 3 === 0) activity.push({ user_id: userId, occurred_at: zonedDateTimeToUtc(`${localDate}T18:00`, timezone).toISOString(), activity_type: sequence % 2 ? "running" : "weights", duration_minutes: 42 + (sequence % 4) * 5, intensity: "moderate", notes: DEMO_MARKER });

    const reviewed = scoreDay(totals, targets);
    const completedAt = zonedDateTimeToUtc(`${localDate}T23:00`, timezone).toISOString();
    statuses.push({ user_id: userId, local_date: localDate, completed: true, completed_at: completedAt, updated_at: completedAt });
    reviews.push({
      user_id: userId,
      local_date: localDate,
      goal_id: goal.id,
      score: reviewed.score,
      grade: reviewed.grade,
      confidence: reviewed.confidence,
      coverage_ratio: reviewed.coverageRatio,
      scoring_algorithm_version: SCORING_ALGORITHM_VERSION,
      goal_snapshot: asJson(targets),
      metric_scores: asJson(reviewed.metrics),
      daily_totals: asJson(totals),
      top_strength: reviewed.topStrength,
      top_opportunity: reviewed.topOpportunity,
      generated_summary: reviewed.summary,
      completed_at: completedAt,
      updated_at: completedAt,
    });

    if (sequence % 7 === 0) measurements.push({ user_id: userId, measured_at: zonedDateTimeToUtc(`${localDate}T07:30`, timezone).toISOString(), weight_kg: round(82.4 - sequence * 0.025 + (sequence % 3) * 0.08), body_fat_pct: round(22.1 - sequence * 0.012), waist_cm: round(91.5 - sequence * 0.035), notes: DEMO_MARKER });
  }

  return {
    meals,
    hydration,
    activity,
    statuses,
    reviews,
    measurements,
    customFoods: [{ user_id: userId, name: "Demo protein shake", serving_description: "1 shaker", calories: 390, protein_g: 46, carbs_g: 31, fat_g: 10, fiber_g: 7, sodium_mg: 280, added_sugar_g: 4, is_favorite: true }],
    savedMeals: [{ user_id: userId, title: "Demo chicken rice bowl", source_type: "home", portion_description: "1 bowl", calories: 680, protein_g: 55, carbs_g: 72, fat_g: 18, fiber_g: 9, sodium_mg: 430, added_sugar_g: 2, is_favorite: true, use_count: 8 }],
  };
}
