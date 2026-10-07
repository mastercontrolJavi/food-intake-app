import type React from "react";
import { ArrowLeft, Bookmark, Clock3, RefreshCw, Star } from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

/**
 * Rebuild of /log/food above the form (src/app/(app)/log/food/page.tsx): page header, "Recent meals"
 * (one-tap Log again → repeatMealAction) and "Reusable foods". Class strings match the app.
 */
export type RecentMeal = { title: string; detail: string; target?: boolean };

export function LogFoodHeader() {
  return (
    <div>
      <Button variant="ghost" className="-ml-2 mb-3"><ArrowLeft /> Back to today</Button>
      <p className="text-sm font-medium text-primary">Fast food logging</p>
      <h1 className="text-3xl font-semibold tracking-tight">What did you eat?</h1>
      <p className="mt-2 text-muted-foreground">Add only the nutrition you know. Intake never invents values from a description.</p>
    </div>
  );
}

export function RecentMealsCard({
  meals,
  pressDepth = 0,
  targetButtonRef,
  className,
}: {
  meals: RecentMeal[];
  pressDepth?: number;
  targetButtonRef?: React.Ref<HTMLButtonElement>;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Clock3 className="size-4" /> Recent meals</CardTitle>
        <CardDescription>One tap creates a new independent log.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {meals.map((meal, index) => (
          <div key={`${meal.title}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{meal.title}</p>
              <p className="text-xs text-muted-foreground">{meal.detail}</p>
            </div>
            <Button
              ref={meal.target ? targetButtonRef : undefined}
              type="button"
              size="sm"
              variant="secondary"
              className={cn(meal.target && pressDepth > 0 && "bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]")}
              style={meal.target ? { transform: `translateY(${pressDepth}px)` } : undefined}
            >
              <RefreshCw /> Log again
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ReusableFoodsCard({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Bookmark className="size-4" /> Reusable foods</CardTitle>
        <CardDescription>Custom foods and favorite combinations.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {/* Fictional sample custom foods (favorites first), then saved meals — same order as the page query. */}
        <Button variant="outline" size="sm"><Star className="fill-current" />Protein shake</Button>
        <Button variant="outline" size="sm"><Star className="fill-current" />Greek yogurt bowl</Button>
        <Button variant="outline" size="sm">Overnight oats</Button>
        <Button variant="outline" size="sm">Eggs and toast</Button>
        <Button variant="outline" size="sm">Protein bar</Button>
        <Button variant="outline" size="sm"><Star className="fill-current" />Chicken rice bowl<Badge variant="secondary">meal</Badge></Button>
        <Button variant="outline" size="sm"><Star className="fill-current" />Salmon dinner<Badge variant="secondary">meal</Badge></Button>
        <Button variant="outline" size="sm">Turkey wrap<Badge variant="secondary">meal</Badge></Button>
        <Button variant="outline" size="sm">Lentil soup<Badge variant="secondary">meal</Badge></Button>
      </CardContent>
    </Card>
  );
}
