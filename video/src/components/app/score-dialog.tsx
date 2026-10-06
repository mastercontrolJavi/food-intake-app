import type React from "react";
import { XIcon } from "lucide-react";
import { Button } from "../ui/button";
import type { FilmMetric } from "../../lib/fixtures";

/**
 * Rebuild of ScoreDetailsDialog (src/components/dashboard/score-details-dialog.tsx) inside the app's
 * DialogContent shell (src/components/ui/dialog.tsx), same class strings. Per-row reveal and the
 * weight-label refs exist only so the film can land each ring segment on its row.
 */
export function ScoreDialog({
  metrics,
  score,
  rowReveal,
  resultReveal = 1,
  weightTint,
  rowLight,
  resultTint = 0,
  weightRefs,
  style,
  className,
}: {
  metrics: FilmMetric[];
  score: number;
  /** 0..1 per configured metric, in display order. */
  rowReveal?: number[];
  resultReveal?: number;
  /** 0..1 per row: momentary primary tint on "Weight NN%" as a ring segment lands (film-only emphasis). */
  weightTint?: number[];
  /** 0..1 per row: momentary row highlight as its ring segment lights (film-only emphasis, no layout change). */
  rowLight?: number[];
  resultTint?: number;
  weightRefs?: React.MutableRefObject<(HTMLDivElement | null)[]>;
  style?: React.CSSProperties;
  className?: string;
}) {
  const configured = metrics.filter((m) => m.configured);
  return (
    <div
      data-slot="dialog-content"
      className={
        "grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-sm relative " +
        (className ?? "")
      }
      style={style}
    >
      <div className="flex flex-col gap-2">
        <div className="font-heading text-base leading-none font-medium">Transparent score breakdown</div>
        <div className="text-sm text-muted-foreground">
          Only configured metrics with tracked data contribute. Missing data is excluded and the available weights are normalized.
        </div>
      </div>
      <div className="divide-y">
        {configured.map((metric, i) => {
          const t = rowReveal?.[i] ?? 1;
          return (
            <div key={metric.id} className="relative grid grid-cols-[1fr_auto] gap-4 py-3">
              {rowLight?.[i] ? (
                <div
                  aria-hidden
                  className="absolute inset-y-1 -inset-x-2 rounded-lg"
                  style={{ background: "color-mix(in oklab, var(--primary) 12%, transparent)", opacity: rowLight[i] }}
                />
              ) : null}
              <div style={{ opacity: t, transform: `translateY(${(1 - t) * 6}px)` }}>
                <div className="font-medium">{metric.label}</div>
                <div className="text-sm text-muted-foreground">
                  {metric.available && metric.slashTarget ? metric.slashTarget : "Not enough tracked data"}
                </div>
              </div>
              <div className="text-right" style={{ opacity: t, transform: `translateY(${(1 - t) * 6}px)` }}>
                <div className="number-tabular font-semibold">{metric.roundedScore == null ? "—" : `${metric.roundedScore}/100`}</div>
                <div
                  ref={(el) => {
                    if (weightRefs) weightRefs.current[i] = el;
                  }}
                  className="text-xs text-muted-foreground"
                  style={weightTint?.[i] ? { color: `color-mix(in oklab, var(--primary) ${Math.round(weightTint[i] * 100)}%, var(--muted-foreground))` } : undefined}
                >
                  Weight {metric.weight}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div
        className="flex items-center justify-between rounded-xl bg-muted p-4"
        style={{ opacity: resultReveal, transform: `translateY(${(1 - resultReveal) * 8}px)` }}
      >
        <span className="font-medium">Normalized result</span>
        <strong
          className="number-tabular text-xl"
          style={resultTint ? { color: `color-mix(in oklab, var(--primary) ${Math.round(resultTint * 100)}%, var(--popover-foreground))` } : undefined}
        >{`${score} / 100`}</strong>
      </div>
      <Button variant="ghost" className="absolute top-2 right-2" size="icon-sm">
        <XIcon />
      </Button>
    </div>
  );
}
