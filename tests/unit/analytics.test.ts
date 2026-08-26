import { describe, expect, it } from "vitest";
import {
  activityAssociationPattern,
  aggregatePeriod,
  caloricDrinksPattern,
  generateInsights,
  hydrationPattern,
  lateEatingPattern,
  median,
  proteinPattern,
  restaurantVsHomePattern,
  takeoutTrendPattern,
  weekendPattern,
  type AnalyticsDay,
  type AnalyticsMeal,
} from "@/lib/analytics";

function day(index: number, overrides: Partial<AnalyticsDay> = {}): AnalyticsDay {
  return { localDate: `2026-08-${String(index + 1).padStart(2, "0")}`, score: 82, confidence: "high", completed: true, calories: 2000, proteinG: 150, proteinTargetG: 150, fiberG: 30, fiberTargetG: 30, waterMl: 2500, waterTargetMl: 2500, steps: 10000, stepTarget: 10000, workoutCount: index % 3 === 0 ? 1 : 0, caloricDrinkCalories: 0, ...overrides };
}

function meal(index: number, overrides: Partial<AnalyticsMeal> = {}): AnalyticsMeal {
  return { id: `meal-${index}`, localDate: `2026-08-${String((index % 20) + 1).padStart(2, "0")}`, sourceType: "home", calories: 500, proteinG: 35, eatenLocalTime: "18:00", isLate: false, ...overrides };
}

describe("period aggregation", () => {
  it("calculates averages, hit rates, source rates, and activity", () => {
    const days = [day(0), day(1, { calories: 2400, proteinG: 100, waterMl: 1500, steps: 5000, workoutCount: 0 })];
    const meals = [meal(0), meal(1, { sourceType: "takeout", localDate: days[1].localDate, isLate: true })];
    const result = aggregatePeriod(days, meals);
    expect(result.averageCalories).toBe(2200);
    expect(result.proteinHitRate).toBe(0.5);
    expect(result.fiberHitRate).toBe(1);
    expect(result.hydrationHitRate).toBe(0.5);
    expect(result.stepHitRate).toBe(0.5);
    expect(result.sourceCounts).toEqual({ home: 1, takeout: 1 });
    expect(result.takeoutPerTrackedDay).toBe(0.5);
    expect(result.lateMealCount).toBe(1);
    expect(result.lateMealRate).toBe(0.5);
    expect(result.firstMealTime).toBe("18:00");
    expect(result.workoutCount).toBe(1);
  });

  it("does not turn unknown averages into zero", () => {
    const result = aggregatePeriod([day(0, { calories: null, proteinG: null, waterMl: null, steps: null })], []);
    expect(result.averageCalories).toBeNull();
    expect(result.proteinHitRate).toBeNull();
  });

  it("calculates a true median", () => expect(median([900, 100, 300, 500])).toBe(400));
});

describe("pattern rules", () => {
  it("detects protein and hydration consistency with evidence", () => {
    const days = Array.from({ length: 10 }, (_, index) => day(index));
    expect(proteinPattern(days)?.id).toBe("protein_consistency");
    expect(hydrationPattern(days)?.confidence).toBe("high");
  });

  it("detects protein and hydration opportunities", () => {
    const days = Array.from({ length: 8 }, (_, index) => day(index, { proteinG: 80, waterMl: 900 }));
    expect(proteinPattern(days)?.id).toBe("protein_opportunity");
    expect(hydrationPattern(days)?.id).toBe("hydration_opportunity");
  });

  it("compares restaurant and home medians only for a material effect", () => {
    const meals = [...Array.from({ length: 5 }, (_, index) => meal(index, { sourceType: "home", calories: 500 })), ...Array.from({ length: 5 }, (_, index) => meal(index + 5, { sourceType: "restaurant", calories: 850 }))];
    expect(restaurantVsHomePattern(meals)?.evidence.difference).toBe(350);
    expect(restaurantVsHomePattern(meals.map((item) => item.sourceType === "restaurant" ? { ...item, calories: 560 } : item))).toBeNull();
  });

  it("detects weekend differences", () => {
    const days = [
      day(2, { localDate: "2026-08-03", calories: 1800 }), day(3, { localDate: "2026-08-04", calories: 1800 }), day(4, { localDate: "2026-08-05", calories: 1800 }), day(5, { localDate: "2026-08-06", calories: 1800 }),
      day(0, { localDate: "2026-08-01", calories: 2600 }), day(1, { localDate: "2026-08-02", calories: 2600 }),
    ];
    expect(weekendPattern(days)?.id).toBe("weekend_weekday_difference");
  });

  it("detects late calorie share and caloric drinks", () => {
    const meals = Array.from({ length: 8 }, (_, index) => meal(index, { calories: 500, isLate: index < 3 }));
    expect(lateEatingPattern(meals, 5)?.id).toBe("late_eating_share");
    const days = Array.from({ length: 5 }, (_, index) => day(index, { caloricDrinkCalories: 150 }));
    expect(caloricDrinksPattern(days)?.id).toBe("caloric_drinks");
  });

  it("labels score differences as an association, not causation", () => {
    const active = Array.from({ length: 4 }, (_, index) => day(index, { steps: 11000, score: 90 }));
    const inactive = Array.from({ length: 4 }, (_, index) => day(index + 4, { steps: 4000, score: 70 }));
    const result = activityAssociationPattern([...active, ...inactive]);
    expect(result?.id).toBe("activity_score_association");
    expect(result?.message).toContain("coincided");
  });

  it("compares normalized takeout frequency with the prior period", () => {
    const current = aggregatePeriod(Array.from({ length: 7 }, (_, index) => day(index)), Array.from({ length: 6 }, (_, index) => meal(index, { sourceType: "takeout" })));
    const previous = aggregatePeriod(Array.from({ length: 7 }, (_, index) => day(index)), [meal(0, { sourceType: "takeout" })]);
    expect(takeoutTrendPattern(current, previous)?.id).toBe("takeout_frequency_increase");
  });

  it("ranks and limits generated insights", () => {
    const days = Array.from({ length: 14 }, (_, index) => day(index, { proteinG: 80, waterMl: 900, caloricDrinkCalories: 180 }));
    const insights = generateInsights(days, Array.from({ length: 14 }, (_, index) => meal(index)), undefined, 2);
    expect(insights).toHaveLength(2);
    expect(insights[0].priority).toBeGreaterThanOrEqual(insights[1].priority);
  });
});

describe("false-positive controls", () => {
  it("does not fire on one or two samples", () => {
    const days = [day(0, { proteinG: 10, waterMl: 100 })];
    const meals = [meal(0, { sourceType: "restaurant", calories: 1200 }), meal(1, { sourceType: "home", calories: 300 })];
    expect(proteinPattern(days)).toBeNull();
    expect(hydrationPattern(days)).toBeNull();
    expect(restaurantVsHomePattern(meals)).toBeNull();
    expect(lateEatingPattern(meals.map((item) => ({ ...item, isLate: true })), 2)).toBeNull();
    expect(generateInsights(days, meals)).toEqual([]);
  });

  it("does not fire for tiny effects or mostly missing nutrients", () => {
    const tinyDifference = [...Array.from({ length: 5 }, (_, index) => meal(index, { sourceType: "home", calories: 500 })), ...Array.from({ length: 5 }, (_, index) => meal(index + 5, { sourceType: "restaurant", calories: 520 }))];
    expect(restaurantVsHomePattern(tinyDifference)).toBeNull();
    const mostlyMissing = Array.from({ length: 10 }, (_, index) => day(index, { proteinG: index < 3 ? 40 : null }));
    expect(proteinPattern(mostlyMissing)).toBeNull();
  });
});
