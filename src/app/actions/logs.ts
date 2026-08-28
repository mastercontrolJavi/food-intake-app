"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { errorMessage, type ActionState } from "@/lib/actions/state";
import { activitySchema, formBoolean, formSelect, formString, hydrationSchema, mealSchema } from "@/lib/validation/schemas";
import { ensureProfile, getGoalForDate } from "@/lib/data/day";
import { localDateInTimezone, zonedDateTimeToUtc } from "@/lib/dates/timezone";
import { goalRowToTargets } from "@/lib/data/mappers";
import { nutritionWithinLimits, scaleNutrition } from "@/lib/nutrition/quantity";
import { scoreMeal } from "@/lib/scoring";
import { calculateAndPersistDailyReview, recalculateDayIfCompleted } from "@/lib/reviews/recalculate";

/**
 * Records that a reusable meal was logged again. The food page orders reusable foods by
 * these columns, so leaving them unwritten kept the ordering permanently frozen.
 * Usage stats are best-effort: a failure here must never lose the meal that was just saved.
 */
async function markSavedMealUsed(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, savedMealId: string) {
  const { data } = await supabase.from("saved_meals").select("use_count").eq("id", savedMealId).eq("user_id", userId).maybeSingle();
  if (!data) return;
  await supabase.from("saved_meals").update({ use_count: data.use_count + 1, last_used_at: new Date().toISOString() })
    .eq("id", savedMealId).eq("user_id", userId);
}

export async function saveMealAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient();
    const userId = await requireUserId();
    const profile = await ensureProfile(supabase, userId);
    const parsed = mealSchema.safeParse({
      id: formString(formData, "id") ?? undefined,
      title: formString(formData, "title") ?? "",
      eatenAt: formString(formData, "eatenAt") ?? "",
      mealType: formSelect(formData, "mealType"), sourceType: formSelect(formData, "sourceType"),
      restaurantName: formString(formData, "restaurantName"), portionDescription: formString(formData, "portionDescription"),
      quantity: formString(formData, "quantity") ?? "1", nutritionSource: formString(formData, "nutritionSource") ?? "manual",
      nutritionExternalId: formString(formData, "nutritionExternalId"), savedMealId: formString(formData, "savedMealId"),
      calories: formString(formData, "calories"), proteinG: formString(formData, "proteinG"), carbsG: formString(formData, "carbsG"),
      fatG: formString(formData, "fatG"), fiberG: formString(formData, "fiberG"), sodiumMg: formString(formData, "sodiumMg"),
      addedSugarG: formString(formData, "addedSugarG"), notes: formString(formData, "notes"), saveForRepeat: formBoolean(formData, "saveForRepeat"),
    });
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the meal details." };
    const value = parsed.data;
    // The nutrition fields describe one unit; the log stores what was actually eaten.
    const totals = scaleNutrition(value, value.quantity);
    if (!nutritionWithinLimits(totals)) return { ok: false, message: "That quantity makes the nutrition totals too large to store. Lower the quantity or the per-unit values." };
    const eatenAt = zonedDateTimeToUtc(value.eatenAt, profile.timezone);
    const localDate = localDateInTimezone(eatenAt, profile.timezone);
    let previousDate: string | null = null;
    if (value.id) {
      const { data: existing, error } = await supabase.from("meal_logs").select("eaten_at").eq("id", value.id).eq("user_id", userId).single();
      if (error) throw error;
      previousDate = localDateInTimezone(new Date(existing.eaten_at), profile.timezone);
    }
    const goal = await getGoalForDate(supabase, userId, localDate);
    const mealScore = scoreMeal({ calories: totals.calories, proteinG: totals.proteinG, carbsG: totals.carbsG, fatG: totals.fatG, fiberG: totals.fiberG, waterMl: null, steps: null }, goalRowToTargets(goal));
    const payload = {
      user_id: userId, eaten_at: eatenAt.toISOString(), title: value.title, meal_type: value.mealType, source_type: value.sourceType,
      raw_description: value.title, restaurant_name: value.restaurantName, portion_description: value.portionDescription, quantity: value.quantity,
      calories: totals.calories, protein_g: totals.proteinG, carbs_g: totals.carbsG, fat_g: totals.fatG, fiber_g: totals.fiberG,
      sodium_mg: totals.sodiumMg, added_sugar_g: totals.addedSugarG, notes: value.notes,
      nutrition_source: value.nutritionSource, nutrition_external_id: value.nutritionExternalId,
      nutrition_confidence: mealScore.confidence === "insufficient" ? "unknown" : mealScore.confidence,
      meal_score: mealScore.score, score_breakdown: JSON.parse(JSON.stringify(mealScore.metrics)), updated_at: new Date().toISOString(),
    };
    const result = value.id
      ? await supabase.from("meal_logs").update(payload).eq("id", value.id).eq("user_id", userId)
      : await supabase.from("meal_logs").insert(payload);
    if (result.error) throw result.error;
    if (value.saveForRepeat) {
      // A reusable meal is the whole logged portion, so it reloads as quantity 1.
      const { error } = await supabase.from("saved_meals").insert({
        user_id: userId, title: value.title, source_type: value.sourceType, restaurant_name: value.restaurantName,
        portion_description: value.portionDescription, calories: totals.calories, protein_g: totals.proteinG,
        carbs_g: totals.carbsG, fat_g: totals.fatG, fiber_g: totals.fiberG, sodium_mg: totals.sodiumMg, added_sugar_g: totals.addedSugarG,
      });
      if (error) throw error;
    }
    if (!value.id && value.savedMealId) await markSavedMealUsed(supabase, userId, value.savedMealId);
    if (previousDate && previousDate !== localDate) await recalculateDayIfCompleted(supabase, userId, previousDate);
    await recalculateDayIfCompleted(supabase, userId, localDate);
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidatePath("/today"); revalidatePath("/history"); revalidatePath("/weekly"); revalidatePath("/monthly");
  redirect("/today");
}

export async function repeatMealAction(formData: FormData) {
  const supabase = await createClient();
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const profile = await ensureProfile(supabase, userId);
  const { data: meal, error } = await supabase.from("meal_logs").select("*").eq("id", id).eq("user_id", userId).single();
  if (error) throw error;
  const now = new Date();
  const localDate = localDateInTimezone(now, profile.timezone);
  const goal = await getGoalForDate(supabase, userId, localDate);
  const scored = scoreMeal({ calories: meal.calories, proteinG: meal.protein_g, carbsG: meal.carbs_g, fatG: meal.fat_g, fiberG: meal.fiber_g, waterMl: null, steps: null }, goalRowToTargets(goal));
  const { error: insertError } = await supabase.from("meal_logs").insert({
    user_id: userId, eaten_at: now.toISOString(), title: meal.title, meal_type: meal.meal_type, source_type: meal.source_type,
    raw_description: meal.raw_description, restaurant_name: meal.restaurant_name, portion_description: meal.portion_description, quantity: meal.quantity,
    calories: meal.calories, protein_g: meal.protein_g, carbs_g: meal.carbs_g, fat_g: meal.fat_g, fiber_g: meal.fiber_g,
    sodium_mg: meal.sodium_mg, added_sugar_g: meal.added_sugar_g, notes: meal.notes, nutrition_source: "repeat",
    nutrition_confidence: meal.nutrition_confidence, meal_score: scored.score, score_breakdown: JSON.parse(JSON.stringify(scored.metrics)),
  });
  if (insertError) throw insertError;
  await recalculateDayIfCompleted(supabase, userId, localDate);
  revalidatePath("/today"); revalidatePath("/weekly"); revalidatePath("/monthly");
  redirect("/today");
}

export async function saveHydrationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient(); const userId = await requireUserId(); const profile = await ensureProfile(supabase, userId);
    const parsed = hydrationSchema.safeParse({ id: formString(formData, "id") ?? undefined, consumedAt: formString(formData, "consumedAt") ?? "", drinkType: formString(formData, "drinkType") ?? "water", volumeMl: formString(formData, "volumeMl"), calories: formString(formData, "calories"), notes: formString(formData, "notes") });
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the drink details." };
    const value = parsed.data; const consumedAt = zonedDateTimeToUtc(value.consumedAt, profile.timezone); const localDate = localDateInTimezone(consumedAt, profile.timezone);
    let previousDate: string | null = null;
    if (value.id) { const { data, error } = await supabase.from("hydration_logs").select("consumed_at").eq("id", value.id).eq("user_id", userId).single(); if (error) throw error; previousDate = localDateInTimezone(new Date(data.consumed_at), profile.timezone); }
    const payload = { user_id: userId, consumed_at: consumedAt.toISOString(), drink_type: value.drinkType, volume_ml: value.volumeMl, calories: value.calories, notes: value.notes, updated_at: new Date().toISOString() };
    const result = value.id ? await supabase.from("hydration_logs").update(payload).eq("id", value.id).eq("user_id", userId) : await supabase.from("hydration_logs").insert(payload);
    if (result.error) throw result.error;
    if (previousDate && previousDate !== localDate) await recalculateDayIfCompleted(supabase, userId, previousDate);
    await recalculateDayIfCompleted(supabase, userId, localDate);
  } catch (error) { return { ok: false, message: errorMessage(error) }; }
  revalidatePath("/today"); revalidatePath("/history"); revalidatePath("/weekly"); revalidatePath("/monthly"); redirect("/today");
}

export async function quickWaterAction(formData: FormData) {
  const volume = Number(formData.get("volumeMl"));
  if (![250, 500, 750].includes(volume)) throw new Error("Invalid quick-add volume.");
  const supabase = await createClient(); const userId = await requireUserId(); const profile = await ensureProfile(supabase, userId); const now = new Date();
  const { error } = await supabase.from("hydration_logs").insert({ user_id: userId, consumed_at: now.toISOString(), drink_type: "water", volume_ml: volume });
  if (error) throw error;
  await recalculateDayIfCompleted(supabase, userId, localDateInTimezone(now, profile.timezone));
  revalidatePath("/today"); revalidatePath("/weekly"); revalidatePath("/monthly");
}

export async function saveActivityAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient(); const userId = await requireUserId(); const profile = await ensureProfile(supabase, userId);
    const parsed = activitySchema.safeParse({ id: formString(formData, "id") ?? undefined, occurredAt: formString(formData, "occurredAt") ?? "", activityType: formString(formData, "activityType") ?? "walking", durationMinutes: formString(formData, "durationMinutes"), steps: formString(formData, "steps"), distanceKm: formString(formData, "distanceKm"), estimatedCaloriesBurned: formString(formData, "estimatedCaloriesBurned"), intensity: formSelect(formData, "intensity"), notes: formString(formData, "notes") });
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the activity details." };
    const value = parsed.data; const occurredAt = zonedDateTimeToUtc(value.occurredAt, profile.timezone); const localDate = localDateInTimezone(occurredAt, profile.timezone);
    let previousDate: string | null = null;
    if (value.id) { const { data, error } = await supabase.from("activity_logs").select("occurred_at").eq("id", value.id).eq("user_id", userId).single(); if (error) throw error; previousDate = localDateInTimezone(new Date(data.occurred_at), profile.timezone); }
    const payload = { user_id: userId, occurred_at: occurredAt.toISOString(), activity_type: value.activityType, duration_minutes: value.durationMinutes, steps: value.steps, distance_km: value.distanceKm, estimated_calories_burned: value.estimatedCaloriesBurned, intensity: value.intensity, notes: value.notes, updated_at: new Date().toISOString() };
    const result = value.id ? await supabase.from("activity_logs").update(payload).eq("id", value.id).eq("user_id", userId) : await supabase.from("activity_logs").insert(payload);
    if (result.error) throw result.error;
    if (previousDate && previousDate !== localDate) await recalculateDayIfCompleted(supabase, userId, previousDate);
    await recalculateDayIfCompleted(supabase, userId, localDate);
  } catch (error) { return { ok: false, message: errorMessage(error) }; }
  revalidatePath("/today"); revalidatePath("/history"); revalidatePath("/weekly"); revalidatePath("/monthly"); redirect("/today");
}

export async function deleteLogAction(formData: FormData) {
  const table = String(formData.get("table")); const id = String(formData.get("id"));
  if (!(["meal_logs", "hydration_logs", "activity_logs"] as const).includes(table as "meal_logs")) throw new Error("Unsupported log type.");
  const supabase = await createClient(); const userId = await requireUserId(); const profile = await ensureProfile(supabase, userId);
  const timestampColumn = table === "meal_logs" ? "eaten_at" : table === "hydration_logs" ? "consumed_at" : "occurred_at";
  const { data, error: readError } = await supabase.from(table as "meal_logs").select(timestampColumn).eq("id", id).eq("user_id", userId).single();
  if (readError) throw readError;
  const timestamp = (data as unknown as Record<string, string>)[timestampColumn];
  const { error } = await supabase.from(table as "meal_logs").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
  await recalculateDayIfCompleted(supabase, userId, localDateInTimezone(new Date(timestamp), profile.timezone));
  revalidatePath("/today"); revalidatePath("/history"); revalidatePath("/weekly"); revalidatePath("/monthly");
}

export async function finishDayAction(formData: FormData) {
  const localDate = String(formData.get("localDate") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) throw new Error("Invalid local date.");
  const supabase = await createClient(); const userId = await requireUserId();
  await calculateAndPersistDailyReview(supabase, userId, localDate);
  revalidatePath("/today"); revalidatePath("/history"); revalidatePath("/weekly"); revalidatePath("/monthly");
}
