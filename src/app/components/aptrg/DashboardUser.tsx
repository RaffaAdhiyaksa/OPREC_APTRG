import { useState, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { GlassCard, Screen } from "./shared";
import { Navbar } from "./Navbar";
import { ArrowRight, Ticket, UserPlus, LogOut, Lock } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

export function DashboardUser({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { profile } = useAuthContext();
  const nama = profile?.nama || "Sobat Angkasa";

  const handleLogout = () => {
    onNavigate("logging-out");
  };

  const [statusMap, setStatusMap] = useState<Record<string, boolean | null>>({ open_mind: null, oprec: null });

  useEffect(() => {
    const fetchStatus = () => {
      supabase
        .from("events")
        .select("event_key, is_active")
        .then(({ data, error }) => {
          if (!error && data) {
            const mapped = data.reduce((acc: Record<string, boolean>, item) => {
              // Menyimpan open_recruitment sebagai 'oprec' agar sesuai dengan kebutuhan state
              const key = item.event_key === "open_recruitment" ? "oprec" : item.event_key;
              acc[key] = item.is_active;
              return acc;
            }, {});
            console.log("Status Map Data:", mapped);
            setStatusMap(mapped);
          } else {
            setStatusMap({ open_mind: false, oprec: false });
          }
        });
    };

    // Panggil saat pertama dimuat
    fetchStatus();

    // Tambahkan event listener agar data otomatis refresh tiap kali user kembali ke tab browser ini
    window.addEventListener("focus", fetchStatus);
    return () => window.removeEventListener("focus", fetchStatus);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-50">

      <Navbar onNavigate={onNavigate} onSection={() => { }} />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-24 pt-32">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Halo, {nama}! 👋
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Selamat datang di Portal Pendaftaran APTRG. Silakan pilih jalur pendaftaran Anda.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card Open Mind */}
          <GlassCard className={`group relative overflow-hidden p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md cursor-pointer ${statusMap.open_mind ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-100 border-slate-200'}`}>
            <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-10 transition-transform group-hover:scale-150 ${statusMap.open_mind ? 'bg-emerald-500' : 'bg-slate-500'}`} />
            <div className="relative z-10 flex h-full flex-col">
              <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl shadow-sm ${statusMap.open_mind ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                <Ticket className="h-7 w-7" />
              </div>
              <h2 className={`text-xl font-bold ${statusMap.open_mind ? 'text-emerald-700' : 'text-slate-500'}`}>
                Open Mind
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
                Acara perkenalan lab APTRG untuk seluruh mahasiswa Telkom University. Wajib diikuti sebelum mendaftar OPREC.
              </p>

              {statusMap.open_mind === null ? (
                <button
                  disabled
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-5 py-3.5 text-sm font-bold text-slate-400 cursor-not-allowed"
                >
                  Memuat Status...
                </button>
              ) : statusMap.open_mind ? (
                <button
                  onClick={() => onNavigate("form-open-mind")}
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Daftar Open Mind <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  disabled
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-400 border border-slate-400 px-5 py-3.5 text-sm font-bold text-white cursor-not-allowed"
                >
                  <Lock className="h-4 w-4" /> Pendaftaran Ditutup
                </button>
              )}
            </div>
          </GlassCard>

          {/* Card OPREC */}
          <GlassCard className={`group relative overflow-hidden p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md cursor-pointer ${statusMap.oprec ? 'bg-red-50 border-red-200' : 'bg-slate-100 border-slate-200'}`}>
            <div
              className={`absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-10 transition-transform group-hover:scale-150 ${statusMap.oprec ? 'bg-red-500' : 'bg-slate-500'}`}
            />
            <div className="relative z-10 flex h-full flex-col">
              <div
                className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl shadow-sm ${statusMap.oprec ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'}`}
              >
                <UserPlus className="h-7 w-7" />
              </div>
              <h2 className={`text-xl font-bold ${statusMap.oprec ? 'text-red-600' : 'text-slate-500'}`}>
                Open Recruitment
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
                Pendaftaran resmi menjadi anggota APTRG. Pilih divisi dan jadilah bagian dari riset aeromodelling kami.
              </p>

              {statusMap.oprec === null ? (
                <button
                  disabled
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-5 py-3.5 text-sm font-bold text-slate-400 cursor-not-allowed"
                >
                  Memuat Status...
                </button>
              ) : statusMap.oprec ? (
                <button
                  onClick={() => onNavigate("register")}
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700"
                >
                  Daftar OPREC <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  disabled
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-400 border border-slate-400 px-5 py-3.5 text-sm font-bold text-white cursor-not-allowed"
                >
                  <Lock className="h-4 w-4" /> Pendaftaran Ditutup
                </button>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
