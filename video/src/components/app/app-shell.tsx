import type React from "react";
import { BarChart3, CalendarDays, CircleUserRound, History, LogOut, Settings2, Sun, UtensilsCrossed } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Glow, LiquidGlassCard } from "../ui/liquid-glass";

/**
 * Rebuild of the signed-in AppShell (src/components/app-shell.tsx), dark theme, same class strings.
 * Breakpoint classes resolve against the emulated viewport (`.screen` container), so `width` 1440
 * renders the desktop sidebar layout and 390 renders the mobile layout. The mobile bottom nav is
 * position:fixed to the device viewport in the app; the film always frames it out, so it is omitted.
 */
const navigation = [
  { href: "/today", label: "Today", icon: UtensilsCrossed },
  { href: "/history", label: "History", icon: History },
  { href: "/weekly", label: "Weekly", icon: CalendarDays },
  { href: "/monthly", label: "Monthly", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export const DESKTOP_VIEWPORT = 1440;
export const MOBILE_VIEWPORT = 390;

export function Screen({
  width,
  children,
  className,
  style,
  transparent = false,
}: {
  width: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Leave the body background to the stage so the signature ring can sit between it and the cards. */
  transparent?: boolean;
}) {
  return (
    <div className={cn("dark", className)} style={{ width, ...style }}>
      <div className={cn("screen relative min-h-full", transparent ? "text-foreground antialiased" : "app-body")} style={{ width }}>
        {children}
      </div>
    </div>
  );
}

export function AppShell({
  children,
  active = "/today",
  width,
  sidebar = true,
}: {
  children: React.ReactNode;
  active?: string;
  width: number;
  /** false: keep the 15rem column but leave it empty (the film never frames the sidebar). */
  sidebar?: boolean;
}) {
  const desktop = width >= 1024;
  return (
    <div className="min-h-screen">
      <div className="lg:grid lg:grid-cols-[15rem_1fr]">
        {desktop && !sidebar && <aside aria-hidden className="h-px" />}
        {desktop && sidebar && (
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-0 w-[28rem]">
            <Glow size={416} color="var(--primary)" opacity={0.18} style={{ top: -128, left: -80 }} />
            <Glow size={384} color="oklch(68.5% 0.169 237.323)" opacity={0.1} style={{ top: 520, left: -96 }} />
          </div>
        )}
        {desktop && sidebar && (
          <aside className="relative z-10 flex h-[900px] shrink-0 flex-col p-3">
            <LiquidGlassCard className="flex h-full w-full flex-col border border-white/25 bg-card/50 p-5 dark:border-white/10 dark:bg-white/5">
              <div className="relative z-30 flex h-full flex-col">
                <div className="flex items-center gap-3 px-2 py-2">
                  <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <UtensilsCrossed className="size-4" />
                  </span>
                  <span className="text-lg font-semibold tracking-tight">Intake</span>
                </div>
                <nav className="mt-8 space-y-1" aria-label="Primary navigation">
                  {navigation.map(({ href, label, icon: Icon }) => {
                    const isActive = href === active;
                    return (
                      <div
                        key={href}
                        className={cn(
                          "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground",
                          isActive && "bg-primary text-primary-foreground shadow-sm",
                        )}
                      >
                        <Icon className="size-4" />
                        {label}
                      </div>
                    );
                  })}
                  <div className="mt-4 border-t pt-4">
                    <Button variant="ghost" size="default" className="h-10 w-full justify-start gap-3 px-3 text-muted-foreground">
                      <Sun />
                      <span>Appearance</span>
                    </Button>
                  </div>
                </nav>
                <div className="mt-10 space-y-3 border-t pt-4">
                  <div className="flex items-center gap-3 rounded-xl border bg-background/70 p-3">
                    <CircleUserRound className="size-5 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">Alex Morgan</p>
                      <p className="truncate text-xs text-muted-foreground">alex@example.com</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="h-10 w-full justify-start rounded-xl">
                    <LogOut /> Sign out
                  </Button>
                </div>
              </div>
            </LiquidGlassCard>
          </aside>
        )}
        <div className="relative z-10 min-w-0">
          {!desktop && (
            <header className="flex h-14 items-center justify-between border-b bg-background/90 px-4">
              <div className="flex items-center gap-2 font-semibold">
                <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <UtensilsCrossed className="size-4" />
                </span>
                Intake
              </div>
              <Button variant="ghost" size="icon">
                <Sun />
              </Button>
            </header>
          )}
          <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 lg:px-10 lg:py-10 lg:pb-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
