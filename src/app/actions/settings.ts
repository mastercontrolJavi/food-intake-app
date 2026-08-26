"use server";

import { revalidatePath } from "next/cache";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { errorMessage, type ActionState } from "@/lib/actions/state";
import { customFoodSchema, formBoolean, formString, goalsSchema, measurementSchema, profileSchema } from "@/lib/validation/schemas";
import { isValidTimezone, zonedDateTimeToUtc } from "@/lib/dates/timezone";
import type { Database } from "@/types/database";

const poundsToKg = (value: number | null) => value == null ? null : value * 0.45359237;
const inchesToCm = (value: number | null) => value == null ? null : value * 2.54;

export async function saveProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const unitSystem = formString(formData, "preferredUnitSystem") ?? "metric";
    const heightInput = formString(formData, "heightCm");
    const weightInput = formString(formData, "goalWeightKg");
    const parsed = profileSchema.safeParse({
      displayName: formString(formData, "displayName"), timezone: formString(formData, "timezone") ?? "UTC",
      preferredUnitSystem: unitSystem,
      heightCm: heightInput == null ? null : unitSystem === "imperial" ? inchesToCm(Number(heightInput)) : heightInput,
      goalWeightKg: weightInput == null ? null : unitSystem === "imperial" ? poundsToKg(Number(weightInput)) : weightInput,
    });
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the profile values." };
    if (!isValidTimezone(parsed.data.timezone)) return { ok: false, message: "Enter a valid IANA timezone, such as America/Mexico_City." };
    const supabase = await createClient(); const userId = await requireUserId();
    const { error } = await supabase.from("profiles").upsert({ id: userId, display_name: parsed.data.displayName, timezone: parsed.data.timezone, preferred_unit_system: parsed.data.preferredUnitSystem, height_cm: parsed.data.heightCm, goal_weight_kg: parsed.data.goalWeightKg, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) throw error;
    revalidatePath("/settings"); revalidatePath("/today");
    return { ok: true, message: "Profile saved." };
  } catch (error) { return { ok: false, message: errorMessage(error) }; }
}

export async function saveGoalsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const parsed = goalsSchema.safeParse({ effectiveFrom: formString(formData, "effectiveFrom") ?? "", primaryGoal: formString(formData, "primaryGoal") ?? "maintain", calorieTarget: formString(formData, "calorieTarget"), proteinTargetG: formString(formData, "proteinTargetG"), carbsTargetG: formString(formData, "carbsTargetG"), fatTargetG: formString(formData, "fatTargetG"), fiberTargetG: formString(formData, "fiberTargetG"), sodiumLimitMg: formString(formData, "sodiumLimitMg"), addedSugarLimitG: formString(formData, "addedSugarLimitG"), waterTargetMl: formString(formData, "waterTargetMl"), stepTarget: formString(formData, "stepTarget"), weeklyWorkoutTarget: formString(formData, "weeklyWorkoutTarget"), lateMealTime: formString(formData, "lateMealTime") ?? "20:00" });
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the goals." };
    const value = parsed.data; const supabase = await createClient(); await requireUserId();
    const args = {
      p_effective_from: value.effectiveFrom, p_primary_goal: value.primaryGoal,
      p_calorie_target: value.calorieTarget, p_protein_target_g: value.proteinTargetG,
      p_carbs_target_g: value.carbsTargetG, p_fat_target_g: value.fatTargetG,
      p_fiber_target_g: value.fiberTargetG, p_sodium_limit_mg: value.sodiumLimitMg,
      p_added_sugar_limit_g: value.addedSugarLimitG, p_water_target_ml: value.waterTargetMl,
      p_step_target: value.stepTarget, p_weekly_workout_target: value.weeklyWorkoutTarget,
      p_late_meal_time: value.lateMealTime,
    } as unknown as Database["public"]["Functions"]["replace_active_goal"]["Args"];
    const { error } = await supabase.rpc("replace_active_goal", args);
    if (error) throw error;
    revalidatePath("/settings"); revalidatePath("/today"); revalidatePath("/history");
    return { ok: true, message: "Goals saved as a new effective period." };
  } catch (error) { return { ok: false, message: errorMessage(error) }; }
}

export async function addMeasurementAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient(); const userId = await requireUserId();
    const { data: profile, error: profileError } = await supabase.from("profiles").select("timezone,preferred_unit_system").eq("id", userId).single();
    if (profileError) throw profileError;
    const unitSystem = profile.preferred_unit_system;
    const weight = formString(formData, "weightKg"); const waist = formString(formData, "waistCm");
    const parsed = measurementSchema.safeParse({ measuredAt: formString(formData, "measuredAt") ?? "", weightKg: weight == null ? null : unitSystem === "imperial" ? poundsToKg(Number(weight)) : weight, bodyFatPct: formString(formData, "bodyFatPct"), waistCm: waist == null ? null : unitSystem === "imperial" ? inchesToCm(Number(waist)) : waist, notes: formString(formData, "notes") });
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the measurement." };
    const value = parsed.data;
    const { error } = await supabase.from("body_measurements").insert({ user_id: userId, measured_at: zonedDateTimeToUtc(value.measuredAt, profile.timezone).toISOString(), weight_kg: value.weightKg, body_fat_pct: value.bodyFatPct, waist_cm: value.waistCm, notes: value.notes });
    if (error) throw error;
    revalidatePath("/settings"); return { ok: true, message: "Measurement added." };
  } catch (error) { return { ok: false, message: errorMessage(error) }; }
}

export async function deleteMeasurementAction(formData: FormData) {
  const supabase = await createClient(); const userId = await requireUserId(); const id = String(formData.get("id") ?? "");
  const { error } = await supabase.from("body_measurements").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error; revalidatePath("/settings");
}

export async function saveCustomFoodAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const parsed = customFoodSchema.safeParse({ id: formString(formData, "id") ?? undefined, name: formString(formData, "name") ?? "", servingDescription: formString(formData, "servingDescription"), calories: formString(formData, "calories"), proteinG: formString(formData, "proteinG"), carbsG: formString(formData, "carbsG"), fatG: formString(formData, "fatG"), fiberG: formString(formData, "fiberG"), sodiumMg: formString(formData, "sodiumMg"), addedSugarG: formString(formData, "addedSugarG"), isFavorite: formBoolean(formData, "isFavorite") });
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the custom food." };
    const value = parsed.data; const supabase = await createClient(); const userId = await requireUserId();
    const payload = { user_id: userId, name: value.name, serving_description: value.servingDescription, calories: value.calories, protein_g: value.proteinG, carbs_g: value.carbsG, fat_g: value.fatG, fiber_g: value.fiberG, sodium_mg: value.sodiumMg, added_sugar_g: value.addedSugarG, is_favorite: value.isFavorite, updated_at: new Date().toISOString() };
    const result = value.id ? await supabase.from("custom_foods").update(payload).eq("id", value.id).eq("user_id", userId) : await supabase.from("custom_foods").insert(payload);
    if (result.error) throw result.error;
    revalidatePath("/settings"); return { ok: true, message: value.id ? "Custom food updated." : "Custom food saved." };
  } catch (error) { return { ok: false, message: errorMessage(error) }; }
}

export async function deleteCustomFoodAction(formData: FormData) {
  const supabase = await createClient(); const userId = await requireUserId(); const id = String(formData.get("id") ?? "");
  const { error } = await supabase.from("custom_foods").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error; revalidatePath("/settings");
}

export async function toggleSavedMealFavoriteAction(formData: FormData) {
  const supabase = await createClient(); const userId = await requireUserId(); const id = String(formData.get("id") ?? "");
  const { data, error: readError } = await supabase.from("saved_meals").select("is_favorite").eq("id", id).eq("user_id", userId).single();
  if (readError) throw readError;
  const { error } = await supabase.from("saved_meals").update({ is_favorite: !data.is_favorite, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  if (error) throw error; revalidatePath("/settings"); revalidatePath("/log/food");
}

export async function deleteSavedMealAction(formData: FormData) {
  const supabase = await createClient(); const userId = await requireUserId(); const id = String(formData.get("id") ?? "");
  const { error } = await supabase.from("saved_meals").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error; revalidatePath("/settings"); revalidatePath("/log/food");
}
