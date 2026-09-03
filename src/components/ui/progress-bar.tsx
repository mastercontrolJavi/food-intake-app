import { cn } from "@/lib/utils";

type ProgressBarProps = {
  currentValue: number | null;
  targetValue: number | null;
  label: string;
  className?: string;
};

function finiteNonNegative(value: number | null) {
  return value != null && Number.isFinite(value) ? Math.max(0, value) : 0;
}

/**
 * Shows goal progress without hiding overages. Once the target is exceeded, the
 * fixed-width track becomes a proportional split of target and overflow amounts.
 */
export function ProgressBar({
  currentValue,
  targetValue,
  label,
  className,
}: ProgressBarProps) {
  const current = finiteNonNegative(currentValue);
  const target = finiteNonNegative(targetValue);
  const hasTarget = target > 0;
  const overTarget = hasTarget && current > target;
  const percentage = hasTarget ? (current / target) * 100 : 0;
  const totalShown = overTarget ? current : target;
  const targetWidth = totalShown > 0
    ? Math.min(100, (Math.min(current, target) / totalShown) * 100)
    : 0;
  const overflowWidth = overTarget ? 100 - targetWidth : 0;
  const warningColor = percentage > 110 ? "bg-rose-500" : "bg-amber-400";
  const valueText = hasTarget
    ? `${Math.round(percentage)}% of target${overTarget ? `, ${Math.round(percentage - 100)}% over` : ""}`
    : "No target configured";

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.max(target, current, 1)}
      aria-valuenow={current}
      aria-valuetext={valueText}
      data-over-target={overTarget || undefined}
      className={cn(
        "relative flex h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
      title={valueText}
    >
      <span
        aria-hidden="true"
        className="h-full shrink-0 bg-emerald-500 transition-[width] dark:bg-emerald-400"
        style={{ width: `${targetWidth}%` }}
      />
      {overTarget && (
        <span
          aria-hidden="true"
          className={cn("h-full shrink-0 transition-[width]", warningColor)}
          style={{ width: `${overflowWidth}%` }}
        />
      )}
    </div>
  );
}
