import { addMonths, differenceInCalendarDays, format, isValid, min, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { PeriodView } from "@/components/insights/period-view";
import { aggregatePeriod, generateInsights } from "@/lib/analytics";
import { ensureProfile } from "@/lib/data/day";
import { getPeriodDataset } from "@/lib/data/period";
import { dayRangeUtc, localDateInTimezone, monthRange } from "@/lib/dates/timezone";
import { scoreMonth, type ConfidenceLevel } from "@/lib/scoring";
import { createClient, requireUserId } from "@/lib/supabase/server";

export const metadata = { title: "Monthly review" };

export default async function MonthlyPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const supabase = await createClient();
  const userId = await requireUserId();
  const profile = await ensureProfile(supabase, userId);
  const today = localDateInTimezone(new Date(), profile.timezone);
  const params = await searchParams;
  const requested = params.date ?? "";
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(requested) && isValid(parseISO(requested)) ? requested : today;
  const current = monthRange(anchor);
  const actualCurrent = monthRange(today);
  const previousAnchor = format(addMonths(parseISO(current.start), -1), "yyyy-MM-dd");
  const previous = monthRange(previousAnchor);
  const next = monthRange(format(addMonths(parseISO(current.start), 1), "yyyy-MM-dd"));
  const measurementStart = dayRangeUtc(current.start, profile.timezone).start.toISOString();
  const measurementEnd = dayRangeUtc(current.end, profile.timezone).end.toISOString();
  const [dataset, previousDataset, measurementsResult] = await Promise.all([
    getPeriodDataset(supabase, userId, profile.timezone, current.start, current.end),
    getPeriodDataset(supabase, userId, profile.timezone, previous.start, previous.end),
    supabase.from("body_measurements").select("measured_at,weight_kg").eq("user_id", userId).gte("measured_at", measurementStart).lt("measured_at", measurementEnd).order("measured_at"),
  ]);
  if (measurementsResult.error) throw measurementsResult.error;
  const reviewDays = dataset.reviews.flatMap((review) => review.score == null ? [] : [{ score: review.score, coverageRatio: review.coverage_ratio, confidence: review.confidence as ConfidenceLevel }]);
  const elapsedEnd = min([parseISO(today), parseISO(current.end)]);
  const elapsedDays = differenceInCalendarDays(elapsedEnd, parseISO(current.start)) + 1;
  const analytics = aggregatePeriod(dataset.days, dataset.meals);
  const priorAnalytics = aggregatePeriod(previousDataset.days, previousDataset.meals);
  return <PeriodView
    eyebrow="Monthly review"
    title={format(parseISO(current.start), "MMMM yyyy")}
    description={`A calendar-month view in ${profile.timezone}, with evidence-backed patterns and prior-month comparisons.`}
    score={scoreMonth(reviewDays, elapsedDays)}
    days={dataset.days}
    analytics={analytics}
    previous={priorAnalytics}
    insights={generateInsights(dataset.days, dataset.meals, previousDataset, 6)}
    measurements={(measurementsResult.data ?? []).map((measurement) => ({ label: formatInTimeZone(measurement.measured_at, profile.timezone, "MMM d"), value: measurement.weight_kg }))}
    navigation={{ previousHref: `/monthly?date=${previous.start}`, nextHref: next.start <= actualCurrent.start ? `/monthly?date=${next.start}` : undefined, currentHref: "/monthly" }}
  />;
}
