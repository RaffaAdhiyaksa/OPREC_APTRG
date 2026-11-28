import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { ClipboardList, Eye, MoreHorizontal, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FilterChips } from "@/components/shared/FilterChips";
import { SearchInput, TableCard } from "@/components/shared/ListControls";
import { PageHeader } from "@/components/shared/PageHeader";
import { RelativeTime } from "@/components/shared/RelativeTime";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { DeadlineBadge, DraftBadge } from "@/components/shared/StatusBadge";
import { useDivisions } from "@/hooks/queries/admin";
import { useAssignments, useDeleteAssignment, usePublishAssignment } from "@/hooks/queries/assignments";
import { useCurrentUser } from "@/hooks/useAuth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ungradedCount } from "@/lib/assignments";
import { getErrorMessage } from "@/lib/errors";
import type { Assignment } from "@/types/api";
import { AssignmentFormSheet } from "./AssignmentFormSheet";

type Tab = "active" | "past" | "draft";

const isPast = (a: Assignment) => new Date(a.due_at).getTime() < Date.now();
const tabOf = (a: Assignment): Tab => (a.status === "draft" ? "draft" : isPast(a) ? "past" : "active");

export default function StaffAssignmentList() {
  const user = useCurrentUser();
  const isAdmin = user.role === "admin";
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [divisionId, setDivisionId] = useState("all");
  const term = useDebouncedValue(search);
  const { data: divisions = [] } = useDivisions();
  const list = useAssignments({ search: term || undefined, division_id: isAdmin && divisionId !== "all" ? Number(divisionId) : undefined });
  const publish = usePublishAssignment();
  const remove = useDeleteAssignment();
  const [editing, setEditing] = useState<Assignment | null | undefined>(undefined);
  const [confirm, setConfirm] = useState<{ kind: "publish" | "delete"; assignment: Assignment } | null>(null);

  const counts = useMemo(() => {
    const c = { active: 0, past: 0, draft: 0 };
    for (const a of list.data ?? []) c[tabOf(a)]++;
    return c;
  }, [list.data]);
  const rows = (list.data ?? []).filter((a) => tabOf(a) === tab);
  const ungraded = (list.data ?? []).reduce((sum, a) => sum + ungradedCount(a), 0);

  const runConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === "publish") {
        await publish.mutateAsync(confirm.assignment.id);
        toast.success("Tugas dipublikasikan. Asisten magang menerima notifikasi.");
      } else {
        await remove.mutateAsync(confirm.assignment.id);
        toast.success("Tugas dihapus.");
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
      throw e;
    }
  };

  return (
    <>
      <PageHeader
        title="Tugas"
        description={isAdmin ? "Tugas semua divisi riset." : `Tugas Divisi ${user.research_division?.name ?? ""}`}
        actions={
          <Button size="lg" className="h-11 pl-1.5 shadow-md" onClick={() => setEditing(null)}>
            <span className="flex size-8 items-center justify-center rounded-full bg-white/20">
              <Plus aria-hidden />
            </span>
            Buat Tugas
          </Button>
        }
        stats={list.data ? [{ label: "Tugas aktif", value: counts.active }, { label: "Belum dinilai", value: ungraded }] : undefined}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari judul tugas" className="md:w-72" />
        <FilterChips<Tab>
          label="Status tugas"
          value={tab}
          onChange={setTab}
          options={[
            { value: "active", label: "Aktif", count: counts.active },
            { value: "past", label: "Lewat Deadline", count: counts.past },
            { value: "draft", label: "Draft", count: counts.draft },
          ]}
        />
        {isAdmin && (
          <Select value={divisionId} onValueChange={setDivisionId}>
            <SelectTrigger className="h-10 bg-white/70 md:ml-auto md:w-48 dark:bg-white/5" aria-label="Filter divisi">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua divisi</SelectItem>
              {divisions
                .filter((d) => d.type === "research")
                .map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {list.isError ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : !list.isPending && rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={term ? "Tidak ada tugas yang cocok." : tab === "draft" ? "Tidak ada draft tugas." : tab === "past" ? "Belum ada tugas yang lewat deadline." : "Belum ada tugas aktif."}
          action={
            tab !== "past" && !term ? (
              <Button onClick={() => setEditing(null)}>
                <Plus aria-hidden /> Buat Tugas
              </Button>
            ) : undefined
          }
        />
      ) : (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Judul</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Progres</TableHead>
                <TableHead>Belum dinilai</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isPending
                ? [0, 1, 2].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="px-5">
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : rows.map((a) => {
                    const s = a.stats;
                    const pending = ungradedCount(a);
                    return (
                      <TableRow key={a.id} className="cursor-pointer" onClick={() => navigate(`/assignments/${a.id}`)}>
                        <TableCell className="max-w-80 pl-5 whitespace-normal">
                          <Link to={`/assignments/${a.id}`} className="font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>
                            {a.title}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            {isAdmin && <span>{a.division.name}</span>}
                            {a.status === "draft" && <DraftBadge />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <RelativeTime value={a.due_at} className="font-medium" />
                            {a.status === "published" && <DeadlineBadge assignment={a} />}
                          </div>
                        </TableCell>
                        <TableCell>
                          {s && (
                            <div className="flex w-36 items-center gap-2">
                              <Progress value={s.total_interns ? (s.submitted / s.total_interns) * 100 : 0} className="h-2" aria-label={`${s.submitted} dari ${s.total_interns} terkumpul`} />
                              <span className="text-xs tabular-nums text-muted-foreground">
                                {s.submitted}/{s.total_interns}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={pending ? "font-semibold text-primary tabular-nums" : "text-muted-foreground tabular-nums"}>{pending}</span>
                        </TableCell>
                        <TableCell className="pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={`Aksi untuk ${a.title}`}>
                                <MoreHorizontal aria-hidden />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                              <DropdownMenuItem onSelect={() => navigate(`/assignments/${a.id}`)}>
                                <Eye aria-hidden /> Lihat & nilai
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setEditing(a)}>
                                <Pencil aria-hidden /> Edit
                              </DropdownMenuItem>
                              {a.status === "draft" && (
                                <DropdownMenuItem onSelect={() => setConfirm({ kind: "publish", assignment: a })}>
                                  <Send aria-hidden /> Publish
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onSelect={() => setConfirm({ kind: "delete", assignment: a })}>
                                <Trash2 aria-hidden /> Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </TableCard>
      )}

      <AssignmentFormSheet open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} assignment={editing ?? null} />
      {confirm && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setConfirm(null)}
          title={confirm.kind === "publish" ? `Publish "${confirm.assignment.title}"?` : `Hapus "${confirm.assignment.title}"?`}
          description={
            confirm.kind === "publish"
              ? `Semua asisten magang Divisi ${confirm.assignment.division.name} akan melihat tugas ini dan menerima notifikasi.`
              : "Tugas disembunyikan dari semua pengguna. Pengumpulan dan nilai yang sudah ada tetap tersimpan di arsip."
          }
          confirmLabel={confirm.kind === "publish" ? "Publish" : "Hapus"}
          destructive={confirm.kind === "delete"}
          onConfirm={runConfirm}
        />
      )}
    </>
  );
}
