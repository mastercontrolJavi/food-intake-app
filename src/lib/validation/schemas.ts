import { z } from "zod";

const nullableNumber = (minimum = 0, maximum = Number.MAX_SAFE_INTEGER) => z.preprocess(
  (value) => value === "" || value == null ? null : Number(value),
  z.number().min(minimum).max(maximum).nullable(),
);

const requiredNumber = (minimum = 0, maximum = Number.MAX_SAFE_INTEGER) => z.preprocess(
  (value) => Number(value),
  z.number().min(minimum).max(maximum),
);

export const mealSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(160),
  eatenAt: z.string().min(1),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "other"]).nullable(),
  sourceType: z.enum(["home", "restaurant", "takeout", "fast_food", "packaged", "snack", "other"]).nullable(),
  restaurantName: z.string().trim().max(160).nullable(),
  portionDescription: z.string().trim().max(160).nullable(),
  quantity: requiredNumber(0.001, 1000),
  nutritionSource: z.enum(["manual", "custom_food", "saved_meal", "repeat", "usda", "unknown"]),
  nutritionExternalId: z.string().trim().max(160).nullable(),
  calories: nullableNumber(), proteinG: nullableNumber(), carbsG: nullableNumber(), fatG: nullableNumber(),
  fiberG: nullableNumber(), sodiumMg: nullableNumber(), addedSugarG: nullableNumber(),
  notes: z.string().trim().max(2000).nullable(),
  saveForRepeat: z.boolean().default(false),
});

export const hydrationSchema = z.object({
  id: z.string().uuid().optional(),
  consumedAt: z.string().min(1),
  drinkType: z.enum(["water", "sparkling_water", "coffee", "tea", "soda", "juice", "energy_drink", "milk", "sports_drink", "alcoholic_drink", "other"]),
  volumeMl: requiredNumber(1, 20_000),
  calories: nullableNumber(),
  notes: z.string().trim().max(1000).nullable(),
});

export const activitySchema = z.object({
  id: z.string().uuid().optional(),
  occurredAt: z.string().min(1),
  activityType: z.enum(["steps", "walking", "running", "gym", "weights", "cycling", "sport", "hiking", "swimming", "other"]),
  durationMinutes: nullableNumber(0, 1440),
  steps: nullableNumber(0, 1_000_000),
  distanceKm: nullableNumber(0, 10_000),
  estimatedCaloriesBurned: nullableNumber(0, 100_000),
  intensity: z.enum(["low", "moderate", "high"]).nullable(),
  notes: z.string().trim().max(1000).nullable(),
}).refine((value) => value.durationMinutes != null || value.steps != null || value.distanceKm != null || value.estimatedCaloriesBurned != null, { message: "Add at least one activity measurement." });

export const goalsSchema = z.object({
  effectiveFrom: z.iso.date(),
  primaryGoal: z.enum(["maintain", "lose", "gain", "performance", "custom"]),
  calorieTarget: nullableNumber(1), proteinTargetG: nullableNumber(1), carbsTargetG: nullableNumber(1),
  fatTargetG: nullableNumber(1), fiberTargetG: nullableNumber(1), sodiumLimitMg: nullableNumber(1),
  addedSugarLimitG: nullableNumber(1), waterTargetMl: nullableNumber(1), stepTarget: nullableNumber(1),
  weeklyWorkoutTarget: nullableNumber(1, 21),
  lateMealTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).nullable(),
  timezone: z.string().min(1).max(80),
  preferredUnitSystem: z.enum(["metric", "imperial"]),
  heightCm: nullableNumber(50, 300),
  goalWeightKg: nullableNumber(20, 500),
});

export const measurementSchema = z.object({
  measuredAt: z.string().min(1),
  weightKg: nullableNumber(20, 500),
  bodyFatPct: nullableNumber(1, 75),
  waistCm: nullableNumber(20, 300),
  notes: z.string().trim().max(1000).nullable(),
}).refine((value) => value.weightKg != null || value.bodyFatPct != null || value.waistCm != null, { message: "Add at least one measurement." });

export const customFoodSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  servingDescription: z.string().trim().max(160).nullable(),
  calories: nullableNumber(), proteinG: nullableNumber(), carbsG: nullableNumber(), fatG: nullableNumber(),
  fiberG: nullableNumber(), sodiumMg: nullableNumber(), addedSugarG: nullableNumber(),
  isFavorite: z.boolean().default(false),
});

export function formString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  return value.trim() === "" || value === "none" ? null : value;
}

export function formBoolean(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}
