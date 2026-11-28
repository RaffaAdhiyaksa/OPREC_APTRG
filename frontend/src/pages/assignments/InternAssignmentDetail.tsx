import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Award, CalendarClock, CheckCircle2, ExternalLink, FileText, Link2, Paperclip, RotateCcw, Trophy, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { InfoItem } from "@/components/shared/InfoItem";
import { RelativeTime } from "@/components/shared/RelativeTime";
import { DeadlineBadge, SubmissionBadge } from "@/components/shared/StatusBadge";
import { useWithdrawSubmission } from "@/hooks/queries/assignments";
import { formatDateTime } from "@/lib/date";
import { getErrorMessage } from "@/lib/errors";
import { formatFileSize, SUBMISSION_EXTENSIONS } from "@/lib/submission";
import type { Assignment } from "@/types/api";
import { SubmissionForm } from "./SubmissionForm";

export default function InternAssignmentDetail({ assignment }: { assignment: Assignment }) {
  const [resubmitting, setResubmitting] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const withdraw = useWithdrawSubmission(assignment.id);
  const submission = assignment.my_submission ?? null;
  const grade = assignment.my_grade ?? null;
  const canSubmit = assignment.can_submit ?? false;
  const beforeDeadline = new Date(assignment.due_at).getTime() > Date.now();

  return (
    <>
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/assignments">
            <ArrowLeft aria-hidden /> Semua tugas
          </Link>
        </Button>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <SubmissionBadge submission={submission} />
            <DeadlineBadge assignment={assignment} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{assignment.title}</h1>
          <p className="text-sm text-muted-foreground">
            Deadline <RelativeTime value={assignment.due_at} className="font-medium text-foreground" /> · {formatDateTime(assignment.due_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-6">
          <section className="glass space-y-4 rounded-2xl p-6" aria-label="Deskripsi tugas">
            <h2 className="text-lg font-bold">Deskripsi</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{assignment.description}</p>
          </section>
          <section className="glass grid gap-4 rounded-2xl p-6 sm:grid-cols-3" aria-label="Ketentuan">
            <InfoItem icon={CalendarClock} label="Deadline">
              {formatDateTime(assignment.due_at)}
              <span className="block text-xs font-normal text-muted-foreground">{assignment.allow_late ? "Terlambat masih diterima" : "Tidak menerima terlambat"}</span>
            </InfoItem>
            <InfoItem icon={Paperclip} label="Batas file">
              Maks {assignment.max_file_size_mb} MB
              <span className="block text-xs font-normal text-muted-foreground">
                {(assignment.allowed_extensions ?? [...SUBMISSION_EXTENSIONS]).join(", ").toUpperCase()}
              </span>
            </InfoItem>
            <InfoItem icon={Trophy} label="Nilai maksimal">
              {assignment.max_score}
            </InfoItem>
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <section className="glass space-y-4 rounded-2xl p-6" aria-labelledby="pengumpulan">
            <h2 id="pengumpulan" className="text-lg font-bold">
              Pengumpulan
            </h2>
            {submission && !resubmitting ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-success/10 p-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                  <div className="text-sm">
                    <p className="font-semibold">Sudah dikumpulkan</p>
                    <p className="text-muted-foreground">{formatDateTime(submission.submitted_at)}</p>
                    {submission.is_late && <Badge variant="destructive" className="mt-1.5">Terlambat</Badge>}
                  </div>
                </div>
                {submission.file_name && (
                  <div className="flex items-center gap-3 rounded-xl border p-3">
                    <FileText className="size-5 shrink-0 text-primary" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{submission.file_name}</p>
                      {submission.file_size !== null && <p className="text-xs text-muted-foreground">{formatFileSize(submission.file_size)}</p>}
                    </div>
                  </div>
                )}
                {submission.drive_link && (
                  <a href={submission.drive_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border p-3 text-sm hover:bg-accent">
                    <Link2 className="size-5 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{submission.drive_link}</span>
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </a>
                )}
                {submission.note && <blockquote className="border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground">{submission.note}</blockquote>}
                {canSubmit && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setResubmitting(true)}>
                      <RotateCcw aria-hidden /> Kumpulkan Ulang
                    </Button>
                    {beforeDeadline && (
                      <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmWithdraw(true)}>
                        <Undo2 aria-hidden /> Tarik
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : canSubmit ? (
              <>
                {!beforeDeadline && (
                  <p className="rounded-xl bg-warning/20 p-3 text-sm">Deadline sudah lewat. Pengumpulan masih diterima dan akan ditandai terlambat.</p>
                )}
                {resubmitting && <p className="text-sm text-muted-foreground">Pengumpulan baru menggantikan yang lama.</p>}
                <SubmissionForm assignment={assignment} onDone={() => setResubmitting(false)} onCancel={resubmitting ? () => setResubmitting(false) : undefined} />
              </>
            ) : (
              <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Deadline sudah lewat. Pengumpulan untuk tugas ini sudah ditutup.</p>
            )}
          </section>

          {/* Only published grades ever reach the intern; drafts are filtered by the server. */}
          <section className={grade ? "space-y-3 rounded-2xl bg-inverse p-6 text-inverse-foreground" : "glass space-y-3 rounded-2xl p-6"} aria-labelledby="nilai">
            <h2 id="nilai" className="flex items-center gap-2 text-lg font-bold">
              <Award className="size-5" aria-hidden /> Nilai
            </h2>
            {grade ? (
              <>
                <p className="flex items-baseline gap-2">
                  <span className="text-6xl font-light tabular-nums">{grade.score}</span>
                  <span className="text-lg opacity-70">/ {assignment.max_score}</span>
                </p>
                {grade.feedback && <p className="rounded-xl bg-white/5 p-3 text-sm whitespace-pre-wrap ring-1 ring-current/10">{grade.feedback}</p>}
                {grade.published_at && <p className="text-xs opacity-60">Dipublikasikan {formatDateTime(grade.published_at)}</p>}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nilai belum dipublikasikan.</p>
            )}
          </section>
        </div>
      </div>

      {confirmWithdraw && (
        <ConfirmDialog
          open
          onOpenChange={setConfirmWithdraw}
          title="Tarik pengumpulan?"
          description="File atau link yang sudah dikumpulkan dihapus. Anda bisa mengumpulkan lagi selama deadline belum lewat."
          confirmLabel="Tarik"
          destructive
          onConfirm={async () => {
            try {
              await withdraw.mutateAsync();
              toast.success("Pengumpulan ditarik.");
            } catch (e) {
              toast.error(getErrorMessage(e));
              throw e;
            }
          }}
        />
      )}
    </>
  );
}
