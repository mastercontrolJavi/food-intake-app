import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HydrationForm } from "@/components/logging/hydration-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/data/day";
import { localDateTimeInput } from "@/lib/dates/timezone";

export const metadata = { title: "Add drink" };

export default async function WaterLogPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams; const supabase = await createClient(); const userId = await requireUserId(); const profile = await ensureProfile(supabase, userId);
  const { data, error } = id ? await supabase.from("hydration_logs").select("*").eq("id", id).eq("user_id", userId).maybeSingle() : { data: null, error: null };
  if (error) throw error;
  return <div className="mx-auto max-w-2xl space-y-6"><div><Button variant="ghost" asChild className="-ml-2 mb-3"><Link href="/today"><ArrowLeft /> Back to today</Link></Button><p className="text-sm font-medium text-primary">Hydration & drinks</p><h1 className="text-3xl font-semibold tracking-tight">{data ? "Edit drink" : "Add a drink"}</h1><p className="mt-2 text-muted-foreground">Water and sparkling water count toward your water target. Other drinks remain visible separately.</p></div><Card><CardContent className="p-5 sm:p-7"><HydrationForm initial={{ id: data?.id, consumedAt: data ? localDateTimeInput(new Date(data.consumed_at), profile.timezone) : localDateTimeInput(new Date(), profile.timezone), drinkType: data?.drink_type, volumeMl: data?.volume_ml, calories: data?.calories, notes: data?.notes }} /></CardContent></Card></div>;
}
