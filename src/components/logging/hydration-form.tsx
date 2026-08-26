"use client";

import { useActionState } from "react";
import { saveHydrationAction } from "@/app/actions/logs";
import { initialActionState } from "@/lib/actions/state";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type HydrationPrefill = {
  id?: string;
  consumedAt: string;
  drinkType?: string;
  volumeMl?: number;
  calories?: number | null;
  notes?: string | null;
};
export function HydrationForm({ initial }: { initial: HydrationPrefill }) {
  const [state, action] = useActionState(
    saveHydrationAction,
    initialActionState,
  );
  return (
    <form action={action} className="space-y-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Drink type</Label>
          <Select name="drinkType" defaultValue={initial.drinkType ?? "water"}>
            <SelectTrigger aria-label="Drink type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                "water",
                "sparkling_water",
                "coffee",
                "tea",
                "soda",
                "juice",
                "energy_drink",
                "milk",
                "sports_drink",
                "alcoholic_drink",
                "other",
              ].map((item) => (
                <SelectItem key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="volumeMl">Volume (ml)</Label>
          <Input
            id="volumeMl"
            name="volumeMl"
            type="number"
            min="1"
            max="20000"
            inputMode="numeric"
            defaultValue={initial.volumeMl ?? 500}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="consumedAt">Date and time</Label>
          <Input
            id="consumedAt"
            name="consumedAt"
            type="datetime-local"
            defaultValue={initial.consumedAt}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="calories">
            Calories{" "}
            <span className="font-normal text-muted-foreground">(if any)</span>
          </Label>
          <Input
            id="calories"
            name="calories"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            defaultValue={initial.calories ?? ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={initial.notes ?? ""} />
      </div>
      <FormMessage state={state} />
      <SubmitButton
        size="lg"
        className="h-11 w-full"
        pendingLabel="Saving drink…"
      >
        {initial.id ? "Update drink" : "Add drink"}
      </SubmitButton>
    </form>
  );
}
