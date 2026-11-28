import { useState } from "react";
import { Link } from "react-router";
import { BookOpen, ClipboardList, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryPanel, Timeline, TimelineItem } from "@/components/shared/DashboardBlocks";
import { FilterChips } from "@/components/shared/FilterChips";
import { PageHeader, SectionTitle } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { useAnnouncements } from "@/hooks/queries/announcements";
import { useAssignments, useMyGrades } from "@/hooks/queries/assignments";
import { useCurrentUser } from "@/hooks/useAuth";
import { formatRelative } from "@/lib/date";
import { InternAssignmentCard, internTabOf, type InternTab } from "@/pages/assignments/InternAssignmentCard";

type Focus = "todo" | "done";

export default function MagangDashboard() {
  const user = useCurrentUser();
  const list = useAssignments({});
  const grades = useMyGrades();
  const announcements = useAnnouncements();
  const [focus, setFocus] = useState<Focus>("todo");

  if (list.isError) return <ErrorState error={list.error} onRetry={() => void list.refetch()} />;

  const all = list.data ?? [];
  const byTab = (t: InternTab) => all.filter((a) => internTabOf(a) === t);
  const todo = byTab("todo").sort((a, b) => a.due_at.localeCompare(b.due_at));
  const done = byTab("done").sort((a, b) => b.due_at.localeCompare(a.due_at));
  const cards = (focus === "todo" ? todo : done).slice(0, 3);
  const average = grades.data?.meta.average;
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title="Beranda"
        description={`Halo, ${firstName}. Divisi ${user.research_division?.name ?? ""}`}
        actions={
          <Button asChild variant="outline" size="lg" className="h-11 bg-white/70 dark:bg-white/5">
            <Link to="/materials">
              <BookOpen aria-hidden /> Buka Materi
            </Link>
          </Button>
        }
        stats={
          list.data
            ? [
                { label: "Belum dikumpulkan", value: todo.length },
                { label: "Terkumpul", value: `${done.length}/${all.length}` },
                { label: "Rata-rata nilai", value: average ?? "—" },
              ]
            : undefined
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-8">
          <section className="space-y-5" aria-labelledby="tugas-mendatang">
            <SectionTitle
              id="tugas-mendatang"
              title="Tugas Mendatang"
              count={todo.length}
              unit="Tugas"
              actions={
                <FilterChips<Focus>
                  label="Tampilkan"
                  value={focus}
                  onChange={setFocus}
                  options={[
                    { value: "todo", label: "Belum dikumpulkan" },
                    { value: "done", label: "Sudah" },
                  ]}
                />
              }
            />
            {list.isPending ? (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-2xl" />
                ))}
              </div>
            ) : cards.length === 0 ? (
              <EmptyState icon={ClipboardList} title={focus === "todo" ? "Semua tugas sudah dikumpulkan. Mantap!" : "Belum ada tugas yang dikumpulkan."} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {cards.map((a, index) => (
                  <InternAssignmentCard key={a.id} assignment={a} highlight={focus === "todo" && index === 0} />
                ))}
              </div>
            )}
          </section>

          <section className="glass space-y-5 rounded-2xl p-6" aria-labelledby="progres">
            <SectionTitle id="progres" title="Progres Saya" actions={<Button asChild variant="ghost" size="sm"><Link to="/grades">Lihat nilai</Link></Button>} />
            {list.isPending || grades.isPending ? (
              <Skeleton className="h-20 rounded-xl" />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Tugas terkumpul</p>
                  <p className="text-4xl font-light tabular-nums">
                    {done.length}
                    <span className="text-lg text-muted-foreground">/{all.length}</span>
                  </p>
                  <Progress value={all.length ? (done.length / all.length) * 100 : 0} aria-label={`${done.length} dari ${all.length} tugas terkumpul`} />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Rata-rata nilai (dipublikasikan)</p>
                  <p className="text-4xl font-light tabular-nums">{average ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{grades.data?.meta.graded_count ?? 0} tugas sudah dinilai</p>
                </div>
              </div>
            )}
          </section>
        </div>

        <SummaryPanel title="Pengumuman Terbaru" icon={Megaphone} to="/announcements" linkLabel="Semua pengumuman" className="xl:sticky xl:top-28 xl:self-start">
          {announcements.isPending ? (
            <Skeleton className="h-40 rounded-xl bg-white/10" />
          ) : announcements.data?.length ? (
            <Timeline>
              {announcements.data.slice(0, 4).map((a) => (
                <TimelineItem key={a.id} marker={a.is_read ? "✓" : "•"} active={!a.is_read}>
                  <Link to={`/announcements?open=${a.id}`} className={a.is_read ? "block text-sm hover:underline" : "block text-sm font-semibold hover:underline"}>
                    {a.title}
                  </Link>
                  <p className="mt-0.5 line-clamp-2 text-xs opacity-70">{a.body}</p>
                  <p className="mt-1.5 text-[11px] opacity-60">
                    {a.author.name} · {formatRelative(a.created_at)}
                  </p>
                </TimelineItem>
              ))}
            </Timeline>
          ) : (
            <p className="text-sm opacity-70">Belum ada pengumuman.</p>
          )}
        </SummaryPanel>
      </div>
    </>
  );
}
