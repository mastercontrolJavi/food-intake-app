import { addWeeks, format, parseISO } from "date-fns";
import { PeriodView } from "@/components/insights/period-view";
import { aggregatePeriod, generateInsights } from "@/lib/analytics";
import { goalForLocalDate } from "@/lib/data/mappers";
import { weekRange } from "@/lib/dates/timezone";
import { clampPublicDemoDate, createPublicDemoSnapshot, getPublicDemoPeriodDataset } from "@/lib/demo/public-demo-data";
import { scoreWeek, type ConfidenceLevel } from "@/lib/scoring";

export const metadata = { title: "Demo weekly review" };

export default async function DemoWeeklyPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const snapshot = createPublicDemoSnapshot();
  const anchor = clampPublicDemoDate(snapshot, (await searchParams).date);
  const current = weekRange(anchor);
  const latest = weekRange(snapshot.endDate);
  const previous = weekRange(format(addWeeks(parseISO(current.start), -1), "yyyy-MM-dd"));
  const next = weekRange(format(addWeeks(parseISO(current.start), 1), "yyyy-MM-dd"));
  const dataset = getPublicDemoPeriodDataset(snapshot, current.start, current.end);
  const previousDataset = getPublicDemoPeriodDataset(snapshot, previous.start, previous.end);
  const reviewDays = dataset.reviews.flatMap((review) => review.score == null ? [] : [{ score: review.score, coverageRatio: review.coverage_ratio, confidence: review.confidence as ConfidenceLevel }]);
  const analytics = aggregatePeriod(dataset.days, dataset.meals);
  const priorAnalytics = aggregatePeriod(previousDataset.days, previousDataset.meals);
  const activeGoal = goalForLocalDate(dataset.goals, current.end);

  return <PeriodView
    eyebrow="Weekly review"
    title={`${format(parseISO(current.start), "MMM d")}–${format(parseISO(current.end), "MMM d, yyyy")}`}
    description={`A Monday-to-Sunday view in ${snapshot.timezone}, using fictional portfolio data.`}
    score={scoreWeek(reviewDays, analytics.workoutCount, activeGoal?.weekly_workout_target ?? null)}
    days={dataset.days}
    analytics={analytics}
    previous={priorAnalytics}
    insights={generateInsights(dataset.days, dataset.meals, previousDataset, 5)}
    navigation={{
      previousHref: previous.end >= snapshot.startDate ? `/demo/weekly?date=${previous.start}` : undefined,
      nextHref: next.start <= latest.start ? `/demo/weekly?date=${next.start}` : undefined,
      currentHref: "/demo/weekly",
    }}
  />;
}
