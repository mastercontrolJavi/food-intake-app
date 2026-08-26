import { addMonths, differenceInCalendarDays, format, min, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { PeriodView } from "@/components/insights/period-view";
import { aggregatePeriod, generateInsights } from "@/lib/analytics";
import { monthRange } from "@/lib/dates/timezone";
import { clampPublicDemoDate, createPublicDemoSnapshot, getPublicDemoMeasurements, getPublicDemoPeriodDataset } from "@/lib/demo/public-demo-data";
import { scoreMonth, type ConfidenceLevel } from "@/lib/scoring";

export const metadata = { title: "Demo monthly review" };

export default async function DemoMonthlyPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const snapshot = createPublicDemoSnapshot();
  const anchor = clampPublicDemoDate(snapshot, (await searchParams).date);
  const current = monthRange(anchor);
  const latest = monthRange(snapshot.endDate);
  const previous = monthRange(format(addMonths(parseISO(current.start), -1), "yyyy-MM-dd"));
  const next = monthRange(format(addMonths(parseISO(current.start), 1), "yyyy-MM-dd"));
  const dataset = getPublicDemoPeriodDataset(snapshot, current.start, current.end);
  const previousDataset = getPublicDemoPeriodDataset(snapshot, previous.start, previous.end);
  const reviewDays = dataset.reviews.flatMap((review) => review.score == null ? [] : [{ score: review.score, coverageRatio: review.coverage_ratio, confidence: review.confidence as ConfidenceLevel }]);
  const elapsedEnd = min([parseISO(snapshot.endDate), parseISO(current.end)]);
  const elapsedDays = differenceInCalendarDays(elapsedEnd, parseISO(current.start)) + 1;
  const analytics = aggregatePeriod(dataset.days, dataset.meals);
  const priorAnalytics = aggregatePeriod(previousDataset.days, previousDataset.meals);
  const measurements = getPublicDemoMeasurements(snapshot, current.start, current.end).map((measurement) => ({
    label: formatInTimeZone(measurement.measured_at, snapshot.timezone, "MMM d"),
    value: measurement.weight_kg,
  }));

  return <PeriodView
    eyebrow="Monthly review"
    title={format(parseISO(current.start), "MMMM yyyy")}
    description={`A calendar-month view in ${snapshot.timezone}, with fictional trends and prior-month comparisons.`}
    score={scoreMonth(reviewDays, elapsedDays)}
    days={dataset.days}
    analytics={analytics}
    previous={priorAnalytics}
    insights={generateInsights(dataset.days, dataset.meals, previousDataset, 6)}
    measurements={measurements}
    navigation={{
      previousHref: previous.end >= snapshot.startDate ? `/demo/monthly?date=${previous.start}` : undefined,
      nextHref: next.start <= latest.start ? `/demo/monthly?date=${next.start}` : undefined,
      currentHref: "/demo/monthly",
    }}
  />;
}
