import { describe, expect, it } from "vitest";
import {
  clampPublicDemoDate,
  createPublicDemoSnapshot,
  getPublicDemoDayData,
  getPublicDemoPeriodDataset,
  PUBLIC_DEMO_DAY_COUNT,
} from "@/lib/demo/public-demo-data";

const now = new Date("2026-08-26T18:00:00.000Z");

describe("public demo data", () => {
  it("builds a complete, deterministic rolling snapshot without Supabase", () => {
    const snapshot = createPublicDemoSnapshot(now);
    expect(snapshot.endDate).toBe("2026-08-26");
    expect(snapshot.statuses).toHaveLength(PUBLIC_DEMO_DAY_COUNT);
    expect(snapshot.reviews).toHaveLength(PUBLIC_DEMO_DAY_COUNT);
    expect(snapshot.meals.length).toBeGreaterThan(PUBLIC_DEMO_DAY_COUNT * 3);
    expect(snapshot.profile.display_name).toBe("Alex Morgan");
  });

  it("returns dashboard-ready data for the latest demo day", () => {
    const snapshot = createPublicDemoSnapshot(now);
    const day = getPublicDemoDayData(snapshot);
    expect(day.localDate).toBe(snapshot.endDate);
    expect(day.goal?.id).toBe(snapshot.goals[0].id);
    expect(day.review?.score).toBeTypeOf("number");
    expect(day.timeline.length).toBeGreaterThan(0);
    expect(day.timeline.every((item) => item.href === "/demo")).toBe(true);
  });

  it("creates analytics-ready periods and clamps invalid dates", () => {
    const snapshot = createPublicDemoSnapshot(now);
    const period = getPublicDemoPeriodDataset(snapshot, "2026-08-20", "2026-08-26");
    expect(period.days).toHaveLength(7);
    expect(period.reviews).toHaveLength(7);
    expect(period.meals.length).toBeGreaterThan(20);
    expect(clampPublicDemoDate(snapshot, "1999-01-01")).toBe(snapshot.endDate);
    expect(clampPublicDemoDate(snapshot, "not-a-date")).toBe(snapshot.endDate);
  });
});
