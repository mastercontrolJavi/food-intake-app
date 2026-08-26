import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

export function localDateInTimezone(date: Date, timezone: string): string {
  return format(toZonedTime(date, timezone), "yyyy-MM-dd");
}

export function localDateTimeInput(date: Date, timezone: string): string {
  return format(toZonedTime(date, timezone), "yyyy-MM-dd'T'HH:mm");
}

export function zonedDateTimeToUtc(value: string, timezone: string): Date {
  return fromZonedTime(value, timezone);
}

export function dayRangeUtc(localDate: string, timezone: string): { start: Date; end: Date } {
  const start = fromZonedTime(`${localDate}T00:00:00`, timezone);
  const end = fromZonedTime(`${format(addDays(new Date(`${localDate}T12:00:00`), 1), "yyyy-MM-dd")}T00:00:00`, timezone);
  return { start, end };
}

export function weekRange(localDate: string): { start: string; end: string } {
  const anchor = new Date(`${localDate}T12:00:00`);
  return {
    start: format(startOfWeek(anchor, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    end: format(endOfWeek(anchor, { weekStartsOn: 1 }), "yyyy-MM-dd"),
  };
}

export function monthRange(localDate: string): { start: string; end: string } {
  const anchor = new Date(`${localDate}T12:00:00`);
  return { start: format(startOfMonth(anchor), "yyyy-MM-dd"), end: format(endOfMonth(anchor), "yyyy-MM-dd") };
}
