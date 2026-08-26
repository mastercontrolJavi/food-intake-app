export type NutritionSearchResult = {
  externalId: string;
  name: string;
  brand: string | null;
  servingLabel: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  sodiumMg: number | null;
  addedSugarG: number | null;
};

export interface NutritionProvider {
  search(query: string): Promise<NutritionSearchResult[]>;
}
