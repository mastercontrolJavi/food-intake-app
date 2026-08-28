import { z } from "zod";
import { roundTo } from "@/lib/format/number";
import { NUTRITION_DECIMALS, QUANTITY_DECIMALS } from "@/lib/nutrition/quantity";

/**
 * Every numeric input is rounded to the precision of the column behind it. Decimals are
 * accepted everywhere they make sense, but Postgres never has to round (or reject, for the
 * integer columns) a value the user was already shown.
 */
const nullableNumber = (decimals: number, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) => z.preprocess(
  (value) => value === "" || value == null ? null : roundTo(Number(value), decimals),
  z.number().min(minimum).max(maximum).nullable(),
);

const requiredNumber = (decimals: number, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) => z.preprocess(
  (value) => roundTo(Number(value), decimals),
  z.number().min(minimum).max(maximum),
);

/** numeric(9,2) and numeric(10,2) nutrition columns. */
const nutritionNumber = () => nullableNumber(NUTRITION_DECIMALS, 0, 1_000_000);

export const mealSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(160),
  eatenAt: z.string().min(1),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "other"]).nullable(),
  sourceType: z.enum(["home", "restaurant", "takeout", "fast_food", "packaged", "snack", "other"]).nullable(),
  restaurantName: z.string().trim().max(160).nullable(),
  portionDescription: z.string().trim().max(160).nullable(),
  quantity: requiredNumber(QUANTITY_DECIMALS, 0.001, 1000),
  nutritionSource: z.enum(["manual", "custom_food", "saved_meal", "repeat", "usda", "unknown"]),
  nutritionExternalId: z.string().trim().max(160).nullable(),
  savedMealId: z.string().uuid().nullable(),
  calories: nutritionNumber(), proteinG: nutritionNumber(), carbsG: nutritionNumber(), fatG: nutritionNumber(),
  fiberG: nutritionNumber(), sodiumMg: nutritionNumber(), addedSugarG: nutritionNumber(),
  notes: z.string().trim().max(2000).nullable(),
  saveForRepeat: z.boolean().default(false),
});

export const hydrationSchema = z.object({
  id: z.string().uuid().optional(),
  consumedAt: z.string().min(1),
  drinkType: z.enum(["water", "sparkling_water", "coffee", "tea", "soda", "juice", "energy_drink", "milk", "sports_drink", "alcoholic_drink", "other"]),
  volumeMl: requiredNumber(0, 1, 20_000),
  calories: nutritionNumber(),
  notes: z.string().trim().max(1000).nullable(),
});

export const activitySchema = z.object({
  id: z.string().uuid().optional(),
  occurredAt: z.string().min(1),
  activityType: z.enum(["steps", "walking", "running", "gym", "weights", "cycling", "sport", "hiking", "swimming", "other"]),
  durationMinutes: nullableNumber(0, 0, 1440),
  steps: nullableNumber(0, 0, 1_000_000),
  distanceKm: nullableNumber(3, 0, 10_000),
  estimatedCaloriesBurned: nullableNumber(2, 0, 100_000),
  intensity: z.enum(["low", "moderate", "high"]).nullable(),
  notes: z.string().trim().max(1000).nullable(),
}).refine((value) => value.durationMinutes != null || value.steps != null || value.distanceKm != null || value.estimatedCaloriesBurned != null, { message: "Add at least one activity measurement." });

export const goalsSchema = z.object({
  effectiveFrom: z.iso.date(),
  primaryGoal: z.enum(["maintain", "lose", "gain", "performance", "custom"]),
  calorieTarget: nullableNumber(2, 1), proteinTargetG: nullableNumber(2, 1), carbsTargetG: nullableNumber(2, 1),
  fatTargetG: nullableNumber(2, 1), fiberTargetG: nullableNumber(2, 1), sodiumLimitMg: nullableNumber(2, 1),
  addedSugarLimitG: nullableNumber(2, 1), waterTargetMl: nullableNumber(0, 1), stepTarget: nullableNumber(0, 1),
  weeklyWorkoutTarget: nullableNumber(0, 1, 21),
  lateMealTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).nullable(),
  timezone: z.string().min(1).max(80),
  preferredUnitSystem: z.enum(["metric", "imperial"]),
  heightCm: nullableNumber(2, 50, 300),
  goalWeightKg: nullableNumber(2, 20, 500),
});

export const measurementSchema = z.object({
  measuredAt: z.string().min(1),
  weightKg: nullableNumber(2, 20, 500),
  bodyFatPct: nullableNumber(2, 1, 75),
  waistCm: nullableNumber(2, 20, 300),
  notes: z.string().trim().max(1000).nullable(),
}).refine((value) => value.weightKg != null || value.bodyFatPct != null || value.waistCm != null, { message: "Add at least one measurement." });

export const customFoodSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  servingDescription: z.string().trim().max(160).nullable(),
  calories: nutritionNumber(), proteinG: nutritionNumber(), carbsG: nutritionNumber(), fatG: nutritionNumber(),
  fiberG: nutritionNumber(), sodiumMg: nutritionNumber(), addedSugarG: nutritionNumber(),
  isFavorite: z.boolean().default(false),
});

export function formString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  return value.trim() === "" ? null : value;
}

/**
 * Reads an optional <Select>, whose "not specified" choice submits the literal "none".
 * Free-text fields use formString so a note or restaurant actually called "none" survives.
 */
export function formSelect(formData: FormData, key: string): string | null {
  const value = formString(formData, key);
  return value === "none" ? null : value;
}

export function formBoolean(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}
