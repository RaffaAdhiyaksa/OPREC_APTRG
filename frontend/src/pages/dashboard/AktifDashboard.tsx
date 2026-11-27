import { useState } from "react";
import { Link } from "react-router";
import { CalendarClock, ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Chip, DashCard, SummaryPanel, Timeline, TimelineItem } from "@/components/shared/DashboardBlocks";
import { FilterChips } from "@/components/shared/FilterChips";
import { PageHeader, SectionTitle } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { CoordinatorBadge } from "@/components/shared/StatusBadge";
import { useAssignments } from "@/hooks/queries/assignments";
import { useCurrentUser } from "@/hooks/useAuth";
import { formatDateTime, formatRelative, isDueSoon } from "@/lib/date";
import { AssignmentFormSheet } from "@/pages/assignments/AssignmentFormSheet";
import { ungradedCount } from "@/lib/assignments";

type Focus = "all" | "ungraded" | "soon";

export default function AktifDashboard() {
  const user = useCurrentUser();
  const list = useAssignments({});
  const [focus, setFocus] = useState<Focus>("all");
  const [creating, setCreating] = useState(false);

  if (list.isError) return <ErrorState error={list.error} onRetry={() => void list.refetch()} />;

  const published = (list.data ?? []).filter((a) => a.status === "published");
  const active = published.filter((a) => new Date(a.due_at).getTime() > Date.now());
  const interns = published[0]?.stats?.total_interns ?? list.data?.[0]?.stats?.total_interns ?? 0;
  const ungraded = published.reduce((sum, a) => sum + ungradedCount(a), 0);
  // "Perlu dinilai" cards: most ungraded first, then nearest deadline.
  const cards = [...published]
    .filter((a) => (focus === "ungraded" ? ungradedCount(a) > 0 : focus === "soon" ? isDueSoon(a.due_at) : true))
    .sort((a, b) => ungradedCount(b) - ungradedCount(a) || a.due_at.localeCompare(b.due_at))
    .slice(0, 6);
  const upcoming = active.slice(0, 5);
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title="Beranda"
        description={
          <span className="flex flex-wrap items-center gap-2">
            Halo, {firstName}. Divisi {user.research_division?.name}
            {user.is_coordinator && <CoordinatorBadge />}
          </span>
        }
        actions={
          <Button size="lg" className="h-11 pl-1.5 shadow-md" onClick={() => setCreating(true)}>
            <span className="flex size-8 items-center justify-center rounded-full bg-white/20">
              <Plus aria-hidden />
            </span>
            Buat Tugas
          </Button>
        }
        stats={
          list.data
            ? [
                { label: "Magang", value: interns },
                { label: "Tugas aktif", value: active.length },
                { label: "Belum dinilai", value: ungraded, hint: ungraded ? <Chip tone="warning" className="w-fit px-2 py-0 text-[10px]">perlu cek</Chip> : undefined },
              ]
            : undefined
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="min-w-0 space-y-5" aria-labelledby="perlu-dinilai">
          <SectionTitle
            id="perlu-dinilai"
            title="Perlu Dinilai"
            count={ungraded}
            unit="Pengumpulan"
            actions={
              <FilterChips<Focus>
                label="Fokus tugas"
                value={focus}
                onChange={setFocus}
                options={[
                  { value: "all", label: "Semua" },
                  { value: "ungraded", label: "Belum dinilai" },
                  { value: "soon", label: "Deadline < 24 jam" },
                ]}
              />
            }
          />
          {list.isPending ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-52 rounded-2xl" />
              ))}
            </div>
          ) : cards.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={published.length ? "Tidak ada tugas untuk filter ini." : "Belum ada tugas yang dipublikasikan."}
              action={
                !published.length && (
                  <Button onClick={() => setCreating(true)}>
                    <Plus aria-hidden /> Buat Tugas
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {cards.map((a, index) => {
                const pending = ungradedCount(a);
                const s = a.stats!;
                return (
                  <DashCard key={a.id} to={`/assignments/${a.id}`} linkLabel={`Nilai ${a.title}`} highlight={index === 0 && pending > 0}>
                    <div className="pr-12">
                      <p className="text-xs opacity-75">Deadline {formatRelative(a.due_at)}</p>
                      <h3 className="mt-1 line-clamp-2 text-xl font-bold leading-snug">{a.title}</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-light tabular-nums">{pending}</span>
                      <span className="text-sm opacity-75">belum dinilai</span>
                    </div>
                    <div className="space-y-1.5">
                      <Progress value={s.total_interns ? (s.submitted / s.total_interns) * 100 : 0} className="h-2 bg-current/15" aria-label={`${s.submitted} dari ${s.total_interns} terkumpul`} />
                      <p className="text-xs opacity-75">
                        {s.submitted}/{s.total_interns} terkumpul
                      </p>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2">
                      {s.late > 0 && <Chip tone="danger">{s.late} terlambat</Chip>}
                      {s.graded_draft > 0 && <Chip>{s.graded_draft} draft nilai</Chip>}
                      {isDueSoon(a.due_at) && <Chip tone="warning">Segera</Chip>}
                    </div>
                  </DashCard>
                );
              })}
            </div>
          )}
        </section>

        <SummaryPanel title="Deadline Terdekat" icon={CalendarClock} to="/assignments" linkLabel="Semua tugas" className="xl:sticky xl:top-28 xl:self-start">
          {list.isPending ? (
            <Skeleton className="h-40 rounded-xl bg-white/10" />
          ) : upcoming.length ? (
            <Timeline>
              {upcoming.map((a, index) => (
                <TimelineItem key={a.id} marker={index + 1} active={index === 0}>
                  <Link to={`/assignments/${a.id}`} className="block text-sm font-semibold hover:underline">
                    {a.title}
                  </Link>
                  <p className="mt-0.5 text-xs opacity-70">{formatDateTime(a.due_at)}</p>
                  <p className="mt-1.5 text-[11px] opacity-60">
                    {formatRelative(a.due_at)} · {a.stats?.submitted ?? 0}/{a.stats?.total_interns ?? 0} terkumpul
                  </p>
                </TimelineItem>
              ))}
            </Timeline>
          ) : (
            <p className="text-sm opacity-70">Tidak ada deadline mendatang.</p>
          )}
        </SummaryPanel>
      </div>

      <AssignmentFormSheet open={creating} onOpenChange={setCreating} assignment={null} />
    </>
  );
}
