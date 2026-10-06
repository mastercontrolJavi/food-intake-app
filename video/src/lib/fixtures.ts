import film from "../fixtures/film.json";

/** Typed access to the fixture file produced by scripts/build-fixtures.ts (real engine output). */
export type FilmMetric = (typeof film.day.after.metrics)[number] & {
  status: { label: string; tone: string } | null;
};
export type TimelineEntry = {
  time: string;
  title: string;
  detail: string;
  score: number | null;
  isNew?: boolean;
};
export type Insight = (typeof film.week.insights)[number];

export const FILM = film;
export const DAY = film.day;
export const WEEK = film.week;
export const BEFORE_METRICS = film.day.before.metrics as FilmMetric[];
export const AFTER_METRICS = film.day.after.metrics as FilmMetric[];
export const TIMELINE = film.day.timeline as TimelineEntry[];

/** Weight-ring segment order = Object.entries(SCORE_WEIGHTS), exactly as IntakeDial builds it. */
export const WEIGHT_SEGMENTS = [
  { id: "calories", metricId: "calories", label: "Calories", weight: film.weights.calories },
  { id: "protein", metricId: "proteinG", label: "Protein", weight: film.weights.protein },
  { id: "fiber", metricId: "fiberG", label: "Fiber", weight: film.weights.fiber },
  { id: "carbs", metricId: "carbsG", label: "Carbohydrates", weight: film.weights.carbs },
  { id: "fat", metricId: "fatG", label: "Fat", weight: film.weights.fat },
  { id: "water", metricId: "waterMl", label: "Water", weight: film.weights.water },
  { id: "steps", metricId: "steps", label: "Steps", weight: film.weights.steps },
] as const;
