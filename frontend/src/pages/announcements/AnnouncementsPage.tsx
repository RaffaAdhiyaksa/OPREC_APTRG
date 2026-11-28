import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Megaphone, Plus, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/utils";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FilterChips } from "@/components/shared/FilterChips";
import { PageHeader } from "@/components/shared/PageHeader";
import { RelativeTime } from "@/components/shared/RelativeTime";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAnnouncements, useDeleteAnnouncement, useMarkAnnouncementRead, useSentAnnouncements } from "@/hooks/queries/announcements";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/date";
import { getErrorMessage } from "@/lib/errors";
import { ROLE_LABEL } from "@/lib/labels";
import type { Announcement } from "@/types/api";
import { AnnouncementFormDialog } from "./AnnouncementFormDialog";

type View = "inbox" | "sent";

function TargetBadges({ a }: { a: Announcement }) {
  return (
    <>
      <Badge variant="outline">{a.target.division ? `Divisi ${a.target.division.name}` : "Semua divisi"}</Badge>
      <Badge variant="outline">{a.target.role ? ROLE_LABEL[a.target.role] : "Semua role"}</Badge>
    </>
  );
}

export default function AnnouncementsPage() {
  const user = useCurrentUser();
  const { hasPermission } = useAuth();
  const canSend = hasPermission("announcement.send");
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<View>("inbox");
  const inbox = useAnnouncements();
  const sent = useSentAnnouncements(canSend && view === "sent");
  const markRead = useMarkAnnouncementRead();
  const remove = useDeleteAnnouncement();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Announcement | null>(null);

  const query = view === "sent" ? sent : inbox;
  const items = query.data ?? [];
  const unread = (inbox.data ?? []).filter((a) => !a.is_read).length;
  const openId = Number(params.get("open"));
  const all = useMemo(() => [...(inbox.data ?? []), ...(sent.data ?? [])], [inbox.data, sent.data]);
  const opened = openId ? (all.find((a) => a.id === openId) ?? null) : null;

  // Opening an announcement marks it read (announcement_reads).
  const openedId = opened?.id;
  const openedUnread = opened ? !opened.is_read : false;
  const { mutate: markAsRead } = markRead;
  useEffect(() => {
    if (openedId && openedUnread) markAsRead(openedId);
  }, [openedId, openedUnread, markAsRead]);

  const open = (a: Announcement) => setParams({ open: String(a.id) });
  const close = () => setParams({}, { replace: true });
  const canDelete = (a: Announcement) => user.role === "admin" || a.author.id === user.id;

  return (
    <>
      <PageHeader
        title="Pengumuman"
        description={canSend ? (user.role === "admin" ? "Kirim ke semua, per divisi, atau per role." : `Kirim ke asisten magang Divisi ${user.research_division?.name}.`) : "Informasi dari admin dan koordinator divisi."}
        actions={
          canSend && (
            <Button size="lg" className="h-11 pl-1.5 shadow-md" onClick={() => setCreating(true)}>
              <span className="flex size-8 items-center justify-center rounded-full bg-white/20">
                <Plus aria-hidden />
              </span>
              Buat Pengumuman
            </Button>
          )
        }
        stats={inbox.data ? [{ label: "Belum dibaca", value: unread }] : undefined}
      />

      {canSend && (
        <FilterChips<View>
          label="Tampilan"
          value={view}
          onChange={setView}
          options={[
            { value: "inbox", label: "Untuk saya", count: inbox.data?.length },
            { value: "sent", label: "Terkirim", count: sent.data?.length },
          ]}
        />
      )}

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={view === "sent" ? "Anda belum mengirim pengumuman." : "Belum ada pengumuman."}
          action={
            canSend && (
              <Button onClick={() => setCreating(true)}>
                <Plus aria-hidden /> Buat Pengumuman
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((a) => {
            const isUnread = view === "inbox" && !a.is_read;
            return (
              <li key={a.id}>
                <article className={cn("glass flex gap-4 rounded-2xl p-5 transition-all duration-200 ease-out hover:-translate-y-0.5", isUnread && "ring-2 ring-brand/60")}>
                  <UserAvatar name={a.author.name} className="mt-0.5 hidden size-10 sm:flex" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {isUnread && <span className="size-2 rounded-full bg-brand" aria-label="Belum dibaca" />}
                      <button type="button" onClick={() => open(a)} className={cn("text-left text-lg outline-none hover:underline focus-visible:underline", isUnread ? "font-bold" : "font-medium")}>
                        {a.title}
                      </button>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{a.body}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{a.author.name}</span>
                      <span aria-hidden>·</span>
                      <RelativeTime value={a.created_at} />
                      {(canSend || view === "sent") && <TargetBadges a={a} />}
                      {view === "sent" && (
                        <span className="flex items-center gap-1">
                          <Users className="size-3.5" aria-hidden /> {a.recipients_count} penerima
                        </span>
                      )}
                    </div>
                  </div>
                  {canDelete(a) && (
                    <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setDeleting(a)} aria-label={`Hapus pengumuman ${a.title}`}>
                      <Trash2 aria-hidden />
                    </Button>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={opened !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-xl">
          {opened && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap gap-2">
                  <TargetBadges a={opened} />
                </div>
                <DialogTitle className="pt-2 text-2xl font-extrabold">{opened.title}</DialogTitle>
                <DialogDescription>
                  {opened.author.name} · {formatDateTime(opened.created_at)}
                </DialogDescription>
              </DialogHeader>
              <p className="max-h-[50svh] overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap">{opened.body}</p>
              <DialogFooter>
                {canDelete(opened) && (
                  <Button variant="outline" className="text-destructive" onClick={() => setDeleting(opened)}>
                    <Trash2 aria-hidden /> Hapus
                  </Button>
                )}
                <Button onClick={close}>Tutup</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AnnouncementFormDialog open={creating} onOpenChange={setCreating} />
      {deleting && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setDeleting(null)}
          title={`Hapus "${deleting.title}"?`}
          description={`Pengumuman hilang dari ${deleting.recipients_count} penerima. Tindakan ini tidak bisa dibatalkan.`}
          confirmLabel="Hapus"
          destructive
          onConfirm={async () => {
            try {
              await remove.mutateAsync(deleting.id);
              toast.success("Pengumuman dihapus.");
              if (opened?.id === deleting.id) close();
            } catch (e) {
              toast.error(getErrorMessage(e));
              throw e;
            }
          }}
        />
      )}
    </>
  );
}
