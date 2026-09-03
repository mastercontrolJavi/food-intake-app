import { UtensilsCrossed } from "lucide-react";

import { SCORE_WEIGHTS } from "@/lib/scoring";
import { cn } from "@/lib/utils";

/**
 * Brand mark for the login screen: the daily intake dial.
 *
 * The outer ring is segmented by the app's real scoring weights (calories,
 * protein, water, steps, fiber, carbs, fat), and the inner arcs echo the daily
 * progress rings on the dashboard. Every arc uses `pathLength={100}` so dash
 * values are read as percentages regardless of radius.
 */

const CENTER = 100;
const WEIGHT_RING_RADIUS = 88;
const SEGMENT_GAP = 2.4;

// Illustrative day used for the marketing mark only — not real user data.
const PROGRESS_ARCS = [
  { id: "nutrition", radius: 72, value: 86, width: 6, className: "text-primary" },
  { id: "hydration", radius: 57, value: 68, width: 5, className: "text-primary/45" },
  { id: "movement", radius: 42, value: 92, width: 4, className: "text-primary/25" },
] as const;

function weightSegments() {
  let start = 0;
  return Object.entries(SCORE_WEIGHTS).map(([id, weight]) => {
    const segment = { id, start, length: Math.max(weight - SEGMENT_GAP, 0.5) };
    start += weight;
    return segment;
  });
}

export function IntakeDial({ className }: { className?: string }) {
  const segments = weightSegments();

  return (
    <div className={cn("grid place-items-center", className)}>
      <svg viewBox="0 0 200 200" className="col-start-1 row-start-1 size-full" aria-hidden>
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`} fill="none" strokeLinecap="round">
          {segments.map((segment, index) => (
            <circle
              key={segment.id}
              cx={CENTER}
              cy={CENTER}
              r={WEIGHT_RING_RADIUS}
              pathLength={100}
              stroke="currentColor"
              strokeWidth={2.5}
              strokeDasharray={`${segment.length} ${100 - segment.length}`}
              strokeDashoffset={-segment.start}
              className="dial-segment text-foreground/35"
              style={{ animationDelay: `${index * 70}ms` }}
            />
          ))}

          {PROGRESS_ARCS.map((arc, index) => (
            <g key={arc.id}>
              <circle
                cx={CENTER}
                cy={CENTER}
                r={arc.radius}
                stroke="currentColor"
                strokeWidth={arc.width}
                className="text-foreground/[0.07]"
              />
              <circle
                cx={CENTER}
                cy={CENTER}
                r={arc.radius}
                pathLength={100}
                stroke="currentColor"
                strokeWidth={arc.width}
                strokeDasharray={`${arc.value} ${100 - arc.value}`}
                className={cn("dial-arc", arc.className)}
                style={
                  {
                    "--dial-value": arc.value,
                    animationDelay: `${240 + index * 140}ms`,
                  } as React.CSSProperties
                }
              />
            </g>
          ))}
        </g>

        <circle
          cx={CENTER}
          cy={CENTER}
          r={26}
          className="dial-plate fill-primary/10 stroke-primary/30"
          strokeWidth={1.5}
        />
      </svg>

      <UtensilsCrossed
        aria-hidden
        strokeWidth={1.5}
        className="dial-plate col-start-1 row-start-1 size-[15%] text-primary"
      />
    </div>
  );
}
