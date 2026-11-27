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
import { PasswordInput } from "@/components/shared/PasswordInput";
import { useCreateUser, useDivisions, useUpdateUser } from "@/hooks/queries/admin";
import { applyFieldErrors, getErrorMessage } from "@/lib/errors";
import { ROLE_LABEL } from "@/lib/labels";
import type { AdminUser, Role, TemporaryPasswordResult, UserPayload } from "@/types/api";

const ROLES = ["admin", "asisten_aktif", "asisten_magang"] as const;

const schema = z
  .object({
    name: z.string().trim().min(1, "Nama wajib diisi.").max(255),
    email: z.string().trim().min(1, "Email wajib diisi.").email("Format email tidak valid."),
    nim: z.string().trim().max(30),
    phone: z.string().trim().max(30),
    role: z.enum(ROLES),
    research_division_id: z.string(),
    is_coordinator: z.boolean(),
    password: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.role !== "admin" && !v.research_division_id) {
      ctx.addIssue({ code: "custom", path: ["research_division_id"], message: "Divisi riset wajib dipilih." });
    }
    if (v.password && (v.password.length < 8 || !/[a-zA-Z]/.test(v.password) || !/\d/.test(v.password))) {
      ctx.addIssue({ code: "custom", path: ["password"], message: "Minimal 8 karakter, berisi huruf dan angka." });
    }
  });
type Values = z.infer<typeof schema>;

const toValues = (user?: AdminUser | null): Values => ({
  name: user?.name ?? "",
  email: user?.email ?? "",
  nim: user?.nim ?? "",
  phone: user?.phone ?? "",
  role: user?.role ?? "asisten_magang",
  research_division_id: user?.research_division ? String(user.research_division.id) : "",
  is_coordinator: user?.is_coordinator ?? false,
  password: "",
});

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null to create. */
  user: AdminUser | null;
  onCreated: (result: TemporaryPasswordResult) => void;
}) {
  const editing = user !== null;
  const { data: divisions = [] } = useDivisions();
  const research = divisions.filter((d) => d.type === "research");
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(user) });
  const role = useWatch({ control: form.control, name: "role" }) as Role;

  useEffect(() => {
    if (open) form.reset(toValues(user));
  }, [open, user, form]);

  const onSubmit = async (v: Values) => {
    // Mirrors the User model invariants; the server enforces them again.
    const payload: UserPayload = {
      name: v.name,
      email: v.email,
      nim: v.nim || null,
      phone: v.phone || null,
      role: v.role,
      research_division_id: v.role === "admin" ? null : Number(v.research_division_id),
      is_coordinator: v.role === "asisten_aktif" && v.is_coordinator,
    };
    try {
      if (editing) {
        await updateUser.mutateAsync({ id: user.id, payload });
        toast.success(`Data ${v.name} diperbarui.`);
      } else {
        const result = await createUser.mutateAsync({ ...payload, password: v.password || null });
        if (result.temporary_password) onCreated(result);
        else toast.success(`Akun ${v.name} dibuat.`);
      }
      onOpenChange(false);
    } catch (error) {
      if (!applyFieldErrors(error, form.setError)) toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit pengguna" : "Tambah pengguna"}</DialogTitle>
          <DialogDescription>
            {editing ? "Perubahan role atau divisi langsung memengaruhi akses pengguna." : "Akun baru wajib mengganti password saat pertama masuk."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nama lengkap</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nim"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIM (opsional)</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No. HP (opsional)</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} />
                  </FormControl>
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
                      {ROLES.map((r) => (
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
            {role !== "admin" && (
              <FormField
                control={form.control}
                name="research_division_id"
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
                        {research.map((d) => (
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
            {role === "asisten_aktif" && (
              <FormField
                control={form.control}
                name="is_coordinator"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4 rounded-xl border p-3 sm:col-span-2">
                    <div className="space-y-0.5">
                      <FormLabel>Koordinator divisi</FormLabel>
                      <FormDescription>Koordinator bisa mengirim pengumuman ke asisten magang divisinya.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            {!editing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Password awal (opsional)</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormDescription>Kosongkan agar sistem membuat password sementara.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
                {editing ? "Simpan perubahan" : "Buat akun"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
