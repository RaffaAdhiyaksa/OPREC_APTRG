import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SourceBadge } from "@/components/shared/StatusBadge";
import { useDivisions } from "@/hooks/queries/admin";
import { useSaveMaterial } from "@/hooks/queries/materials";
import { useCurrentUser } from "@/hooks/useAuth";
import { applyFieldErrors, getErrorMessage } from "@/lib/errors";
import { detectSourceType } from "@/lib/materialSource";
import type { Material } from "@/types/api";

const schema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi.").max(255, "Judul maksimal 255 karakter."),
  description: z.string().trim().max(2000),
  url: z
    .string()
    .trim()
    .min(1, "URL wajib diisi.")
    .refine((v) => detectSourceType(v) !== null, "Masukkan URL lengkap, misalnya https://youtu.be/…"),
  is_published: z.boolean(),
  division_id: z.string(),
});
type Values = z.infer<typeof schema>;

export function MaterialFormDialog({ open, onOpenChange, material }: { open: boolean; onOpenChange: (open: boolean) => void; material: Material | null }) {
  const user = useCurrentUser();
  const isAdmin = user.role === "admin";
  const { data: divisions = [] } = useDivisions();
  const save = useSaveMaterial();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", url: "", is_published: true, division_id: "" },
  });
  const url = useWatch({ control: form.control, name: "url" }) ?? "";
  const detected = detectSourceType(url.trim());

  useEffect(() => {
    if (!open) return;
    form.reset({
      title: material?.title ?? "",
      description: material?.description ?? "",
      url: material?.url ?? "",
      is_published: material?.is_published ?? true,
      division_id: material ? String(material.division.id) : "",
    });
  }, [open, material, form]);

  const onSubmit = async (v: Values) => {
    if (isAdmin && !material && !v.division_id) {
      form.setError("division_id", { message: "Divisi riset wajib dipilih." });
      return;
    }
    try {
      await save.mutateAsync({
        id: material?.id,
        payload: {
          title: v.title,
          description: v.description || null,
          url: v.url,
          is_published: v.is_published,
          division_id: isAdmin && !material ? Number(v.division_id) : undefined,
        },
      });
      toast.success(material ? "Materi diperbarui." : "Materi ditambahkan.");
      onOpenChange(false);
    } catch (error) {
      if (!applyFieldErrors(error, form.setError)) toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{material ? "Edit materi" : "Tambah materi"}</DialogTitle>
          <DialogDescription>Materi berupa tautan YouTube, Google Drive/Docs, atau situs lain.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {isAdmin && !material && (
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
                  <FormLabel>Deskripsi (opsional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input type="url" inputMode="url" placeholder="https://" {...field} />
                  </FormControl>
                  <div className="flex min-h-6 items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
                    {detected ? (
                      <>
                        Terdeteksi: <SourceBadge type={detected} />
                      </>
                    ) : (
                      "Tipe sumber terdeteksi otomatis dari alamat."
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-xl border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Publikasikan</FormLabel>
                    <FormDescription>Materi yang belum dipublikasikan tidak terlihat oleh asisten magang.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
                {material ? "Simpan perubahan" : "Tambah materi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
