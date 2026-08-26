import type { Tables } from "@/types/database";
import type { GoalTargets } from "@/lib/scoring";

export type GoalRow = Tables<"user_goals">;

export function goalRowToTargets(goal: GoalRow | null): GoalTargets {
  return {
    id: goal?.id,
    calorieTarget: goal?.calorie_target ?? null,
    proteinTargetG: goal?.protein_target_g ?? null,
    carbsTargetG: goal?.carbs_target_g ?? null,
    fatTargetG: goal?.fat_target_g ?? null,
    fiberTargetG: goal?.fiber_target_g ?? null,
    waterTargetMl: goal?.water_target_ml ?? null,
    stepTarget: goal?.step_target ?? null,
    weeklyWorkoutTarget: goal?.weekly_workout_target ?? null,
    lateMealTime: goal?.late_meal_time ?? null,
    primaryGoal: goal?.primary_goal,
  };
}

export function goalForLocalDate(goals: GoalRow[], localDate: string): GoalRow | null {
  return goals
    .filter((goal) => goal.effective_from <= localDate && (goal.effective_until == null || goal.effective_until > localDate))
    .sort((a, b) => b.effective_from.localeCompare(a.effective_from))[0] ?? null;
}
