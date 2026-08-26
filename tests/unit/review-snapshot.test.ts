import { describe, expect, it } from "vitest";
import { goalRowToTargets, type GoalRow } from "@/lib/data/mappers";

describe("historical review goal snapshots", () => {
  it("remains unchanged when the current goal row changes", () => {
    const currentGoal: GoalRow = {
      id: "goal-1",
      user_id: "user-1",
      created_at: "2026-08-01T00:00:00Z",
      effective_from: "2026-08-01",
      effective_until: null,
      primary_goal: "maintain",
      calorie_target: 2_000,
      protein_target_g: 150,
      carbs_target_g: 220,
      fat_target_g: 70,
      fiber_target_g: 30,
      water_target_ml: 2_500,
      step_target: 10_000,
      weekly_workout_target: 4,
      late_meal_time: "21:00:00",
      added_sugar_limit_g: null,
      sodium_limit_mg: null,
    };

    const persistedSnapshot = structuredClone(goalRowToTargets(currentGoal));
    currentGoal.calorie_target = 2_300;
    currentGoal.protein_target_g = 175;

    expect(persistedSnapshot.calorieTarget).toBe(2_000);
    expect(persistedSnapshot.proteinTargetG).toBe(150);
  });
});
