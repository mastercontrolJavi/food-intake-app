"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ScoreMetric } from "@/lib/scoring";

export function ScoreDetailsDialog({ metrics, score }: { metrics: ScoreMetric[]; score: number | null }) {
  return <Dialog><DialogTrigger asChild><Button variant="ghost" size="sm"><Info /> Why this score?</Button></DialogTrigger><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Transparent score breakdown</DialogTitle><DialogDescription>Only configured metrics with tracked data contribute. Missing data is excluded and the available weights are normalized.</DialogDescription></DialogHeader><div className="divide-y">{metrics.filter((metric) => metric.configured).map((metric) => <div key={metric.id} className="grid grid-cols-[1fr_auto] gap-4 py-3"><div><div className="font-medium">{metric.label}</div><div className="text-sm text-muted-foreground">{metric.available && metric.actual != null && metric.target != null ? `${Math.round(metric.actual).toLocaleString()}${metric.unit} / ${Math.round(metric.target).toLocaleString()}${metric.unit}` : "Not enough tracked data"}</div></div><div className="text-right"><div className="number-tabular font-semibold">{metric.score == null ? "—" : `${Math.round(metric.score)}/100`}</div><div className="text-xs text-muted-foreground">Weight {metric.weight}%</div></div></div>)}</div><div className="flex items-center justify-between rounded-xl bg-muted p-4"><span className="font-medium">Normalized result</span><strong className="number-tabular text-xl">{score == null ? "Not enough data" : `${Math.round(score)} / 100`}</strong></div></DialogContent></Dialog>;
}
