"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BarChart3,
  CalendarDays,
  CircleUserRound,
  Eye,
  History,
  LogIn,
  LogOut,
  Moon,
  Settings2,
  Sun,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LiquidGlassCard } from "@/components/ui/liquid-glass";
import { signOutAction } from "@/app/actions/auth";

const navigation = [
  { href: "/today", label: "Today", icon: UtensilsCrossed },
  { href: "/history", label: "History", icon: History },
  { href: "/weekly", label: "Weekly", icon: CalendarDays },
  { href: "/monthly", label: "Monthly", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

const subscribeToHydration = () => () => undefined;

function ThemeButton({ showLabel = false }: { showLabel?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  return (
    <Button
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      className={showLabel ? "h-10 w-full justify-start gap-3 px-3 text-muted-foreground" : undefined}
      aria-label={hydrated ? `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode` : "Toggle color theme"}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {hydrated && resolvedTheme === "dark" ? <Sun /> : <Moon />}
      {showLabel && <span>Appearance</span>}
    </Button>
  );
}

export function AppShell({
  children,
  displayName,
  email,
  demoMode = false,
}: {
  children: React.ReactNode;
  displayName: string | null;
  email: string;
  demoMode?: boolean;
}) {
  const pathname = usePathname();
  const homeHref = demoMode ? "/demo" : "/today";
  const navigationHref = (href: string) => {
    if (!demoMode) return href;
    return href === "/today" ? "/demo" : `/demo${href}`;
  };
  const [showDemoNotice, setShowDemoNotice] = useState(true);
  return (
    <div className="min-h-screen">
      {demoMode && showDemoNotice && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-primary/10 px-4 py-2 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <Eye className="size-4 shrink-0 text-primary" />
            <span className="truncate">
              <strong>Interactive demo.</strong> Everything shown is fictional and read-only.
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button asChild size="sm" variant="outline">
              <Link href="/login">Create your own account</Link>
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Dismiss demo notice"
              onClick={() => setShowDemoNotice(false)}
            >
              <X />
            </Button>
          </div>
        </div>
      )}
      <div className="lg:grid lg:grid-cols-[15rem_1fr]">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-y-0 left-0 -z-10 hidden w-[28rem] overflow-hidden lg:block"
        >
          <div className="absolute -top-32 -left-20 size-[26rem] rounded-full bg-primary/18 blur-3xl" />
          <div className="absolute bottom-[-6rem] -left-24 size-[24rem] rounded-full bg-sky-400/12 blur-3xl dark:bg-sky-500/10" />
        </div>
        <aside className="sticky top-0 hidden h-screen shrink-0 p-3 lg:flex lg:flex-col">
          <LiquidGlassCard
            draggable={false}
            blurIntensity="lg"
            glowIntensity="sm"
            shadowIntensity="sm"
            borderRadius="24px"
            className="flex h-full w-full flex-col border border-white/25 bg-card/50 p-5 dark:border-white/10 dark:bg-white/5"
          >
            <div className="relative z-30 flex h-full flex-col">
              <Link
                href={homeHref}
                className="flex items-center gap-3 px-2 py-2"
                aria-label="Intake home"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <UtensilsCrossed className="size-4" />
                </span>
                <span className="text-lg font-semibold tracking-tight">Intake</span>
              </Link>
              <nav className="mt-8 space-y-1" aria-label="Primary navigation">
                {navigation.map(({ href, label, icon: Icon }) => {
                  const targetHref = navigationHref(href);
                  const active = pathname === targetHref || (targetHref !== "/demo" && pathname.startsWith(`${targetHref}/`));
                  return (
                    <Link
                      key={href}
                      href={targetHref}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                        active && "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                      {label}
                    </Link>
                  );
                })}
                <div className="mt-4 border-t pt-4">
                  <ThemeButton showLabel />
                </div>
              </nav>
              <div className="mt-10 space-y-3 border-t pt-4">
                <div className="flex items-center gap-3 rounded-xl border bg-background/70 p-3">
                  <CircleUserRound className="size-5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {displayName ?? "Intake member"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{email}</p>
                  </div>
                </div>
                {demoMode ? (
                  <Button asChild className="h-10 w-full justify-start rounded-xl">
                    <Link href="/login"><LogIn /> Exit demo / sign up</Link>
                  </Button>
                ) : (
                  <form action={signOutAction}>
                    <Button variant="ghost" className="h-10 w-full justify-start rounded-xl">
                      <LogOut /> Sign out
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </LiquidGlassCard>
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:hidden">
            <Link href={homeHref} className="flex items-center gap-2 font-semibold">
              <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <UtensilsCrossed className="size-4" />
              </span>
              Intake
            </Link>
            <ThemeButton />
          </header>
          <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 lg:px-10 lg:py-10 lg:pb-10">
            {children}
          </main>
        </div>
        <nav
          className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/95 px-2 pt-2 backdrop-blur lg:hidden"
          aria-label="Mobile navigation"
        >
          {navigation.map(({ href, label, icon: Icon }) => {
            const targetHref = navigationHref(href);
            const active = pathname === targetHref || (targetHref !== "/demo" && pathname.startsWith(`${targetHref}/`));
            return (
              <Link
                key={href}
                href={targetHref}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium text-muted-foreground",
                  active && "text-primary",
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
