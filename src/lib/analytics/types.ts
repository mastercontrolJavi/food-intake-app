import type { ConfidenceLevel } from "@/lib/scoring";

export type AnalyticsMeal = {
  id: string;
  localDate: string;
  sourceType: string | null;
  calories: number | null;
  proteinG: number | null;
  eatenLocalTime: string;
  isLate: boolean;
};

export type AnalyticsDay = {
  localDate: string;
  score: number | null;
  confidence: ConfidenceLevel;
  completed: boolean;
  calories: number | null;
  proteinG: number | null;
  proteinTargetG: number | null;
  fiberG: number | null;
  fiberTargetG: number | null;
  waterMl: number | null;
  waterTargetMl: number | null;
  steps: number | null;
  stepTarget: number | null;
  workoutCount: number;
  caloricDrinkCalories: number;
};

export type PatternInsight = {
  id: string;
  category: "nutrition" | "hydration" | "activity" | "behavior" | "tracking";
  direction: "positive" | "negative" | "neutral";
  confidence: "low" | "medium" | "high";
  priority: number;
  title: string;
  message: string;
  evidence: Record<string, string | number | boolean | null>;
};

export type PeriodAnalytics = {
  trackedDays: number;
  completedDays: number;
  sufficientlyCompleteDays: number;
  averageCalories: number | null;
  averageProteinG: number | null;
  averageWaterMl: number | null;
  averageSteps: number | null;
  proteinHitRate: number | null;
  fiberHitRate: number | null;
  hydrationHitRate: number | null;
  stepHitRate: number | null;
  workoutCount: number;
  sourceCounts: Record<string, number>;
  takeoutPerTrackedDay: number;
  restaurantPerTrackedDay: number;
  lateMealCount: number;
  lateMealRate: number | null;
  firstMealTime: string | null;
  finalMealTime: string | null;
  caloricDrinkCalories: number;
};
