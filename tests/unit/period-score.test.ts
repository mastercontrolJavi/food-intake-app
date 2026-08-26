import { describe, expect, it } from "vitest";
import { scoreMonth, scoreWeek, type PeriodScoreInput } from "@/lib/scoring";

const days = (count: number, score = 84, coverageRatio = 0.9): PeriodScoreInput[] => Array.from({ length: count }, () => ({ score, coverageRatio, confidence: "high" }));

describe("period scoring", () => {
  it("requires four sufficient days for a weekly grade", () => {
    expect(scoreWeek(days(3), 3, 4).score).toBeNull();
    expect(scoreWeek(days(3), 3, 4).confidence).toBe("insufficient");
    expect(scoreWeek(days(4), 4, 4).score).not.toBeNull();
  });

  it("includes weekly workouts only when configured", () => {
    expect(scoreWeek(days(7, 80), 0, null).score).toBeCloseTo(80);
    expect(scoreWeek(days(7, 80), 4, 4).score).toBeCloseTo(83);
    expect(scoreWeek(days(7, 80), 0, 4).score).toBeCloseTo(68);
  });

  it("weights sufficiently complete days by coverage", () => {
    const result = scoreWeek([{ score: 100, coverageRatio: 1, confidence: "high" }, { score: 50, coverageRatio: 0.5, confidence: "medium" }, ...days(2, 80, 1)], 0, null);
    expect(result.score).toBeCloseTo((100 + 25 + 160) / 3.5);
  });

  it("requires fifteen sufficient days for a monthly grade", () => {
    expect(scoreMonth(days(14), 30).score).toBeNull();
    expect(scoreMonth(days(15), 20).score).toBeCloseTo(84);
    expect(scoreMonth(days(15), 20).coverageRatio).toBe(0.75);
  });
});
