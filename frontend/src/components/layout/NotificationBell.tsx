import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationItem } from "@/components/shared/NotificationItem";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useUnreadCount } from "@/hooks/queries/notifications";
import type { AppNotification } from "@/types/api";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: unread = 0 } = useUnreadCount();
  const latest = useNotifications({ page: 1 });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const openNotification = (n: AppNotification) => {
    if (!n.read_at) markRead.mutate(n.id);
    setOpen(false);
    navigate(n.link);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative size-10 bg-white/80 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10"
          aria-label={unread ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
        >
          <Bell aria-hidden />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground ring-2 ring-card tabular-nums">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-[min(24rem,calc(100vw-2rem))] rounded-xl p-0">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <p className="font-medium">Notifikasi</p>
          <Button variant="ghost" size="sm" disabled={!unread || markAll.isPending} onClick={() => markAll.mutate()}>
            <CheckCheck aria-hidden />
            Tandai semua dibaca
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto px-2">
          {latest.isPending ? (
            <div className="space-y-2 p-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : latest.data?.data.length ? (
            latest.data.data.slice(0, 5).map((n) => <NotificationItem key={n.id} notification={n} onOpen={openNotification} compact />)
          ) : (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">Belum ada notifikasi.</p>
          )}
        </div>
        <div className="border-t p-2">
          <Button asChild variant="ghost" className="w-full" onClick={() => setOpen(false)}>
            <Link to="/notifications">Lihat semua</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
