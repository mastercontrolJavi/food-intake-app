import { describe, expect, it } from "vitest";
import { dayRangeUtc, isValidTimezone, localDateInTimezone, weekRange, zonedDateTimeToUtc } from "@/lib/dates/timezone";

describe("timezone-safe local dates", () => {
  it("places instants around midnight in the correct Los Angeles day", () => {
    expect(localDateInTimezone(new Date("2026-08-26T06:45:00Z"), "America/Los_Angeles")).toBe("2026-08-25");
    expect(localDateInTimezone(new Date("2026-08-26T07:15:00Z"), "America/Los_Angeles")).toBe("2026-08-26");
  });

  it("converts a late local meal to UTC without slicing ISO strings", () => {
    expect(zonedDateTimeToUtc("2026-08-25T23:45", "America/Los_Angeles").toISOString()).toBe("2026-08-26T06:45:00.000Z");
  });

  it("handles the spring DST transition as a 23-hour local day", () => {
    const range = dayRangeUtc("2026-03-08", "America/New_York");
    expect((range.end.getTime() - range.start.getTime()) / 3_600_000).toBe(23);
    expect(zonedDateTimeToUtc("2026-03-08T01:30", "America/New_York").toISOString()).toBe("2026-03-08T06:30:00.000Z");
    expect(zonedDateTimeToUtc("2026-03-08T03:30", "America/New_York").toISOString()).toBe("2026-03-08T07:30:00.000Z");
  });

  it("handles the fall DST transition as a 25-hour local day", () => {
    const range = dayRangeUtc("2026-11-01", "America/New_York");
    expect((range.end.getTime() - range.start.getTime()) / 3_600_000).toBe(25);
  });

  it("shows that one instant can belong to different local dates after a timezone change", () => {
    const instant = new Date("2026-08-26T01:00:00Z");
    expect(localDateInTimezone(instant, "Europe/Paris")).toBe("2026-08-26");
    expect(localDateInTimezone(instant, "America/Los_Angeles")).toBe("2026-08-25");
  });

  it("validates IANA zones and uses Monday week boundaries", () => {
    expect(isValidTimezone("America/Mexico_City")).toBe(true);
    expect(isValidTimezone("Not/A_Zone")).toBe(false);
    expect(weekRange("2026-08-26")).toEqual({ start: "2026-08-24", end: "2026-08-30" });
  });

  it("rejects ambiguous legacy abbreviations even though Intl resolves them silently", () => {
    // "CST" is Central Standard Time in multiple countries with different DST rules.
    // Intl.DateTimeFormat silently resolves it to America/Chicago (which observes DST)
    // instead of throwing, so isValidTimezone must reject it explicitly rather than
    // relying on the constructor not throwing.
    expect(isValidTimezone("CST")).toBe(false);
    expect(isValidTimezone("PST")).toBe(false);
    expect(isValidTimezone("EST")).toBe(false);
    expect(isValidTimezone("UTC")).toBe(true);
  });
});
