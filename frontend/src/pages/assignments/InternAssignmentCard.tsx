import { Clock } from "lucide-react";
import { Chip, DashCard } from "@/components/shared/DashboardBlocks";
import { formatDateTime, formatRelative, isDueSoon } from "@/lib/date";
import type { Assignment } from "@/types/api";

export type InternTab = "todo" | "done" | "past";

/** Belum = not submitted and still open; Sudah = submitted; Lewat = not submitted and past the deadline. */
export const internTabOf = (a: Assignment): InternTab => (a.my_submission ? "done" : a.is_overdue ? "past" : "todo");

export function InternAssignmentCard({ assignment: a, highlight = false }: { assignment: Assignment; highlight?: boolean }) {
  const submission = a.my_submission;
  const grade = a.my_grade;
  return (
    <DashCard to={`/assignments/${a.id}`} linkLabel={`Buka ${a.title}`} highlight={highlight}>
      <div className="pr-12">
        <p className="text-xs opacity-75">Divisi {a.division.name}</p>
        <h3 className="mt-1 line-clamp-2 text-xl font-bold leading-snug">{a.title}</h3>
      </div>
      <div className="flex items-start gap-2 text-sm">
        <Clock className="mt-0.5 size-4 shrink-0 opacity-70" aria-hidden />
        <div className="min-w-0">
          <p className="font-semibold whitespace-nowrap tabular-nums">{formatRelative(a.due_at)}</p>
          <p className="truncate text-xs opacity-70">{formatDateTime(a.due_at)}</p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        {submission ? (
          submission.is_late ? <Chip tone="danger">Terlambat</Chip> : <Chip tone="success">Terkumpul</Chip>
        ) : a.is_overdue ? (
          <Chip>{a.can_submit ? "Lewat deadline · masih diterima" : "Lewat deadline"}</Chip>
        ) : (
          <Chip>Belum</Chip>
        )}
        {!submission && isDueSoon(a.due_at) && <Chip tone="warning">Segera</Chip>}
        {/* Interns only ever receive published grades. */}
        {grade && (
          <Chip className="border-transparent bg-inverse text-inverse-foreground">
            Nilai {grade.score}/{a.max_score}
          </Chip>
        )}
      </div>
    </DashCard>
  );
}
