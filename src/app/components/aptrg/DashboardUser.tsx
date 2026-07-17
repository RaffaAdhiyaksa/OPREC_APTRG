import { useAuthContext } from "../../context/AuthContext";
import { GlassCard, Screen, RED, GlassBackground } from "./shared";
import { Navbar } from "./Navbar";
import { ArrowRight, Ticket, UserPlus, LogOut } from "lucide-react";

export function DashboardUser({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { profile } = useAuthContext();
  const nama = profile?.nama || "Sobat Angkasa";

  const handleLogout = () => {
    onNavigate("logging-out");
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#f6f2f0]">
          <GlassBackground />
          <Navbar onNavigate={onNavigate} onSection={() => {}} />

          <div className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-24 pt-32">
            <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h1 className="text-[28px] font-extrabold tracking-tight text-[#2a2320]">
                  Halo, {nama}! 👋
                </h1>
                <p className="mt-2 text-[15px] text-[#857a75]">
                  Selamat datang di Portal Pendaftaran APTRG. Silakan pilih jalur pendaftaran Anda.
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/60 px-5 py-2.5 text-[14px] font-semibold text-[#c81e2c] shadow-sm transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Keluar
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Card Open Mind */}
              <GlassCard className="group relative overflow-hidden p-8 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl hover:shadow-red-500/10 cursor-pointer">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#3aa66f] opacity-10 transition-transform group-hover:scale-150" />
                <div className="relative z-10 flex h-full flex-col">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3aa66f]/10 text-[#3aa66f]">
                    <Ticket className="h-7 w-7" />
                  </div>
                  <h2 className="text-[22px] font-extrabold text-[#2a2320]">
                    Open Mind
                  </h2>
                  <p className="mt-2 flex-1 text-[14px] leading-relaxed text-[#5a504b]">
                    Acara perkenalan lab APTRG untuk seluruh mahasiswa Telkom University. Wajib diikuti sebelum mendaftar OPREC.
                  </p>
                  <button
                    onClick={() => onNavigate("form-open-mind")}
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3aa66f] px-5 py-3.5 text-[14px] font-bold text-white shadow-md transition hover:bg-[#2f885a]"
                  >
                    Daftar Open Mind <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </GlassCard>

              {/* Card OPREC */}
              <GlassCard className="group relative overflow-hidden p-8 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl hover:shadow-red-500/10 cursor-pointer">
                <div
                  className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-10 transition-transform group-hover:scale-150"
                  style={{ background: RED }}
                />
                <div className="relative z-10 flex h-full flex-col">
                  <div
                    className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm"
                    style={{ background: RED }}
                  >
                    <UserPlus className="h-7 w-7" />
                  </div>
                  <h2 className="text-[22px] font-extrabold text-[#2a2320]">
                    Open Recruitment
                  </h2>
                  <p className="mt-2 flex-1 text-[14px] leading-relaxed text-[#5a504b]">
                    Pendaftaran resmi menjadi anggota APTRG. Pilih divisi dan jadilah bagian dari riset aeromodelling kami.
                  </p>
                  <button
                    onClick={() => onNavigate("register")}
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[14px] font-bold text-white shadow-md transition hover:opacity-90"
                    style={{ background: RED }}
                  >
                    Daftar OPREC <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </GlassCard>
            </div>
          </div>
    </div>
  );
}
