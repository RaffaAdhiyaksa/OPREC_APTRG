import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowUpRight, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BrandMark } from "@/components/shared/BrandMark";
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
  const message = notice && !error ? notice : error;

  return (
    <main className="grid min-h-full gap-4 p-4 lg:grid-cols-[1.1fr_1fr] lg:p-6">
      <section className="relative hidden flex-col justify-between overflow-hidden rounded-xl bg-primary p-10 text-primary-foreground lg:flex dark:bg-card dark:text-card-foreground">
        <BrandMark />
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-brand-foreground">
            Laboratorium APTRG
          </span>
          <h1 className="max-w-md text-5xl font-semibold uppercase leading-[1.05] tracking-tight text-inherit">
            Belajar, kumpulkan, berkembang.
          </h1>
          <p className="max-w-sm text-base text-inherit opacity-70">
            Materi divisi, tugas, nilai, dan pengumuman Asisten Magang dalam satu tempat.
          </p>
        </div>
        <div className="flex gap-3" aria-hidden>
          {["Materi", "Tugas", "Nilai"].map((label) => (
            <span key={label} className="flex items-center gap-2 rounded-full border border-current/20 px-4 py-2 text-sm opacity-80">
              {label}
              <ArrowUpRight className="size-4" />
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute -right-24 -bottom-24 size-80 rounded-full bg-brand/20 blur-3xl" aria-hidden />
      </section>

      <section className="flex items-center justify-center">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-card p-6 sm:p-10">
          <div className="space-y-2">
            <BrandMark className="lg:hidden" />
            <h2 className="pt-4 text-3xl font-semibold tracking-tight lg:pt-0">Masuk</h2>
            <p className="text-sm text-muted-foreground">Gunakan email atau NIM yang terdaftar.</p>
          </div>

          {message && (
            <Alert variant="destructive">
              <AlertCircle aria-hidden />
              <AlertDescription>
                {throttled ? `Terlalu banyak percobaan. Coba lagi dalam ${secondsLeft} detik.` : message}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
                      <PasswordInput autoComplete="current-password" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="h-11 w-full" disabled={submitting || throttled}>
                {submitting && <Loader2 className="animate-spin" aria-hidden />}
                {throttled ? `Tunggu ${secondsLeft} detik` : "Masuk"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Akun dibuat oleh admin lab. Lupa password? Hubungi admin.
          </p>
        </div>
      </section>
    </main>
  );
}
