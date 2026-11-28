import { Award, ClipboardList, Megaphone, RefreshCw } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { formatDateTime, formatRelative } from "@/lib/date";
import type { AppNotification, NotificationType } from "@/types/api";

const ICON: Record<NotificationType, typeof Megaphone> = {
  announcement: Megaphone,
  assignment_published: ClipboardList,
  grade_published: Award,
  grade_updated: RefreshCw,
};

export function NotificationItem({
  notification: n,
  onOpen,
  compact = false,
}: {
  notification: AppNotification;
  onOpen: (n: AppNotification) => void;
  compact?: boolean;
}) {
  const Icon = ICON[n.type];
  const unread = !n.read_at;

  return (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg text-left outline-none transition-colors duration-200 hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50",
        compact ? "p-2" : "p-4",
      )}
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", unread ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground")}>
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className={cn("flex items-center gap-2 text-sm", unread ? "font-semibold" : "font-medium text-muted-foreground")}>
          <span className="truncate">{n.title}</span>
          {unread && <span className="size-2 shrink-0 rounded-full bg-brand" aria-label="Belum dibaca" />}
        </span>
        <span className={cn("block text-sm text-muted-foreground", compact && "line-clamp-1")}>{n.excerpt}</span>
        <time dateTime={n.created_at} title={formatDateTime(n.created_at)} className="block text-xs text-muted-foreground">
          {formatRelative(n.created_at)}
        </time>
      </span>
    </button>
  );
}
