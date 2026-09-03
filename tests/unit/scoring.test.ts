import { describe, expect, it } from "vitest";
import {
  ACTIVITY_CURVE,
  CALORIE_CURVE,
  FIBER_CURVE,
  HYDRATION_CURVE,
  PROTEIN_CURVE,
  clampScore,
  confidenceFromCoverage,
  feedbackForMetrics,
  gradeFromScore,
  scoreActivity,
  scoreCalories,
  scoreCarbs,
  scoreDay,
  scoreFat,
  scoreFiber,
  scoreHydration,
  scoreMeal,
  scorePiecewiseRatio,
  scoreProtein,
  weightedAverageKnown,
  type GoalTargets,
  type ScoreMetric,
} from "@/lib/scoring";

const goals: GoalTargets = {
  calorieTarget: 2000,
  proteinTargetG: 150,
  carbsTargetG: 220,
  fatTargetG: 70,
  fiberTargetG: 30,
  waterTargetMl: 2500,
  stepTarget: 10000,
  weeklyWorkoutTarget: 4,
};

describe("piecewise interpolation", () => {
  it.each(CALORIE_CURVE)("returns exact calorie curve point %s", (ratio, expected) => {
    expect(scorePiecewiseRatio(ratio * 100, 100, CALORIE_CURVE)).toBeCloseTo(expected);
  });

  it("linearly interpolates between points", () => {
    expect(scorePiecewiseRatio(72.5, 100, CALORIE_CURVE)).toBeCloseTo(57.5);
  });

  it("clamps below, above, and non-finite outputs", () => {
    expect(clampScore(-10)).toBe(0);
    expect(clampScore(110)).toBe(100);
    expect(clampScore(Number.NaN)).toBe(0);
    expect(scorePiecewiseRatio(0, 100, CALORIE_CURVE)).toBe(0);
    expect(scorePiecewiseRatio(999, 100, CALORIE_CURVE)).toBe(0);
  });

  it.each([
    [null, 100], [10, null], [10, 0], [-1, 100], [Number.NaN, 100], [10, Number.POSITIVE_INFINITY],
  ])("returns null for invalid actual/target pair", (actual, target) => {
    expect(scorePiecewiseRatio(actual, target, CALORIE_CURVE)).toBeNull();
  });
});

describe("metric curves", () => {
  it("scores calorie target and symmetric moderate/extreme misses", () => {
    expect(scoreCalories(2000, 2000)).toBe(100);
    expect(scoreCalories(1600, 2000)).toBe(75);
    expect(scoreCalories(2400, 2000)).toBe(75);
    expect(scoreCalories(900, 2000)).toBe(0);
    expect(scoreCalories(3200, 2000)).toBe(0);
  });

  it("matches minimum-target protein, fiber, hydration, and activity curves", () => {
    expect(scorePiecewiseRatio(0.8, 1, PROTEIN_CURVE)).toBe(80);
    expect(scoreProtein(150, 150)).toBe(100);
    expect(scorePiecewiseRatio(0.75, 1, FIBER_CURVE)).toBe(80);
    expect(scoreFiber(37.5, 30)).toBe(100);
    expect(scorePiecewiseRatio(0.85, 1, HYDRATION_CURVE)).toBe(90);
    expect(scoreHydration(3125, 2500)).toBe(100);
    expect(scorePiecewiseRatio(0.9, 1, ACTIVITY_CURVE)).toBe(95);
    expect(scoreActivity(12500, 10000)).toBe(100);
  });

  it("uses an alignment curve for carbohydrate and fat", () => {
    expect(scoreCarbs(220, 220)).toBe(100);
    expect(scoreFat(70, 70)).toBe(100);
    expect(scoreCarbs(352, 220)).toBe(20);
    expect(scoreFat(28, 70)).toBe(20);
  });

  it("never decreases minimum scores on the path toward target", () => {
    for (const scorer of [scoreProtein, scoreFiber, scoreHydration]) {
      const scores = Array.from({ length: 21 }, (_, index) => scorer(index * 5, 100) ?? -1);
      scores.slice(1).forEach((score, index) => expect(score).toBeGreaterThanOrEqual(scores[index]));
    }
  });
});

describe("weighting, confidence, and grades", () => {
  const metric = (overrides: Partial<ScoreMetric>): ScoreMetric => ({ id: "calories", label: "Calories", score: 100, weight: 30, configured: true, available: true, actual: 100, target: 100, unit: "kcal", direction: "aligned", ...overrides });

  it("renormalizes only known metrics", () => {
    const result = weightedAverageKnown([metric({ score: 100, weight: 30 }), metric({ id: "proteinG", score: 50, weight: 20 }), metric({ id: "fiberG", score: null, weight: 50, available: false })]);
    expect(result.score).toBe(80);
    expect(result.availableWeight).toBe(50);
    expect(result.totalPossibleWeight).toBe(100);
    expect(result.coverageRatio).toBe(0.5);
    const normalizedWeights = [30 / result.availableWeight, 20 / result.availableWeight];
    expect(normalizedWeights.reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(1);
  });

  it("does not treat missing data as zero", () => {
    const missing = weightedAverageKnown([metric({ score: 100 }), metric({ id: "fiberG", score: null, available: false })]);
    const zero = weightedAverageKnown([metric({ score: 100 }), metric({ id: "fiberG", score: 0, available: true })]);
    expect(missing.score).toBe(100);
    expect(zero.score).toBe(50);
  });

  it.each([[0.34, "insufficient"], [0.35, "low"], [0.54, "low"], [0.55, "medium"], [0.79, "medium"], [0.8, "high"]] as const)("maps %s coverage to %s", (coverage, expected) => {
    expect(confidenceFromCoverage(coverage)).toBe(expected);
  });

  it.each([[90, "A"], [89.99, "B"], [80, "B"], [79.99, "C"], [70, "C"], [69.99, "D"], [60, "D"], [59.99, "F"], [0, "F"]] as const)("maps %s to grade %s", (score, grade) => {
    expect(gradeFromScore(score)).toBe(grade);
  });
});

describe("day and meal scores", () => {
  it("returns 100 at perfect configured daily alignment", () => {
    const result = scoreDay({ calories: 2000, proteinG: 150, carbsG: 220, fatG: 70, fiberG: 30, waterMl: 2500, steps: 10000 }, goals);
    expect(result.score).toBeCloseTo(100);
    expect(result.grade).toBe("A");
    expect(result.confidence).toBe("high");
  });

  it("excludes a missing metric and reports reduced coverage", () => {
    const result = scoreDay({ calories: 2000, proteinG: 150, carbsG: 220, fatG: 70, fiberG: null, waterMl: 2500, steps: 10000 }, goals);
    expect(result.score).toBe(100);
    expect(result.coverageRatio).toBeCloseTo(0.92);
  });

  it("does not grade when configured information is insufficient", () => {
    const result = scoreDay({ calories: null, proteinG: 150, carbsG: null, fatG: null, fiberG: null, waterMl: null, steps: null }, goals);
    expect(result.confidence).toBe("insufficient");
    expect(result.grade).toBeNull();
    expect(result.score).toBe(100);
  });

  it("returns no score when targets are null", () => {
    const result = scoreDay({ calories: 1000, proteinG: 80, carbsG: 100, fatG: 40, fiberG: 10, waterMl: 1000, steps: 5000 }, { calorieTarget: null, proteinTargetG: null, carbsTargetG: null, fatTargetG: null, fiberTargetG: null, waterTargetMl: null, stepTarget: null, weeklyWorkoutTarget: null });
    expect(result.score).toBeNull();
    expect(result.confidence).toBe("insufficient");
  });

  it("scores a meal proportionally to its calorie share", () => {
    const result = scoreMeal({ calories: 500, proteinG: 37.5, carbsG: 55, fatG: 17.5, fiberG: 7.5, waterMl: null, steps: null }, goals);
    expect(result.score).toBeCloseTo(100);
    expect(result.metrics.every((item) => item.score === 100)).toBe(true);
  });

  it("handles zero calorie targets without invalid output", () => {
    const result = scoreMeal({ calories: 500, proteinG: 20, carbsG: 30, fatG: 10, fiberG: 4, waterMl: null, steps: null }, { ...goals, calorieTarget: 0 });
    expect(result.score).toBeNull();
    expect(result.metrics.every((item) => item.score == null)).toBe(true);
  });

  it("keeps every generated score within the universal bounds", () => {
    for (let ratio = 0; ratio <= 3; ratio += 0.025) {
      for (const scorer of [scoreCalories, scoreProtein, scoreFiber, scoreHydration, scoreActivity, scoreCarbs, scoreFat]) {
        const score = scorer(ratio * 100, 100);
        expect(score).not.toBeNull();
        expect(score!).toBeGreaterThanOrEqual(0);
        expect(score!).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("actionable daily feedback", () => {
  const metric = (overrides: Partial<ScoreMetric>): ScoreMetric => ({
    id: "proteinG",
    label: "Protein",
    score: 100,
    weight: 20,
    configured: true,
    available: true,
    actual: 150,
    target: 150,
    unit: "g",
    direction: "aligned",
    ...overrides,
  });

  it("pairs a precisely hit target with a concrete correction for an overage", () => {
    const result = feedbackForMetrics([
      metric({}),
      metric({ id: "fatG", label: "Fat", score: 88, actual: 76.9, target: 70 }),
    ]);

    expect(result.summary).toBe(
      "You hit your protein target exactly, but went slightly over your fat target by 6.9g. Choose leaner protein sources and measure added fats for tomorrow’s split.",
    );
    expect(result.topOpportunity).toContain("6.9g");
  });

  it("suggests a training-aware correction when protein is short", () => {
    const result = feedbackForMetrics([
      metric({ score: 74, actual: 112, direction: "below" }),
    ]);

    expect(result.summary).toContain("38g short of your protein target");
    expect(result.summary).toContain("lean protein serving earlier in the day");
  });
});
