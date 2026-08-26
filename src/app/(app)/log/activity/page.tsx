import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ActivityForm } from "@/components/logging/activity-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/data/day";
import { localDateTimeInput } from "@/lib/dates/timezone";

export const metadata = { title: "Add activity" };

export default async function ActivityLogPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams; const supabase = await createClient(); const userId = await requireUserId(); const profile = await ensureProfile(supabase, userId);
  const { data, error } = id ? await supabase.from("activity_logs").select("*").eq("id", id).eq("user_id", userId).maybeSingle() : { data: null, error: null };
  if (error) throw error;
  return <div className="mx-auto max-w-2xl space-y-6"><div><Button variant="ghost" asChild className="-ml-2 mb-3"><Link href="/today"><ArrowLeft /> Back to today</Link></Button><p className="text-sm font-medium text-primary">Movement</p><h1 className="text-3xl font-semibold tracking-tight">{data ? "Edit activity" : "Add activity"}</h1><p className="mt-2 text-muted-foreground">Activity stays separate from food intake—exercise calories are never automatically subtracted.</p></div><Card><CardContent className="p-5 sm:p-7"><ActivityForm initial={{ id: data?.id, occurredAt: data ? localDateTimeInput(new Date(data.occurred_at), profile.timezone) : localDateTimeInput(new Date(), profile.timezone), activityType: data?.activity_type, durationMinutes: data?.duration_minutes, steps: data?.steps, distanceKm: data?.distance_km, estimatedCaloriesBurned: data?.estimated_calories_burned, intensity: data?.intensity, notes: data?.notes }} /></CardContent></Card></div>;
}
