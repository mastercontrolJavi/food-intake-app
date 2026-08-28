import { SettingsTabs } from "@/components/settings/settings-tabs";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { ensureProfile, getGoalForDate } from "@/lib/data/day";
import { localDateInTimezone, localDateTimeInput } from "@/lib/dates/timezone";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LEAKED_PASSWORD_NOTICE } from "@/lib/auth/messages";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string; editFood?: string; security?: string }> }) {
  const params = await searchParams; const supabase = await createClient(); const userId = await requireUserId(); const profile = await ensureProfile(supabase, userId);
  const today = localDateInTimezone(new Date(), profile.timezone);
  const [activeGoal, goalHistory, measurements, customFoods, savedMeals, editingFood] = await Promise.all([
    getGoalForDate(supabase, userId, today),
    supabase.from("user_goals").select("*").eq("user_id", userId).order("effective_from", { ascending: false }),
    supabase.from("body_measurements").select("*").eq("user_id", userId).order("measured_at", { ascending: false }).limit(100),
    supabase.from("custom_foods").select("*").eq("user_id", userId).order("is_favorite", { ascending: false }).order("name"),
    supabase.from("saved_meals").select("*").eq("user_id", userId).order("is_favorite", { ascending: false }).order("updated_at", { ascending: false }),
    params.editFood ? supabase.from("custom_foods").select("*").eq("id", params.editFood).eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  for (const result of [goalHistory, measurements, customFoods, savedMeals, editingFood]) if (result.error) throw result.error;
  const tabs = ["profile", "goals", "measurements", "foods", "data"];
  return <div className="space-y-6"><div><p className="text-sm font-medium text-primary">Preferences & targets</p><h1 className="text-3xl font-semibold tracking-tight">Settings</h1><p className="mt-2 max-w-2xl text-muted-foreground">You control every target. Body information stays optional.</p></div>{params.security === "leaked-password" ? <Alert variant="destructive"><AlertTriangle /><AlertTitle>Change your password</AlertTitle><AlertDescription>{LEAKED_PASSWORD_NOTICE}</AlertDescription></Alert> : null}<SettingsTabs defaultTab={tabs.includes(params.tab ?? "") ? params.tab! : "profile"} today={today} nowInput={localDateTimeInput(new Date(), profile.timezone)} profile={profile} activeGoal={activeGoal} goalHistory={goalHistory.data ?? []} measurements={measurements.data ?? []} customFoods={customFoods.data ?? []} savedMeals={savedMeals.data ?? []} editingFood={editingFood.data} /></div>;
}
