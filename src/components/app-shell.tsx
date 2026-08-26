"use client";

import { useSyncExternalStore } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions/auth";

const navigation = [
  { href: "/today", label: "Today", icon: UtensilsCrossed },
  { href: "/history", label: "History", icon: History },
  { href: "/weekly", label: "Weekly", icon: CalendarDays },
  { href: "/monthly", label: "Monthly", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

const subscribeToHydration = () => () => undefined;

function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle color theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {hydrated && resolvedTheme === "dark" ? <Sun /> : <Moon />}
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
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r bg-card/80 p-5 backdrop-blur lg:flex lg:flex-col">
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
                  active && "bg-primary/10 text-primary",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-3 rounded-xl border bg-background/70 p-3">
            <CircleUserRound className="size-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {displayName ?? "Intake member"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
            <ThemeButton />
          </div>
          {demoMode ? (
            <Button asChild className="w-full justify-start">
              <Link href="/login"><LogIn /> Use Intake</Link>
            </Button>
          ) : (
            <form action={signOutAction}>
              <Button variant="ghost" className="w-full justify-start">
                <LogOut /> Sign out
              </Button>
            </form>
          )}
        </div>
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
          {demoMode && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-primary" />
                <span><strong>Interactive product demo.</strong> Everything shown is fictional and read-only.</span>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/login">Create your own account</Link>
              </Button>
            </div>
          )}
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
  );
}
