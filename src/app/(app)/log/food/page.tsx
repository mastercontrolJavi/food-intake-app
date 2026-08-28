import Link from "next/link";
import { ArrowLeft, Bookmark, Clock3, RefreshCw, Star } from "lucide-react";
import { repeatMealAction } from "@/app/actions/logs";
import { MealForm, type MealPrefill } from "@/components/logging/meal-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { ensureProfile, mealDetail } from "@/lib/data/day";
import { localDateTimeInput } from "@/lib/dates/timezone";
import { unscaleNutrition } from "@/lib/nutrition/quantity";

export const metadata = { title: "Log food" };

export default async function FoodLogPage({ searchParams }: { searchParams: Promise<{ id?: string; custom?: string; saved?: string }> }) {
  const params = await searchParams; const supabase = await createClient(); const userId = await requireUserId(); const profile = await ensureProfile(supabase, userId);
  const [existingResult, customResult, savedResult, recentResult, customListResult, savedListResult] = await Promise.all([
    params.id ? supabase.from("meal_logs").select("*").eq("id", params.id).eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    params.custom ? supabase.from("custom_foods").select("*").eq("id", params.custom).eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    params.saved ? supabase.from("saved_meals").select("*").eq("id", params.saved).eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    supabase.from("meal_logs").select("id,title,calories,protein_g,quantity,eaten_at").eq("user_id", userId).order("eaten_at", { ascending: false }).limit(5),
    supabase.from("custom_foods").select("id,name,calories,protein_g,is_favorite").eq("user_id", userId).order("is_favorite", { ascending: false }).order("updated_at", { ascending: false }).limit(8),
    supabase.from("saved_meals").select("id,title,calories,protein_g,is_favorite").eq("user_id", userId).order("is_favorite", { ascending: false }).order("last_used_at", { ascending: false, nullsFirst: false }).limit(8),
  ]);
  for (const result of [existingResult, customResult, savedResult, recentResult, customListResult, savedListResult]) if (result.error) throw result.error;
  const existing = existingResult.data; const custom = customResult.data; const saved = savedResult.data;
  const reusable = custom ?? saved;
  // Stored logs hold the eaten totals; the form edits per-unit values, so split the quantity back out.
  const perUnit = existing
    ? unscaleNutrition({ calories: existing.calories, proteinG: existing.protein_g, carbsG: existing.carbs_g, fatG: existing.fat_g, fiberG: existing.fiber_g, sodiumMg: existing.sodium_mg, addedSugarG: existing.added_sugar_g }, existing.quantity)
    : { calories: reusable?.calories ?? null, proteinG: reusable?.protein_g ?? null, carbsG: reusable?.carbs_g ?? null, fatG: reusable?.fat_g ?? null, fiberG: reusable?.fiber_g ?? null, sodiumMg: reusable?.sodium_mg ?? null, addedSugarG: reusable?.added_sugar_g ?? null };
  const initial: MealPrefill = {
    id: existing?.id, title: existing?.title ?? custom?.name ?? saved?.title ?? "",
    eatenAt: existing ? localDateTimeInput(new Date(existing.eaten_at), profile.timezone) : localDateTimeInput(new Date(), profile.timezone),
    mealType: existing?.meal_type, sourceType: existing?.source_type ?? saved?.source_type,
    restaurantName: existing?.restaurant_name ?? saved?.restaurant_name, quantity: existing?.quantity ?? 1,
    portionDescription: existing?.portion_description ?? custom?.serving_description ?? saved?.portion_description,
    ...perUnit,
    nutritionSource: existing?.nutrition_source ?? (custom ? "custom_food" : saved ? "saved_meal" : "manual"),
    nutritionExternalId: existing?.nutrition_external_id, savedMealId: saved?.id, notes: existing?.notes,
  };
  return <div className="mx-auto max-w-3xl space-y-6"><div><Button variant="ghost" asChild className="-ml-2 mb-3"><Link href="/today"><ArrowLeft /> Back to today</Link></Button><p className="text-sm font-medium text-primary">Fast food logging</p><h1 className="text-3xl font-semibold tracking-tight">{existing ? "Edit meal" : "What did you eat?"}</h1><p className="mt-2 text-muted-foreground">Add only the nutrition you know. Intake never invents values from a description.</p></div>{!existing && <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock3 className="size-4" /> Recent meals</CardTitle><CardDescription>One tap creates a new independent log.</CardDescription></CardHeader><CardContent className="space-y-2">{recentResult.data?.length ? recentResult.data.map((meal) => <form action={repeatMealAction} key={meal.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><input type="hidden" name="id" value={meal.id} /><div className="min-w-0"><p className="truncate text-sm font-medium">{meal.title}</p><p className="text-xs text-muted-foreground">{mealDetail(meal)}</p></div><Button type="submit" size="sm" variant="secondary"><RefreshCw /> Log again</Button></form>) : <p className="text-sm text-muted-foreground">Your recent meals will appear here.</p>}</CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bookmark className="size-4" /> Reusable foods</CardTitle><CardDescription>Custom foods and favorite combinations.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2">{customListResult.data?.map((food) => <Button key={food.id} variant="outline" size="sm" asChild><Link href={`/log/food?custom=${food.id}`}>{food.is_favorite && <Star className="fill-current" />}{food.name}</Link></Button>)}{savedListResult.data?.map((meal) => <Button key={meal.id} variant="outline" size="sm" asChild><Link href={`/log/food?saved=${meal.id}`}>{meal.is_favorite && <Star className="fill-current" />}{meal.title}<Badge variant="secondary">meal</Badge></Link></Button>)}{!customListResult.data?.length && !savedListResult.data?.length && <p className="text-sm text-muted-foreground">Save a custom food in Settings or check “Save as reusable” below.</p>}</CardContent></Card></div>}<Card><CardContent className="p-5 sm:p-7"><MealForm key={existing?.id ?? custom?.id ?? saved?.id ?? "new"} initial={initial} /></CardContent></Card></div>;
}
