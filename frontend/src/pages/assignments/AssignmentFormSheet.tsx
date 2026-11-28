import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/components/ui/utils";
import { useDivisions } from "@/hooks/queries/admin";
import { useSaveAssignment } from "@/hooks/queries/assignments";
import { useCurrentUser } from "@/hooks/useAuth";
import { fromWibInputs, toWibInputs } from "@/lib/date";
import { applyFieldErrors, getErrorMessage, toApiError } from "@/lib/errors";
import { MAX_UPLOAD_MB, SUBMISSION_EXTENSIONS } from "@/lib/submission";
import type { Assignment, AssignmentPayload } from "@/types/api";

const int = (min: number, max: number, message: string) =>
  z.string().refine((v) => /^\d+$/.test(v) && Number(v) >= min && Number(v) <= max, message);

const schema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi.").max(255, "Judul maksimal 255 karakter."),
  description: z.string().trim().min(1, "Deskripsi wajib diisi."),
  due_date: z.string().min(1, "Tanggal deadline wajib diisi."),
  due_time: z.string().min(1, "Jam deadline wajib diisi."),
  allow_late: z.boolean(),
  max_file_size_mb: int(1, MAX_UPLOAD_MB, `Isi angka 1–${MAX_UPLOAD_MB}.`),
  allowed_extensions: z.array(z.string()),
  max_score: int(1, 1000, "Isi angka minimal 1."),
  division_id: z.string(),
});
type Values = z.infer<typeof schema>;

function defaults(a: Assignment | null): Values {
  // New assignments default to one week from now, 23.59 WIB.
  const due = a ? toWibInputs(a.due_at) : { ...toWibInputs(new Date(Date.now() + 7 * 864e5)), time: "23:59" };
  return {
    title: a?.title ?? "",
    description: a?.description ?? "",
    due_date: due.date,
    due_time: due.time,
    allow_late: a?.allow_late ?? false,
    max_file_size_mb: String(a?.max_file_size_mb ?? 10),
    allowed_extensions: a?.allowed_extensions ?? [],
    max_score: String(a?.max_score ?? 100),
    division_id: a ? String(a.division.id) : "",
  };
}

export function AssignmentFormSheet({
  open,
  onOpenChange,
  assignment,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment | null;
  onSaved?: (a: Assignment) => void;
}) {
  const user = useCurrentUser();
  const isAdmin = user.role === "admin";
  const { data: divisions = [] } = useDivisions();
  const save = useSaveAssignment();
  const [publishing, setPublishing] = useState<boolean | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults(assignment) });
  const isDraft = !assignment || assignment.status === "draft";

  useEffect(() => {
    if (open) form.reset(defaults(assignment));
  }, [open, assignment, form]);

  const submit = (publish: boolean) =>
    form.handleSubmit(async (v) => {
      const dueAt = fromWibInputs(v.due_date, v.due_time);
      if (new Date(dueAt).getTime() <= Date.now() && dueAt !== assignment?.due_at) {
        form.setError("due_date", { message: "Deadline harus di masa depan." });
        return;
      }
      if (isAdmin && !assignment && !v.division_id) {
        form.setError("division_id", { message: "Divisi riset wajib dipilih." });
        return;
      }
      const payload: AssignmentPayload = {
        title: v.title,
        description: v.description,
        due_at: dueAt,
        allow_late: v.allow_late,
        max_file_size_mb: Number(v.max_file_size_mb),
        allowed_extensions: v.allowed_extensions.length ? v.allowed_extensions : null,
        max_score: Number(v.max_score),
        division_id: isAdmin && !assignment ? Number(v.division_id) : undefined,
      };
      setPublishing(publish);
      try {
        const saved = await save.mutateAsync({ id: assignment?.id, payload, publish });
        toast.success(publish && isDraft ? "Tugas dipublikasikan. Asisten magang menerima notifikasi." : assignment ? "Tugas diperbarui." : "Draft tugas disimpan.");
        onSaved?.(saved);
        onOpenChange(false);
      } catch (error) {
        const e = toApiError(error);
        // due_at errors belong to the date field in this form.
        if (e.errors?.due_at) form.setError("due_date", { message: e.errors.due_at[0] });
        if (!applyFieldErrors(error, form.setError)) toast.error(getErrorMessage(error));
      } finally {
        setPublishing(null);
      }
    })();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-xl font-extrabold">{assignment ? "Edit tugas" : "Buat tugas"}</SheetTitle>
          <SheetDescription>Semua waktu dalam WIB. Tugas draft tidak terlihat oleh asisten magang.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-1 flex-col gap-5 px-6 py-5" noValidate>
            {isAdmin && !assignment && (
              <FormField
                control={form.control}
                name="division_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Divisi riset</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Pilih divisi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {divisions
                          .filter((d) => d.type === "research")
                          .map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                              {d.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea rows={6} className="resize-y" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal deadline</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="due_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jam (WIB)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="allow_late"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-xl border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Izinkan terlambat</FormLabel>
                    <FormDescription>Pengumpulan setelah deadline tetap diterima dan ditandai terlambat.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="max_file_size_mb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batas ukuran file (MB)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={MAX_UPLOAD_MB} inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nilai maksimal</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="col-span-2 -mt-2 text-sm text-muted-foreground">Di atas batas ini, magang wajib mengirim link Google Drive.</p>
            </div>
            <FormField
              control={form.control}
              name="allowed_extensions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ekstensi file</FormLabel>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Ekstensi file yang diizinkan">
                    {SUBMISSION_EXTENSIONS.map((ext) => {
                      const on = field.value.includes(ext);
                      return (
                        <button
                          key={ext}
                          type="button"
                          aria-pressed={on}
                          onClick={() => field.onChange(on ? field.value.filter((x) => x !== ext) : [...field.value, ext])}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-semibold uppercase outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                            on ? "border-transparent bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-accent",
                          )}
                        >
                          {ext}
                        </button>
                      );
                    })}
                  </div>
                  <FormDescription>
                    {field.value.length ? `Hanya ${field.value.join(", ").toUpperCase()}.` : "Tidak ada yang dipilih: semua format di atas diizinkan."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className="sticky bottom-0 flex-row justify-end gap-2 border-t bg-card px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={publishing !== null}>
            Batal
          </Button>
          {isDraft ? (
            <>
              <Button variant="outline" onClick={() => void submit(false)} disabled={publishing !== null}>
                {publishing === false && <Loader2 className="animate-spin" aria-hidden />}
                Simpan Draft
              </Button>
              <Button onClick={() => void submit(true)} disabled={publishing !== null}>
                {publishing === true ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
                Publish
              </Button>
            </>
          ) : (
            <Button onClick={() => void submit(false)} disabled={publishing !== null}>
              {publishing !== null && <Loader2 className="animate-spin" aria-hidden />}
              Simpan perubahan
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
