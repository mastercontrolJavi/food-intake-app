import type { Grade } from "./types";

export function gradeFromScore(score: number | null): Grade | null {
  if (score == null || !Number.isFinite(score)) return null;
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
