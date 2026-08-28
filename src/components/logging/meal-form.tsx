"use client";

import { useActionState, useState } from "react";
import { saveMealAction } from "@/app/actions/logs";
import { initialActionState } from "@/lib/actions/state";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NutritionSearch } from "./nutrition-search";
import type { NutritionSearchResult } from "@/lib/nutrition/types";
import { formatAmount, roundTo } from "@/lib/format/number";
import { NUTRITION_DECIMALS } from "@/lib/nutrition/quantity";

export type MealPrefill = {
  id?: string; title?: string; eatenAt: string; mealType?: string | null; sourceType?: string | null;
  restaurantName?: string | null; portionDescription?: string | null; quantity?: number;
  calories?: number | null; proteinG?: number | null; carbsG?: number | null; fatG?: number | null;
  fiberG?: number | null; sodiumMg?: number | null; addedSugarG?: number | null;
  nutritionSource?: string; nutritionExternalId?: string | null; savedMealId?: string | null; notes?: string | null;
};

type NutritionState = {
  title: string; portionDescription: string; calories: string; proteinG: string; carbsG: string;
  fatG: string; fiberG: string; sodiumMg: string; addedSugarG: string;
  nutritionSource: string; nutritionExternalId: string;
};

const numberValue = (number: number | null | undefined) => number == null ? "" : String(number);
const nutritionFields = [
  { key: "calories", label: "Calories", suffix: "kcal" }, { key: "proteinG", label: "Protein", suffix: "g" },
  { key: "carbsG", label: "Carbs", suffix: "g" }, { key: "fatG", label: "Fat", suffix: "g" },
  { key: "fiberG", label: "Fiber", suffix: "g" }, { key: "sodiumMg", label: "Sodium", suffix: "mg" },
  { key: "addedSugarG", label: "Added sugar", suffix: "g" },
] as const;

export function MealForm({ initial }: { initial: MealPrefill }) {
  const [state, action] = useActionState(saveMealAction, initialActionState);
  const [nutrition, setNutrition] = useState<NutritionState>({
    title: initial.title ?? "", portionDescription: initial.portionDescription ?? "", calories: numberValue(initial.calories),
    proteinG: numberValue(initial.proteinG), carbsG: numberValue(initial.carbsG), fatG: numberValue(initial.fatG),
    fiberG: numberValue(initial.fiberG), sodiumMg: numberValue(initial.sodiumMg), addedSugarG: numberValue(initial.addedSugarG),
    nutritionSource: initial.nutritionSource ?? "manual", nutritionExternalId: initial.nutritionExternalId ?? "",
  });
  const [quantity, setQuantity] = useState(numberValue(initial.quantity) || "1");
  const set = (key: keyof NutritionState, next: string) => setNutrition((current) => ({ ...current, [key]: next }));
  const multiplier = Number(quantity);
  const totalPreview = Number.isFinite(multiplier) && multiplier > 0 && multiplier !== 1
    ? nutritionFields.flatMap((field) => {
        const perUnit = Number(nutrition[field.key]);
        if (nutrition[field.key].trim() === "" || !Number.isFinite(perUnit)) return [];
        return [`${field.label} ${formatAmount(roundTo(perUnit * multiplier, NUTRITION_DECIMALS))} ${field.suffix}`];
      })
    : [];
  const importResult = (result: NutritionSearchResult) => setNutrition({
    title: result.name, portionDescription: result.servingLabel, calories: numberValue(result.calories),
    proteinG: numberValue(result.proteinG), carbsG: numberValue(result.carbsG), fatG: numberValue(result.fatG),
    fiberG: numberValue(result.fiberG), sodiumMg: numberValue(result.sodiumMg), addedSugarG: numberValue(result.addedSugarG),
    nutritionSource: "usda", nutritionExternalId: result.externalId,
  });

  return <form action={action} className="space-y-6">
    {initial.id && <input type="hidden" name="id" value={initial.id} />}
    <input type="hidden" name="nutritionSource" value={nutrition.nutritionSource} />
    <input type="hidden" name="nutritionExternalId" value={nutrition.nutritionExternalId} />
    {initial.savedMealId && <input type="hidden" name="savedMealId" value={initial.savedMealId} />}
    <div className="space-y-2"><Label htmlFor="title">What did you eat?</Label><Input id="title" name="title" className="h-12 text-base" placeholder="Chicken, rice and broccoli" value={nutrition.title} onChange={(event) => set("title", event.target.value)} autoFocus required maxLength={160} /></div>
    <NutritionSearch onSelect={importResult} />
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="eatenAt">Date and time</Label><Input id="eatenAt" name="eatenAt" type="datetime-local" defaultValue={initial.eatenAt} required /></div>
      <div className="space-y-2"><Label htmlFor="portionDescription">Portion</Label><Input id="portionDescription" name="portionDescription" placeholder="1 bowl, 350 g, 2 pieces" value={nutrition.portionDescription} onChange={(event) => set("portionDescription", event.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="quantity">Quantity</Label><Input id="quantity" name="quantity" type="number" min="0.001" max="1000" step="any" inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /><p className="text-xs text-muted-foreground">Multiplies the nutrition below.</p></div>
      <div className="space-y-2"><Label>Meal type <span className="font-normal text-muted-foreground">(optional)</span></Label><Select name="mealType" defaultValue={initial.mealType ?? "none"}><SelectTrigger aria-label="Meal type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not specified</SelectItem>{["breakfast", "lunch", "dinner", "snack", "other"].map((item) => <SelectItem key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Food source <span className="font-normal text-muted-foreground">(optional)</span></Label><Select name="sourceType" defaultValue={initial.sourceType ?? "none"}><SelectTrigger aria-label="Food source"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not specified</SelectItem>{["home", "restaurant", "takeout", "fast_food", "packaged", "snack", "other"].map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2 sm:col-span-2"><Label htmlFor="restaurantName">Restaurant or business</Label><Input id="restaurantName" name="restaurantName" defaultValue={initial.restaurantName ?? ""} /></div>
    </div>
    <fieldset><legend className="mb-3 font-medium">Nutrition <span className="font-normal text-muted-foreground">(per unit; enter only what you know)</span></legend><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{nutritionFields.map((field) => <div key={field.key} className="space-y-2"><Label htmlFor={field.key}>{field.label}</Label><div className="relative"><Input id={field.key} name={field.key} type="number" min="0" step="any" inputMode="decimal" value={nutrition[field.key]} onChange={(event) => set(field.key, event.target.value)} className="pr-12" /><span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs text-muted-foreground">{field.suffix}</span></div></div>)}</div>{totalPreview.length > 0 && <p className="mt-3 rounded-lg bg-muted/55 p-3 text-sm" aria-live="polite"><span className="font-medium">Total logged (× {quantity}):</span> <span className="text-muted-foreground">{totalPreview.join(" · ")}</span></p>}</fieldset>
    <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" defaultValue={initial.notes ?? ""} placeholder="Optional context" /></div>
    <label className="flex min-h-11 items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" name="saveForRepeat" className="size-4 accent-primary" />Save as a reusable meal</label>
    <FormMessage state={state} />
    <div className="sticky bottom-20 z-20 -mx-1 flex gap-3 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur lg:bottom-4"><SubmitButton size="lg" className="h-11 flex-1" pendingLabel="Saving meal…">{initial.id ? "Update meal" : "Save meal"}</SubmitButton></div>
  </form>;
}
