import { addWeeks, format, isValid, parseISO } from "date-fns";
import { PeriodView } from "@/components/insights/period-view";
import { aggregatePeriod, generateInsights } from "@/lib/analytics";
import { getPeriodDataset } from "@/lib/data/period";
import { ensureProfile } from "@/lib/data/day";
import { goalForLocalDate } from "@/lib/data/mappers";
import { localDateInTimezone, weekRange } from "@/lib/dates/timezone";
import { scoreWeek, type ConfidenceLevel } from "@/lib/scoring";
import { createClient, requireUserId } from "@/lib/supabase/server";

export const metadata = { title: "Weekly review" };

export default async function WeeklyPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const supabase = await createClient();
  const userId = await requireUserId();
  const profile = await ensureProfile(supabase, userId);
  const today = localDateInTimezone(new Date(), profile.timezone);
  const params = await searchParams;
  const requested = params.date ?? "";
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(requested) && isValid(parseISO(requested)) ? requested : today;
  const current = weekRange(anchor);
  const actualCurrent = weekRange(today);
  const previous = weekRange(format(addWeeks(parseISO(current.start), -1), "yyyy-MM-dd"));
  const next = weekRange(format(addWeeks(parseISO(current.start), 1), "yyyy-MM-dd"));
  const [dataset, previousDataset] = await Promise.all([
    getPeriodDataset(supabase, userId, profile.timezone, current.start, current.end),
    getPeriodDataset(supabase, userId, profile.timezone, previous.start, previous.end),
  ]);
  const reviewDays = dataset.reviews.flatMap((review) => review.score == null ? [] : [{ score: review.score, coverageRatio: review.coverage_ratio, confidence: review.confidence as ConfidenceLevel }]);
  const activeGoal = goalForLocalDate(dataset.goals, current.end);
  const analytics = aggregatePeriod(dataset.days, dataset.meals);
  const priorAnalytics = aggregatePeriod(previousDataset.days, previousDataset.meals);
  return <PeriodView
    eyebrow="Weekly review"
    title={`${format(parseISO(current.start), "MMM d")}–${format(parseISO(current.end), "MMM d, yyyy")}`}
    description={`A Monday-to-Sunday view in ${profile.timezone}, with comparisons to the prior week.`}
    score={scoreWeek(reviewDays, analytics.workoutCount, activeGoal?.weekly_workout_target ?? null)}
    days={dataset.days}
    analytics={analytics}
    previous={priorAnalytics}
    insights={generateInsights(dataset.days, dataset.meals, previousDataset, 5)}
    navigation={{ previousHref: `/weekly?date=${previous.start}`, nextHref: next.start <= actualCurrent.start ? `/weekly?date=${next.start}` : undefined, currentHref: "/weekly" }}
  />;
}
