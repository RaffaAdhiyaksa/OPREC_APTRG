import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, CalendarClock, FileCheck2, Paperclip, Pencil, Send, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Chip } from "@/components/shared/DashboardBlocks";
import { FilterChips } from "@/components/shared/FilterChips";
import { InfoItem } from "@/components/shared/InfoItem";
import { SearchInput, TableCard } from "@/components/shared/ListControls";
import { RelativeTime } from "@/components/shared/RelativeTime";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { DeadlineBadge, DraftBadge, GradeStatusBadge, SubmissionBadge } from "@/components/shared/StatusBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAssignmentSubmissions, usePublishAssignment, usePublishGrades } from "@/hooks/queries/assignments";
import { formatDateTime } from "@/lib/date";
import { getErrorMessage } from "@/lib/errors";
import type { Assignment, SubmissionRow } from "@/types/api";
import { AssignmentFormSheet } from "./AssignmentFormSheet";
import { GradeSheet } from "./GradeSheet";

type Filter = "all" | "submitted" | "missing" | "late" | "graded_draft" | "graded_published";

const matches = (r: SubmissionRow, f: Filter) => {
  switch (f) {
    case "all":
      return true;
    case "submitted":
      return Boolean(r.submission);
    case "missing":
      return !r.submission;
    case "late":
      return Boolean(r.submission?.is_late);
    case "graded_draft":
      return r.grade?.status === "draft";
    case "graded_published":
      return r.grade?.status === "published";
  }
};

const METHOD_LABEL = { file: "File", drive: "Drive", both: "File + Drive" } as const;

export default function StaffAssignmentDetail({ assignment }: { assignment: Assignment }) {
  const submissions = useAssignmentSubmissions(assignment.id);
  const publishGrades = usePublishGrades(assignment.id);
  const publishAssignment = usePublishAssignment();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<"all" | "selected" | "assignment" | null>(null);

  const meta = submissions.data?.meta;
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (submissions.data?.data ?? []).filter(
      (r) => matches(r, filter) && (!term || r.user.name.toLowerCase().includes(term) || (r.user.nim ?? "").includes(term)),
    );
  }, [submissions.data, filter, search]);
  const draftIds = rows.filter((r) => r.grade?.status === "draft").map((r) => r.user.id);
  const selectedDrafts = [...selected].filter((id) => draftIds.includes(id));

  const toggle = (id: number, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const runConfirm = async () => {
    try {
      if (confirm === "assignment") {
        await publishAssignment.mutateAsync(assignment.id);
        toast.success("Tugas dipublikasikan. Asisten magang menerima notifikasi.");
      } else {
        const { published } = await publishGrades.mutateAsync(confirm === "selected" ? selectedDrafts : undefined);
        setSelected(new Set());
        toast.success(`${published} nilai dipublikasikan. Asisten magang menerima notifikasi.`);
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
      throw e;
    }
  };

  const draftTotal = meta?.graded_draft ?? 0;

  return (
    <>
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/assignments">
            <ArrowLeft aria-hidden /> Semua tugas
          </Link>
        </Button>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Divisi {assignment.division.name}</Badge>
              {assignment.status === "draft" ? <DraftBadge /> : <DeadlineBadge assignment={assignment} />}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{assignment.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="bg-white/70 dark:bg-white/5" onClick={() => setEditing(true)}>
              <Pencil aria-hidden /> Edit
            </Button>
            {assignment.status === "draft" ? (
              <Button onClick={() => setConfirm("assignment")}>
                <Send aria-hidden /> Publish tugas
              </Button>
            ) : (
              <Button onClick={() => setConfirm("all")} disabled={draftTotal === 0}>
                <Send aria-hidden /> Publish Semua Nilai Draft{draftTotal ? ` (${draftTotal})` : ""}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="glass space-y-4 rounded-2xl p-6" aria-label="Deskripsi tugas">
          <h2 className="text-lg font-bold">Deskripsi</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{assignment.description}</p>
        </section>
        <section className="glass grid gap-4 rounded-2xl p-6 sm:grid-cols-2 xl:grid-cols-1" aria-label="Ketentuan">
          <InfoItem icon={CalendarClock} label="Deadline">
            {formatDateTime(assignment.due_at)}
            <span className="block text-xs font-normal text-muted-foreground">{assignment.allow_late ? "Terlambat diizinkan" : "Tidak menerima terlambat"}</span>
          </InfoItem>
          <InfoItem icon={Paperclip} label="File">
            Maks {assignment.max_file_size_mb} MB · {assignment.allowed_extensions?.join(", ").toUpperCase() ?? "Semua format"}
          </InfoItem>
          <InfoItem icon={Trophy} label="Nilai maksimal">
            {assignment.max_score}
          </InfoItem>
        </section>
      </div>

      <section className="space-y-4" aria-labelledby="submissions-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="submissions-title" className="text-xl font-bold tracking-tight">
            Pengumpulan
          </h2>
          {meta && (
            <div className="flex flex-wrap gap-2">
              <Chip>
                <FileCheck2 className="size-3.5" aria-hidden /> {meta.submitted}/{meta.total} terkumpul
              </Chip>
              <Chip>{meta.missing} belum</Chip>
              <Chip tone={meta.late ? "danger" : "default"}>{meta.late} terlambat</Chip>
              <Chip tone={meta.graded_draft ? "warning" : "default"}>{meta.graded_draft} draft nilai</Chip>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari nama atau NIM" className="lg:w-64" />
          <FilterChips<Filter>
            label="Filter pengumpulan"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "Semua", count: meta?.total },
              { value: "submitted", label: "Terkumpul", count: meta?.submitted },
              { value: "missing", label: "Belum", count: meta?.missing },
              { value: "late", label: "Terlambat", count: meta?.late },
              { value: "graded_draft", label: "Draft", count: meta?.graded_draft },
              { value: "graded_published", label: "Published", count: meta?.graded_published },
            ]}
          />
          {selectedDrafts.length > 0 && (
            <Button className="lg:ml-auto" onClick={() => setConfirm("selected")}>
              <Send aria-hidden /> Publish terpilih ({selectedDrafts.length})
            </Button>
          )}
        </div>

        {submissions.isError ? (
          <ErrorState error={submissions.error} onRetry={() => void submissions.refetch()} />
        ) : !submissions.isPending && rows.length === 0 ? (
          <EmptyState icon={Users} title={meta?.total ? "Tidak ada yang cocok dengan filter." : "Belum ada asisten magang di divisi ini."} />
        ) : (
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-5">
                    <Checkbox
                      aria-label="Pilih semua nilai draft"
                      checked={draftIds.length > 0 && draftIds.every((id) => selected.has(id))}
                      disabled={draftIds.length === 0}
                      onCheckedChange={(on) => setSelected(on ? new Set(draftIds) : new Set())}
                    />
                  </TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead className="pr-5 text-right">
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.isPending
                  ? [0, 1, 2].map((i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7} className="px-5">
                          <Skeleton className="h-10 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : rows.map((r, index) => (
                      <TableRow key={r.user.id}>
                        <TableCell className="pl-5">
                          {r.grade?.status === "draft" && (
                            <Checkbox aria-label={`Pilih nilai ${r.user.name}`} checked={selected.has(r.user.id)} onCheckedChange={(on) => toggle(r.user.id, on === true)} />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar name={r.user.name} className="size-8" />
                            <div>
                              <p className="font-medium">{r.user.name}</p>
                              <p className="text-xs text-muted-foreground">{r.user.nim ?? r.user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <SubmissionBadge submission={r.submission} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{r.submission ? METHOD_LABEL[r.submission.method] : "—"}</TableCell>
                        <TableCell>{r.submission ? <RelativeTime value={r.submission.submitted_at} className="text-muted-foreground" /> : "—"}</TableCell>
                        <TableCell>
                          {r.grade ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold tabular-nums">
                                {r.grade.score}
                                <span className="font-normal text-muted-foreground">/{assignment.max_score}</span>
                              </span>
                              <GradeStatusBadge status={r.grade.status} />
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="pr-5 text-right">
                          <Button size="sm" variant={r.submission && !r.grade ? "default" : "outline"} onClick={() => setReviewIndex(index)}>
                            Periksa
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </TableCard>
        )}
      </section>

      <GradeSheet assignment={assignment} rows={rows} index={reviewIndex} onIndexChange={setReviewIndex} onClose={() => setReviewIndex(null)} />
      <AssignmentFormSheet open={editing} onOpenChange={setEditing} assignment={assignment} />
      {confirm && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setConfirm(null)}
          title={
            confirm === "assignment"
              ? "Publish tugas ini?"
              : confirm === "selected"
                ? `Publish ${selectedDrafts.length} nilai terpilih?`
                : `Publish semua ${draftTotal} nilai draft?`
          }
          description={
            confirm === "assignment"
              ? `Semua asisten magang Divisi ${assignment.division.name} akan melihat tugas ini dan menerima notifikasi.`
              : "Nilai dan feedback langsung terlihat oleh asisten magang yang bersangkutan, dan masing-masing menerima notifikasi."
          }
          confirmLabel="Publish"
          onConfirm={runConfirm}
        />
      )}
    </>
  );
}
