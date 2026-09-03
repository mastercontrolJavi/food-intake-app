import { formatAmount } from "@/lib/format/number";
import type { ScoreMetric } from "./types";

function display(value: number, unit: string): string {
  if (unit === "ml") return `${Math.round(value)} ml`;
  if (unit === "steps") return `${Math.round(value).toLocaleString()} steps`;
  return formatAmount(value, unit);
}

function targetName(metric: ScoreMetric): string {
  switch (metric.id) {
    case "calories": return "calorie target";
    case "proteinG": return "protein target";
    case "carbsG": return "carb target";
    case "fatG": return "fat target";
    case "fiberG": return "fiber target";
    case "waterMl": return "hydration target";
    case "steps": return "step target";
  }
}

function differenceDetails(metric: ScoreMetric) {
  const actual = metric.actual ?? 0;
  const target = metric.target ?? 0;
  const difference = actual - target;
  const percentage = target > 0 ? Math.abs(difference / target) * 100 : 0;
  return { difference, percentage };
}

function strengthClause(metric: ScoreMetric): string {
  const { difference, percentage } = differenceDetails(metric);
  if (Math.abs(difference) < 0.05) return `You hit your ${targetName(metric)} exactly`;
  if (percentage <= 2) return `You kept your ${targetName(metric)} within ${Math.max(1, Math.round(percentage))}% of goal`;
  if (difference > 0) return `You reached your ${targetName(metric)}`;
  return `You came closest on your ${targetName(metric)}`;
}

function opportunityClause(metric: ScoreMetric): string {
  const { difference, percentage } = differenceDetails(metric);
  const amount = display(Math.abs(difference), metric.unit);
  const degree = percentage <= 10 ? "slightly " : percentage <= 20 ? "moderately " : "";

  if (Math.abs(difference) < 0.05) return `also hit your ${targetName(metric)} exactly`;
  if (difference > 0) return `went ${degree}over your ${targetName(metric)} by ${amount}`;
  return `finished ${amount} short of your ${targetName(metric)}`;
}

function nextAction(metric: ScoreMetric): string {
  const above = (metric.actual ?? 0) > (metric.target ?? 0);

  switch (metric.id) {
    case "calories":
      return above
        ? "Reduce one energy-dense serving or added fat to tighten tomorrow’s intake."
        : "Add a planned meal or snack so tomorrow’s training is properly fueled.";
    case "proteinG":
      return above
        ? "Use slightly smaller protein portions while keeping them spread across the day."
        : "Add a lean protein serving earlier in the day to support tomorrow’s training.";
    case "carbsG":
      return above
        ? "Trim carb portions away from the training window while preserving workout fuel."
        : "Plan more carbs around tomorrow’s training window to support performance and recovery.";
    case "fatG":
      return above
        ? "Choose leaner protein sources and measure added fats for tomorrow’s split."
        : "Add a measured source of unsaturated fat without displacing protein or carbs.";
    case "fiberG":
      return above
        ? "Keep fluids consistent and repeat the food choices that made fiber easy to hit."
        : "Add fruit, vegetables, legumes, or whole grains to tomorrow’s planned meals.";
    case "waterMl":
      return above
        ? "Keep hydration steady and adjust only if this exceeded your training-day plan."
        : "Front-load fluids and keep a bottle visible during tomorrow’s session.";
    case "steps":
      return above
        ? "Your activity target is covered; prioritize recovery around the next lifting session."
        : "Schedule a short walk so activity does not compete with lifting or recovery.";
  }
}

function capitalize(value: string): string {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
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
    ? `${strengthClause(strength)}.`
    : `${strength.label} was your strongest tracked component.`;
  const opportunityText = opportunity.actual != null && opportunity.target != null
    ? `${capitalize(opportunityClause(opportunity))}. ${nextAction(opportunity)}`
    : `${opportunity.label} had the most room relative to your configured target.`;

  const summary = strength.id === opportunity.id
    ? opportunityText
    : `${strengthClause(strength)}, but ${opportunityClause(opportunity)}. ${nextAction(opportunity)}`;

  return {
    topStrength: strengthText,
    topOpportunity: opportunityText,
    summary,
  };
}
