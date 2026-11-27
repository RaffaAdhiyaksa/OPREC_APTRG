import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterChips } from "@/components/shared/FilterChips";
import { Pager } from "@/components/shared/ListControls";
import { NotificationItem } from "@/components/shared/NotificationItem";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/hooks/queries/notifications";
import { getErrorMessage } from "@/lib/errors";
import type { AppNotification } from "@/types/api";

type Tab = "all" | "unread";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(1);
  const list = useNotifications({ unread: tab === "unread", page });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unread = list.data?.meta.unread_count ?? 0;

  const openNotification = (n: AppNotification) => {
    if (!n.read_at) markRead.mutate(n.id);
    navigate(n.link);
  };

  const readAll = () =>
    markAll.mutate(undefined, {
      onSuccess: () => toast.success("Semua notifikasi ditandai dibaca."),
      onError: (e) => toast.error(getErrorMessage(e)),
    });

  return (
    <>
      <PageHeader
        title="Notifikasi"
        description="Pengumuman, tugas baru, dan nilai yang dipublikasikan."
        actions={
          <Button variant="outline" size="lg" className="h-11 bg-white/70 dark:bg-white/5" disabled={!unread || markAll.isPending} onClick={readAll}>
            <CheckCheck aria-hidden /> Tandai semua dibaca
          </Button>
        }
        stats={list.data ? [{ label: "Belum dibaca", value: unread }] : undefined}
      />
      <FilterChips<Tab>
        label="Filter notifikasi"
        value={tab}
        onChange={(t) => {
          setTab(t);
          setPage(1);
        }}
        options={[
          { value: "all", label: "Semua" },
          { value: "unread", label: "Belum dibaca", count: unread },
        ]}
      />
      {list.isError ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : list.isPending ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : list.data.data.length === 0 ? (
        <EmptyState icon={Bell} title={tab === "unread" ? "Tidak ada notifikasi yang belum dibaca." : "Belum ada notifikasi."} />
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <ul className="divide-y divide-border/60 p-1" aria-label="Daftar notifikasi">
            {list.data.data.map((n) => (
              <li key={n.id}>
                <NotificationItem notification={n} onOpen={openNotification} />
              </li>
            ))}
          </ul>
          {list.data.meta.last_page > 1 && (
            <div className="border-t border-border/60 px-4 py-3">
              <Pager meta={list.data.meta} onPage={setPage} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
