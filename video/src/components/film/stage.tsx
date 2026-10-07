import type React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";

/**
 * Screen-space backdrop: the app's dark body colour and its primary glow (globals.css body rule),
 * sized for a 2K frame. Everything else sits on top.
 */
export function Stage({ children }: { children?: React.ReactNode }) {
  const { width } = useVideoConfig();
  const glow = width * 0.42;
  return (
    <AbsoluteFill className="dark" style={{ backgroundColor: "var(--background)" }}>
      <AbsoluteFill
        style={{
          backgroundColor: "var(--background)",
          backgroundImage: `radial-gradient(circle at 15% 0%, color-mix(in oklab, var(--primary) 7%, transparent), transparent ${glow}px)`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
}
