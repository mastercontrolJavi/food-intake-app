"use client";

import { useActionState } from "react";
import {
  Bookmark,
  DatabaseZap,
  Heart,
  Ruler,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { seedDemoDataAction } from "@/app/actions/demo";
import { updatePasswordAction } from "@/app/actions/auth";
import {
  addMeasurementAction,
  deleteCustomFoodAction,
  deleteMeasurementAction,
  deleteSavedMealAction,
  saveCustomFoodAction,
  saveGoalsAction,
  saveProfileAction,
  toggleSavedMealFavoriteAction,
} from "@/app/actions/settings";
import { initialActionState } from "@/lib/actions/state";
import type { Tables } from "@/types/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

type Props = {
  defaultTab: string;
  today: string;
  nowInput: string;
  profile: Tables<"profiles">;
  activeGoal: Tables<"user_goals"> | null;
  goalHistory: Tables<"user_goals">[];
  measurements: Tables<"body_measurements">[];
  customFoods: Tables<"custom_foods">[];
  savedMeals: Tables<"saved_meals">[];
  editingFood: Tables<"custom_foods"> | null;
};
const kgToLb = (value: number | null) =>
  value == null ? "" : (value / 0.45359237).toFixed(1);
const cmToIn = (value: number | null) =>
  value == null ? "" : (value / 2.54).toFixed(1);

function ProfileSection({ profile }: Pick<Props, "profile">) {
  const [state, action] = useActionState(saveProfileAction, initialActionState);
  const imperial = profile.preferred_unit_system === "imperial";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Optional personal details and the timezone used to group your days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                name="displayName"
                defaultValue={profile.display_name ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">IANA timezone</Label>
              <Input
                id="timezone"
                name="timezone"
                defaultValue={profile.timezone}
                list="timezone-list"
                required
              />
              <datalist id="timezone-list">
                <option value="America/Mexico_City" />
                <option value="America/Los_Angeles" />
                <option value="America/New_York" />
                <option value="Europe/London" />
                <option value="Europe/Paris" />
                <option value="Asia/Tokyo" />
                <option value="UTC" />
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>Unit system</Label>
              <Select
                name="preferredUnitSystem"
                defaultValue={profile.preferred_unit_system}
              >
                <SelectTrigger aria-label="Unit system">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Metric</SelectItem>
                  <SelectItem value="imperial">Imperial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="heightCm">
                Height ({imperial ? "in" : "cm"})
              </Label>
              <Input
                id="heightCm"
                name="heightCm"
                type="number"
                min="1"
                step="any"
                inputMode="decimal"
                defaultValue={
                  imperial
                    ? cmToIn(profile.height_cm)
                    : (profile.height_cm ?? "")
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goalWeightKg">
                Goal weight ({imperial ? "lb" : "kg"})
              </Label>
              <Input
                id="goalWeightKg"
                name="goalWeightKg"
                type="number"
                min="1"
                step="any"
                inputMode="decimal"
                defaultValue={
                  imperial
                    ? kgToLb(profile.goal_weight_kg)
                    : (profile.goal_weight_kg ?? "")
                }
              />
            </div>
          </div>
          <FormMessage state={state} />
          <SubmitButton>Save profile</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordSection() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialActionState);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" /> Account security</CardTitle>
        <CardDescription>Use a unique password you do not reuse on any other site.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" name="password" type="password" autoComplete="new-password" minLength={8} required />
          </div>
          <FormMessage state={state} />
          <Button type="submit" disabled={pending}>{pending ? "Updating…" : "Update password"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function GoalsSection({
  activeGoal,
  goalHistory,
  today,
}: Pick<Props, "activeGoal" | "goalHistory" | "today">) {
  const [state, action] = useActionState(saveGoalsAction, initialActionState);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your goals</CardTitle>
          <CardDescription>
            These targets are your source of truth. Saving closes the prior
            period and preserves historical reviews.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Primary goal</Label>
                <Select
                  name="primaryGoal"
                  defaultValue={activeGoal?.primary_goal ?? "maintain"}
                >
                  <SelectTrigger aria-label="Primary goal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["maintain", "lose", "gain", "performance", "custom"].map(
                      (item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="effectiveFrom">Effective from</Label>
                <Input
                  id="effectiveFrom"
                  name="effectiveFrom"
                  type="date"
                  defaultValue={today}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calorieTarget">Calories</Label>
                <Input
                  id="calorieTarget"
                  name="calorieTarget"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  defaultValue={activeGoal?.calorie_target ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proteinTargetG">Protein (g)</Label>
                <Input
                  id="proteinTargetG"
                  name="proteinTargetG"
                  type="number"
                  min="1"
                  step="any"
                  defaultValue={activeGoal?.protein_target_g ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbsTargetG">Carbohydrates (g)</Label>
                <Input
                  id="carbsTargetG"
                  name="carbsTargetG"
                  type="number"
                  min="1"
                  step="any"
                  defaultValue={activeGoal?.carbs_target_g ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fatTargetG">Fat (g)</Label>
                <Input
                  id="fatTargetG"
                  name="fatTargetG"
                  type="number"
                  min="1"
                  step="any"
                  defaultValue={activeGoal?.fat_target_g ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiberTargetG">Fiber (g)</Label>
                <Input
                  id="fiberTargetG"
                  name="fiberTargetG"
                  type="number"
                  min="1"
                  step="any"
                  defaultValue={activeGoal?.fiber_target_g ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waterTargetMl">Water (ml)</Label>
                <Input
                  id="waterTargetMl"
                  name="waterTargetMl"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  defaultValue={activeGoal?.water_target_ml ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stepTarget">Daily steps</Label>
                <Input
                  id="stepTarget"
                  name="stepTarget"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  defaultValue={activeGoal?.step_target ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weeklyWorkoutTarget">Weekly workouts</Label>
                <Input
                  id="weeklyWorkoutTarget"
                  name="weeklyWorkoutTarget"
                  type="number"
                  min="1"
                  max="21"
                  defaultValue={activeGoal?.weekly_workout_target ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lateMealTime">Late meal cutoff</Label>
                <Input
                  id="lateMealTime"
                  name="lateMealTime"
                  type="time"
                  defaultValue={
                    activeGoal?.late_meal_time?.slice(0, 5) ?? "20:00"
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sodiumLimitMg">Sodium upper limit (mg)</Label>
                <Input
                  id="sodiumLimitMg"
                  name="sodiumLimitMg"
                  type="number"
                  min="1"
                  defaultValue={activeGoal?.sodium_limit_mg ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addedSugarLimitG">
                  Added sugar upper limit (g)
                </Label>
                <Input
                  id="addedSugarLimitG"
                  name="addedSugarLimitG"
                  type="number"
                  min="1"
                  step="any"
                  defaultValue={activeGoal?.added_sugar_limit_g ?? ""}
                />
              </div>
            </div>
            <FormMessage state={state} />
            <SubmitButton>Save goals</SubmitButton>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Goal history</CardTitle>
          <CardDescription>
            Effective-dated configurations used by historical reviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {goalHistory.length ? (
            goalHistory.map((goal) => (
              <div
                key={goal.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    From {goal.effective_from}
                    {goal.effective_until
                      ? ` to ${goal.effective_until}`
                      : " · current"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      goal.calorie_target != null
                        ? `${goal.calorie_target} kcal`
                        : null,
                      goal.protein_target_g != null
                        ? `${goal.protein_target_g}g protein`
                        : null,
                      goal.water_target_ml != null
                        ? `${goal.water_target_ml}ml water`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Badge variant="secondary">{goal.primary_goal}</Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No goals saved yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MeasurementsSection({
  measurements,
  profile,
  nowInput,
}: Pick<Props, "measurements" | "profile" | "nowInput">) {
  const [state, action] = useActionState(
    addMeasurementAction,
    initialActionState,
  );
  const imperial = profile.preferred_unit_system === "imperial";
  return (
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Add measurement</CardTitle>
          <CardDescription>
            Body statistics are optional and never required for grading.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="measuredAt">Measured at</Label>
              <Input
                id="measuredAt"
                name="measuredAt"
                type="datetime-local"
                defaultValue={nowInput}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightKg">
                Weight ({imperial ? "lb" : "kg"})
              </Label>
              <Input
                id="weightKg"
                name="weightKg"
                type="number"
                min="1"
                step="any"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bodyFatPct">Body fat (%)</Label>
              <Input
                id="bodyFatPct"
                name="bodyFatPct"
                type="number"
                min="1"
                max="75"
                step="any"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="waistCm">Waist ({imperial ? "in" : "cm"})</Label>
              <Input
                id="waistCm"
                name="waistCm"
                type="number"
                min="1"
                step="any"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="measurementNotes">Note</Label>
              <Textarea id="measurementNotes" name="notes" />
            </div>
            <FormMessage state={state} />
            <SubmitButton>Add measurement</SubmitButton>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Measurement history</CardTitle>
          <CardDescription>
            Normalized metric values are stored internally.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {measurements.length ? (
            <div className="divide-y">
              {measurements.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(entry.measured_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        entry.weight_kg != null
                          ? `${imperial ? kgToLb(entry.weight_kg) : entry.weight_kg} ${imperial ? "lb" : "kg"}`
                          : null,
                        entry.body_fat_pct != null
                          ? `${entry.body_fat_pct}% fat`
                          : null,
                        entry.waist_cm != null
                          ? `${imperial ? cmToIn(entry.waist_cm) : entry.waist_cm} ${imperial ? "in waist" : "cm waist"}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <form action={deleteMeasurementAction}>
                    <input type="hidden" name="id" value={entry.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      aria-label="Delete measurement"
                    >
                      <Trash2 />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid min-h-36 place-items-center text-sm text-muted-foreground">
              No measurements yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FoodsSection({
  customFoods,
  savedMeals,
  editingFood,
}: Pick<Props, "customFoods" | "savedMeals" | "editingFood">) {
  const [state, action] = useActionState(
    saveCustomFoodAction,
    initialActionState,
  );
  return (
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingFood ? "Edit custom food" : "Create custom food"}
          </CardTitle>
          <CardDescription>
            Save a trusted nutrition snapshot for fast logging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            {editingFood && (
              <input type="hidden" name="id" value={editingFood.id} />
            )}
            <div className="space-y-2">
              <Label htmlFor="foodName">Name</Label>
              <Input
                id="foodName"
                name="name"
                defaultValue={editingFood?.name ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servingDescription">Serving</Label>
              <Input
                id="servingDescription"
                name="servingDescription"
                defaultValue={editingFood?.serving_description ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["calories", "Calories", editingFood?.calories],
                  ["proteinG", "Protein (g)", editingFood?.protein_g],
                  ["carbsG", "Carbs (g)", editingFood?.carbs_g],
                  ["fatG", "Fat (g)", editingFood?.fat_g],
                  ["fiberG", "Fiber (g)", editingFood?.fiber_g],
                  ["sodiumMg", "Sodium (mg)", editingFood?.sodium_mg],
                  [
                    "addedSugarG",
                    "Added sugar (g)",
                    editingFood?.added_sugar_g,
                  ],
                ] as const
              ).map(([name, label, initial]) => (
                <div className="space-y-2" key={name}>
                  <Label htmlFor={name}>{label}</Label>
                  <Input
                    id={name}
                    name={name}
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    defaultValue={initial ?? ""}
                  />
                </div>
              ))}
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="isFavorite"
                defaultChecked={editingFood?.is_favorite}
                className="size-4 accent-primary"
              />
              Favorite
            </label>
            <FormMessage state={state} />
            <SubmitButton>
              {editingFood ? "Update food" : "Save custom food"}
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="size-5" /> Custom foods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {customFoods.length ? (
              customFoods.map((food) => (
                <div
                  key={food.id}
                  className="flex items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {food.name}{" "}
                      {food.is_favorite && (
                        <Heart className="inline size-3 fill-current text-primary" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        food.calories != null ? `${food.calories} kcal` : null,
                        food.protein_g != null
                          ? `${food.protein_g}g protein`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Nutrition unknown"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <a href={`/settings?tab=foods&editFood=${food.id}`}>
                        Edit
                      </a>
                    </Button>
                    <form action={deleteCustomFoodAction}>
                      <input type="hidden" name="id" value={food.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        aria-label="Delete custom food"
                      >
                        <Trash2 />
                      </Button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No custom foods yet.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="size-5" /> Saved meals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {savedMeals.length ? (
              savedMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{meal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        meal.calories != null ? `${meal.calories} kcal` : null,
                        meal.protein_g != null
                          ? `${meal.protein_g}g protein`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <form action={toggleSavedMealFavoriteAction}>
                      <input type="hidden" name="id" value={meal.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        aria-label="Toggle favorite"
                      >
                        <Heart
                          className={
                            meal.is_favorite ? "fill-current text-primary" : ""
                          }
                        />
                      </Button>
                    </form>
                    <form action={deleteSavedMealAction}>
                      <input type="hidden" name="id" value={meal.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        aria-label="Delete saved meal"
                      >
                        <Trash2 />
                      </Button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No saved meals yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DataSection() {
  const [state, action] = useActionState(
    seedDemoDataAction,
    initialActionState,
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Development data</CardTitle>
        <CardDescription>
          Exercise weekly and monthly analytics with a realistic, deterministic
          history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm leading-6 text-muted-foreground">
            This adds 35 days of meals, drinks, activity, reviews, and optional
            measurements to your account. It runs only when the account has no
            meal history and never runs automatically.
          </div>
          <input type="hidden" name="confirmation" value="seed" />
          <FormMessage state={state} />
          <SubmitButton>
            <DatabaseZap /> Add demo data to this empty account
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

export function SettingsTabs(props: Props) {
  return (
    <Tabs defaultValue={props.defaultTab} className="space-y-6">
      <TabsList className="h-auto w-full justify-start overflow-x-auto">
        <TabsTrigger value="profile">
          <UserRound /> Profile
        </TabsTrigger>
        <TabsTrigger value="goals">Goals</TabsTrigger>
        <TabsTrigger value="measurements">Measurements</TabsTrigger>
        <TabsTrigger value="foods">Foods</TabsTrigger>
        <TabsTrigger value="data">
          <DatabaseZap /> Data
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <div className="space-y-6">
          <ProfileSection profile={props.profile} />
          <PasswordSection />
        </div>
      </TabsContent>
      <TabsContent value="goals">
        <GoalsSection
          activeGoal={props.activeGoal}
          goalHistory={props.goalHistory}
          today={props.today}
        />
      </TabsContent>
      <TabsContent value="measurements">
        <MeasurementsSection
          measurements={props.measurements}
          profile={props.profile}
          nowInput={props.nowInput}
        />
      </TabsContent>
      <TabsContent value="foods">
        <FoodsSection
          customFoods={props.customFoods}
          savedMeals={props.savedMeals}
          editingFood={props.editingFood}
        />
      </TabsContent>
      <TabsContent value="data">
        <DataSection />
      </TabsContent>
    </Tabs>
  );
}
