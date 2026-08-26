export type ConfidenceLevel = "high" | "medium" | "low" | "insufficient";
export type Grade = "A" | "B" | "C" | "D" | "F";

export type GoalTargets = {
  id?: string;
  calorieTarget: number | null;
  proteinTargetG: number | null;
  carbsTargetG: number | null;
  fatTargetG: number | null;
  fiberTargetG: number | null;
  waterTargetMl: number | null;
  stepTarget: number | null;
  weeklyWorkoutTarget: number | null;
  lateMealTime?: string | null;
  primaryGoal?: string;
};

export type NutritionTotals = {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  waterMl: number | null;
  steps: number | null;
};

export type ScoreMetric = {
  id: keyof NutritionTotals;
  label: string;
  score: number | null;
  weight: number;
  configured: boolean;
  available: boolean;
  actual: number | null;
  target: number | null;
  unit: string;
  direction: "below" | "aligned" | "above" | "unknown";
};

export type WeightedScore = {
  score: number | null;
  availableWeight: number;
  totalPossibleWeight: number;
  coverageRatio: number;
};

export type ScoreResult = WeightedScore & {
  grade: Grade | null;
  confidence: ConfidenceLevel;
  metrics: ScoreMetric[];
  topStrength: string | null;
  topOpportunity: string | null;
  summary: string;
};

export type PeriodScoreInput = {
  score: number;
  coverageRatio: number;
  confidence: ConfidenceLevel;
};

export type PeriodScoreResult = {
  score: number | null;
  grade: Grade | null;
  confidence: ConfidenceLevel;
  trackedDays: number;
  sufficientlyCompleteDays: number;
  coverageRatio: number;
};
