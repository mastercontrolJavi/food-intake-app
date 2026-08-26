import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { getDayPageData } from "@/lib/data/day";
import { SCORING_ALGORITHM_VERSION, scoreDay } from "@/lib/scoring";

function asJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

export async function calculateAndPersistDailyReview(
  supabase: SupabaseClient<Database>, userId: string, localDate: string,
) {
  const day = await getDayPageData(supabase, userId, localDate);
  const result = scoreDay(day.totals, day.goals);
  const completedAt = new Date().toISOString();
  const { error: statusError } = await supabase.from("day_status").upsert({
    user_id: userId, local_date: localDate, completed: true, completed_at: completedAt, updated_at: completedAt,
  }, { onConflict: "user_id,local_date" });
  if (statusError) throw statusError;
  const { error: reviewError } = await supabase.from("daily_reviews").upsert({
    user_id: userId,
    local_date: localDate,
    goal_id: day.goal?.id ?? null,
    score: result.score,
    grade: result.grade,
    confidence: result.confidence,
    coverage_ratio: result.coverageRatio,
    scoring_algorithm_version: SCORING_ALGORITHM_VERSION,
    goal_snapshot: asJson(day.goals),
    metric_scores: asJson(result.metrics),
    daily_totals: asJson(day.totals),
    top_strength: result.topStrength,
    top_opportunity: result.topOpportunity,
    generated_summary: result.summary,
    is_stale: false,
    completed_at: completedAt,
    updated_at: completedAt,
  }, { onConflict: "user_id,local_date" });
  if (reviewError) throw reviewError;
  return result;
}

export async function recalculateDayIfCompleted(
  supabase: SupabaseClient<Database>, userId: string, localDate: string,
) {
  const { data, error } = await supabase.from("day_status").select("completed").eq("user_id", userId).eq("local_date", localDate).maybeSingle();
  if (error) throw error;
  if (!data?.completed) return null;
  await supabase.from("daily_reviews").update({ is_stale: true, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("local_date", localDate);
  return calculateAndPersistDailyReview(supabase, userId, localDate);
}
