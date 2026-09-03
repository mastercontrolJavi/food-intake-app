import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatAmount } from "@/lib/format/number";
import type { ScoreMetric } from "@/lib/scoring";

function metricStatus(metric: ScoreMetric) {
  if (metric.actual == null || metric.target == null) return null;

  const difference = metric.actual - metric.target;
  if (difference > 0) {
    return {
      label: `${formatAmount(difference, metric.unit)} over target`,
      className: metric.actual / metric.target > 1.1 ? "text-rose-600 dark:text-rose-400" : "text-amber-700 dark:text-amber-400",
    };
  }
  if (difference === 0) {
    return { label: "Target met", className: "text-emerald-700 dark:text-emerald-400" };
  }
  return {
    label: `${formatAmount(Math.abs(difference), metric.unit)} remaining`,
    className: "text-muted-foreground",
  };
}

function MetricRow({ metric }: { metric: ScoreMetric }) {
  const status = metricStatus(metric);
  const scoreDescription = `${metric.label} alignment score based on distance from your configured target`;

  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium">{metric.label}</div>
          <div className="number-tabular text-xs text-muted-foreground">
            {metric.target == null
              ? "No target configured"
              : metric.actual == null
                ? "Not tracked yet"
                : `${formatAmount(metric.actual, metric.unit)} of ${formatAmount(metric.target, metric.unit)}`}
          </div>
        </div>
        {metric.score != null && (
          <div className="shrink-0 text-right" title={scoreDescription}>
            <div className="number-tabular text-sm font-semibold">{Math.round(metric.score)}%</div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">alignment</div>
          </div>
        )}
      </div>
      <ProgressBar
        currentValue={metric.actual}
        targetValue={metric.target}
        label={`${metric.label} intake progress`}
      />
      {status && <p className={`text-xs font-medium ${status.className}`}>{status.label}</p>}
    </div>
  );
}

export function ProgressCard({ metrics }: { metrics: ScoreMetric[] }) {
  const configuredMetrics = metrics.filter((metric) => metric.configured);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily targets</CardTitle>
        <CardDescription>
          Green shows intake up to your target; amber or red isolates any overage. Alignment scores measure target accuracy.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
        {configuredMetrics.map((metric) => <MetricRow key={metric.id} metric={metric} />)}
        {configuredMetrics.length === 0 && (
          <p className="text-sm text-muted-foreground sm:col-span-2">Configure goals to see daily progress.</p>
        )}
      </CardContent>
    </Card>
  );
}
