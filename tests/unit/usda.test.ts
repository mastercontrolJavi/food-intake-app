import { describe, expect, it } from "vitest";
import { mapFdcFood } from "@/lib/nutrition/usda";

/**
 * Trimmed from real /v1/foods/search responses. FoodData Central reports branded nutrients
 * per 100 g or per 100 ml — each nutrient's derivation reads "Given by information provider
 * as an approximate value per 100 unit measure" — while servingSize describes the label
 * serving, which is usually something else entirely.
 */
const cheerios = {
  fdcId: 2707576, description: "Cheerios Cereal", brandOwner: "General Mills",
  servingSize: 20, servingSizeUnit: "GRM", householdServingFullText: "3/4 cup (20g) (age 1-3 years)",
  foodNutrients: [
    { nutrientId: 1003, value: 12.8 }, { nutrientId: 1004, value: 6.41 }, { nutrientId: 1005, value: 74.4 },
    { nutrientId: 1008, value: 359 }, { nutrientId: 1079, value: 10.3 }, { nutrientId: 1093, value: 487 },
    { nutrientId: 1235, value: 5.1 },
  ],
};

const milk = {
  fdcId: 2501185, description: "MILK", brandOwner: "HP Hood LLC",
  servingSize: 240, servingSizeUnit: "MLT", householdServingFullText: "1 cup",
  foodNutrients: [
    { nutrientId: 1003, value: 3.33 }, { nutrientId: 1004, value: 3.33 }, { nutrientId: 1005, value: 5.42 },
    { nutrientId: 1008, value: 62 }, { nutrientId: 1079, value: 0 }, { nutrientId: 1093, value: 52 },
  ],
};

const wholeFood = {
  fdcId: 747447, description: "Broccoli, raw",
  foodNutrients: [{ nutrientId: 1008, value: 34 }, { nutrientId: 1003, value: 2.82 }],
};

describe("USDA import", () => {
  it("scales per-100g values down to the label serving", () => {
    const result = mapFdcFood(cheerios);
    // 20 g of a 359 kcal/100 g cereal is ~72 kcal, not 359.
    expect(result.calories).toBe(71.8);
    expect(result.proteinG).toBe(2.56);
    expect(result.carbsG).toBe(14.88);
    expect(result.sodiumMg).toBe(97.4);
    expect(result.servingLabel).toBe("3/4 cup (20g) (age 1-3 years)");
  });

  it("scales per-100ml values up to a larger label serving", () => {
    const result = mapFdcFood(milk);
    // A 240 ml cup of 62 kcal/100 ml milk is ~149 kcal, not 62.
    expect(result.calories).toBe(148.8);
    expect(result.proteinG).toBe(7.99);
    expect(result.servingLabel).toBe("1 cup");
  });

  it("keeps the per-100g basis for foods with no label serving", () => {
    const result = mapFdcFood(wholeFood);
    expect(result.calories).toBe(34);
    expect(result.proteinG).toBe(2.82);
    expect(result.servingLabel).toBe("100 g estimate");
  });

  it("does not scale against a serving unit it cannot compare to 100 g", () => {
    const result = mapFdcFood({ ...milk, servingSizeUnit: "IU", householdServingFullText: undefined });
    expect(result.calories).toBe(62);
    expect(result.servingLabel).toBe("100 g estimate");
  });

  it("falls back to the measured serving when no household description is given", () => {
    expect(mapFdcFood({ ...cheerios, householdServingFullText: undefined }).servingLabel).toBe("20 g");
    expect(mapFdcFood({ ...milk, householdServingFullText: "   " }).servingLabel).toBe("240 ml");
  });

  it("keeps unreported nutrients unknown rather than zero", () => {
    const result = mapFdcFood(milk);
    expect(result.addedSugarG).toBeNull();
    expect(result.fiberG).toBe(0);
  });

  it("keeps the portion label short enough to store", () => {
    const result = mapFdcFood({ ...cheerios, householdServingFullText: "x".repeat(400) });
    expect(result.servingLabel).toHaveLength(160);
  });

  it("reads the brand from either brand field", () => {
    expect(mapFdcFood(milk).brand).toBe("HP Hood LLC");
    expect(mapFdcFood({ ...wholeFood, brandName: "Store" }).brand).toBe("Store");
    expect(mapFdcFood(wholeFood).brand).toBeNull();
  });
});
