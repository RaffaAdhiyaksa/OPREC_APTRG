import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BookOpen, ExternalLink, FileText, Globe, PlayCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FilterChips } from "@/components/shared/FilterChips";
import { SearchInput } from "@/components/shared/ListControls";
import { PageHeader, SectionTitle } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { useDivisions } from "@/hooks/queries/admin";
import { useDeleteMaterial, useMaterials, useReorderMaterials } from "@/hooks/queries/materials";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getErrorMessage } from "@/lib/errors";
import type { Material, MaterialSourceType } from "@/types/api";
import { MaterialCard } from "./MaterialCard";
import { MaterialFormDialog } from "./MaterialFormDialog";

type SourceFilter = MaterialSourceType | "all";

export default function MaterialsPage() {
  const user = useCurrentUser();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("material.manage");
  const isAdmin = user.role === "admin";
  const [source, setSource] = useState<SourceFilter>("all");
  const [divisionId, setDivisionId] = useState("all");
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search);
  const { data: divisions = [] } = useDivisions();

  const materials = useMaterials({
    search: term || undefined,
    source_type: source === "all" ? undefined : source,
    division_id: isAdmin && divisionId !== "all" ? Number(divisionId) : undefined,
  });
  const reorder = useReorderMaterials();
  const remove = useDeleteMaterial();
  const [editing, setEditing] = useState<Material | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Material | null>(null);
  const [playing, setPlaying] = useState<Material | null>(null);

  // Group per division so ordering (and reordering) stays within one division.
  const groups = useMemo(() => {
    const map = new Map<number, { name: string; items: Material[] }>();
    for (const m of materials.data ?? []) {
      const g = map.get(m.division.id) ?? { name: m.division.name, items: [] };
      g.items.push(m);
      map.set(m.division.id, g);
    }
    return [...map.entries()];
  }, [materials.data]);

  const open = (m: Material) => {
    if (m.embed_url) setPlaying(m);
    else window.open(m.url, "_blank", "noopener,noreferrer");
  };

  const move = (items: Material[], index: number, dir: -1 | 1) => {
    const ids = items.map((m) => m.id);
    [ids[index], ids[index + dir]] = [ids[index + dir], ids[index]];
    reorder.mutate(ids, { onError: (e) => toast.error(getErrorMessage(e)) });
  };

  const filtered = Boolean(term) || source !== "all";
  const total = materials.data?.length ?? 0;

  return (
    <>
      <PageHeader
        title="Materi"
        description={isAdmin ? "Materi semua divisi riset." : `Materi Divisi ${user.research_division?.name ?? ""}`}
        actions={
          canManage && (
            <Button size="lg" className="h-11 pl-1.5 shadow-md" onClick={() => setEditing(null)}>
              <span className="flex size-8 items-center justify-center rounded-full bg-white/20">
                <Plus aria-hidden />
              </span>
              Tambah Materi
            </Button>
          )
        }
        stats={materials.data ? [{ label: "Materi", value: total }] : undefined}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari materi" className="md:w-72" />
        <FilterChips<SourceFilter>
          label="Filter tipe materi"
          value={source}
          onChange={setSource}
          options={[
            { value: "all", label: "Semua" },
            { value: "youtube", label: "YouTube", icon: <PlayCircle aria-hidden /> },
            { value: "drive", label: "Drive", icon: <FileText aria-hidden /> },
            { value: "other", label: "Lainnya", icon: <Globe aria-hidden /> },
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

      {materials.isError ? (
        <ErrorState error={materials.error} onRetry={() => void materials.refetch()} />
      ) : materials.isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={filtered ? "Tidak ada materi yang cocok." : "Belum ada materi."}
          description={filtered ? "Ubah kata kunci atau filter." : canManage ? "Tambahkan tautan materi pertama untuk divisi ini." : "Materi dari asisten akan muncul di sini."}
          action={
            canManage && !filtered ? (
              <Button onClick={() => setEditing(null)}>
                <Plus aria-hidden /> Tambah Materi
              </Button>
            ) : undefined
          }
        />
      ) : (
        groups.map(([id, group]) => (
          <section key={id} className="space-y-4" aria-label={`Materi ${group.name}`}>
            {(isAdmin || groups.length > 1) && <SectionTitle title={group.name} count={group.items.length} unit="Materi" />}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((m, index) => (
                <MaterialCard
                  key={m.id}
                  material={m}
                  onOpen={open}
                  manage={
                    canManage
                      ? {
                          onEdit: () => setEditing(m),
                          onDelete: () => setDeleting(m),
                          // Reordering a filtered subset would scramble hidden items.
                          onMove: (dir) => move(group.items, index, dir),
                          first: filtered || index === 0,
                          last: filtered || index === group.items.length - 1,
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        ))
      )}

      {canManage && <MaterialFormDialog open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} material={editing ?? null} />}

      {deleting && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setDeleting(null)}
          title={`Hapus "${deleting.title}"?`}
          description="Materi dihapus permanen dan tidak lagi terlihat oleh asisten magang."
          confirmLabel="Hapus"
          destructive
          onConfirm={async () => {
            try {
              await remove.mutateAsync(deleting.id);
              toast.success("Materi dihapus.");
            } catch (e) {
              toast.error(getErrorMessage(e));
              throw e;
            }
          }}
        />
      )}

      <Dialog open={playing !== null} onOpenChange={(o) => !o && setPlaying(null)}>
        <DialogContent
          className="gap-3 p-3 sm:max-w-4xl"
          // Keep focus out of the YouTube iframe so Esc still closes the dialog.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).querySelector<HTMLElement>("a")?.focus();
          }}
        >
          <DialogHeader className="px-2 pt-1">
            <DialogTitle className="pr-8">{playing?.title}</DialogTitle>
            <DialogDescription className="sr-only">Video materi YouTube</DialogDescription>
          </DialogHeader>
          {playing?.embed_url && (
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              <iframe
                src={playing.embed_url}
                title={playing.title}
                className="size-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {playing && (
            <a href={playing.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2 pb-1 text-sm text-muted-foreground hover:text-foreground">
              <ExternalLink className="size-4" aria-hidden /> Buka di YouTube
            </a>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
