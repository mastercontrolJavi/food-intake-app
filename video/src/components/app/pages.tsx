import type React from "react";
import { AppShell, DESKTOP_VIEWPORT, MOBILE_VIEWPORT, Screen } from "./app-shell";
import { DailyTargetsCard, DayHeading, HeroScoreCard, QuickActionsCard, TimelineCard, type HeroScoreProps } from "./dashboard";
import { LogFoodHeader, RecentMealsCard, ReusableFoodsCard, type RecentMeal } from "./log-food";
import { CoverageCard, InsightsCard, TrendCard } from "./weekly";
import { DAY, WEEK, type FilmMetric, type TimelineEntry } from "../../lib/fixtures";
import type { Orientation } from "../../layout";

/** Full page compositions, laid out at the depicted device width (desktop 1440 / mobile 390). */
export const viewportFor = (o: Orientation) => (o === "landscape" ? DESKTOP_VIEWPORT : MOBILE_VIEWPORT);

type RefFn = (el: HTMLElement | null) => void;
/** Returns the measuring callback for a named element (see usePageRects). */
export type Mark = (key: string) => RefFn;

export function LogFoodPage({
  orientation,
  rootRef,
  mark,
  pressDepth,
}: {
  orientation: Orientation;
  rootRef: React.Ref<HTMLDivElement>;
  mark: Mark;
  pressDepth: number;
}) {
  const width = viewportFor(orientation);
  return (
    <div ref={rootRef} style={{ position: "relative", width }}>
      <Screen width={width} transparent>
        <AppShell width={width} active="" sidebar={false}>
          <div className="mx-auto max-w-3xl space-y-6">
            <div ref={mark("header")}>
              <LogFoodHeader />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div ref={mark("recent")}>
                <RecentMealsCard meals={DAY.recentMeals as RecentMeal[]} pressDepth={pressDepth} targetButtonRef={mark("target")} />
              </div>
              <div ref={mark("reusable")}>
                <ReusableFoodsCard className="h-full" />
              </div>
            </div>
          </div>
        </AppShell>
      </Screen>
    </div>
  );
}

export type TodayState = {
  metrics: FilmMetric[];
  waterActual?: number;
  hero: HeroScoreProps;
  timeline: TimelineEntry[];
  newEntryReveal?: number;
  plus500Press?: number;
  overlay?: React.ReactNode;
  contentStyle?: React.CSSProperties;
};

export function TodayPage({
  orientation,
  rootRef,
  mark,
  state,
}: {
  orientation: Orientation;
  rootRef: React.Ref<HTMLDivElement>;
  mark: Mark;
  state: TodayState;
}) {
  const width = viewportFor(orientation);
  return (
    <div ref={rootRef} style={{ position: "relative", width }}>
      <div style={state.contentStyle}>
        <Screen width={width} transparent>
          <AppShell width={width} active="/today" sidebar={false}>
            <div className="space-y-6">
              <DayHeading heading={DAY.heading} />
              <div ref={mark("hero")}>
                <HeroScoreCard {...state.hero} ringRef={mark("ring")} whyRef={mark("why")} />
              </div>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,.6fr)]">
                <div ref={mark("targets")}>
                  <DailyTargetsCard metrics={state.metrics} waterActual={state.waterActual} waterRowRef={mark("water")} />
                </div>
                <div ref={mark("quick")}>
                  <QuickActionsCard pressed={500} pressDepth={state.plus500Press ?? 0} plus500Ref={mark("plus500")} />
                </div>
              </div>
              <div ref={mark("timeline")}>
                <TimelineCard entries={state.timeline} newEntryReveal={state.newEntryReveal} newRowRef={mark("newRow")} />
              </div>
            </div>
          </AppShell>
        </Screen>
      </div>
      {state.overlay}
    </div>
  );
}

export function WeeklyLowerPage({
  orientation,
  rootRef,
  mark,
  chartReveal,
  insightReveal,
}: {
  orientation: Orientation;
  rootRef: React.Ref<HTMLDivElement>;
  mark: Mark;
  chartReveal: number;
  insightReveal: number[];
}) {
  const width = viewportFor(orientation);
  return (
    <div ref={rootRef} style={{ position: "relative", width }}>
      <Screen width={width} transparent>
        <AppShell width={width} active="/weekly" sidebar={false}>
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.45fr_.75fr]">
              <div ref={mark("chart")}>
                <TrendCard points={WEEK.chartPoints} reveal={chartReveal} />
              </div>
              <div ref={mark("coverage")}>
                <CoverageCard
                  trackedDays={WEEK.trackedDays}
                  completedDays={WEEK.completedDays}
                  mealsLogged={WEEK.mealsLogged}
                  workoutCount={WEEK.workoutCount}
                  hitRates={WEEK.hitRates}
                  sourceCounts={WEEK.sourceCounts as [string, number][]}
                  timing={WEEK.timing}
                />
              </div>
            </div>
            <div ref={mark("insights")}>
              <InsightsCard insights={WEEK.insights} reveal={insightReveal} firstRowRef={mark("firstInsight")} />
            </div>
          </div>
        </AppShell>
      </Screen>
    </div>
  );
}
