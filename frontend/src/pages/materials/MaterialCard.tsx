import { ArrowDown, ArrowUp, ArrowUpRight, FileText, Globe, MoreHorizontal, Pencil, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/components/ui/utils";
import { DraftBadge, SourceBadge } from "@/components/shared/StatusBadge";
import { youtubeId, youtubeThumbnail } from "@/lib/materialSource";
import type { Material } from "@/types/api";

function Thumbnail({ material }: { material: Material }) {
  const videoId = material.source_type === "youtube" ? youtubeId(material.url) : null;
  if (videoId) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
        <img src={youtubeThumbnail(videoId)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/20">
          <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg">
            <Play className="ml-0.5 size-5 fill-current" aria-hidden />
          </span>
        </span>
      </div>
    );
  }
  const Icon = material.source_type === "drive" ? FileText : Globe;
  return (
    <div className="flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 via-amber/15 to-brand/15">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-md">
        <Icon className="size-6" aria-hidden />
      </span>
    </div>
  );
}

export function MaterialCard({
  material,
  onOpen,
  manage,
}: {
  material: Material;
  onOpen: (m: Material) => void;
  manage?: { onEdit: () => void; onDelete: () => void; onMove: (dir: -1 | 1) => void; first: boolean; last: boolean };
}) {
  return (
    <article className={cn("group glass relative flex flex-col gap-3 rounded-2xl p-3 transition-all duration-200 ease-out hover:-translate-y-0.5", !material.is_published && "opacity-80")}>
      <button type="button" onClick={() => onOpen(material)} className="rounded-xl text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" aria-label={`Buka materi ${material.title}`}>
        <Thumbnail material={material} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-2 px-1.5 pb-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <SourceBadge type={material.source_type} />
          {!material.is_published && <DraftBadge />}
        </div>
        <h3 className="line-clamp-2 text-base font-bold leading-snug">{material.title}</h3>
        {material.description && <p className="line-clamp-2 text-sm text-muted-foreground">{material.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="truncate text-xs text-muted-foreground">{material.author.name}</span>
          <div className="flex items-center gap-1">
            {manage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-9" aria-label={`Aksi untuk ${material.title}`}>
                    <MoreHorizontal aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  <DropdownMenuItem onSelect={manage.onEdit}>
                    <Pencil aria-hidden /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={manage.first} onSelect={() => manage.onMove(-1)}>
                    <ArrowUp aria-hidden /> Naikkan urutan
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={manage.last} onSelect={() => manage.onMove(1)}>
                    <ArrowDown aria-hidden /> Turunkan urutan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={manage.onDelete}>
                    <Trash2 aria-hidden /> Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button variant="outline" size="icon" className="size-9 bg-white/70 dark:bg-white/5" onClick={() => onOpen(material)} aria-label={`Buka ${material.title}`}>
              <ArrowUpRight aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
