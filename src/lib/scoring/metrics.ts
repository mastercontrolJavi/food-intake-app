import {
  ACTIVITY_CURVE,
  ALIGNMENT_CURVE,
  CALORIE_CURVE,
  FIBER_CURVE,
  HYDRATION_CURVE,
  PROTEIN_CURVE,
} from "./constants";
import { scorePiecewiseRatio } from "./interpolation";

export const scoreCalories = (actual: number | null, target: number | null) => scorePiecewiseRatio(actual, target, CALORIE_CURVE);
export const scoreProtein = (actual: number | null, target: number | null) => scorePiecewiseRatio(actual, target, PROTEIN_CURVE);
export const scoreFiber = (actual: number | null, target: number | null) => scorePiecewiseRatio(actual, target, FIBER_CURVE);
export const scoreCarbs = (actual: number | null, target: number | null) => scorePiecewiseRatio(actual, target, ALIGNMENT_CURVE);
export const scoreFat = (actual: number | null, target: number | null) => scorePiecewiseRatio(actual, target, ALIGNMENT_CURVE);
export const scoreHydration = (actual: number | null, target: number | null) => scorePiecewiseRatio(actual, target, HYDRATION_CURVE);
export const scoreActivity = (actual: number | null, target: number | null) => scorePiecewiseRatio(actual, target, ACTIVITY_CURVE);
