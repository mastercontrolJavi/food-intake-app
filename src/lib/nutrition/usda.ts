import type { NutritionProvider, NutritionSearchResult } from "./types";

type FdcNutrient = { nutrientId?: number; nutrientNumber?: string; nutrientName?: string; unitName?: string; value?: number };
type FdcFood = { fdcId: number; description: string; brandOwner?: string; brandName?: string; servingSize?: number; servingSizeUnit?: string; foodNutrients?: FdcNutrient[] };
type FdcResponse = { foods?: FdcFood[] };

const nutrientIds = { calories: 1008, protein: 1003, fat: 1004, carbs: 1005, fiber: 1079, sodium: 1093, addedSugar: 1235 } as const;

function nutrient(food: FdcFood, id: number): number | null {
  const value = food.foodNutrients?.find((item) => item.nutrientId === id)?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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
    return (payload.foods ?? []).map((food) => ({
      externalId: String(food.fdcId), name: food.description, brand: food.brandOwner ?? food.brandName ?? null,
      servingLabel: food.servingSize && food.servingSizeUnit ? `${food.servingSize} ${food.servingSizeUnit}` : "100 g estimate",
      calories: nutrient(food, nutrientIds.calories), proteinG: nutrient(food, nutrientIds.protein), carbsG: nutrient(food, nutrientIds.carbs),
      fatG: nutrient(food, nutrientIds.fat), fiberG: nutrient(food, nutrientIds.fiber), sodiumMg: nutrient(food, nutrientIds.sodium),
      addedSugarG: nutrient(food, nutrientIds.addedSugar),
    }));
  }
}

export function getNutritionProvider(): NutritionProvider | null {
  const key = process.env.FDC_API_KEY;
  return key ? new UsdaFoodDataCentralProvider(key) : null;
}
