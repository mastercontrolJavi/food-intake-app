"use client";

import { useActionState } from "react";
import { saveActivityAction } from "@/app/actions/logs";
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

export type ActivityPrefill = {
  id?: string;
  occurredAt: string;
  activityType?: string;
  durationMinutes?: number | null;
  steps?: number | null;
  distanceKm?: number | null;
  estimatedCaloriesBurned?: number | null;
  intensity?: string | null;
  notes?: string | null;
};
export function ActivityForm({ initial }: { initial: ActivityPrefill }) {
  const [state, action] = useActionState(
    saveActivityAction,
    initialActionState,
  );
  return (
    <form action={action} className="space-y-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Activity type</Label>
          <Select
            name="activityType"
            defaultValue={initial.activityType ?? "walking"}
          >
            <SelectTrigger aria-label="Activity type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                "steps",
                "walking",
                "running",
                "gym",
                "weights",
                "cycling",
                "sport",
                "hiking",
                "swimming",
                "other",
              ].map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="occurredAt">Date and time</Label>
          <Input
            id="occurredAt"
            name="occurredAt"
            type="datetime-local"
            defaultValue={initial.occurredAt}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationMinutes">Duration (minutes)</Label>
          <Input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min="0"
            inputMode="numeric"
            defaultValue={initial.durationMinutes ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="steps">Steps</Label>
          <Input
            id="steps"
            name="steps"
            type="number"
            min="0"
            inputMode="numeric"
            defaultValue={initial.steps ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="distanceKm">Distance (km)</Label>
          <Input
            id="distanceKm"
            name="distanceKm"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            defaultValue={initial.distanceKm ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedCaloriesBurned">
            Estimated calories burned
          </Label>
          <Input
            id="estimatedCaloriesBurned"
            name="estimatedCaloriesBurned"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            defaultValue={initial.estimatedCaloriesBurned ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label>Intensity</Label>
          <Select name="intensity" defaultValue={initial.intensity ?? "none"}>
            <SelectTrigger aria-label="Intensity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              {["low", "moderate", "high"].map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={initial.notes ?? ""} />
      </div>
      <FormMessage state={state} />
      <p className="text-xs text-muted-foreground">
        Activity is displayed separately and never subtracted from food intake.
      </p>
      <SubmitButton
        size="lg"
        className="h-11 w-full"
        pendingLabel="Saving activity…"
      >
        {initial.id ? "Update activity" : "Add activity"}
      </SubmitButton>
    </form>
  );
}
