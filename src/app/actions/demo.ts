"use server";

import { addDays, format, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/actions/state";
import { errorMessage } from "@/lib/actions/state";
import { ensureProfile } from "@/lib/data/day";
import type { GoalRow } from "@/lib/data/mappers";
import { buildDemoDataset, DEMO_GOAL_VALUES, DEMO_MARKER } from "@/lib/demo/build-demo-data";
import { localDateInTimezone } from "@/lib/dates/timezone";
import { createClient, requireUserId } from "@/lib/supabase/server";

export async function seedDemoDataAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("confirmation") !== "seed") return { ok: false, message: "Confirm that this account is for demo data." };
  try {
    const supabase = await createClient();
    const userId = await requireUserId();
    const profile = await ensureProfile(supabase, userId);
    const { count: demoCount, error: demoCountError } = await supabase.from("meal_logs").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("notes", DEMO_MARKER);
    if (demoCountError) throw demoCountError;
    if ((demoCount ?? 0) > 0) return { ok: true, message: "Demo data is already present on this account." };
    const { count, error: countError } = await supabase.from("meal_logs").select("id", { count: "exact", head: true }).eq("user_id", userId);
    if (countError) throw countError;
    if ((count ?? 0) > 0) return { ok: false, message: "Demo data is only added to accounts with no meal history." };

    const endDate = format(addDays(parseISO(localDateInTimezone(new Date(), profile.timezone)), -1), "yyyy-MM-dd");
    const startDate = format(addDays(parseISO(endDate), -34), "yyyy-MM-dd");
    const { data: existingGoals, error: goalsError } = await supabase.from("user_goals").select("*").eq("user_id", userId).order("effective_from");
    if (goalsError) throw goalsError;
    if (existingGoals?.length) return { ok: false, message: "Demo data requires a new account with no goals or meal history." };
    const { data: goal, error: goalError } = await supabase.from("user_goals").insert({ user_id: userId, effective_from: startDate, ...DEMO_GOAL_VALUES }).select("*").single();
    if (goalError) throw goalError;
    const dataset = buildDemoDataset({ userId, timezone: profile.timezone, endDate, goal: goal as GoalRow });

    const inserts = await Promise.all([
      supabase.from("meal_logs").insert(dataset.meals),
      supabase.from("hydration_logs").insert(dataset.hydration),
      supabase.from("activity_logs").insert(dataset.activity),
      supabase.from("body_measurements").insert(dataset.measurements),
      supabase.from("custom_foods").insert(dataset.customFoods),
      supabase.from("saved_meals").insert(dataset.savedMeals),
    ]);
    const insertNames = ["meal_logs", "hydration_logs", "activity_logs", "body_measurements", "custom_foods", "saved_meals"];
    inserts.forEach((result, index) => { if (result.error) throw new Error(`${insertNames[index]}: ${result.error.message}`); });
    const statusResult = await supabase.from("day_status").insert(dataset.statuses);
    if (statusResult.error) throw new Error(`day_status: ${statusResult.error.message}`);
    const reviewResult = await supabase.from("daily_reviews").insert(dataset.reviews);
    if (reviewResult.error) throw new Error(`daily_reviews: ${reviewResult.error.message}`);
    revalidatePath("/today"); revalidatePath("/history"); revalidatePath("/weekly"); revalidatePath("/monthly"); revalidatePath("/settings");
    return { ok: true, message: `Added 35 days of opt-in demo data (${DEMO_MARKER}).` };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}
