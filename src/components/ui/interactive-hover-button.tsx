import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Interactive hover button (magicui). On hover the leading dot expands to flood
 * the pill and a duplicated label slides in with an arrow.
 *
 * The duplicated label is `aria-hidden` so the accessible name stays the label
 * itself rather than being announced twice.
 */
export function InteractiveHoverButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "group relative w-auto cursor-pointer overflow-hidden rounded-full border bg-background p-2 px-6 text-center font-semibold outline-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-60",
        className
      )}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full bg-primary transition-transform duration-300 group-hover:scale-[100.8] motion-reduce:transition-none"
        />
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0 motion-reduce:transition-none">
          {children}
        </span>
      </span>
      <span
        aria-hidden
        className="absolute inset-0 z-10 flex translate-x-12 items-center justify-center gap-2 text-primary-foreground opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100 motion-reduce:transition-none"
      >
        <span>{children}</span>
        <ArrowRight className="size-4" />
      </span>
    </button>
  );
}
