import { describe, expect, it } from "vitest";
import { formatAmount, roundTo } from "@/lib/format/number";
import { NUTRITION_FIELDS, nutritionWithinLimits, scaleNutrition, unscaleNutrition } from "@/lib/nutrition/quantity";
import { mealDetail } from "@/lib/data/day";
import { mealSchema } from "@/lib/validation/schemas";

const perUnit = (overrides: Partial<Record<(typeof NUTRITION_FIELDS)[number], number | null>> = {}) => ({
  calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6, fiberG: null, sodiumMg: 74, addedSugarG: null,
  ...overrides,
});

const mealFormValues = (overrides: Record<string, string> = {}) => ({
  title: "Chicken breast", eatenAt: "2026-08-28T12:30", mealType: null, sourceType: null,
  restaurantName: null, portionDescription: null, quantity: "1", nutritionSource: "manual",
  nutritionExternalId: null, savedMealId: null, calories: null, proteinG: null, carbsG: null,
  fatG: null, fiberG: null, sodiumMg: null, addedSugarG: null, notes: null, saveForRepeat: false,
  ...overrides,
});

describe("meal quantity", () => {
  it("multiplies the per-unit nutrition by the logged quantity", () => {
    const totals = scaleNutrition(perUnit(), 5);
    expect(totals.calories).toBe(825);
    expect(totals.proteinG).toBe(155);
    expect(totals.fatG).toBe(18);
    expect(totals.sodiumMg).toBe(370);
  });

  it("leaves nutrition the user did not enter unknown rather than zero", () => {
    const totals = scaleNutrition(perUnit(), 5);
    expect(totals.fiberG).toBeNull();
    expect(totals.addedSugarG).toBeNull();
    expect(totals.carbsG).toBe(0);
  });

  it("handles fractional quantities", () => {
    expect(scaleNutrition(perUnit({ calories: 210 }), 0.5).calories).toBe(105);
    expect(scaleNutrition(perUnit({ calories: 210 }), 1.5).calories).toBe(315);
  });

  it("rounds totals to the two decimals the nutrition columns store", () => {
    expect(scaleNutrition(perUnit({ calories: 33.333 }), 3).calories).toBe(100);
    expect(scaleNutrition(perUnit({ calories: 0.125 }), 1).calories).toBe(0.13);
  });

  it("splits a stored total back into per-unit values for editing", () => {
    const totals = scaleNutrition(perUnit(), 5);
    const editing = unscaleNutrition(totals, 5);
    expect(editing.calories).toBe(165);
    expect(editing.proteinG).toBe(31);
    expect(editing.fatG).toBe(3.6);
    expect(editing.fiberG).toBeNull();
  });

  it("round-trips an edit without drifting the stored total", () => {
    const totals = scaleNutrition(perUnit({ calories: 100 }), 3);
    expect(scaleNutrition(unscaleNutrition(totals, 3), 3).calories).toBe(totals.calories);
  });

  it("rejects totals too large for the nutrition columns", () => {
    expect(nutritionWithinLimits(scaleNutrition(perUnit({ calories: 900_000 }), 1000))).toBe(false);
    expect(nutritionWithinLimits(scaleNutrition(perUnit(), 1000))).toBe(true);
  });
});

describe("mealSchema", () => {
  it("accepts decimal nutrition and rounds it to the stored precision", () => {
    const parsed = mealSchema.parse(mealFormValues({ proteinG: "12.345", fatG: "0.25", calories: "0.4" }));
    expect(parsed.proteinG).toBe(12.35);
    expect(parsed.fatG).toBe(0.25);
    expect(parsed.calories).toBe(0.4);
  });

  it("accepts a decimal quantity and rounds it to the stored precision", () => {
    expect(mealSchema.parse(mealFormValues({ quantity: "1.5" })).quantity).toBe(1.5);
    expect(mealSchema.parse(mealFormValues({ quantity: "0.3333" })).quantity).toBe(0.333);
  });

  it("rejects a quantity outside the supported range", () => {
    expect(mealSchema.safeParse(mealFormValues({ quantity: "0" })).success).toBe(false);
    expect(mealSchema.safeParse(mealFormValues({ quantity: "1001" })).success).toBe(false);
  });
});

describe("display formatting", () => {
  it("keeps a decimal on small amounts instead of rounding them to zero", () => {
    expect(formatAmount(0.4, "g")).toBe("0.4g");
    expect(formatAmount(12.35, "g")).toBe("12.4g");
  });

  it("shows large amounts as whole numbers", () => {
    expect(formatAmount(825.4, " kcal")).toBe("825 kcal");
    expect(formatAmount(1234)).toBe("1,234");
  });

  it("rounds half up without float drift", () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(8.165, 2)).toBe(8.17);
  });

  it("shows the quantity on a meal logged more than once over", () => {
    expect(mealDetail({ quantity: 5, calories: 825, protein_g: 155 })).toBe("×5 · 825 kcal · 155g protein");
    expect(mealDetail({ quantity: 1, calories: 165, protein_g: 31 })).toBe("165 kcal · 31g protein");
    expect(mealDetail({ quantity: 2, calories: null, protein_g: null })).toBe("×2 · Nutrition not entered");
  });
});
