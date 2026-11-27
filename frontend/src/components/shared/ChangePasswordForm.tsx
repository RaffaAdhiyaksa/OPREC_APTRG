import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/components/ui/utils";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { useAuth } from "@/hooks/useAuth";
import { applyFieldErrors, getErrorMessage } from "@/lib/errors";
import { getPasswordStrength } from "@/lib/passwordStrength";
import { changePassword } from "@/services/auth";

// Mirrors the backend rule (UpdatePasswordRequest); the server stays authoritative.
const schema = z
  .object({
    current_password: z.string().min(1, "Password lama wajib diisi."),
    password: z
      .string()
      .min(8, "Minimal 8 karakter.")
      .regex(/[a-zA-Z]/, "Harus mengandung huruf.")
      .regex(/\d/, "Harus mengandung angka."),
    password_confirmation: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((v) => v.password !== v.current_password, {
    path: ["password"],
    message: "Password baru harus berbeda dari password lama.",
  })
  .refine((v) => v.password === v.password_confirmation, {
    path: ["password_confirmation"],
    message: "Konfirmasi password tidak sama.",
  });
type Values = z.infer<typeof schema>;

const STRENGTH_COLORS = ["bg-destructive", "bg-destructive", "bg-warning", "bg-success", "bg-success"];

export function ChangePasswordForm({ onSuccess }: { onSuccess?: () => void }) {
  const { markPasswordChanged } = useAuth();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { current_password: "", password: "", password_confirmation: "" },
  });
  const password = useWatch({ control: form.control, name: "password" });
  const strength = getPasswordStrength(password);

  const onSubmit = async (values: Values) => {
    try {
      const { message } = await changePassword(values);
      toast.success(message);
      markPasswordChanged();
      form.reset();
      onSuccess?.();
    } catch (error) {
      if (!applyFieldErrors(error, form.setError)) toast.error(getErrorMessage(error));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField
          control={form.control}
          name="current_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password lama</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password baru</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <div className="flex items-center gap-3" aria-live="polite">
                <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden>
                  {[1, 2, 3, 4].map((step) => (
                    <span
                      key={step}
                      className={cn(
                        "h-1.5 rounded-full transition-colors duration-200",
                        strength.score >= step ? STRENGTH_COLORS[strength.score] : "bg-muted",
                      )}
                    />
                  ))}
                </div>
                <span className="w-24 text-right text-xs text-muted-foreground">{strength.label}</span>
              </div>
              <FormDescription>Minimal 8 karakter, berisi huruf dan angka.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password_confirmation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Konfirmasi password baru</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          Simpan password
        </Button>
      </form>
    </Form>
  );
}
