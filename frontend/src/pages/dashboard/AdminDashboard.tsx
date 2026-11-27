import { Link } from "react-router";
import { ClipboardCheck, Megaphone, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Chip, DashCard, SummaryPanel, Timeline, TimelineItem } from "@/components/shared/DashboardBlocks";
import { PageHeader, SectionTitle } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/States";
import { useAdminDashboard } from "@/hooks/queries/admin";
import { formatRelative } from "@/lib/date";
import { divisionPhoto } from "@/lib/divisionMedia";
import { ROLE_LABEL } from "@/lib/labels";

export default function AdminDashboard() {
  const { data, isPending, isError, error, refetch } = useAdminDashboard();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const mostUngraded = data ? Math.max(...data.divisions.map((d) => d.ungraded)) : 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Ringkasan Laboratorium APTRG"
        actions={
          <Button asChild size="lg" className="h-11 pl-1.5 shadow-md">
            <Link to="/admin/users?create=1">
              <span className="flex size-8 items-center justify-center rounded-full bg-white/20">
                <Plus aria-hidden />
              </span>
              Tambah Pengguna
            </Link>
          </Button>
        }
        stats={
          data
            ? [
                { label: "Asisten Aktif", value: data.users.asisten_aktif },
                { label: "Asisten Magang", value: data.users.asisten_magang },
                {
                  label: "Nonaktif",
                  value: data.users.inactive,
                  hint: data.users.inactive > 0 ? <Chip tone="danger" className="w-fit px-2 py-0 text-[10px]">perlu cek</Chip> : undefined,
                },
                {
                  label: "Belum dinilai",
                  value: data.pending_grading,
                  hint: data.pending_grading > 0 ? <Chip tone="warning" className="w-fit px-2 py-0 text-[10px]">tertunda</Chip> : undefined,
                },
              ]
            : undefined
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="min-w-0 space-y-5" aria-labelledby="per-divisi">
          <SectionTitle id="per-divisi" title="Per Divisi Riset" count={data?.divisions.length} unit="Divisi" />
          <div className="grid gap-4 sm:grid-cols-2">
            {isPending
              ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)
              : data.divisions.map((d) => (
                  <DashCard
                    key={d.division.id}
                    to={`/admin/users?division_id=${d.division.id}`}
                    linkLabel={`Lihat pengguna divisi ${d.division.name}`}
                    highlight={d.ungraded > 0 && d.ungraded === mostUngraded}
                  >
                    <div className="flex items-center gap-3 pr-12">
                      <img src={divisionPhoto(d.division.slug)} alt="" className="size-12 rounded-full object-cover ring-2 ring-white/80" />
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold text-inherit">
                          {d.division.name}
                        </h3>
                        <p className="text-xs opacity-75">Divisi Riset</p>
                      </div>
                    </div>
                    <dl className="grid grid-cols-2 gap-3">
                      <div>
                        <dt className="text-xs opacity-75">{ROLE_LABEL.asisten_aktif}</dt>
                        <dd className="text-3xl font-light tabular-nums">{d.asisten_aktif}</dd>
                      </div>
                      <div>
                        <dt className="text-xs opacity-75">{ROLE_LABEL.asisten_magang}</dt>
                        <dd className="text-3xl font-light tabular-nums">{d.asisten_magang}</dd>
                      </div>
                    </dl>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Chip>
                        <ClipboardCheck className="size-3.5" aria-hidden />
                        {d.assignments} tugas
                      </Chip>
                      <Chip tone={d.ungraded > 0 ? "warning" : "default"}>{d.ungraded} belum dinilai</Chip>
                    </div>
                  </DashCard>
                ))}
          </div>
        </section>

        <SummaryPanel title="Pengumuman Terbaru" icon={Megaphone} to="/announcements" linkLabel="Buka pengumuman" className="xl:sticky xl:top-28 xl:self-start">
          {isPending ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl bg-white/10" />
              ))}
            </div>
          ) : data.recent_announcements.length ? (
            <Timeline>
              {data.recent_announcements.map((a, index) => (
                <TimelineItem key={a.id} marker={index + 1} active={index === 0}>
                  <p className="truncate text-sm font-semibold text-inherit">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-inherit opacity-70">{a.body}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[11px] opacity-60">
                    <span>{a.target.division?.name ?? "Semua divisi"}</span>
                    <span aria-hidden>·</span>
                    <span>{a.target.role ? ROLE_LABEL[a.target.role] : "Semua role"}</span>
                    <span aria-hidden>·</span>
                    <span>{formatRelative(a.created_at)}</span>
                  </p>
                </TimelineItem>
              ))}
            </Timeline>
          ) : (
            <p className="flex items-center gap-2 text-sm opacity-70">
              <Users className="size-4" aria-hidden /> Belum ada pengumuman.
            </p>
          )}
        </SummaryPanel>
      </div>
    </>
  );
}
