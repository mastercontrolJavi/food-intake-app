import { WORKOUT_CURVE } from "./constants";
import { confidenceFromCoverage } from "./confidence";
import { gradeFromScore } from "./grade";
import { clampScore, scorePiecewiseRatio } from "./interpolation";
import type { PeriodScoreInput, PeriodScoreResult } from "./types";

function weightedDailyMean(days: PeriodScoreInput[]): number | null {
  const eligible = days.filter((day) => day.confidence !== "insufficient" && day.coverageRatio > 0);
  const weight = eligible.reduce((sum, day) => sum + day.coverageRatio, 0);
  if (weight === 0) return null;
  return eligible.reduce((sum, day) => sum + day.score * day.coverageRatio, 0) / weight;
}

export function scoreWeek(days: PeriodScoreInput[], completedWorkouts: number, workoutTarget: number | null): PeriodScoreResult {
  const sufficient = days.filter((day) => day.confidence !== "insufficient");
  const coverageRatio = days.length > 0 ? sufficient.length / 7 : 0;
  if (sufficient.length < 4) {
    return { score: null, grade: null, confidence: "insufficient", trackedDays: days.length, sufficientlyCompleteDays: sufficient.length, coverageRatio };
  }
  const daily = weightedDailyMean(sufficient)!;
  const workout = workoutTarget != null && workoutTarget > 0
    ? scorePiecewiseRatio(completedWorkouts, workoutTarget, WORKOUT_CURVE)
    : null;
  const score = clampScore(workout == null ? daily : daily * 0.85 + workout * 0.15);
  const confidence = confidenceFromCoverage(Math.min(1, sufficient.length / 7));
  return { score, grade: gradeFromScore(score), confidence, trackedDays: days.length, sufficientlyCompleteDays: sufficient.length, coverageRatio };
}

export function scoreMonth(days: PeriodScoreInput[], elapsedDays: number): PeriodScoreResult {
  const sufficient = days.filter((day) => day.confidence !== "insufficient");
  const coverageRatio = elapsedDays > 0 ? sufficient.length / elapsedDays : 0;
  if (sufficient.length < 15) {
    return { score: null, grade: null, confidence: "insufficient", trackedDays: days.length, sufficientlyCompleteDays: sufficient.length, coverageRatio };
  }
  const score = weightedDailyMean(sufficient);
  const confidence = confidenceFromCoverage(coverageRatio);
  return { score, grade: gradeFromScore(score), confidence, trackedDays: days.length, sufficientlyCompleteDays: sufficient.length, coverageRatio };
}
