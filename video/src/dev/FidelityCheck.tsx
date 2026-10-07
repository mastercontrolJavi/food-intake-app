import { AbsoluteFill } from "remotion";
import { Eye, X } from "lucide-react";
import { AppShell, DESKTOP_VIEWPORT, Screen } from "../components/app/app-shell";
import { DailyTargetsCard, DayHeading, HeroScoreCard, TimelineCard } from "../components/app/dashboard";
import { Button } from "../components/ui/button";
import { FILM, type FilmMetric, type TimelineEntry } from "../lib/fixtures";
import { ensureFonts } from "../theme/fonts";

/**
 * Dev-only: the public demo's Oct 6 Today page rebuilt at 1440 css px × 2, for a pixel diff against
 * audit/screens/demo-today-desktop-dark.jpg. Not part of the film.
 */
ensureFonts();

export function FidelityCheck() {
  const f = FILM.fidelity;
  return (
    <AbsoluteFill style={{ backgroundColor: "#09120c" }}>
      <div style={{ transform: "scale(2)", transformOrigin: "0 0", width: DESKTOP_VIEWPORT }}>
        <Screen width={DESKTOP_VIEWPORT}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-primary/10 px-4 py-2 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <Eye className="size-4 shrink-0 text-primary" />
              <span className="truncate">
                <strong>Interactive demo.</strong> Everything shown is fictional and read-only.
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button size="sm" variant="outline">Create your own account</Button>
              <Button size="icon-sm" variant="ghost"><X /></Button>
            </div>
          </div>
          <AppShell width={DESKTOP_VIEWPORT}>
            <div className="space-y-6">
              <DayHeading heading={f.heading} />
              <HeroScoreCard
                ringScore={f.score ?? 0}
                displayScore={Math.round(f.score ?? 0)}
                grade={f.grade ?? "—"}
                confidence={f.confidence ?? "insufficient"}
                completed
                summary={f.summary}
              />
              <DailyTargetsCard metrics={f.metrics as FilmMetric[]} />
              <TimelineCard entries={f.timeline as TimelineEntry[]} />
            </div>
          </AppShell>
        </Screen>
      </div>
    </AbsoluteFill>
  );
}
