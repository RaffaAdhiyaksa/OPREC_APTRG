import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/utils";

// Building blocks for dashboards in the style of the user's reference image:
// rounded cards with a circular ↗ button, one highlighted card, and a dark summary panel.

export function ArrowButton({ to, label, className }: { to: string; label: string; className?: string }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full border border-current/15 bg-white/70 text-foreground outline-none transition-all duration-200 ease-out hover:scale-105 hover:bg-white focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-white/10 dark:hover:bg-white/20",
        className,
      )}
    >
      <ArrowUpRight className="size-4" aria-hidden />
    </Link>
  );
}

/** Card with a ↗ action in the corner. `highlight` paints it sky blue (the reference's lime card). */
export function DashCard({
  children,
  to,
  linkLabel,
  highlight = false,
  className,
}: {
  children: ReactNode;
  to?: string;
  linkLabel?: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "relative flex min-w-0 flex-col gap-4 rounded-2xl p-5 transition-all duration-200 ease-out hover:-translate-y-0.5",
        highlight ? "bg-brand text-brand-foreground shadow-lg shadow-brand/20" : "glass",
        className,
      )}
    >
      {to && <ArrowButton to={to} label={linkLabel ?? "Buka"} className="absolute top-4 right-4" />}
      {children}
    </article>
  );
}

/** Small rounded info chip used at the bottom of dashboard cards. */
export function Chip({ children, tone = "default", className }: { children: ReactNode; tone?: "default" | "warning" | "success" | "danger"; className?: string }) {
  const tones = {
    default: "border-current/15 bg-white/50 dark:bg-white/5",
    warning: "border-transparent bg-warning text-warning-foreground",
    success: "border-transparent bg-success text-success-foreground",
    danger: "border-transparent bg-destructive text-destructive-foreground",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

/** Dark panel with a vertical timeline (the reference's "Summary" panel). */
export function SummaryPanel({
  title,
  icon: Icon,
  to,
  linkLabel,
  children,
  className,
}: {
  title: string;
  icon: LucideIcon;
  to?: string;
  linkLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-5 rounded-2xl bg-inverse p-5 text-inverse-foreground", className)} aria-label={title}>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full border border-current/20">
          <Icon className="size-4" aria-hidden />
        </span>
        <h2 className="flex-1 text-xl font-bold tracking-tight text-inherit">{title}</h2>
        {to && <ArrowButton to={to} label={linkLabel ?? title} className="border-current/20 bg-transparent text-inherit hover:bg-white/10 dark:bg-transparent" />}
      </div>
      {children}
    </section>
  );
}

export function Timeline({ children }: { children: ReactNode }) {
  return <ol className="relative space-y-3 before:absolute before:top-2 before:bottom-2 before:left-[13px] before:w-px before:bg-current/20">{children}</ol>;
}

export function TimelineItem({ marker, children, active = false }: { marker: ReactNode; children: ReactNode; active?: boolean }) {
  return (
    <li className="relative flex gap-3">
      <span
        className={cn(
          "relative z-10 mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
          active ? "bg-brand text-brand-foreground" : "bg-white/10 text-inherit ring-1 ring-current/20",
        )}
      >
        {marker}
      </span>
      <div className="min-w-0 flex-1 rounded-xl bg-white/5 p-3 ring-1 ring-current/10">{children}</div>
    </li>
  );
}
