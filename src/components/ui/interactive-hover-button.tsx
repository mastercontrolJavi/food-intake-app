import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Interactive hover button (magicui). On hover a flood grows from the left to
 * fill the pill while the label slides out and a duplicate slides in with an
 * arrow.
 *
 * The flood is hidden at rest — magicui parks it as a visible dot beside the
 * label, which reads as an unfinished element rather than an affordance.
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
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-6 size-2 -translate-y-1/2 scale-0 rounded-full bg-primary opacity-0 transition-all duration-300 group-hover:scale-[100.8] group-hover:opacity-100 motion-reduce:transition-none"
      />
      <span className="relative flex items-center justify-center transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0 motion-reduce:transition-none">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute inset-0 z-10 flex translate-x-12 items-center justify-center gap-2 text-primary-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none"
      >
        <span>{children}</span>
        <ArrowRight className="size-4" />
      </span>
    </button>
  );
}
