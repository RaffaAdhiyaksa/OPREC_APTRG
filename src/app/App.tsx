import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { GlassBackground, Screen } from "./components/aptrg/shared";
import { Loader2 } from "lucide-react";
import { Navbar } from "./components/aptrg/Navbar";
import { Landing } from "./components/aptrg/Landing";
import { Footer } from "./components/aptrg/Footer";
import { Login } from "./components/aptrg/Login";
import { MemberLayout } from "./components/member/MemberLayout";
import { DashboardUser } from "./components/aptrg/DashboardUser";
import { Dashboard } from "./components/member/Dashboard";
import { ProgressSaya } from "./components/member/ProgressSaya";
import { JadwalRapat } from "./components/member/JadwalRapat";
import { TubesProyek } from "./components/member/TubesProyek";
import { Anggota } from "./components/member/Anggota";
import { MemberProfile } from "./components/member/MemberProfile";
import { Profile } from "./components/member/Profile";
import { Materi } from "./components/member/Materi";
import { Pengumuman } from "./components/member/Pengumuman";
import { StrukturOrganisasi } from "./components/member/StrukturOrganisasi";
import { Placeholder } from "./components/member/Placeholder";
import { AuthProvider, useAuthContext } from "./context/AuthContext";
import { ThemeProvider } from "next-themes";
import { AnimatePresence, motion } from "motion/react";
import { supabase } from "../lib/supabaseClient";
import { LoadingScreen } from "./components/aptrg/LoadingScreen";

/* ── Meta & screen list ──────────────────────────────────── */

const MEMBER_META: Record<string, { title: string; subtitle: string }> = {
 dashboard: { title: "Dashboard", subtitle: "Ringkasan aktivitas dan progres Anda." },
 progress: { title: "Progress Saya", subtitle: "Perjalanan menuju Asisten Laboratorium." },
 jadwal: { title: "Jadwal Rapat", subtitle: "Agenda rapat dan koordinasi tim." },
 tubes: { title: "Tubes & Proyek", subtitle: "Papan tugas besar dan proyek divisi." },
 anggota: { title: "Anggota", subtitle: "Direktori anggota laboratorium." },
 "member-detail": { title: "Profil Anggota", subtitle: "Detail anggota laboratorium." },
 materi: { title: "Materi", subtitle: "Knowledge base dan dokumen belajar." },
 pengumuman: { title: "Pengumuman", subtitle: "Informasi terbaru dari koordinator lab." },
 struktur: { title: "Struktur Organisasi", subtitle: "Bagan kepengurusan APTRG." },
 profil: { title: "Profil", subtitle: "Kelola informasi akun Anda." },
 "kelola-anggota": { title: "Kelola Anggota", subtitle: "Manajemen data anggota lab." },
 "kelola-jadwal": { title: "Kelola Jadwal", subtitle: "Manajemen agenda dan rapat." },
};

const MEMBER_SCREENS: Screen[] = [
 "dashboard",
 "progress",
 "jadwal",
 "tubes",
 "anggota",
 "member-detail",
 "materi",
 "pengumuman",
 "struktur",
 "profil",
 "kelola-anggota",
 "kelola-jadwal",
];

/* ── RoleGuard ───────────────────────────────────────────── */

/**
 * Membungkus area member portal.
 *
 * - Jika `loading` → tampilkan full-screen spinner sambil sesi & role dimuat.
 * - Jika `user` null → redirect ke login (navigasi ke screen "login").
 * - Jika `user` ada → render children (MemberLayout + konten).
 *
 * Komponen ini harus berada di dalam `<AuthProvider>`.
 */
function RoleGuard({
 children,
 onNavigate,
}: {
 children: React.ReactNode;
 onNavigate: (s: Screen) => void;
}) {
 const { user, loading } = useAuthContext();

 useEffect(() => {
 if (!loading && !user) {
  onNavigate("login");
 }
 }, [user, loading, onNavigate]);

 if (loading) {
 return (
  <div className="relative z-10 flex min-h-screen items-center justify-center gap-3 text-[#857a75]">
  <Loader2 className="h-7 w-7 animate-spin" />
  <span className="text-[15px] font-medium">Memverifikasi sesi…</span>
  </div>
 );
 }

 if (!user) {
 return null;
 }

 return <>{children}</>;
}

/* ── Hooks ───────────────────────────────────────────────── */

function useSessionStorage<T>(key: string, initialValue: T) {
 const [storedValue, setStoredValue] = useState<T>(() => {
 try {
  const item = window.sessionStorage.getItem(key);
  return item ? JSON.parse(item) : initialValue;
 } catch (error) {
  console.warn(`Error reading sessionStorage key "${key}":`, error);
  return initialValue;
 }
 });

 const setValue = (value: T | ((val: T) => T)) => {
 try {
  const valueToStore = value instanceof Function ? value(storedValue) : value;
  setStoredValue(valueToStore);
  if (valueToStore === null || valueToStore === undefined) {
  window.sessionStorage.removeItem(key);
  } else {
  window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
  }
 } catch (error) {
  console.warn(`Error setting sessionStorage key "${key}":`, error);
 }
 };

 return [storedValue, setValue] as const;
}

/* ── AppInner ────────────────────────────────────────────── */

/**
 * Komponen utama yang berisi semua logic navigasi.
 * Dibungkus dengan `<AuthProvider>` di export default agar
 * `useAuthContext()` tersedia di seluruh subtree.
 */
function AppInner() {
 const [screen, setScreen] = useSessionStorage<Screen>("app_screen", "landing");
 const [selectedMember, setSelectedMember] = useState<string | null>(null);

 // Guard: jika sessionStorage menyimpan screen lama yang sudah dihapus
 // (misal "dashboard-user", "register", "form-open-mind"), reset ke "landing"
 const VALID_SCREENS: string[] = [
 "landing", "login", "logging-out",
 ...MEMBER_SCREENS,
 ];
 useEffect(() => {
 if (!VALID_SCREENS.includes(screen)) {
  setScreen("landing");
 }
 }, []);

 useEffect(() => {
 const handleHashChange = () => {
  const hash = window.location.hash.replace("#", "") as Screen;
  if (hash && hash !== screen) {
  setScreen(hash);
  }
 };
 window.addEventListener("hashchange", handleHashChange);
 return () => window.removeEventListener("hashchange", handleHashChange);
 }, [screen, setScreen]);

 useEffect(() => {
 if (window.location.hash !== `#${screen}`) {
  window.history.pushState(null, "", `#${screen}`);
 }
 }, [screen]);

 const { user, role, loading } = useAuthContext();
 const [isGlobalLoading, setIsGlobalLoading] = useState(true);

 useEffect(() => {
 if (screen === "logging-out") {
  const doLogout = async () => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  await supabase.auth.signOut();
  setScreen("landing");
  };
  doLogout();
 }
 }, [screen, setScreen]);

 useEffect(() => {
 const checkAuthAndLoad = async () => {
  const authPromise = supabase.auth.getSession();
  const delayPromise = new Promise((resolve) => setTimeout(resolve, 1500));
  await Promise.all([authPromise, delayPromise]);
  setIsGlobalLoading(false);
 };
 checkAuthAndLoad();
 }, []);

 /* ── Route Protection ──────────────────────────────────── */
 useEffect(() => {
 if (loading) return;

 // 1. Lindungi halaman yang butuh login
 const protectedScreens: Screen[] = ["profil-user", "dashboard", "member-detail"];
 if (!user && protectedScreens.includes(screen)) {
  setScreen("login");
  setTimeout(() => toast.error("Silakan masuk terlebih dahulu untuk mengakses halaman ini."), 100);
  return;
 }

 // 2. Proteksi role-based jika sudah login
 if (user) {
  if (screen === "login") {
  setScreen("landing");
  }
 }
 }, [screen, user, role, loading, setScreen]);

 const navigate = (s: Screen) => {
 setScreen(s);
 window.scrollTo({ top: 0, behavior: "auto" });
 };

 const openMember = (id: string) => {
 setSelectedMember(id);
 navigate("member-detail");
 };

 const scrollToSection = (id: string) => {
 if (screen !== "landing") {
  setScreen("landing");
  setTimeout(() => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, 60);
 } else {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
 }
 };

 const renderMemberContent = () => {
 // 🛡️ Admin Guard: Blokir akses non-admin ke halaman kelola
 const isAdminScreen = ["kelola-anggota", "kelola-jadwal"].includes(screen);
 if (isAdminScreen && role !== "admin") {
  return <Dashboard onNavigate={navigate} onOpenMember={openMember} />;
 }

 switch (screen) {
  case "dashboard":
  return <Dashboard onNavigate={navigate} onOpenMember={openMember} />;
  case "progress":
  return <ProgressSaya />;
  case "jadwal":
  return <JadwalRapat />;
  case "tubes":
  return <TubesProyek />;
  case "anggota":
  return <Anggota onOpenMember={openMember} />;
  case "member-detail":
  return (
   <MemberProfile
   memberId={selectedMember ?? "u1"}
   onBack={() => navigate("anggota")}
   />
  );
  case "materi":
  return <Materi />;
  case "pengumuman":
  return <Pengumuman />;
  case "struktur":
  return <StrukturOrganisasi />;
  case "profil":
  return <Profile />;
  default:
  return <Placeholder title={MEMBER_META[screen]?.title ?? "Halaman"} />;
 }
 };

 return (
 <div className="relative min-h-screen w-full overflow-x-hidden bg-[#f6f2f0] text-[#2a2320] transition-colors duration-500">
  <Toaster richColors position="top-right" />
  <GlassBackground />

  <AnimatePresence mode="wait">
  {isGlobalLoading ? (
   <LoadingScreen key="global-loading" />
  ) : (
   <motion.div
   key={screen}
   initial={{ opacity: 0, y: 15 }}
   animate={{ opacity: 1, y: 0 }}
   exit={{ opacity: 0, y: -15 }}
   transition={{ duration: 0.3, ease: "easeInOut" }}
   className="w-full min-h-screen flex flex-col"
   >
   {screen === "landing" && (
    <>
    <Navbar onNavigate={navigate} onSection={scrollToSection} />
    <Landing onNavigate={navigate} />
    <Footer />
    </>
   )}

   {screen === "logging-out" && <LoadingScreen />}

   {screen === "login" && (
    <Login
    onNavigate={navigate}
    onLoginSuccess={() => navigate("landing")}
    />
   )}

   {MEMBER_SCREENS.includes(screen) && (
    <RoleGuard onNavigate={navigate}>
    <MemberLayout
     active={screen === "member-detail" ? "anggota" : screen}
     role={role ?? "magang"}
     onNavigate={navigate}
     title={MEMBER_META[screen]?.title ?? ""}
     subtitle={MEMBER_META[screen]?.subtitle ?? ""}
    >
     {renderMemberContent()}
    </MemberLayout>
    </RoleGuard>
   )}
   </motion.div>
  )}
  </AnimatePresence>
 </div>
 );
}

/* ── Root export ─────────────────────────────────────────── */

export default function App() {
 return (
 <ThemeProvider attribute="class" forcedTheme="light" disableTransitionOnChange>
  <AuthProvider>
  <AppInner />
  </AuthProvider>
 </ThemeProvider>
 );
}
