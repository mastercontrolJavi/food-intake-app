import { roundTo } from "@/lib/format/number";

export const NUTRITION_FIELDS = ["calories", "proteinG", "carbsG", "fatG", "fiberG", "sodiumMg", "addedSugarG"] as const;
export type NutritionField = (typeof NUTRITION_FIELDS)[number];
export type NutritionValues = Record<NutritionField, number | null>;

/** meal_logs stores nutrition as numeric(9,2)/numeric(10,2) and quantity as numeric(8,3). */
export const NUTRITION_DECIMALS = 2;
export const QUANTITY_DECIMALS = 3;
/** Largest total the numeric(9,2) nutrition columns can hold. */
export const MAX_NUTRITION_TOTAL = 9_999_999;
/** Per-unit precision kept when splitting a stored total back out for editing. */
const PER_UNIT_DECIMALS = 4;

function mapValues(values: NutritionValues, transform: (value: number) => number): NutritionValues {
  return Object.fromEntries(
    NUTRITION_FIELDS.map((field) => [field, values[field] == null ? null : transform(values[field])]),
  ) as NutritionValues;
}

/** Turns the per-unit nutrition a user entered into the totals actually eaten. */
export function scaleNutrition(perUnit: NutritionValues, quantity: number): NutritionValues {
  return mapValues(perUnit, (value) => roundTo(value * quantity, NUTRITION_DECIMALS));
}

/** Inverse of {@link scaleNutrition}, used to prefill the form when editing a stored log. */
export function unscaleNutrition(totals: NutritionValues, quantity: number): NutritionValues {
  if (!(quantity > 0)) return totals;
  return mapValues(totals, (value) => roundTo(value / quantity, PER_UNIT_DECIMALS));
}

/** Guards against totals the nutrition columns cannot store, so the user sees a message instead of a database error. */
export function nutritionWithinLimits(values: NutritionValues): boolean {
  return NUTRITION_FIELDS.every((field) => (values[field] ?? 0) <= MAX_NUTRITION_TOTAL);
}
