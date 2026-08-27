import { describe, expect, it } from "vitest";
import { totalsFromLogs } from "@/lib/data/day";
import type { Tables } from "@/types/database";

function mealRow(overrides: Partial<Tables<"meal_logs">> = {}): Tables<"meal_logs"> {
  return {
    id: "meal-1", user_id: "user-1", title: "Meal", eaten_at: "2026-08-26T12:00:00Z",
    created_at: "2026-08-26T12:00:00Z", updated_at: "2026-08-26T12:00:00Z",
    calories: null, protein_g: null, carbs_g: null, fat_g: null, fiber_g: null,
    added_sugar_g: null, sodium_mg: null, meal_score: null, meal_type: null,
    notes: null, nutrition_confidence: "unknown", nutrition_external_id: null,
    nutrition_source: "manual", portion_description: null, quantity: 1,
    raw_description: null, restaurant_name: null, score_breakdown: null, source_type: null,
    ...overrides,
  };
}

function hydrationRow(overrides: Partial<Tables<"hydration_logs">> = {}): Tables<"hydration_logs"> {
  return {
    id: "hydration-1", user_id: "user-1", consumed_at: "2026-08-26T12:00:00Z",
    created_at: "2026-08-26T12:00:00Z", updated_at: "2026-08-26T12:00:00Z",
    drink_type: "water", volume_ml: 250, calories: null, notes: null,
    ...overrides,
  };
}

function activityRow(overrides: Partial<Tables<"activity_logs">> = {}): Tables<"activity_logs"> {
  return {
    id: "activity-1", user_id: "user-1", occurred_at: "2026-08-26T12:00:00Z",
    created_at: "2026-08-26T12:00:00Z", updated_at: "2026-08-26T12:00:00Z",
    activity_type: "steps", steps: null, duration_minutes: null, distance_km: null,
    estimated_calories_burned: null, intensity: null, notes: null,
    ...overrides,
  };
}

describe("totalsFromLogs", () => {
  it("sums known nutrients across entries even when one entry is missing some fields", () => {
    // Mirrors a real day: three fully-logged meals plus one meal logged with only
    // calories (e.g. manually entered), and a no-nutrition drink alongside water.
    const meals = [
      mealRow({ id: "peanuts", calories: 210, protein_g: 8, carbs_g: 20, fat_g: 12, fiber_g: 3 }),
      mealRow({ id: "banana", calories: 97, protein_g: 0, carbs_g: 25, fat_g: 0, fiber_g: 3 }),
      mealRow({ id: "flautas", calories: 800, protein_g: null, carbs_g: null, fat_g: null, fiber_g: null }),
      mealRow({ id: "taco-bell", calories: 229, protein_g: 8, carbs_g: 20, fat_g: 10, fiber_g: 2 }),
    ];
    const hydration = [
      hydrationRow({ id: "water-1", drink_type: "water", volume_ml: 500 }),
      hydrationRow({ id: "water-2", drink_type: "water", volume_ml: 250 }),
      hydrationRow({ id: "coke-zero", drink_type: "soda", volume_ml: 355, calories: null }),
    ];

    const totals = totalsFromLogs(meals, hydration, []);

    expect(totals.calories).toBe(1336);
    expect(totals.proteinG).toBe(16);
    expect(totals.carbsG).toBe(65);
    expect(totals.fatG).toBe(22);
    expect(totals.fiberG).toBe(8);
    expect(totals.waterMl).toBe(750);
  });

  it("returns null for a nutrient only when none of the entries have it", () => {
    const meals = [mealRow({ calories: null, protein_g: null, carbs_g: null, fat_g: null, fiber_g: null })];
    const totals = totalsFromLogs(meals, [], []);
    expect(totals.calories).toBeNull();
    expect(totals.proteinG).toBeNull();
    expect(totals.carbsG).toBeNull();
    expect(totals.fatG).toBeNull();
    expect(totals.fiberG).toBeNull();
  });

  it("treats water and sparkling water as a known zero calories", () => {
    const hydration = [hydrationRow({ drink_type: "water", volume_ml: 500, calories: null })];
    const totals = totalsFromLogs([], hydration, []);
    expect(totals.calories).toBe(0);
  });

  it("returns all nulls when nothing has been logged", () => {
    const totals = totalsFromLogs([], [], []);
    expect(totals).toEqual({
      calories: null, proteinG: null, carbsG: null, fatG: null, fiberG: null, waterMl: null, steps: null,
    });
  });

  it("sums known steps across activity entries", () => {
    const activity = [
      activityRow({ id: "a1", activity_type: "walking", steps: 4000 }),
      activityRow({ id: "a2", activity_type: "running", steps: null }),
      activityRow({ id: "a3", activity_type: "steps", steps: 2500 }),
    ];
    const totals = totalsFromLogs([], [], activity);
    expect(totals.steps).toBe(6500);
  });
});
