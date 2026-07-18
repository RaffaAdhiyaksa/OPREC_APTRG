import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { GlassBackground, Screen, RED, AMBER } from "./components/aptrg/shared";
import { CheckCircle2, Loader2, Printer, Ticket } from "lucide-react";
import { Navbar } from "./components/aptrg/Navbar";
import { Landing } from "./components/aptrg/Landing";
import { Footer } from "./components/aptrg/Footer";
import { Registration } from "./components/aptrg/Registration";
import { Login } from "./components/aptrg/Login";
import { StatusTracking } from "./components/aptrg/StatusTracking";
import {
  LolosAdmin,
  UndanganWawancara,
  DiterimaMagang,
} from "./components/aptrg/Milestones";
import { CekPengumuman } from "./components/aptrg/CekPengumuman";
import { MemberLayout } from "./components/member/MemberLayout";
import { FormOpenMind } from "./components/aptrg/FormOpenMind";
import { PilihBangku, type RegistrantData } from "./components/aptrg/PilihBangku";
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
import { KelolaOprec } from "./components/member/KelolaOprec";
import { DashboardPendaftar } from "./components/member/DashboardPendaftar";
import { AuthProvider, useAuthContext } from "./context/AuthContext";
import { AnimatePresence, motion } from "motion/react";
import { supabase } from "../lib/supabaseClient";
import { LoadingScreen } from "./components/aptrg/LoadingScreen";

/* ── OpenMindSuccess ─────────────────────────────────────── */

/**
 * Halaman sukses setelah pendaftar Open Mind mengkonfirmasi bangku.
 */
function OpenMindSuccess({
  nama,
  seatLabel,
  onNavigate,
}: {
  nama: string;
  seatLabel: string;
  onNavigate: (s: Screen) => void;
}) {
  const qrData = `OPENMIND-${encodeURIComponent(nama || "Sobat Angkasa")}-${seatLabel}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#f6f2f0] print:bg-white print:min-h-0">
      <div className="print:hidden">
        <GlassBackground />
      </div>
      
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-12 text-center print:min-h-0 print:py-0">
        
        {/* Pesan Sukses Header (Hidden on Print) */}
        <div className="print:hidden mb-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#3aa66f]/10 text-[#3aa66f]">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-[22px] font-extrabold tracking-tight text-[#2a2320]">
            Pendaftaran Selesai! 🎉
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5a504b]">
            Sampai jumpa di acara Open Mind APTRG!
          </p>
        </div>

        {/* Tiket Digital */}
        <div className="relative w-full overflow-hidden rounded-[20px] bg-white shadow-2xl print:shadow-none print:border print:border-black">
          {/* Header Tiket */}
          <div className="bg-[#2a2320] px-6 py-5 text-left text-white" style={{ background: `linear-gradient(135deg, ${RED}, #a11420)` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">
                  E-Ticket
                </p>
                <h3 className="mt-1 text-[18px] font-extrabold leading-tight">
                  Open Mind APTRG 2026
                </h3>
              </div>
              <Ticket className="h-8 w-8 opacity-40" />
            </div>
          </div>

          {/* Badan Tiket */}
          <div className="px-6 py-6 text-left">
            <p className="text-[12px] font-semibold text-[#857a75]">NAMA PENDAFTAR</p>
            <p className="mb-5 mt-1 text-[16px] font-bold text-[#2a2320]">
              {nama || "Sobat Angkasa"}
            </p>
            
            <div className="mb-2 flex items-center justify-between rounded-xl bg-[#f6f2f0] px-5 py-4">
              <div>
                <p className="text-[11px] font-bold text-[#857a75]">NOMOR BANGKU</p>
                <p className="text-[28px] font-extrabold leading-none text-[#2a2320]" style={{ color: AMBER }}>
                  {seatLabel || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Garis Sobekan / Dashed Line */}
          <div className="relative flex items-center">
            <div className="absolute -left-4 h-8 w-8 rounded-full bg-[#f6f2f0] shadow-inner print:hidden" />
            <div className="h-[2px] w-full border-t-2 border-dashed border-[#e6dfda] print:border-black/20" />
            <div className="absolute -right-4 h-8 w-8 rounded-full bg-[#f6f2f0] shadow-inner print:hidden" />
          </div>

          {/* Bagian Bawah / QR Code */}
          <div className="flex flex-col items-center justify-center bg-white px-6 pb-8 pt-6">
            <div className="rounded-[12px] border-4 border-[#f6f2f0] bg-white p-2">
              <img
                src={qrUrl}
                alt="QR Code Tiket"
                className="h-[120px] w-[120px]"
                crossOrigin="anonymous"
              />
            </div>
            <p className="mt-4 max-w-[200px] text-center text-[11px] text-[#857a75]">
              Tunjukkan QR Code ini kepada panitia saat registrasi ulang di lokasi.
            </p>
          </div>
        </div>

        {/* Tombol Aksi (Hidden on Print) */}
        <div className="mt-4 flex w-full flex-col gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] py-3.5 text-[14px] font-semibold text-white shadow-lg transition hover:opacity-90 active:scale-95"
            style={{ background: AMBER }}
          >
            <Printer className="h-4 w-4" />
            Simpan Tiket (Cetak PDF)
          </button>
          
          <button
            onClick={() => onNavigate("landing")}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] border-2 bg-transparent py-3 text-[14px] font-semibold transition hover:bg-white/40 active:scale-95"
            style={{ borderColor: RED, color: RED }}
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}

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
  "kelola-oprec": { title: "Kelola OPREC", subtitle: "Manajemen open recruitment." },
  "dashboard-pendaftar": { title: "Pendaftar OPREC", subtitle: "Verifikasi pendaftar." },
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
  "kelola-oprec",
  "dashboard-pendaftar",
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
      // Sesi habis atau belum login — kembali ke layar login
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
  const [division, setDivision] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState("14 Juli 2026");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  /** Data pendaftar Open Mind yang dibawa dari FormOpenMind ke PilihBangku (disimpan di session) */
  const [registrantData, setRegistrantData] = useSessionStorage<RegistrantData | null>("app_registrant", null);
  /** Bangku yang dikonfirmasi — dipakai di halaman sukses (disimpan di session agar aman reload) */
  const [confirmedSeat, setConfirmedSeat] = useSessionStorage<string | null>("app_confirmed_seat", null);

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
    const protectedScreens: Screen[] = ["form-open-mind", "register", "pilih-bangku", "dashboard-user", "dashboard", "member-detail"];
    if (!user && protectedScreens.includes(screen)) {
      setScreen("login");
      setTimeout(() => toast.error("Silakan masuk terlebih dahulu untuk mengakses halaman ini."), 100);
      return;
    }

    // 2. Proteksi role-based jika sudah login
    if (user) {
      const isAdmin = role === "admin" || role === "asisten";
      
      // Mencegah user biasa masuk ke dashboard admin
      if (!isAdmin && (screen === "dashboard" || screen === "member-detail")) {
        setScreen("dashboard-user");
      }

      // Self-heal: kalau admin/asisten kepeleset (misal race condition pas
      // klik "Buka Dashboard" sebelum role selesai di-fetch) nyangkut di
      // dashboard-user, tarik balik ke dashboard yang benar begitu role
      // sudah pasti diketahui.
      if (isAdmin && screen === "dashboard-user") {
        setScreen("dashboard");
      }
      
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

  /**
   * Dipanggil oleh Registration setelah INSERT ke Supabase berhasil.
   */
  const handleSubmitSuccess = (divisionId: string) => {
    setDivision(divisionId);
    setSubmittedAt(
      new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
    navigate("status");
  };

  const renderMemberContent = () => {
    switch (screen) {
      case "dashboard":
        // Dashboard membaca role sendiri dari AuthContext
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
      case "kelola-oprec":
        return <KelolaOprec />;
      case "dashboard-pendaftar":
        return <DashboardPendaftar />;
      case "profil":
        return <Profile />;
      default:
        return <Placeholder title={MEMBER_META[screen].title} />;
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#f6f2f0] text-[#2a2320]">
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

      {screen === "dashboard-user" && (
        <DashboardUser onNavigate={navigate} />
      )}

      {screen === "logging-out" && <LoadingScreen />}

      {screen === "form-open-mind" && (
        <FormOpenMind
          onNavigate={navigate}
          onGoToBangku={(data) => {
            setRegistrantData(data);
            navigate("pilih-bangku");
          }}
        />
      )}

      {screen === "pilih-bangku" && registrantData && (
        <PilihBangku
          registrant={registrantData}
          onNavigate={navigate}
          onConfirm={(seatNumber) => {
            setConfirmedSeat(seatNumber);
            navigate("open-mind-success" as Screen);
          }}
        />
      )}

      {screen === ("open-mind-success" as Screen) && (
        <OpenMindSuccess
          nama={registrantData?.nama ?? ""}
          seatLabel={confirmedSeat ?? ""}
          onNavigate={(s) => {
            // Hapus data dari sessionStorage agar form bersih untuk pendaftar selanjutnya
            setRegistrantData(null);
            setConfirmedSeat(null);
            navigate(s);
          }}
        />
      )}

      {screen === "register" && (
        <Registration
          onNavigate={navigate}
          onSubmitSuccess={handleSubmitSuccess}
        />
      )}

      {screen === "login" && (
        <Login
          onNavigate={navigate}
          onLoginSuccess={() => navigate("landing")}
        />
      )}

      {screen === "status" && (
        <StatusTracking
          divisionId={division}
          submittedAt={submittedAt}
          onNavigate={navigate}
        />
      )}

      {screen === "cek-pengumuman" && (
        <CekPengumuman
          onNavigate={navigate}
          onAccepted={(divisionId) => {
            setDivision(divisionId);
            navigate("diterima");
          }}
        />
      )}

      {screen === "lolos-admin" && <LolosAdmin onNavigate={navigate} />}

      {screen === "undangan-wawancara" && (
        <UndanganWawancara onNavigate={navigate} />
      )}

      {screen === "diterima" && (
        <DiterimaMagang divisionId={division} onNavigate={navigate} />
      )}

      {MEMBER_SCREENS.includes(screen) && (
        <RoleGuard onNavigate={navigate}>
          <MemberLayout
            active={screen === "member-detail" ? "anggota" : screen}
            role={role ?? "magang"}
            onNavigate={navigate}
            title={MEMBER_META[screen].title}
            subtitle={MEMBER_META[screen].subtitle}
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
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
