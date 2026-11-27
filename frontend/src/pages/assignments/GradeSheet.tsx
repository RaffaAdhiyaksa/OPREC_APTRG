import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Link2, Loader2, Send, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { GradeStatusBadge, SubmissionBadge } from "@/components/shared/StatusBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useGradeSubmission, useUnpublishGrade } from "@/hooks/queries/assignments";
import { formatDateTime } from "@/lib/date";
import { saveBlob } from "@/lib/download";
import { applyFieldErrors, getErrorMessage } from "@/lib/errors";
import { formatFileSize } from "@/lib/submission";
import { assignmentsService } from "@/services/assignments";
import type { Assignment, SubmissionRow } from "@/types/api";

/**
 * Review one intern's submission and grade it. Interns without a submission can still be graded.
 * New grades are drafts; "Simpan & Publish" publishes immediately and notifies the intern.
 */
export function GradeSheet({
  assignment,
  rows,
  index,
  onIndexChange,
  onClose,
}: {
  assignment: Assignment;
  rows: SubmissionRow[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const row = index === null ? null : rows[index];
  const grade = useGradeSubmission(assignment.id);
  const unpublish = useUnpublishGrade();
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);

  const schema = z.object({
    score: z
      .string()
      .trim()
      .min(1, "Nilai wajib diisi.")
      .refine((v) => !Number.isNaN(Number(v.replace(",", "."))), "Isi angka.")
      .refine((v) => {
        const n = Number(v.replace(",", "."));
        return n >= 0 && n <= assignment.max_score;
      }, `Nilai harus 0–${assignment.max_score}.`),
    feedback: z.string().trim().max(5000),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { score: "", feedback: "" } });

  useEffect(() => {
    form.reset({ score: row?.grade ? String(row.grade.score) : "", feedback: row?.grade?.feedback ?? "" });
  }, [row, form]);

  const save = (publish: boolean) =>
    form.handleSubmit(async (v) => {
      if (!row) return;
      setSaving(publish ? "publish" : "draft");
      try {
        await grade.mutateAsync({
          userId: row.user.id,
          payload: { score: Number(v.score.replace(",", ".")), feedback: v.feedback || null },
          publish,
        });
        const wasPublished = row.grade?.status === "published";
        toast.success(
          wasPublished ? `Nilai ${row.user.name} diperbarui. Magang menerima notifikasi.` : publish ? `Nilai ${row.user.name} dipublikasikan.` : `Nilai ${row.user.name} disimpan sebagai draft.`,
        );
      } catch (error) {
        if (!applyFieldErrors(error, form.setError)) toast.error(getErrorMessage(error));
      } finally {
        setSaving(null);
      }
    })();

  const download = async () => {
    if (!row?.submission) return;
    setDownloading(true);
    try {
      const { blob, fileName } = await assignmentsService.download(row.submission.id);
      saveBlob(blob, fileName);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDownloading(false);
    }
  };

  const published = row?.grade?.status === "published";
  const submission = row?.submission;

  return (
    <Sheet open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        {row && (
          <>
            <SheetHeader className="px-6 pt-6">
              <div className="flex items-center gap-3 pr-8">
                <UserAvatar name={row.user.name} className="size-12" />
                <div className="min-w-0">
                  <SheetTitle className="truncate text-xl font-extrabold">{row.user.name}</SheetTitle>
                  <SheetDescription>{row.user.nim ?? row.user.email}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 px-6 py-5">
              <section className="space-y-3 rounded-2xl border p-4" aria-label="Pengumpulan">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Pengumpulan</h3>
                  <SubmissionBadge submission={submission} />
                </div>
                {submission ? (
                  <>
                    <p className="text-xs text-muted-foreground">Dikumpulkan {formatDateTime(submission.submitted_at)}</p>
                    {submission.file_name && (
                      <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                        <FileText className="size-5 shrink-0 text-primary" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{submission.file_name}</p>
                          {submission.file_size !== null && <p className="text-xs text-muted-foreground">{formatFileSize(submission.file_size)}</p>}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => void download()} disabled={downloading}>
                          {downloading ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
                          Unduh
                        </Button>
                      </div>
                    )}
                    {submission.drive_link && (
                      <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                        <Link2 className="size-5 shrink-0 text-primary" aria-hidden />
                        <p className="min-w-0 flex-1 truncate text-sm">{submission.drive_link}</p>
                        <Button size="sm" variant="outline" asChild>
                          <a href={submission.drive_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink aria-hidden /> Buka
                          </a>
                        </Button>
                      </div>
                    )}
                    {submission.note && (
                      <blockquote className="border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground">{submission.note}</blockquote>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Belum mengumpulkan. Nilai tetap bisa diberikan.</p>
                )}
              </section>

              <Form {...form}>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-4" noValidate>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Penilaian</h3>
                    {row.grade && <GradeStatusBadge status={row.grade.status} />}
                  </div>
                  <FormField
                    control={form.control}
                    name="score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nilai (0–{assignment.max_score})</FormLabel>
                        <FormControl>
                          <Input inputMode="decimal" className="h-12 text-2xl font-light tabular-nums" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="feedback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Feedback</FormLabel>
                        <FormControl>
                          <Textarea rows={5} className="resize-y" placeholder="Catatan untuk asisten magang" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {published && (
                    <p className="rounded-xl bg-brand/15 p-3 text-xs">
                      Nilai ini sudah dipublikasikan. Perubahan langsung terlihat oleh magang dan mengirim notifikasi "nilai diperbarui".
                    </p>
                  )}
                </form>
              </Form>
            </div>

            <SheetFooter className="sticky bottom-0 gap-3 border-t bg-card px-6 py-4">
              <div className="flex flex-wrap justify-end gap-2">
                {published ? (
                  <>
                    <Button variant="outline" onClick={() => setConfirmUnpublish(true)} disabled={saving !== null}>
                      <Undo2 aria-hidden /> Unpublish
                    </Button>
                    <Button onClick={() => void save(false)} disabled={saving !== null}>
                      {saving && <Loader2 className="animate-spin" aria-hidden />}
                      Simpan
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => void save(false)} disabled={saving !== null}>
                      {saving === "draft" && <Loader2 className="animate-spin" aria-hidden />}
                      Simpan Draft
                    </Button>
                    <Button onClick={() => void save(true)} disabled={saving !== null}>
                      {saving === "publish" ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
                      Simpan & Publish
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => onIndexChange(index! - 1)}>
                  <ChevronLeft aria-hidden /> Sebelumnya
                </Button>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {index! + 1} / {rows.length}
                </span>
                <Button variant="ghost" size="sm" disabled={index === rows.length - 1} onClick={() => onIndexChange(index! + 1)}>
                  Berikutnya <ChevronRight aria-hidden />
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>

      {confirmUnpublish && row?.grade && (
        <ConfirmDialog
          open
          onOpenChange={setConfirmUnpublish}
          title={`Unpublish nilai ${row.user.name}?`}
          description="Nilai kembali menjadi draft dan langsung disembunyikan dari asisten magang sampai dipublikasikan lagi."
          confirmLabel="Unpublish"
          onConfirm={async () => {
            try {
              await unpublish.mutateAsync(row.grade!.id);
              toast.success("Nilai dikembalikan ke draft.");
            } catch (e) {
              toast.error(getErrorMessage(e));
              throw e;
            }
          }}
        />
      )}
    </Sheet>
  );
}
