import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";
import type { PaginationMeta } from "@/types/api";

export function SearchInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 bg-white/70 pl-10 dark:bg-white/5"
      />
    </div>
  );
}

/** Glass container for data tables; scrolls horizontally on narrow screens instead of the page. */
export function TableCard({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">{children}</div>
      {footer && <div className="border-t border-border/60 px-4 py-3">{footer}</div>}
    </div>
  );
}

export function Pager({ meta, onPage }: { meta: PaginationMeta; onPage: (page: number) => void }) {
  const from = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);
  return (
    <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Paginasi">
      <span className="text-muted-foreground tabular-nums">
        {from}–{to} dari {meta.total}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="size-8" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)} aria-label="Halaman sebelumnya">
          <ChevronLeft aria-hidden />
        </Button>
        <span className="tabular-nums">
          {meta.current_page} / {meta.last_page}
        </span>
        <Button variant="outline" size="icon" className="size-8" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)} aria-label="Halaman berikutnya">
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
