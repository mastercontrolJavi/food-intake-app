"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { label: string; value: number | null };

function ChartTooltip({ active, payload, label, unit = "" }: {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length || payload[0]?.value == null) return null;
  return <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md"><div className="font-medium">{label}</div><div className="mt-1 text-muted-foreground">{Math.round(Number(payload[0].value) * 10) / 10}{unit}</div></div>;
}

export function ScoreTrendChart({ points }: { points: Point[] }) {
  return <div className="h-64 w-full" role="img" aria-label="Daily score trend chart">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={points} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
        <defs><linearGradient id="score-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} minTickGap={18} />
        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} fill="url(#score-fill)" connectNulls={false} />
      </AreaChart>
    </ResponsiveContainer>
  </div>;
}

export function MeasurementTrendChart({ points, unit }: { points: Point[]; unit: string }) {
  return <div className="h-56 w-full" role="img" aria-label={`Body measurement trend in ${unit}`}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={points} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} minTickGap={18} />
        <YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} width={48} />
        <Tooltip content={<ChartTooltip unit={` ${unit}`} />} />
        <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} dot={{ fill: "var(--primary)", r: 3 }} connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>;
}
