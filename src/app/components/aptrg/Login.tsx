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
 const [hp, setHp] = useState("");
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

 const handleGoogleLogin = async () => {
 setLoading(true);
 setError(null);
 try {
 const { error } = await supabase.auth.signInWithOAuth({
 provider: "google",
 });
 if (error) throw error;
 } catch (err: unknown) {
 const message = err instanceof Error ? err.message : "Terjadi kesalahan saat login Google.";
 setError(humanizeError(message));
 setLoading(false);
 }
 };

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
 if (!hp.trim()) {
 setError("Nomor telepon wajib diisi.");
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
 hp: hp.trim() || null,
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
 className="mb-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#5a504b] transition hover:text-[#2a2320] :text-zinc-50"
 >
 <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
 </button>
 <GlassCard className="p-8">
 <div className="flex flex-col items-center text-center">
 <Logo />
 <h2 className="mt-6 text-[24px] font-extrabold tracking-tight text-[#2a2320] ">
 {mode === "login" ? "Masuk ke Portal" : "Daftar Akun Baru"}
 </h2>
 <p className="mt-1.5 text-[14px] text-[#857a75] ">
 {mode === "login" 
 ? "Pantau status pendaftaran dan keanggotaan Anda." 
 : "Buat akun untuk memulai pendaftaran."}
 </p>
 </div>

 <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
 {mode === "register" && (
 <div className="space-y-1.5">
 <Label htmlFor="login-nama" className="">Nama Lengkap</Label>
 <Input
 id="login-nama"
 type="text"
 placeholder="Sobat Angkasa"
 value={nama}
 onChange={(e) => {
 setNama(e.target.value);
 if (error) setError(null);
 }}
 className="bg-white/60 "
 disabled={loading}
 />
 </div>
 )}
 {mode === "register" && (
 <div className="space-y-1.5">
 <Label htmlFor="login-hp" className="">No. Telepon</Label>
 <Input
 id="login-hp"
 type="tel"
 placeholder="08xxxxxxxxxx"
 value={hp}
 onChange={(e) => {
 setHp(e.target.value);
 if (error) setError(null);
 }}
 className="bg-white/60 "
 disabled={loading}
 />
 </div>
 )}
 <div className="space-y-1.5">
 <Label htmlFor="login-email" className="">Email</Label>
 <Input
 id="login-email"
 type="email"
 placeholder="nama@student.ac.id"
 value={email}
 onChange={(e) => {
 setEmail(e.target.value);
 if (error) setError(null);
 }}
 className="bg-white/60 "
 autoComplete="email"
 disabled={loading}
 />
 </div>
 <div className="space-y-1.5">
 <Label htmlFor="login-pass" className="">Password</Label>
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
 className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0a49e] hover:text-[#5a504b] :text-zinc-300 focus:outline-none transition-colors"
 tabIndex={-1}
 >
 {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
 </button>
 </div>
 </div>

 {mode === "register" && (
 <div className="space-y-1.5">
 <Label htmlFor="login-confirm-pass" className="">Konfirmasi Password</Label>
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
 className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0a49e] hover:text-[#5a504b] :text-zinc-300 focus:outline-none transition-colors"
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

 <div className="my-5 flex items-center">
 <hr className="flex-grow border-white/60" />
 <span className="px-3 text-[13px] font-medium text-[#857a75]">atau</span>
 <hr className="flex-grow border-white/60" />
 </div>

 <button
 type="button"
 onClick={handleGoogleLogin}
 disabled={loading}
 className="flex w-full items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-3.5 font-medium text-[#2a2320] shadow-sm transition-colors hover:bg-white/90 disabled:opacity-50"
 >
 <svg className="h-5 w-5" viewBox="0 0 24 24">
 <path
 d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
 fill="#4285F4"
 />
 <path
 d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
 fill="#34A853"
 />
 <path
 d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
 fill="#FBBC05"
 />
 <path
 d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
 fill="#EA4335"
 />
 </svg>
 Masuk dengan Google
 </button>
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
