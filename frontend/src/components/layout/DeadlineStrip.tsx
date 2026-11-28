import { Link } from "react-router";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { useAssignments } from "@/hooks/queries/assignments";
import { formatDate, formatDateTime, formatRelative } from "@/lib/date";

/**
 * Dark pill timeline of the next deadlines (the dashboard reference's "Your Schedule" bar).
 * The nearest deadline is highlighted in sky blue.
 */
export function DeadlineStrip({ className }: { className?: string }) {
  const { data } = useAssignments({ due: "upcoming" });
  const upcoming = (data ?? []).filter((a) => a.status === "published").slice(0, 3);

  return (
    <div className={cn("flex h-12 min-w-0 items-center gap-2 rounded-full bg-inverse p-1.5 pl-5 text-inverse-foreground", className)}>
      <span className="shrink-0 text-sm font-semibold">Deadline</span>
      <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-current/20 px-3 py-1 text-xs opacity-80 2xl:flex">
        <CalendarDays className="size-3.5" aria-hidden />
        {formatDate(new Date())}
      </span>
      <ol className="flex min-w-0 flex-1 items-center gap-1.5" aria-label="Deadline terdekat">
        {upcoming.length === 0 && <li className="px-3 text-xs opacity-70">Tidak ada deadline dekat.</li>}
        {upcoming.map((a, index) => (
          <li key={a.id} className="min-w-0 flex-1">
            <Link
              to={`/assignments/${a.id}`}
              title={`${a.title} — ${formatDateTime(a.due_at)}`}
              className={cn(
                "flex h-9 min-w-0 items-center gap-2 rounded-full px-3 text-xs outline-none transition-all duration-200 ease-out focus-visible:ring-[3px] focus-visible:ring-brand/60",
                index === 0 ? "bg-brand text-brand-foreground" : "hover:bg-current/10",
              )}
            >
              <span className="shrink-0 font-bold tabular-nums">{formatRelative(a.due_at)}</span>
              <span className="truncate opacity-80">{a.title}</span>
              {index === 0 && <ArrowUpRight className="ml-auto size-4 shrink-0" aria-hidden />}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
