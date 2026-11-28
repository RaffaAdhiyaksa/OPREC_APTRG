import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/layout/AuthCard";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { useAuth } from "@/hooks/useAuth";
import { useCountdown } from "@/hooks/useCountdown";
import { toApiError } from "@/lib/errors";

const schema = z.object({
  login: z.string().trim().min(1, "Email atau NIM wajib diisi."),
  password: z.string().min(1, "Password wajib diisi."),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, notice } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { secondsLeft, start } = useCountdown();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { login: "", password: "" } });

  const onSubmit = async (values: Values) => {
    setError(null);
    try {
      // On success GuestOnly redirects to the page the user came from.
      await login(values);
    } catch (raw) {
      const e = toApiError(raw);
      if (e.status === 429) start(e.retryAfter ?? 60);
      setError(e.errors?.login?.[0] ?? e.message);
      form.resetField("password");
    }
  };

  const throttled = secondsLeft > 0;
  const submitting = form.formState.isSubmitting;
  const message = throttled ? `Terlalu banyak percobaan. Coba lagi dalam ${secondsLeft} detik.` : (error ?? notice);

  return (
    <AuthCard
      title="Masuk ke LMS"
      description="Akses materi, tugas, nilai, dan pengumuman divisi Anda."
      footer="Akun dibuat oleh admin lab. Lupa password? Hubungi admin."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="login"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email atau NIM</FormLabel>
                <FormControl>
                  <Input autoComplete="username" autoFocus placeholder="nama@aptrg.test" className="h-11" {...field} />
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="current-password" placeholder="••••••••" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {message && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{message}</span>
            </div>
          )}

          <Button type="submit" size="lg" className="h-12 w-full shadow-md" disabled={submitting || throttled}>
            {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <LogIn aria-hidden />}
            {submitting ? "Memproses…" : throttled ? `Tunggu ${secondsLeft} detik` : "Masuk"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
