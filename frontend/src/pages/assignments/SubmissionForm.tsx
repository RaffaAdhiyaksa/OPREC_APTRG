import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { AlertTriangle, FileUp, Link2, Loader2, Send, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/components/ui/utils";
import { useSubmitAssignment } from "@/hooks/queries/assignments";
import { toApiError } from "@/lib/errors";
import { formatFileSize, isDriveLink, SUBMISSION_EXTENSIONS } from "@/lib/submission";
import type { Assignment } from "@/types/api";

type Method = "file" | "drive";

/**
 * Hybrid submission: upload a file within the assignment's size limit, or send a Google Drive
 * link. Size and type are checked in the browser before uploading; the server stays authoritative.
 */
export function SubmissionForm({ assignment, onDone, onCancel }: { assignment: Assignment; onDone: () => void; onCancel?: () => void }) {
  const submit = useSubmitAssignment(assignment.id);
  const inputRef = useRef<HTMLInputElement>(null);
  const [method, setMethod] = useState<Method>("file");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [serverError, setServerError] = useState<{ field: "file" | "drive_link" | "note" | "form"; message: string } | null>(null);

  const allowed = assignment.allowed_extensions ?? [...SUBMISSION_EXTENSIONS];
  const limitBytes = assignment.max_file_size_mb * 1024 * 1024;
  const ext = file?.name.split(".").pop()?.toLowerCase() ?? "";
  const tooLarge = file !== null && file.size > limitBytes;
  const badType = file !== null && !allowed.includes(ext);
  const linkInvalid = link.trim() !== "" && !isDriveLink(link.trim());
  const fileOk = file !== null && !tooLarge && !badType;
  const linkOk = link.trim() !== "" && !linkInvalid;
  const ready = method === "file" ? fileOk : linkOk;
  const busy = submit.isPending;

  const pick = (f: File | undefined) => {
    setServerError(null);
    setFile(f ?? null);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files[0]);
  };

  const send = async () => {
    setServerError(null);
    setProgress(method === "file" ? 0 : null);
    try {
      await submit.mutateAsync({
        payload: { file: method === "file" ? file : null, drive_link: method === "drive" ? link.trim() : null, note: note.trim() || null },
        onProgress: setProgress,
      });
      toast.success("Tugas berhasil dikumpulkan.");
      onDone();
    } catch (raw) {
      const e = toApiError(raw);
      if (e.code === "FILE_TOO_LARGE") setServerError({ field: "file", message: e.message });
      else if (e.errors?.drive_link) setServerError({ field: "drive_link", message: e.errors.drive_link[0] });
      else if (e.errors?.file) setServerError({ field: "file", message: e.errors.file[0] });
      else if (e.errors?.note) setServerError({ field: "note", message: e.errors.note[0] });
      else {
        setServerError({ field: "form", message: e.message });
        toast.error(e.message);
      }
    } finally {
      setProgress(null);
    }
  };

  const toDrive = () => {
    setMethod("drive");
    setServerError(null);
  };

  return (
    <div className="space-y-4">
      <Tabs value={method} onValueChange={(v) => setMethod(v as Method)}>
        <TabsList className="w-full">
          <TabsTrigger value="file" disabled={busy}>
            <FileUp aria-hidden /> Upload<span className="hidden sm:inline"> File</span>
          </TabsTrigger>
          <TabsTrigger value="drive" disabled={busy}>
            <Link2 aria-hidden /> <span className="sm:hidden">Link Drive</span><span className="hidden sm:inline">Link Google Drive</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="mt-3 space-y-3">
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept={allowed.map((x) => `.${x}`).join(",")}
            onChange={(e) => pick(e.target.files?.[0])}
            aria-label="Pilih file"
            tabIndex={-1}
          />
          {file ? (
            <div className={cn("flex items-center gap-3 rounded-xl border p-3", (tooLarge || badType) && "border-destructive/50 bg-destructive/5")}>
              <FileUp className="size-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => pick(undefined)} disabled={busy} aria-label="Hapus file">
                <X aria-hidden />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-white/40 dark:hover:bg-white/5",
              )}
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-gradient text-white shadow-md">
                <FileUp className="size-5" aria-hidden />
              </span>
              <span className="text-sm font-semibold">Pilih atau seret file ke sini</span>
              <span className="text-xs text-muted-foreground">
                Maks {assignment.max_file_size_mb} MB • {allowed.join(", ").toUpperCase()}
              </span>
            </button>
          )}

          {tooLarge && (
            <div role="alert" className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <p>
                File {formatFileSize(file.size)} melebihi batas {assignment.max_file_size_mb} MB.
              </p>
              <Button size="sm" variant="outline" onClick={toDrive}>
                <Link2 aria-hidden /> Kirim via Google Drive
              </Button>
            </div>
          )}
          {badType && !tooLarge && (
            <p role="alert" className="text-sm text-destructive">
              Format .{ext || "?"} tidak diizinkan. Gunakan: {allowed.join(", ")}.
            </p>
          )}
          {serverError?.field === "file" && (
            <div role="alert" className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <p>{serverError.message}</p>
              <Button size="sm" variant="outline" onClick={toDrive}>
                <Link2 aria-hidden /> Kirim via Google Drive
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="drive" className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="drive-link">Link Google Drive</Label>
            <Input
              id="drive-link"
              type="url"
              inputMode="url"
              placeholder="https://drive.google.com/…"
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                setServerError(null);
              }}
              aria-invalid={linkInvalid || serverError?.field === "drive_link"}
              disabled={busy}
            />
            {(linkInvalid || serverError?.field === "drive_link") && (
              <p className="text-sm text-destructive">{serverError?.field === "drive_link" ? serverError.message : "Gunakan link HTTPS dari drive.google.com atau docs.google.com."}</p>
            )}
          </div>
          <Alert>
            <AlertTriangle aria-hidden />
            <AlertDescription>Pastikan akses link: “Anyone with the link can view”. Asisten tidak bisa membuka file yang terkunci.</AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      <div className="space-y-1.5">
        <Label htmlFor="submission-note">Catatan (opsional)</Label>
        <Textarea id="submission-note" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} disabled={busy} />
        {serverError?.field === "note" && <p className="text-sm text-destructive">{serverError.message}</p>}
      </div>

      {progress !== null && (
        <div className="space-y-1.5" aria-live="polite">
          <Progress value={progress} aria-label="Progres upload" />
          <p className="text-xs text-muted-foreground tabular-nums">Mengunggah… {progress}%</p>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Batal
          </Button>
        )}
        <Button onClick={() => void send()} disabled={!ready || busy} className="min-w-36">
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
          Kumpulkan
        </Button>
      </div>
    </div>
  );
}
