import { FileText, Globe, PlayCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";
import { SOURCE_LABEL } from "@/lib/labels";
import type { Assignment, GradeStatus, MaterialSourceType, Submission } from "@/types/api";

// One vocabulary for statuses across the app (PRD §8 "Bahasa Badge").

const SUCCESS = "border-transparent bg-success text-success-foreground";
const WARNING = "border-transparent bg-warning text-warning-foreground";

/** Staff only. Interns must never see the word "Draft" for grades. */
export function GradeStatusBadge({ status }: { status: GradeStatus }) {
  return status === "published" ? <Badge>Published</Badge> : <Badge variant="secondary">Draft</Badge>;
}

export function DraftBadge() {
  return <Badge variant="outline">Draft</Badge>;
}

export function SubmissionBadge({ submission }: { submission: Submission | null | undefined }) {
  if (!submission) return <Badge variant="outline">Belum</Badge>;
  if (submission.is_late) return <Badge variant="destructive">Terlambat</Badge>;
  return <Badge className={SUCCESS}>Terkumpul</Badge>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Segera" when the deadline is within 24 h, "Lewat" once it passed. Nothing otherwise. */
export function DeadlineBadge({ assignment, className }: { assignment: Pick<Assignment, "due_at" | "status">; className?: string }) {
  if (assignment.status === "draft") return <DraftBadge />;
  const left = new Date(assignment.due_at).getTime() - Date.now();
  if (left < 0) return <Badge variant="outline" className={className}>Lewat deadline</Badge>;
  if (left < DAY_MS) return <Badge className={cn(WARNING, className)}>Segera</Badge>;
  return null;
}

export function InactiveBadge() {
  return (
    <Badge variant="outline" className="border-destructive text-destructive">
      Nonaktif
    </Badge>
  );
}

export function CoordinatorBadge() {
  return (
    <Badge variant="outline">
      <Star className="fill-current" aria-hidden />
      Koordinator
    </Badge>
  );
}

const SOURCE_ICON = { youtube: PlayCircle, drive: FileText, other: Globe } as const;

export function SourceBadge({ type }: { type: MaterialSourceType }) {
  const Icon = SOURCE_ICON[type];
  return (
    <Badge variant="outline">
      <Icon aria-hidden />
      {SOURCE_LABEL[type]}
    </Badge>
  );
}
