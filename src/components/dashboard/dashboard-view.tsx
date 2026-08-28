import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Droplets,
  LockKeyhole,
  Plus,
  Utensils,
  WandSparkles,
} from "lucide-react";
import { finishDayAction, quickWaterAction } from "@/app/actions/logs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatDayHeading, type DayPageData } from "@/lib/data/day";
import { formatAmount } from "@/lib/format/number";
import { scoreDay, type ScoreMetric } from "@/lib/scoring";
import { ScoreDetailsDialog } from "./score-details-dialog";
import { TimelineActions } from "./timeline-actions";

function confidenceLabel(value: string) {
  return value[0].toUpperCase() + value.slice(1);
}

function MetricRow({ metric }: { metric: ScoreMetric }) {
  const progress = metric.actual != null && metric.target != null && metric.target > 0
    ? Math.min(100, (metric.actual / metric.target) * 100)
    : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium">{metric.label}</div>
          <div className="text-xs text-muted-foreground">
            {metric.target == null
              ? "No target configured"
              : metric.actual == null
                ? "Not tracked yet"
                : `${formatAmount(metric.actual, metric.unit)} of ${formatAmount(metric.target, metric.unit)}`}
          </div>
        </div>
        {metric.score != null && <span className="number-tabular text-sm font-semibold">{Math.round(metric.score)}</span>}
      </div>
      <Progress value={progress} aria-label={`${metric.label} progress`} className="h-2" />
    </div>
  );
}

type DashboardViewProps = {
  day: DayPageData;
  historyMode?: boolean;
  demoMode?: boolean;
  dateBounds?: { start: string; end: string };
};

export function DashboardView({ day, historyMode = false, demoMode = false, dateBounds }: DashboardViewProps) {
  const live = scoreDay(day.totals, day.goals);
  const persistedMetrics = Array.isArray(day.review?.metric_scores)
    ? day.review.metric_scores as unknown as ScoreMetric[]
    : null;
  const completed = Boolean(day.status?.completed && day.review);
  const score = completed ? day.review?.score ?? null : live.score;
  const grade = completed ? day.review?.grade ?? null : live.grade;
  const confidence = completed ? day.review?.confidence ?? "insufficient" : live.confidence;
  const summary = completed ? day.review?.generated_summary ?? live.summary : live.summary;
  const metrics = persistedMetrics ?? live.metrics;
  const date = parseISO(day.localDate);
  const previous = format(addDays(date, -1), "yyyy-MM-dd");
  const next = format(addDays(date, 1), "yyyy-MM-dd");
  const historyPath = demoMode ? "/demo/history" : "/history";
  const previousAvailable = !dateBounds || previous >= dateBounds.start;
  const nextAvailable = !dateBounds || next <= dateBounds.end;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">{historyMode ? "Daily review" : demoMode ? "Demo snapshot" : "Today"}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{formatDayHeading(day.localDate)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Times shown in {day.timezone}</p>
        </div>
        {historyMode && (
          <div className="flex flex-wrap items-center gap-2">
            {previousAvailable ? (
              <Button variant="outline" size="icon" asChild>
                <Link href={`${historyPath}?date=${previous}`} aria-label="Previous day"><ChevronLeft /></Link>
              </Button>
            ) : (
              <Button variant="outline" size="icon" disabled aria-label="Previous day unavailable"><ChevronLeft /></Button>
            )}
            <form action={historyPath} method="get">
              <Input type="date" name="date" defaultValue={day.localDate} min={dateBounds?.start} max={dateBounds?.end} aria-label="Choose history date" className="w-40" />
            </form>
            <Button variant="outline" asChild><Link href={historyPath}>{demoMode ? "Latest" : "Today"}</Link></Button>
            {nextAvailable ? (
              <Button variant="outline" size="icon" asChild>
                <Link href={`${historyPath}?date=${next}`} aria-label="Next day"><ChevronRight /></Link>
              </Button>
            ) : (
              <Button variant="outline" size="icon" disabled aria-label="Next day unavailable"><ChevronRight /></Button>
            )}
          </div>
        )}
      </div>

      {!day.goal && (
        <Alert>
          <WandSparkles />
          <AlertTitle>Set your targets to unlock grading</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            Intake grades alignment with goals you choose—it does not prescribe them.
            <Button asChild size="sm"><Link href="/settings?tab=goals">Configure goals</Link></Button>
          </AlertDescription>
        </Alert>
      )}
      {day.review?.is_stale && (
        <Alert variant="destructive">
          <AlertTitle>Review update in progress</AlertTitle>
          <AlertDescription>This day changed after completion. Refresh to load the recalculated review.</AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden border-primary/15 bg-card/90">
        <CardContent className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[14rem_1fr] lg:items-center">
          <div className="flex items-center gap-5 lg:block lg:text-center">
            <div className="relative grid size-32 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--primary) ${(score ?? 0) * 3.6}deg, var(--muted) 0deg)` }}>
              <div className="grid size-[7rem] place-items-center rounded-full bg-card">
                <div>
                  <div className="number-tabular text-4xl font-semibold tracking-tight">{score == null ? "—" : Math.round(score)}</div>
                  <div className="text-xs text-muted-foreground">out of 100</div>
                </div>
              </div>
            </div>
            <div className="lg:mt-3">
              <div className="text-3xl font-semibold">{grade ?? "—"}</div>
              <Badge variant="secondary">{confidenceLabel(confidence)} confidence</Badge>
            </div>
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-primary">{completed ? "Finished day" : "Live alignment"}</p>
                <h2 className="text-2xl font-semibold tracking-tight">{completed ? "Your daily review" : "How today is tracking"}</h2>
              </div>
              <ScoreDetailsDialog metrics={metrics} score={score} />
            </div>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">{summary}</p>
            <p className="mt-4 text-xs text-muted-foreground">Scores measure alignment with your configured targets, not universal health quality.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>Unknown values remain unknown and do not count as zero.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {live.metrics.filter((metric) => metric.configured).map((metric) => <MetricRow key={metric.id} metric={metric} />)}
            {!live.metrics.some((metric) => metric.configured) && <p className="text-sm text-muted-foreground sm:col-span-2">Configure goals to see daily progress.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{demoMode ? "Demo controls" : "Quick actions"}</CardTitle>
            <CardDescription>{demoMode ? "Editing is disabled so the public example always resets cleanly." : "Designed for a few seconds, not a few minutes."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {demoMode ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {[250, 500, 750].map((volume) => <Button key={volume} disabled variant="outline" className="h-12"><Droplets /> +{volume}</Button>)}
                </div>
                <Button asChild className="h-11 w-full"><Link href="/login"><LockKeyhole /> Create an account to log entries</Link></Button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {[250, 500, 750].map((volume) => (
                    <form key={volume} action={quickWaterAction}>
                      <input type="hidden" name="volumeMl" value={volume} />
                      <Button type="submit" variant="outline" className="h-12 w-full"><Droplets /> +{volume}</Button>
                    </form>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Button asChild className="h-11"><Link href="/log/food"><Utensils /> Log food</Link></Button>
                  <Button asChild variant="secondary" className="h-11"><Link href="/log/water"><Droplets /> Drink</Link></Button>
                  <Button asChild variant="secondary" className="h-11"><Link href="/log/activity"><Activity /> Activity</Link></Button>
                </div>
                {!historyMode && (
                  <form action={finishDayAction}>
                    <input type="hidden" name="localDate" value={day.localDate} />
                    <Button type="submit" variant="outline" className="h-11 w-full">{completed ? "Recalculate finished day" : "Finish day"}</Button>
                  </form>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>{day.timeline.length ? `${day.timeline.length} entries logged` : "No food, drinks, or activity logged yet."}</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={demoMode ? "/login" : "/log/food"}><Plus /> {demoMode ? "Try Intake" : "Add"}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {day.timeline.length === 0 ? (
            <div className="grid min-h-40 place-items-center rounded-xl border border-dashed text-center">
              <div>
                <Utensils className="mx-auto mb-3 size-6 text-muted-foreground" />
                <p className="font-medium">No food logged yet</p>
                <p className="text-sm text-muted-foreground">Start with what you ate—nutrition can stay unknown.</p>
                <Button asChild className="mt-4"><Link href={demoMode ? "/login" : "/log/food"}>{demoMode ? "Create an account" : "Log food"}</Link></Button>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {day.timeline.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 py-4">
                  <time className="number-tabular text-xs text-muted-foreground">{item.timeLabel}</time>
                  {demoMode ? (
                    <div className="min-w-0">
                      <div className="truncate font-medium capitalize">{item.title}</div>
                      <div className="truncate text-sm text-muted-foreground">{item.detail}{item.score != null ? ` · Meal score ${Math.round(item.score)}` : ""}</div>
                    </div>
                  ) : (
                    <Link href={item.href} className="min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <div className="truncate font-medium capitalize">{item.title}</div>
                      <div className="truncate text-sm text-muted-foreground">{item.detail}{item.score != null ? ` · Meal score ${Math.round(item.score)}` : ""}</div>
                    </Link>
                  )}
                  {!demoMode && <TimelineActions id={item.id} kind={item.kind} />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
