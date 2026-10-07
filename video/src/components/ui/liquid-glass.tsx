import type React from "react";
import { cn } from "../../lib/utils";

/**
 * Static rebuild of the app's LiquidGlassCard (src/components/ui/liquid-glass.tsx) with the exact
 * face/edge shadow layers the app uses at blurIntensity="lg", glowIntensity="sm", shadowIntensity="sm".
 * The SVG turbulence displacement and backdrop blur are omitted: the only thing behind these panels is
 * an already-blurred ambient glow, so both are invisible at film scale and cost seconds per frame.
 */
const GLOW_SM = "0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08), 0 0 24px rgba(255, 255, 255, 0.1)";
const EDGE_SM = "inset 2px 2px 2px 0 rgba(255, 255, 255, 0.35), inset -2px -2px 2px 0 rgba(255, 255, 255, 0.35)";

export function LiquidGlassCard({
  children,
  className,
  borderRadius = "24px",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn("relative", className)} style={{ borderRadius, ...style }}>
      <div className="absolute inset-0 z-10" style={{ borderRadius, boxShadow: GLOW_SM }} />
      <div className="absolute inset-0 z-20" style={{ borderRadius, boxShadow: EDGE_SM }} />
      {children}
    </div>
  );
}

/**
 * The app's decorative glows (`rounded-full bg-primary/16 blur-3xl` etc.) drawn as radial gradients:
 * a 64px gaussian blur of a flat disc is visually a radial falloff, at a fraction of the raster cost.
 */
export function Glow({
  size,
  color,
  opacity,
  style,
}: {
  size: number;
  color: string;
  opacity: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute rounded-full"
      style={{
        width: size + 128,
        height: size + 128,
        margin: -64,
        background: `radial-gradient(closest-side, color-mix(in oklab, ${color} ${opacity * 100}%, transparent) 0%, color-mix(in oklab, ${color} ${opacity * 100}%, transparent) 55%, transparent 100%)`,
        ...style,
      }}
    />
  );
}
