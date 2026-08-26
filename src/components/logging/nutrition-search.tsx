"use client";

import { useState } from "react";
import { Database, LoaderCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { NutritionSearchResult } from "@/lib/nutrition/types";

export function NutritionSearch({ onSelect }: { onSelect: (result: NutritionSearchResult) => void }) {
  const [query, setQuery] = useState(""); const [results, setResults] = useState<NutritionSearchResult[]>([]); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function search() {
    if (query.trim().length < 2) return;
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`/api/nutrition/search?q=${encodeURIComponent(query)}`);
      const body = await response.json() as { configured?: boolean; results?: NutritionSearchResult[]; error?: string };
      if (!response.ok) { setResults([]); setMessage(body.configured === false ? "USDA search is not configured. Manual and saved foods remain available." : body.error ?? "Search is unavailable."); return; }
      setResults(body.results ?? []); if (!body.results?.length) setMessage("No matching foods found.");
    } catch { setMessage("Nutrition search is unavailable. You can still save the meal manually."); }
    finally { setLoading(false); }
  }
  return <div className="space-y-3 rounded-xl border bg-muted/35 p-4"><div><div className="flex items-center gap-2 text-sm font-medium"><Database className="size-4" /> USDA FoodData Central</div><p className="mt-1 text-xs text-muted-foreground">Optional estimates. Review and edit values before saving.</p></div><div className="flex gap-2"><Input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void search(); } }} placeholder="Search foods" aria-label="Search USDA foods" /><Button type="button" variant="outline" onClick={() => void search()} disabled={loading}>{loading ? <LoaderCircle className="animate-spin" /> : <Search />} Search</Button></div>{message && <Alert><AlertDescription>{message}</AlertDescription></Alert>}{results.length > 0 && <div className="max-h-64 divide-y overflow-y-auto rounded-lg border bg-background">{results.map((result) => <div key={result.externalId} className="flex items-center justify-between gap-3 p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{result.name}</p><p className="truncate text-xs text-muted-foreground">{[result.brand, result.servingLabel, result.calories != null ? `${Math.round(result.calories)} kcal` : null].filter(Boolean).join(" · ")}</p></div><Button type="button" size="sm" variant="secondary" onClick={() => { onSelect(result); setResults([]); setMessage("Estimate imported. Review the portion and nutrition fields."); }}>Use</Button></div>)}</div>}</div>;
}
