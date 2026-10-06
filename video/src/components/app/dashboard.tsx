import type React from "react";
import { Activity, Droplets, Info, MoreHorizontal, Plus, Utensils } from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Glow, LiquidGlassCard } from "../ui/liquid-glass";
import { ProgressBar } from "../ui/progress-bar";
import type { FilmMetric, TimelineEntry } from "../../lib/fixtures";

/**
 * Rebuild of the signed-in Today dashboard (src/components/dashboard/dashboard-view.tsx non-demo branch,
 * progress-card.tsx, score-details-dialog trigger) with the app's class strings. Values that animate in
 * the film are passed in as props; nothing here animates on its own.
 */

function confidenceLabel(value: string) {
  return value[0].toUpperCase() + value.slice(1);
}

export function DayHeading({ heading, eyebrow = "Today" }: { heading: string; eyebrow?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{heading}</h1>
      </div>
    </div>
  );
}

export type HeroScoreProps = {
  /** Score driving the conic ring (may be fractional while sweeping). */
  ringScore: number;
  /** Integer shown in the centre. */
  displayScore: number;
  grade: string;
  confidence: string;
  completed?: boolean;
  summary: React.ReactNode;
  whyPressed?: number; // 0..1 press depth on "Why this score?"
  whyRef?: React.Ref<HTMLButtonElement>;
  ringRef?: React.Ref<HTMLDivElement>;
};

export function HeroScoreCard({ ringScore, displayScore, grade, confidence, completed = false, summary, whyPressed = 0, whyRef, ringRef }: HeroScoreProps) {
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <Glow size={288} color="var(--primary)" opacity={0.16} style={{ top: -64, left: "25%" }} />
        <Glow size={288} color="oklch(68.5% 0.169 237.323)" opacity={0.08} style={{ bottom: -64, right: "25%" }} />
      </div>
      <LiquidGlassCard className="w-full border border-white/25 bg-card/50 dark:border-white/10 dark:bg-white/5">
        <div className="relative z-30 grid gap-8 p-6 sm:p-8 lg:grid-cols-[14rem_1fr] lg:items-center">
          <div className="flex items-center gap-5 lg:block lg:text-center">
            <div
              ref={ringRef}
              className="relative grid size-32 shrink-0 place-items-center rounded-full"
              style={{ background: `conic-gradient(var(--primary) ${ringScore * 3.6}deg, var(--muted) 0deg)` }}
            >
              <div className="grid size-[7rem] place-items-center rounded-full bg-card">
                <div>
                  <div className="number-tabular text-4xl font-semibold tracking-tight">{displayScore}</div>
                  <div className="text-xs text-muted-foreground">out of 100</div>
                </div>
              </div>
            </div>
            <div className="lg:mt-3">
              <div className="text-3xl font-semibold">{grade}</div>
              <Badge variant="secondary">{confidenceLabel(confidence)} confidence</Badge>
            </div>
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-primary">{completed ? "Finished day" : "Live alignment"}</p>
                <h2 className="text-2xl font-semibold tracking-tight">{completed ? "Your daily review" : "How today is tracking"}</h2>
              </div>
              <Button
                ref={whyRef}
                variant="ghost"
                size="sm"
                className={cn(whyPressed > 0 && "bg-muted text-foreground")}
                style={{ transform: `translateY(${whyPressed}px)` }}
              >
                <Info /> Why this score?
              </Button>
            </div>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">{summary}</p>
            <p className="mt-4 text-xs text-muted-foreground">Scores measure alignment with your configured targets, not universal health quality.</p>
          </div>
        </div>
      </LiquidGlassCard>
    </div>
  );
}

export function QuickActionsCard({
  pressed,
  pressDepth = 0,
  plus500Ref,
  className,
}: {
  pressed?: 250 | 500 | 750;
  pressDepth?: number;
  plus500Ref?: React.Ref<HTMLButtonElement>;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
        <CardDescription>Designed for a few seconds, not a few minutes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {([250, 500, 750] as const).map((volume) => (
            <Button
              key={volume}
              ref={volume === 500 ? plus500Ref : undefined}
              type="button"
              variant="outline"
              className={cn("h-12 w-full", pressed === volume && pressDepth > 0 && "dark:bg-input/50")}
              style={pressed === volume ? { transform: `translateY(${pressDepth}px)` } : undefined}
            >
              <Droplets /> +{volume}
            </Button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Button className="h-11"><Utensils /> Log food</Button>
          <Button variant="secondary" className="h-11"><Droplets /> Drink</Button>
          <Button variant="secondary" className="h-11"><Activity /> Activity</Button>
        </div>
        <Button type="button" variant="outline" className="h-11 w-full">Finish day</Button>
      </CardContent>
    </Card>
  );
}

const toneClass: Record<string, string> = {
  rose: "text-rose-600 dark:text-rose-400",
  amber: "text-amber-700 dark:text-amber-400",
  emerald: "text-emerald-700 dark:text-emerald-400",
  muted: "text-muted-foreground",
};

export function MetricRow({ metric, actualOverride, rowRef }: { metric: FilmMetric; actualOverride?: number; rowRef?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={rowRef} className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium">{metric.label}</div>
          <div className="number-tabular text-xs text-muted-foreground">{metric.ofTarget ?? "Not tracked yet"}</div>
        </div>
        {metric.roundedScore != null && (
          <div className="hidden shrink-0 text-right sm:block">
            <div className="number-tabular text-sm font-semibold">{metric.roundedScore}%</div>
          </div>
        )}
      </div>
      <ProgressBar currentValue={actualOverride ?? metric.actual} targetValue={metric.target} label={`${metric.label} intake progress`} />
      {metric.status && <p className={`hidden text-xs font-medium sm:block ${toneClass[metric.status.tone]}`}>{metric.status.label}</p>}
    </div>
  );
}

export function DailyTargetsCard({
  metrics,
  waterActual,
  waterRowRef,
  className,
}: {
  metrics: FilmMetric[];
  waterActual?: number;
  waterRowRef?: React.Ref<HTMLDivElement>;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Daily targets</CardTitle>
        <CardDescription>
          Green shows intake up to your target; amber or red isolates any overage. Alignment scores measure target accuracy.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {metrics.filter((m) => m.configured).map((m) => (
          <MetricRow
            key={m.id}
            metric={m}
            actualOverride={m.id === "waterMl" ? waterActual : undefined}
            rowRef={m.id === "waterMl" ? waterRowRef : undefined}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export function TimelineCard({
  entries,
  newEntryReveal = 1,
  newRowRef,
  className,
}: {
  entries: TimelineEntry[];
  /** 0..1 entrance of the row flagged isNew. */
  newEntryReveal?: number;
  newRowRef?: React.Ref<HTMLDivElement>;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>{`${entries.length} entries logged`}</CardDescription>
        </div>
        <Button variant="outline" size="sm"><Plus /> Add</Button>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {entries.map((item) => {
            const isNew = Boolean(item.isNew);
            const t = isNew ? newEntryReveal : 1;
            return (
              <div
                key={`${item.time}-${item.title}`}
                ref={isNew ? newRowRef : undefined}
                className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 py-4"
                style={isNew ? { opacity: t, transform: `translateY(${(1 - t) * 12}px)` } : undefined}
              >
                <time className="number-tabular text-xs text-muted-foreground">{item.time}</time>
                <div className="min-w-0 rounded-md">
                  <div className="truncate font-medium capitalize">{item.title}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {item.detail}
                    {item.score != null ? ` · Meal score ${item.score}` : ""}
                  </div>
                </div>
                <Button variant="ghost" size="icon" aria-label="Entry actions">
                  <MoreHorizontal />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
