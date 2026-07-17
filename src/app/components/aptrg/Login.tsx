import { useState } from "react";
import { ArrowLeft, LogIn, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { GlassCard, Logo, Screen, RED } from "./shared";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { supabase } from "../../../lib/supabaseClient";



export function Login({
  onNavigate,
  onLoginSuccess,
}: {
  onNavigate: (s: Screen) => void;
  /** Dipanggil setelah login Supabase berhasil. Role dilempar sebagai argumen. */
  onLoginSuccess: (role: string | null) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Terjemahkan pesan error Supabase menjadi bahasa Indonesia yang user-friendly */
  function humanizeError(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes("invalid login credentials") || lower.includes("invalid email or password")) {
      return "Email atau password yang Anda masukkan salah. Periksa kembali dan coba lagi.";
    }
    if (lower.includes("email not confirmed")) {
      return "Email Anda belum dikonfirmasi. Silakan cek kotak masuk dan klik tautan verifikasi.";
    }
    if (lower.includes("too many requests")) {
      return "Terlalu banyak percobaan login. Tunggu beberapa menit lalu coba lagi.";
    }
    if (lower.includes("user not found")) {
      return "Akun dengan email ini tidak ditemukan. Pastikan email sudah terdaftar.";
    }
    if (lower.includes("network") || lower.includes("fetch")) {
      return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
    }
    // Fallback ke pesan asli
    return message;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }
    
    if (mode === "register") {
      if (!nama.trim()) {
        setError("Nama lengkap wajib diisi.");
        return;
      }
      if (password.length < 6) {
        setError("Password minimal 6 karakter.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Password tidak cocok!");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

        if (authError) throw authError;

        if (data.user) {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            nama: nama.trim(),
            email: trimmedEmail,
            role: "magang",
          });
          if (profileError) throw profileError;
        }
        onLoginSuccess("magang");
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", authData.user.id)
            .single();

          onLoginSuccess(profile?.role || "magang");
        } else {
          onLoginSuccess("magang");
        }
      }


    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";
      setError(humanizeError(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <button
          onClick={() => onNavigate("landing")}
          className="mb-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#5a504b] transition hover:text-[#2a2320]"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
        </button>
        <GlassCard className="p-8">
          <div className="flex flex-col items-center text-center">
            <Logo />
            <h2 className="mt-6 text-[24px] font-extrabold tracking-tight text-[#2a2320]">
              {mode === "login" ? "Masuk ke Portal" : "Daftar Akun Baru"}
            </h2>
            <p className="mt-1.5 text-[14px] text-[#857a75]">
              {mode === "login" 
                ? "Pantau status pendaftaran dan keanggotaan Anda." 
                : "Buat akun untuk memulai pendaftaran."}
            </p>
          </div>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="login-nama">Nama Lengkap</Label>
                <Input
                  id="login-nama"
                  type="text"
                  placeholder="Sobat Angkasa"
                  value={nama}
                  onChange={(e) => {
                    setNama(e.target.value);
                    if (error) setError(null);
                  }}
                  className="bg-white/60"
                  disabled={loading}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="nama@student.ac.id"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                className="bg-white/60"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-pass">Password</Label>
              <div className="relative">
                <Input
                  id="login-pass"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="bg-white/60 pr-10"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0a49e] hover:text-[#5a504b] focus:outline-none transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="login-confirm-pass">Konfirmasi Password</Label>
                <div className="relative">
                  <Input
                    id="login-confirm-pass"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    className="bg-white/60 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0a49e] hover:text-[#5a504b] focus:outline-none transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 rounded-[10px] border border-red-200 bg-red-50/80 px-3.5 py-2.5 text-[13px] text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                <span>{error}</span>
              </div>
            )}

            {mode === "login" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[14px] text-[#5a504b]">
                  <Checkbox id="remember" disabled={loading} /> Ingat saya
                </label>
                <button
                  type="button"
                  className="text-[14px] font-medium text-[#c81e2c] hover:underline disabled:opacity-50"
                  disabled={loading}
                >
                  Lupa password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-6 text-white shadow-md hover:opacity-90 disabled:opacity-70"
              style={{ background: RED }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Memproses...
                </>
              ) : (
                <>
                  <LogIn className="mr-1.5 h-4 w-4" /> {mode === "login" ? "Masuk" : "Daftar"}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-[14px] text-[#857a75]">
            {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
              className="font-semibold text-[#c81e2c] hover:underline"
              disabled={loading}
            >
              {mode === "login" ? "Daftar sekarang" : "Masuk"}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
