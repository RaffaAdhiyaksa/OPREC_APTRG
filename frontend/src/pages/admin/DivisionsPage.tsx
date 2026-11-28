import { useState } from "react";
import { toast } from "sonner";
import { Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/components/ui/utils";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader, SectionTitle } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/States";
import { useDivisions, useSetDivisionActive } from "@/hooks/queries/admin";
import { divisionPhoto } from "@/lib/divisionMedia";
import { getErrorMessage } from "@/lib/errors";
import type { Division } from "@/types/api";

function ResearchCard({ division }: { division: Division }) {
  return (
    <article className="group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-[var(--glass-shadow)] sm:aspect-[3/4]">
      <img src={divisionPhoto(division.slug)} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 space-y-2 p-5 text-white">
        <span className="text-[11px] font-bold uppercase tracking-widest text-amber">Divisi Riset</span>
        <h3 className="text-2xl font-extrabold tracking-tight text-white">{division.name}</h3>
        <p className="flex items-center gap-1.5 text-sm text-white/80">
          <Users className="size-4" aria-hidden />
          {division.members_count ?? 0} anggota
        </p>
      </div>
    </article>
  );
}

function CompetitionCard({ division, onToggle, pending }: { division: Division; onToggle: (d: Division, next: boolean) => void; pending: boolean }) {
  return (
    <article className={cn("glass flex flex-col gap-4 rounded-2xl p-5 transition-opacity duration-200", !division.is_active && "opacity-60")}>
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-md">
          <Trophy className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold">{division.name}</h3>
          <p className="text-sm text-muted-foreground">{division.team_name}</p>
        </div>
        {division.is_optional && (
          <Switch
            checked={division.is_active}
            disabled={pending}
            onCheckedChange={(next) => onToggle(division, next)}
            aria-label={`${division.is_active ? "Nonaktifkan" : "Aktifkan"} divisi ${division.name}`}
          />
        )}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        <Badge variant="outline">{division.members_count ?? 0} anggota</Badge>
        {division.is_optional && <Badge className="border-transparent bg-warning text-warning-foreground">Opsional</Badge>}
        {!division.is_active && <Badge variant="secondary">Nonaktif</Badge>}
        <Badge variant="outline" className="text-muted-foreground">Fase 2</Badge>
      </div>
    </article>
  );
}

export default function DivisionsPage() {
  const { data, isPending, isError, error, refetch } = useDivisions();
  const setActive = useSetDivisionActive();
  const [pendingOff, setPendingOff] = useState<Division | null>(null);

  const toggle = async (division: Division, isActive: boolean) => {
    try {
      await setActive.mutateAsync({ id: division.id, isActive });
      toast.success(isActive ? `${division.name} diaktifkan.` : `${division.name} dinonaktifkan.`);
    } catch (e) {
      toast.error(getErrorMessage(e));
      throw e;
    }
  };

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const research = data?.filter((d) => d.type === "research") ?? [];
  const competition = data?.filter((d) => d.type === "competition") ?? [];

  return (
    <>
      <PageHeader
        title="Divisi"
        description="Struktur divisi riset dan tim lomba laboratorium."
        stats={data ? [{ label: "Divisi Riset", value: research.length }, { label: "Tim Lomba", value: competition.length }] : undefined}
      />

      <section className="space-y-5" aria-labelledby="riset">
        <SectionTitle id="riset" title="Divisi Riset" count={research.length} unit="Divisi" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {isPending ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />) : research.map((d) => <ResearchCard key={d.id} division={d} />)}
        </div>
      </section>

      <section className="space-y-5" aria-labelledby="lomba">
        <SectionTitle id="lomba" title="Divisi Lomba" count={competition.length} unit="Tim" />
        <p className="-mt-2 text-sm text-muted-foreground">Fitur tim lomba dibangun di Fase 2. Hanya divisi opsional yang bisa diaktifkan atau dinonaktifkan.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isPending
            ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
            : competition.map((d) => (
                <CompetitionCard
                  key={d.id}
                  division={d}
                  pending={setActive.isPending}
                  onToggle={(division, next) => (next ? void toggle(division, true).catch(() => undefined) : setPendingOff(division))}
                />
              ))}
        </div>
      </section>

      {pendingOff && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setPendingOff(null)}
          title={`Nonaktifkan ${pendingOff.name}?`}
          description={`Divisi disembunyikan dari pengguna non-admin dan tidak bisa diberi anggota baru. ${pendingOff.members_count ?? 0} anggota yang sudah tercatat tetap tersimpan.`}
          confirmLabel="Nonaktifkan"
          destructive
          onConfirm={() => toggle(pendingOff, false)}
        />
      )}
    </>
  );
}
