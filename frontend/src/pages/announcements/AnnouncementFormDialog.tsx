import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Info, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminDashboard, useDivisions } from "@/hooks/queries/admin";
import { useCreateAnnouncement } from "@/hooks/queries/announcements";
import { useCurrentUser } from "@/hooks/useAuth";
import { applyFieldErrors, getErrorMessage } from "@/lib/errors";
import { ROLE_LABEL } from "@/lib/labels";
import type { AdminDashboard, Role } from "@/types/api";

const ALL = "all";

const schema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi.").max(255, "Judul maksimal 255 karakter."),
  body: z.string().trim().min(1, "Isi pengumuman wajib diisi.").max(5000),
  division: z.string(),
  role: z.string(),
});
type Values = z.infer<typeof schema>;

/** Rough recipient count for the admin preview, from dashboard counts (active users, author excluded). */
function estimate(d: AdminDashboard | undefined, division: string, role: string): number | null {
  if (!d) return null;
  const roleCount = (r: Role) => d.users[r];
  if (division === ALL) {
    const total = role === ALL ? d.users.admin + d.users.asisten_aktif + d.users.asisten_magang : roleCount(role as Role);
    return Math.max(0, total - (role === ALL || role === "admin" ? 1 : 0));
  }
  const row = d.divisions.find((x) => String(x.division.id) === division);
  if (!row) return null;
  if (role === "admin") return 0;
  if (role === "asisten_aktif") return row.asisten_aktif;
  if (role === "asisten_magang") return row.asisten_magang;
  return row.asisten_aktif + row.asisten_magang;
}

export function AnnouncementFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const user = useCurrentUser();
  const isAdmin = user.role === "admin";
  const { data: divisions = [] } = useDivisions();
  // Admin only: the dashboard counts feed the recipient estimate.
  const dashboard = useAdminDashboard(isAdmin && open);
  const create = useCreateAnnouncement();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { title: "", body: "", division: ALL, role: ALL } });
  const [division, role] = useWatch({ control: form.control, name: ["division", "role"] });
  const recipients = isAdmin ? estimate(dashboard.data, division, role) : null;

  useEffect(() => {
    if (open) form.reset({ title: "", body: "", division: ALL, role: ALL });
  }, [open, form]);

  const onSubmit = async (v: Values) => {
    try {
      const sent = await create.mutateAsync(
        isAdmin
          ? {
              title: v.title,
              body: v.body,
              research_division_id: v.division === ALL ? null : Number(v.division),
              target_role: v.role === ALL ? null : (v.role as Role),
            }
          : // Coordinators send no target: the server forces their division + interns.
            { title: v.title, body: v.body },
      );
      toast.success(`Pengumuman terkirim ke ${sent.recipients_count} orang.`);
      onOpenChange(false);
    } catch (error) {
      if (!applyFieldErrors(error, form.setError)) toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buat pengumuman</DialogTitle>
          <DialogDescription>Penerima mendapat notifikasi di lonceng.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Isi</FormLabel>
                  <FormControl>
                    <Textarea rows={5} className="resize-y" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isAdmin ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="division"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Divisi</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={ALL}>Semua divisi</SelectItem>
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
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={ALL}>Semua role</SelectItem>
                          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="flex items-center gap-2 rounded-xl bg-brand/15 px-3 py-2 text-sm sm:col-span-2" aria-live="polite">
                  <Info className="size-4 shrink-0" aria-hidden />
                  {recipients === null ? "Menghitung penerima…" : `Akan dikirim ke ~${recipients} orang.`}
                </p>
              </div>
            ) : (
              <p className="flex items-center gap-2 rounded-xl bg-brand/15 px-3 py-2 text-sm">
                <Info className="size-4 shrink-0" aria-hidden />
                Dikirim ke semua asisten magang Divisi {user.research_division?.name}.
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
                Kirim
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
