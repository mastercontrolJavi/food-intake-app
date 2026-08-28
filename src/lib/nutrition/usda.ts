import { roundTo } from "@/lib/format/number";
import { NUTRITION_DECIMALS } from "@/lib/nutrition/quantity";
import type { NutritionProvider, NutritionSearchResult } from "./types";

type FdcNutrient = { nutrientId?: number; nutrientNumber?: string; nutrientName?: string; unitName?: string; value?: number };
type FdcFood = {
  fdcId: number; description: string; brandOwner?: string; brandName?: string;
  servingSize?: number; servingSizeUnit?: string; householdServingFullText?: string; foodNutrients?: FdcNutrient[];
};
type FdcResponse = { foods?: FdcFood[] };

const nutrientIds = { calories: 1008, protein: 1003, fat: 1004, carbs: 1005, fiber: 1079, sodium: 1093, addedSugar: 1235 } as const;

/** Serving units measured against the same 100 g / 100 ml basis as the nutrient values. */
const servingUnits: Record<string, string> = { grm: "g", g: "g", gram: "g", grams: "g", mlt: "ml", ml: "ml" };

const PORTION_LABEL_MAX = 160;

/**
 * FoodData Central reports nutrients per 100 g (or per 100 ml) even for branded foods with a
 * much smaller label serving — every nutrient carries the derivation "Given by information
 * provider as an approximate value per 100 unit measure". Pair the values with the serving
 * they are measured against, so an import is never read as a per-serving estimate it is not.
 */
function servingBasis(food: FdcFood): { factor: number; label: string } {
  const unit = servingUnits[food.servingSizeUnit?.trim().toLowerCase() ?? ""];
  const size = food.servingSize;
  if (!unit || size == null || !Number.isFinite(size) || size <= 0) return { factor: 1, label: "100 g estimate" };
  const household = food.householdServingFullText?.trim();
  return { factor: size / 100, label: (household || `${roundTo(size, 2)} ${unit}`).slice(0, PORTION_LABEL_MAX) };
}

function nutrient(food: FdcFood, id: number, factor: number): number | null {
  const value = food.foodNutrients?.find((item) => item.nutrientId === id)?.value;
  return typeof value === "number" && Number.isFinite(value) ? roundTo(value * factor, NUTRITION_DECIMALS) : null;
}

export function mapFdcFood(food: FdcFood): NutritionSearchResult {
  const { factor, label } = servingBasis(food);
  return {
    externalId: String(food.fdcId), name: food.description, brand: food.brandOwner ?? food.brandName ?? null,
    servingLabel: label,
    calories: nutrient(food, nutrientIds.calories, factor), proteinG: nutrient(food, nutrientIds.protein, factor),
    carbsG: nutrient(food, nutrientIds.carbs, factor), fatG: nutrient(food, nutrientIds.fat, factor),
    fiberG: nutrient(food, nutrientIds.fiber, factor), sodiumMg: nutrient(food, nutrientIds.sodium, factor),
    addedSugarG: nutrient(food, nutrientIds.addedSugar, factor),
  };
}

export class UsdaFoodDataCentralProvider implements NutritionProvider {
  constructor(private readonly apiKey: string) {}

  async search(query: string): Promise<NutritionSearchResult[]> {
    const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(this.apiKey)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, pageSize: 12 }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(response.status === 429 ? "USDA search is temporarily rate-limited." : "USDA food search is unavailable.");
    const payload = await response.json() as FdcResponse;
    return (payload.foods ?? []).map(mapFdcFood);
  }
}

export function getNutritionProvider(): NutritionProvider | null {
  const key = process.env.FDC_API_KEY;
  return key ? new UsdaFoodDataCentralProvider(key) : null;
}
