import { useLayoutEffect, useRef, useState } from "react";
import { Lightbulb } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { continueRender, delayRender } from "remotion";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import type { Insight } from "../../lib/fixtures";

/**
 * Rebuild of the lower half of PeriodView (src/components/insights/period-view.tsx + period-chart.tsx):
 * score-trend chart card, tracking-coverage card and pattern-insights card, same class strings. The
 * chart is the app's own Recharts AreaChart config, rendered at a measured fixed width (ResponsiveContainer
 * resolves asynchronously) with animation off; the film reveals it with a frame-driven clip.
 */
type Point = { label: string; value: number | null };

function useMeasuredWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [handle] = useState(() => delayRender("Measuring chart width"));
  useLayoutEffect(() => {
    if (ref.current) setWidth(ref.current.offsetWidth);
    continueRender(handle);
  }, [handle]);
  return { ref, width };
}

export function ScoreTrendChart({ points, reveal = 1 }: { points: Point[]; reveal?: number }) {
  const { ref, width } = useMeasuredWidth();
  return (
    <div ref={ref} className="h-64 w-full" role="img" aria-label="Daily score trend chart">
      {width != null && (
        <div style={{ clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)` }}>
          <AreaChart width={width} height={256} data={points} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="score-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} minTickGap={18} />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
            <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} fill="url(#score-fill)" connectNulls={false} isAnimationActive={false} />
          </AreaChart>
        </div>
      )}
    </div>
  );
}

export function TrendCard({ points, reveal, className }: { points: Point[]; reveal?: number; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{points.length > 14 ? "Weekly score trend" : "Daily score trend"}</CardTitle>
        <CardDescription>Only completed reviews with a usable score are connected.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScoreTrendChart points={points} reveal={reveal} />
      </CardContent>
    </Card>
  );
}

export function CoverageCard({
  trackedDays,
  completedDays,
  mealsLogged,
  workoutCount,
  hitRates,
  sourceCounts,
  timing,
  className,
}: {
  trackedDays: number;
  completedDays: number;
  mealsLogged: number;
  workoutCount: number;
  hitRates: Record<"protein" | "fiber" | "water" | "steps", number | null>;
  sourceCounts: [string, number][];
  timing: { first: string; final: string | null; late: number; lateRate: number | null } | null;
  className?: string;
}) {
  const adherence: [string, number | null][] = [["Protein", hitRates.protein], ["Fiber", hitRates.fiber], ["Water", hitRates.water], ["Steps", hitRates.steps]];
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Tracking coverage</CardTitle>
        <CardDescription>Evidence behind this review.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {[[trackedDays, "Tracked days"], [completedDays, "Finished days"], [mealsLogged, "Meals logged"], [workoutCount, "Workouts"]].map(([value, label]) => (
            <div key={String(label)} className="rounded-xl bg-muted/55 p-4">
              <p className="number-tabular text-2xl font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-sm font-medium">Goal adherence</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {adherence.map(([label, rate]) => (
              <Badge key={label} variant="outline">{label} · {typeof rate === "number" ? `${Math.round(rate * 100)}%` : "—"}</Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">Meal sources</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sourceCounts.map(([source, count]) => (
              <Badge key={source} variant="outline" className="capitalize">{source.replaceAll("_", " ")} · {count}</Badge>
            ))}
          </div>
        </div>
        {timing && (
          <p className="text-xs text-muted-foreground">
            Timing range: {timing.first}–{timing.final} · {timing.late} after cutoff ({Math.round((timing.lateRate ?? 0) * 100)}%).
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function evidenceLabel(confidence: string) {
  return confidence === "high" ? "Strong evidence" : confidence === "medium" ? "Moderate evidence" : "Early signal";
}

export function InsightRow({ insight, reveal = 1 }: { insight: Insight; reveal?: number }) {
  return (
    <div className="rounded-xl border bg-background/65 p-4" style={{ opacity: reveal, transform: `translateY(${(1 - reveal) * 16}px)` }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{insight.title}</p>
        <div className="flex gap-2">
          <Badge variant="secondary" className="capitalize">{insight.category}</Badge>
          <Badge variant="outline">{evidenceLabel(insight.confidence)}</Badge>
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{insight.message}</p>
    </div>
  );
}

export function InsightsCard({
  insights,
  reveal,
  className,
  firstRowRef,
}: {
  insights: Insight[];
  reveal?: number[];
  className?: string;
  firstRowRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Lightbulb className="size-5" /></span>
          <div>
            <CardTitle>Pattern insights</CardTitle>
            <CardDescription>Deterministic observations with explicit evidence thresholds.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => (
          <div key={insight.id} ref={i === 0 ? firstRowRef : undefined}>
            <InsightRow insight={insight} reveal={reveal?.[i] ?? 1} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
