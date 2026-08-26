import { format, parseISO, startOfWeek } from "date-fns";
import Link from "next/link";
import { Activity, CalendarCheck2, ChevronLeft, ChevronRight, Droplets, Footprints, Lightbulb, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { AnalyticsDay, PatternInsight, PeriodAnalytics } from "@/lib/analytics";
import type { PeriodScoreResult } from "@/lib/scoring";
import { MeasurementTrendChart, ScoreTrendChart } from "./period-chart";

type MeasurementPoint = { label: string; value: number | null };

function formatValue(value: number | null, suffix = "") {
  return value == null ? "—" : `${Math.round(value).toLocaleString()}${suffix}`;
}

function comparison(current: number | null, previous: number | null, suffix = "") {
  if (current == null || previous == null || previous === 0) return "No prior comparison";
  const difference = current - previous;
  return `${difference >= 0 ? "+" : ""}${Math.round(difference).toLocaleString()}${suffix} vs prior`;
}

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Utensils }) {
  return <Card><CardContent className="flex items-start justify-between gap-4 p-5"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="number-tabular mt-2 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span></CardContent></Card>;
}

function InsightCard({ insight }: { insight: PatternInsight }) {
  const label = insight.confidence === "high" ? "Strong evidence" : insight.confidence === "medium" ? "Moderate evidence" : "Early signal";
  return <div className="rounded-xl border bg-background/65 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{insight.title}</p><div className="flex gap-2"><Badge variant="secondary" className="capitalize">{insight.category}</Badge><Badge variant="outline">{label}</Badge></div></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{insight.message}</p></div>;
}

export function PeriodView({
  eyebrow,
  title,
  description,
  score,
  days,
  analytics,
  previous,
  insights,
  measurements = [],
  navigation,
}: {
  eyebrow: string;
  title: string;
  description: string;
  score: PeriodScoreResult;
  days: AnalyticsDay[];
  analytics: PeriodAnalytics;
  previous: PeriodAnalytics;
  insights: PatternInsight[];
  measurements?: MeasurementPoint[];
  navigation?: { previousHref?: string; nextHref?: string; currentHref: string };
}) {
  const chartPoints = days.length > 14
    ? Object.entries(days.reduce<Record<string, number[]>>((groups, day) => {
      if (day.score == null) return groups;
      const key = format(startOfWeek(parseISO(day.localDate), { weekStartsOn: 1 }), "yyyy-MM-dd");
      (groups[key] ??= []).push(day.score);
      return groups;
    }, {})).map(([week, scores]) => ({ label: format(parseISO(week), "MMM d"), value: scores.reduce((sum, value) => sum + value, 0) / scores.length }))
    : days.map((day) => ({ label: format(parseISO(day.localDate), "EEE"), value: day.score }));
  const sourceTotal = Object.values(analytics.sourceCounts).reduce((sum, count) => sum + count, 0);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">{eyebrow}</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-muted-foreground">{description}</p></div>{navigation && <div className="flex items-center gap-2">{navigation.previousHref ? <Button variant="outline" size="icon" asChild><Link href={navigation.previousHref} aria-label="Previous period"><ChevronLeft /></Link></Button> : <Button variant="outline" size="icon" disabled aria-label="Previous period unavailable"><ChevronLeft /></Button>}<Button variant="outline" asChild><Link href={navigation.currentHref}>Current</Link></Button>{navigation.nextHref ? <Button variant="outline" size="icon" asChild><Link href={navigation.nextHref} aria-label="Next period"><ChevronRight /></Link></Button> : <Button variant="outline" size="icon" disabled aria-label="Next period unavailable"><ChevronRight /></Button>}</div>}</div>

    <Card className="overflow-hidden border-primary/15 bg-card/90"><CardContent className="grid gap-7 p-6 sm:p-8 lg:grid-cols-[12rem_1fr] lg:items-center"><div className="flex items-center gap-4 lg:block lg:text-center"><div className="relative grid size-28 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--primary) ${(score.score ?? 0) * 3.6}deg, var(--muted) 0deg)` }}><div className="grid size-24 place-items-center rounded-full bg-card"><div><div className="number-tabular text-3xl font-semibold">{score.score == null ? "—" : Math.round(score.score)}</div><div className="text-xs text-muted-foreground">period score</div></div></div></div><div className="lg:mt-2"><div className="text-2xl font-semibold">{score.grade ?? "—"}</div><Badge variant="secondary" className="capitalize">{score.confidence} confidence</Badge></div></div><div><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-primary">Goal alignment</p><h2 className="text-2xl font-semibold tracking-tight">{score.score == null ? "More tracking needed" : "Your period review"}</h2></div><span className="text-sm text-muted-foreground">{score.sufficientlyCompleteDays} sufficient days</span></div><p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{score.score == null ? `A formal grade needs ${eyebrow === "Weekly review" ? "4" : "15"} sufficiently complete days. Your tracked information is still summarized below without treating missing values as zero.` : "This score combines completed-day alignment with your own targets and weights days by their tracking coverage."}</p><Progress value={Math.min(100, score.coverageRatio * 100)} aria-label="Period grading coverage" className="mt-5 h-2" /><p className="mt-2 text-xs text-muted-foreground">{Math.round(score.coverageRatio * 100)}% grading coverage · Scores reflect configured targets, not universal health quality.</p></div></CardContent></Card>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Average calories" value={formatValue(analytics.averageCalories, " kcal")} detail={comparison(analytics.averageCalories, previous.averageCalories, " kcal")} icon={Utensils} />
      <MetricCard label="Average protein" value={formatValue(analytics.averageProteinG, " g")} detail={comparison(analytics.averageProteinG, previous.averageProteinG, " g")} icon={Activity} />
      <MetricCard label="Average water" value={formatValue(analytics.averageWaterMl, " ml")} detail={comparison(analytics.averageWaterMl, previous.averageWaterMl, " ml")} icon={Droplets} />
      <MetricCard label="Average steps" value={formatValue(analytics.averageSteps)} detail={comparison(analytics.averageSteps, previous.averageSteps)} icon={Footprints} />
    </div>

    <div className="grid gap-6 lg:grid-cols-[1.45fr_.75fr]">
      <Card><CardHeader><CardTitle>{days.length > 14 ? "Weekly score trend" : "Daily score trend"}</CardTitle><CardDescription>Only completed reviews with a usable score are connected.</CardDescription></CardHeader><CardContent><ScoreTrendChart points={chartPoints} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Tracking coverage</CardTitle><CardDescription>Evidence behind this review.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-muted/55 p-4"><p className="number-tabular text-2xl font-semibold">{analytics.trackedDays}</p><p className="text-xs text-muted-foreground">Tracked days</p></div><div className="rounded-xl bg-muted/55 p-4"><p className="number-tabular text-2xl font-semibold">{analytics.completedDays}</p><p className="text-xs text-muted-foreground">Finished days</p></div><div className="rounded-xl bg-muted/55 p-4"><p className="number-tabular text-2xl font-semibold">{sourceTotal}</p><p className="text-xs text-muted-foreground">Meals logged</p></div><div className="rounded-xl bg-muted/55 p-4"><p className="number-tabular text-2xl font-semibold">{analytics.workoutCount}</p><p className="text-xs text-muted-foreground">Workouts</p></div></div><div><p className="text-sm font-medium">Goal adherence</p><div className="mt-2 flex flex-wrap gap-2">{[["Protein", analytics.proteinHitRate], ["Fiber", analytics.fiberHitRate], ["Water", analytics.hydrationHitRate], ["Steps", analytics.stepHitRate]].map(([label, rate]) => <Badge key={String(label)} variant="outline">{label} · {typeof rate === "number" ? `${Math.round(rate * 100)}%` : "—"}</Badge>)}</div></div><div><p className="text-sm font-medium">Meal sources</p><div className="mt-2 flex flex-wrap gap-2">{Object.entries(analytics.sourceCounts).length ? Object.entries(analytics.sourceCounts).sort((a, b) => b[1] - a[1]).map(([source, count]) => <Badge key={source} variant="outline" className="capitalize">{source.replaceAll("_", " ")} · {count}</Badge>) : <span className="text-sm text-muted-foreground">No meal sources tracked.</span>}</div></div>{analytics.firstMealTime && <p className="text-xs text-muted-foreground">Timing range: {analytics.firstMealTime}–{analytics.finalMealTime} · {analytics.lateMealCount} after cutoff ({Math.round((analytics.lateMealRate ?? 0) * 100)}%).</p>}</CardContent></Card>
    </div>

    <Card><CardHeader><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Lightbulb className="size-5" /></span><div><CardTitle>Pattern insights</CardTitle><CardDescription>Deterministic observations with explicit evidence thresholds.</CardDescription></div></div></CardHeader><CardContent className="space-y-3">{insights.length ? insights.map((insight) => <InsightCard key={insight.id} insight={insight} />) : <div className="grid min-h-36 place-items-center rounded-xl border border-dashed text-center"><div><CalendarCheck2 className="mx-auto mb-3 size-6 text-muted-foreground" /><p className="font-medium">No reliable pattern yet</p><p className="mt-1 max-w-md text-sm text-muted-foreground">Keep logging consistently. Insights appear only when the minimum sample and effect-size rules are met.</p></div></div>}</CardContent></Card>

    {measurements.some((point) => point.value != null) && <Card><CardHeader><CardTitle>Weight trend</CardTitle><CardDescription>Optional measurements you recorded during this period.</CardDescription></CardHeader><CardContent><MeasurementTrendChart points={measurements} unit="kg" /></CardContent></Card>}
  </div>;
}
