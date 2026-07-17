import { useState } from "react";
import {
  Search,
  SearchX,
  Loader2,
  ArrowRight,
  RotateCcw,
  HeartHandshake,
  ArrowLeft,
  ServerCrash,
  WifiOff,
  ClockArrowUp,
  PartyPopper,
} from "lucide-react";
import { GlassCard, Logo, Screen, RED } from "./shared";
import { Navbar } from "./Navbar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { supabase } from "../../../lib/supabaseClient";

/**
 * Supabase table: applicants
 * Kolom yang dibutuhkan komponen ini:
 *   nim       text  — Nomor Induk Mahasiswa (unik)
 *   status    text  — lihat DbStatus di bawah
 *   divisi    text  — ID divisi (digunakan saat status 'diterima')
 *
 * Pemetaan status DB → tampilan:
 *   'pending'    | 'lolos-admin' | 'wawancara'  → view "pending"   (sedang diproses)
 *   'diterima'                                  → onAccepted()      (selamat!)
 *   'ditolak'    | 'tidak-lolos'                → view "declined"   (terima kasih)
 */

/** Semua nilai status yang mungkin disimpan di kolom applicants.status */
type DbStatus =
  | "pending"
  | "lolos-admin"
  | "wawancara"
  | "diterima"
  | "ditolak"
  | "tidak-lolos"; // nilai lama, tetap didukung

type View = "form" | "notfound" | "pending" | "declined" | "error";

/**
 * 'server'  → Supabase mengembalikan PostgrestError (kueri/RLS gagal)
 * 'network' → koneksi ke Supabase tidak dapat dijangkau
 */
type ErrorKind = "server" | "network";

/** Kembalikan kategori tampilan berdasarkan status dari DB */
function resolveView(status: DbStatus): View {
  switch (status) {
    case "diterima":
      return "form"; // ditangani oleh onAccepted() sebelum setView
    case "ditolak":
    case "tidak-lolos":
      return "declined";
    case "pending":
    case "lolos-admin":
    case "wawancara":
    default:
      return "pending";
  }
}

/** Label tahap seleksi yang ramah dibaca pengguna */
const STAGE_LABEL: Partial<Record<DbStatus, string>> = {
  pending: "Menunggu Seleksi Administrasi",
  "lolos-admin": "Lolos Administrasi — Menunggu Wawancara",
  wawancara: "Dalam Tahap Wawancara",
};

export function CekPengumuman({
  onNavigate,
  onAccepted,
}: {
  onNavigate: (s: Screen) => void;
  onAccepted: (divisionId: string) => void;
}) {
  const [nim, setNim] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>("form");
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  /** Simpan status DB untuk ditampilkan di PendingState */
  const [pendingStatus, setPendingStatus] = useState<DbStatus | null>(null);

  const resetToForm = () => {
    setView("form");
    setErrorKind(null);
    setPendingStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nim.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setErrorKind(null);
    setPendingStatus(null);

    try {
      /**
       * Query ke tabel 'applicants'.
       * maybeSingle() → null jika tidak ada baris yang cocok (bukan error),
       *                 error jika ada masalah jaringan/RLS/Supabase.
       */
      const { data, error } = await supabase
        .from("applicants")
        .select("status, divisi")
        .eq("nim", trimmed)
        .maybeSingle<{ status: DbStatus; divisi: string }>();

      if (error) {
        const isNetwork =
          error.message.toLowerCase().includes("failed to fetch") ||
          error.message.toLowerCase().includes("network");
        setErrorKind(isNetwork ? "network" : "server");
        setView("error");
        return;
      }

      // null → NIM tidak ditemukan di database
      if (!data) {
        setView("notfound");
        return;
      }

      // Status 'diterima' → langsung panggil callback tanpa setView
      if (data.status === "diterima") {
        onAccepted(data.divisi ?? "");
        return;
      }

      // Status lainnya → tentukan view lewat helper
      const nextView = resolveView(data.status);
      if (nextView === "pending") {
        setPendingStatus(data.status);
      }
      setView(nextView);
    } catch {
      setErrorKind("network");
      setView("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10">
      <Navbar onNavigate={onNavigate} onSection={() => onNavigate("landing")} />
      <div className="flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-[480px]">
          <button
            onClick={() => onNavigate("landing")}
            className="mb-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#5a504b] transition hover:text-[#2a2320]"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
          </button>

          {view === "pending" ? (
            <PendingState
              status={pendingStatus}
              onRetry={resetToForm}
            />
          ) : view === "declined" ? (
            <Declined onRetry={resetToForm} />
          ) : view === "error" ? (
            <ErrorState kind={errorKind!} onRetry={resetToForm} />
          ) : (
            <GlassCard className="p-8">
              <div className="flex flex-col items-center text-center">
                <Logo subtitle="Cek Pengumuman" />
                {view === "notfound" ? (
                  <div
                    className="mt-6 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg"
                    style={{
                      background: RED,
                      boxShadow: "0 0 0 8px rgba(200,30,44,0.12)",
                    }}
                  >
                    <SearchX className="h-8 w-8" />
                  </div>
                ) : (
                  <div
                    className="mt-6 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg"
                    style={{
                      background: RED,
                      boxShadow: "0 0 0 8px rgba(200,30,44,0.1)",
                    }}
                  >
                    <Search className="h-8 w-8" />
                  </div>
                )}

                <h2 className="mt-5 text-[24px] font-extrabold tracking-tight text-[#2a2320]">
                  {view === "notfound"
                    ? "NIM Tidak Ditemukan"
                    : "Cek Status Pendaftaran Anda"}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[#857a75]">
                  {view === "notfound"
                    ? "Periksa kembali NIM Anda atau hubungi panitia. Pastikan tidak ada karakter yang keliru, lalu coba lagi."
                    : "Masukkan Nomor Induk Mahasiswa (NIM) Anda untuk melihat hasil seleksi Open Recruitment APTRG 2026."}
                </p>
              </div>

              <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="cek-nim">Nomor Induk Mahasiswa (NIM)</Label>
                  <Input
                    id="cek-nim"
                    placeholder="1030124xxxxx"
                    value={nim}
                    onChange={(e) => {
                      setNim(e.target.value);
                      if (view === "notfound") resetToForm();
                    }}
                    className="bg-white/60"
                    autoComplete="off"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !nim.trim()}
                  className="w-full rounded-full py-6 text-white shadow-md hover:opacity-90 disabled:opacity-80"
                  style={{ background: RED }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />{" "}
                      Memeriksa...
                    </>
                  ) : view === "notfound" ? (
                    <>
                      <RotateCcw className="mr-1.5 h-4 w-4" /> Coba Lagi
                    </>
                  ) : (
                    <>
                      Cek Status <ArrowRight className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-5 text-center text-[13px] text-[#857a75]">
                Lupa NIM?{" "}
                <button className="font-semibold text-[#c81e2c] hover:underline">
                  Hubungi panitia
                </button>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

/**
 * Ditampilkan ketika status adalah 'pending', 'lolos-admin', atau 'wawancara'.
 * Memberikan informasi bahwa proses seleksi masih berlangsung.
 */
function PendingState({
  status,
  onRetry,
}: {
  status: DbStatus | null;
  onRetry: () => void;
}) {
  const stageLabel = status ? STAGE_LABEL[status] ?? "Sedang Diproses" : "Sedang Diproses";

  return (
    <GlassCard className="p-8">
      <div className="flex flex-col items-center text-center">
        <Logo subtitle="Cek Pengumuman" />
        <div
          className="mt-6 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg"
          style={{
            background: "linear-gradient(135deg, #2f7dd1, #1a5fa8)",
            boxShadow: "0 0 0 8px rgba(47,125,209,0.12)",
          }}
        >
          <ClockArrowUp className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-[24px] font-extrabold tracking-tight text-[#2a2320]">
          Pendaftaran Sedang Diproses
        </h2>

        {/* Badge tahap seleksi */}
        <span
          className="mt-3 inline-flex items-center rounded-full px-3.5 py-1 text-[12px] font-semibold text-white"
          style={{ background: "linear-gradient(90deg, #2f7dd1, #1a5fa8)" }}
        >
          {stageLabel}
        </span>

        <p className="mt-4 text-[14px] leading-relaxed text-[#5a504b]">
          Pendaftaran Anda telah kami terima dan saat ini sedang dalam proses
          peninjauan oleh tim seleksi APTRG. Harap bersabar dan pantau terus
          pengumuman melalui halaman ini.
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-[#857a75]">
          Pengumuman hasil seleksi akan diinformasikan sesuai jadwal yang telah
          ditetapkan. Pastikan NIM yang Anda masukkan sudah benar.
        </p>

        <button
          onClick={onRetry}
          className="mt-7 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-6 py-3 text-[14px] font-medium text-[#2a2320] backdrop-blur-xl transition hover:bg-white/80"
        >
          <RotateCcw className="h-4 w-4" /> Cek Ulang
        </button>
      </div>
    </GlassCard>
  );
}

/** Ditampilkan ketika status adalah 'ditolak' atau 'tidak-lolos'. */
function Declined({ onRetry }: { onRetry: () => void }) {
  return (
    <GlassCard className="p-8">
      <div className="flex flex-col items-center text-center">
        <Logo subtitle="Cek Pengumuman" />
        <div
          className="mt-6 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg"
          style={{
            background: "linear-gradient(135deg, #857a75, #6b625d)",
            boxShadow: "0 0 0 8px rgba(133,122,117,0.12)",
          }}
        >
          <HeartHandshake className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-[24px] font-extrabold tracking-tight text-[#2a2320]">
          Terima Kasih Atas Partisipasi Anda
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[#5a504b]">
          Setelah pertimbangan yang cermat, Anda belum dapat kami terima pada
          gelombang rekrutmen kali ini. Keputusan ini bukan akhir — kami sangat
          mengapresiasi minat dan usaha Anda.
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-[#857a75]">
          Kami mendorong Anda untuk mendaftar kembali pada periode berikutnya.
          Terima kasih telah tertarik menjadi bagian dari APTRG.
        </p>
        <button
          onClick={onRetry}
          className="mt-7 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-6 py-3 text-[14px] font-medium text-[#2a2320] backdrop-blur-xl transition hover:bg-white/80"
        >
          <ArrowLeft className="h-4 w-4" /> Cek NIM Lain
        </button>
      </div>
    </GlassCard>
  );
}

function errorMessage(kind: ErrorKind): { title: string; body: string } {
  switch (kind) {
    case "network":
      return {
        title: "Tidak Dapat Terhubung",
        body: "Gagal menjangkau server Supabase. Pastikan Anda terhubung ke internet dan konfigurasi VITE_SUPABASE_URL sudah benar.",
      };
    case "server":
    default:
      return {
        title: "Terjadi Kesalahan Server",
        body: "Supabase mengembalikan error. Cek konfigurasi RLS pada tabel 'applicants', atau hubungi panitia jika masalah berlanjut.",
      };
  }
}

function ErrorState({
  kind,
  onRetry,
}: {
  kind: ErrorKind;
  onRetry: () => void;
}) {
  const { title, body } = errorMessage(kind);
  const Icon = kind === "network" ? WifiOff : ServerCrash;

  return (
    <GlassCard className="p-8">
      <div className="flex flex-col items-center text-center">
        <Logo subtitle="Cek Pengumuman" />
        <div
          className="mt-6 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg"
          style={{
            background: "linear-gradient(135deg, #d97706, #b45309)",
            boxShadow: "0 0 0 8px rgba(217,119,6,0.12)",
          }}
        >
          <Icon className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-[24px] font-extrabold tracking-tight text-[#2a2320]">
          {title}
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[#5a504b]">
          {body}
        </p>
        <button
          onClick={onRetry}
          className="mt-7 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-6 py-3 text-[14px] font-medium text-[#2a2320] backdrop-blur-xl transition hover:bg-white/80"
        >
          <RotateCcw className="h-4 w-4" /> Coba Lagi
        </button>
      </div>
    </GlassCard>
  );
}

/** Tidak digunakan saat ini — status 'diterima' langsung memanggil onAccepted().
 *  Disimpan sebagai referensi jika ingin menampilkan layar selamat sebelum
 *  dinavigasi ke halaman DiterimaMagang.
 */
export function _AcceptedCard({ onContinue }: { onContinue: () => void }) {
  return (
    <GlassCard className="p-8">
      <div className="flex flex-col items-center text-center">
        <Logo subtitle="Cek Pengumuman" />
        <div
          className="mt-6 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg"
          style={{
            background: "linear-gradient(135deg, #3aa66f, #27865a)",
            boxShadow: "0 0 0 8px rgba(58,166,111,0.14)",
          }}
        >
          <PartyPopper className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-[24px] font-extrabold tracking-tight text-[#2a2320]">
          Selamat, Anda Diterima!
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[#5a504b]">
          Anda berhasil lolos seleksi Open Recruitment APTRG. Selamat bergabung
          bersama kami — petualangan baru menanti Anda di laboratorium!
        </p>
        <button
          onClick={onContinue}
          className="mt-7 inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-[14px] font-semibold text-white shadow-md transition hover:opacity-90"
          style={{ background: "linear-gradient(90deg, #3aa66f, #27865a)" }}
        >
          Lihat Detail Penerimaan <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </GlassCard>
  );
}
