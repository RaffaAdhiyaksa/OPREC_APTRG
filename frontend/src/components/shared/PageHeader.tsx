import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

export interface HeaderStat {
  label: string;
  value: ReactNode;
  /** Small chip next to the number, e.g. "+2". */
  hint?: ReactNode;
}

/** Page title in the big uppercase style, one primary action on the right, optional big-number stats. */
export function PageHeader({
  title,
  description,
  actions,
  stats,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  stats?: HeaderStat[];
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between", className)}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {stats && stats.length > 0 && (
        <dl className="flex flex-wrap gap-x-10 gap-y-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-2">
              <dd className="text-5xl font-light tabular-nums tracking-tight">{stat.value}</dd>
              <dt className="flex flex-col text-sm text-muted-foreground">
                {stat.hint}
                <span>{stat.label}</span>
              </dt>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}

/** Section title with an underlined count, like "New Leads 7 Leads" in the reference. */
export function SectionTitle({ title, count, unit, actions }: { title: string; count?: number; unit?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-baseline gap-3">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {count !== undefined && (
          <span className="text-sm text-muted-foreground underline decoration-1 underline-offset-4">
            {count} {unit}
          </span>
        )}
      </div>
      {actions}
    </div>
  );
}
