export const SCORING_ALGORITHM_VERSION = "1.0.0";

export type RatioPoint = readonly [ratio: number, score: number];

export const SCORE_WEIGHTS = {
  calories: 30,
  protein: 20,
  fiber: 8,
  carbs: 6,
  fat: 6,
  water: 15,
  steps: 15,
} as const;

export const MEAL_SCORE_WEIGHTS = {
  protein: 40,
  fiber: 25,
  carbs: 17.5,
  fat: 17.5,
} as const;

export const CALORIE_CURVE: RatioPoint[] = [
  [0.45, 0], [0.65, 40], [0.8, 75], [0.9, 95], [1, 100],
  [1.1, 95], [1.2, 75], [1.35, 40], [1.6, 0],
];

export const PROTEIN_CURVE: RatioPoint[] = [
  [0, 0], [0.3, 20], [0.5, 45], [0.65, 65], [0.8, 80],
  [0.9, 92], [1, 100], [1.25, 100],
];

export const FIBER_CURVE: RatioPoint[] = [
  [0, 0], [0.3, 30], [0.5, 55], [0.75, 80], [0.9, 95],
  [1, 100], [1.25, 100],
];

export const ALIGNMENT_CURVE: RatioPoint[] = [
  [0.4, 20], [0.6, 50], [0.75, 75], [0.9, 95], [1, 100],
  [1.1, 95], [1.25, 75], [1.4, 50], [1.6, 20],
];

export const HYDRATION_CURVE: RatioPoint[] = [
  [0, 0], [0.3, 30], [0.5, 55], [0.7, 75], [0.85, 90],
  [1, 100], [1.25, 100],
];

export const ACTIVITY_CURVE: RatioPoint[] = [
  [0, 0], [0.3, 30], [0.5, 55], [0.7, 75], [0.9, 95],
  [1, 100], [1.25, 100],
];

export const WORKOUT_CURVE: RatioPoint[] = [
  [0, 0], [0.25, 35], [0.5, 60], [0.75, 85], [1, 100], [1.25, 100],
];
