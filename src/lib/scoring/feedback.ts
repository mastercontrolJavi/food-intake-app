import type { ScoreMetric } from "./types";

function display(value: number, unit: string): string {
  if (unit === "ml") return `${Math.round(value)} ml`;
  if (unit === "steps") return `${Math.round(value).toLocaleString()} steps`;
  return `${Math.round(value)}${unit}`;
}

export function directionFor(actual: number | null, target: number | null): ScoreMetric["direction"] {
  if (actual == null || target == null || target <= 0) return "unknown";
  const ratio = actual / target;
  if (ratio < 0.9) return "below";
  if (ratio > 1.1) return "above";
  return "aligned";
}

export function feedbackForMetrics(metrics: ScoreMetric[]) {
  const known = metrics.filter((metric) => metric.available && metric.score != null);
  if (known.length === 0) {
    return {
      topStrength: null,
      topOpportunity: null,
      summary: "Not enough nutrition data to grade this accurately.",
    };
  }

  const strength = [...known].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  const opportunity = [...known].sort(
    (a, b) => ((a.score ?? 0) - (b.score ?? 0)) || b.weight - a.weight,
  )[0];

  const strengthText = strength.actual != null && strength.target != null
    ? `${strength.label} was closely aligned at ${display(strength.actual, strength.unit)} / ${display(strength.target, strength.unit)}.`
    : `${strength.label} was your strongest tracked component.`;
  const opportunityText = opportunity.actual != null && opportunity.target != null
    ? `${opportunity.label} was your largest gap at ${display(opportunity.actual, opportunity.unit)} / ${display(opportunity.target, opportunity.unit)}.`
    : `${opportunity.label} had the most room relative to your configured target.`;

  return {
    topStrength: strengthText,
    topOpportunity: opportunityText,
    summary: strength.id === opportunity.id ? strengthText : `${strengthText} ${opportunityText}`,
  };
}
