import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterChips } from "@/components/shared/FilterChips";
import { SearchInput } from "@/components/shared/ListControls";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { useAssignments } from "@/hooks/queries/assignments";
import { useCurrentUser } from "@/hooks/useAuth";
import { InternAssignmentCard, internTabOf, type InternTab } from "./InternAssignmentCard";

const EMPTY: Record<InternTab, string> = {
  todo: "Tidak ada tugas yang perlu dikumpulkan.",
  done: "Belum ada tugas yang dikumpulkan.",
  past: "Tidak ada tugas yang terlewat.",
};

export default function InternAssignmentList() {
  const user = useCurrentUser();
  const list = useAssignments({});
  const [tab, setTab] = useState<InternTab>("todo");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const c = { todo: 0, done: 0, past: 0 };
    for (const a of list.data ?? []) c[internTabOf(a)]++;
    return c;
  }, [list.data]);
  const term = search.trim().toLowerCase();
  const rows = (list.data ?? [])
    .filter((a) => internTabOf(a) === tab && (!term || a.title.toLowerCase().includes(term)))
    // Open work by nearest deadline; finished and missed work newest first.
    .sort((a, b) => (tab === "todo" ? a.due_at.localeCompare(b.due_at) : b.due_at.localeCompare(a.due_at)));

  return (
    <>
      <PageHeader
        title="Tugas"
        description={`Tugas Divisi ${user.research_division?.name ?? ""}`}
        stats={list.data ? [{ label: "Belum dikumpulkan", value: counts.todo }, { label: "Terkumpul", value: counts.done }] : undefined}
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari judul tugas" className="md:w-72" />
        <FilterChips<InternTab>
          label="Status tugas"
          value={tab}
          onChange={setTab}
          options={[
            { value: "todo", label: "Belum", count: counts.todo },
            { value: "done", label: "Sudah", count: counts.done },
            { value: "past", label: "Lewat Deadline", count: counts.past },
          ]}
        />
      </div>
      {list.isError ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : list.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title={term ? "Tidak ada tugas yang cocok." : EMPTY[tab]} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((a, index) => (
            <InternAssignmentCard key={a.id} assignment={a} highlight={tab === "todo" && index === 0} />
          ))}
        </div>
      )}
    </>
  );
}
