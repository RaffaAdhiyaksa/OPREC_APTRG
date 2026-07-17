import {
  Check,
  Clock,
  CalendarClock,
  MapPin,
  Video,
  UserRound,
  CheckCircle2,
  CalendarPlus,
  Info,
  Sparkles,
  ArrowRight,
  BookOpen,
  Layers,
  CalendarDays,
} from "lucide-react";
import { GlassCard, DIVISIONS, STAGES, Screen, RED, AMBER } from "./shared";
import { Navbar } from "./Navbar";
import { Button } from "../ui/button";

const STAGE_DESC = [
  "Pendaftaran berhasil diterima.",
  "Berkas administrasi telah diverifikasi.",
  "Sesi wawancara dengan tim divisi.",
  "Hasil akhir seleksi diumumkan.",
  "Onboarding dan mulai magang di laboratorium.",
];

/* Reusable vertical timeline — completed = amber check, active = pulsing red */
function RecruitmentTimeline({ current }: { current: number }) {
  return (
    <GlassCard className="p-8">
      <h2 className="text-[18px] font-bold text-[#2a2320]">Tahapan Rekrutmen</h2>
      <div className="mt-6">
        {STAGES.map((stage, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={stage} className="relative flex gap-4 pb-8 last:pb-0">
              {i < STAGES.length - 1 && (
                <div
                  className="absolute left-[17px] top-9 h-full w-0.5"
                  style={{ background: done ? AMBER : "rgba(200,30,44,0.18)" }}
                />
              )}
              <div className="relative z-10 flex-none">
                {active && (
                  <span
                    className="absolute inset-0 -m-1 animate-ping rounded-full"
                    style={{ background: "rgba(200,30,44,0.35)" }}
                  />
                )}
                <div
                  className="relative flex h-9 w-9 items-center justify-center rounded-full text-white shadow-md"
                  style={{
                    background: done ? AMBER : active ? RED : "rgba(200,30,44,0.18)",
                    boxShadow: active ? "0 0 0 5px rgba(200,30,44,0.18)" : undefined,
                  }}
                >
                  {done ? (
                    <Check className="h-4 w-4" />
                  ) : active ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <span className="text-[13px] font-bold text-[#c81e2c]">
                      {i + 1}
                    </span>
                  )}
                </div>
              </div>
              <div className="pt-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[15px] font-semibold"
                    style={{ color: active || done ? "#2a2320" : "#857a75" }}
                  >
                    {stage}
                  </span>
                  {active && (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                      style={{ background: RED }}
                    >
                      Sedang berlangsung
                    </span>
                  )}
                  {done && (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ background: "rgba(227,165,72,0.18)", color: "#b47a1e" }}
                    >
                      Selesai
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] text-[#857a75]">{STAGE_DESC[i]}</p>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function PageShell({
  onNavigate,
  children,
}: {
  onNavigate: (s: Screen) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-10">
      <Navbar onNavigate={onNavigate} onSection={() => onNavigate("landing")} />
      <div className="mx-auto w-full max-w-5xl px-4 pt-32 pb-16">{children}</div>
    </div>
  );
}

/* ============ 1. Lolos Seleksi Administrasi ============ */
export function LolosAdmin({
  onNavigate,
}: {
  onNavigate: (s: Screen) => void;
}) {
  return (
    <PageShell onNavigate={onNavigate}>
      {/* Hero */}
      <GlassCard className="mb-6 p-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <span
              className="absolute inset-0 animate-ping rounded-full"
              style={{ background: "rgba(200,30,44,0.25)" }}
            />
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${RED}, ${AMBER})`,
                boxShadow: "0 0 0 8px rgba(200,30,44,0.12)",
              }}
            >
              <Check className="h-8 w-8" strokeWidth={3} />
            </div>
          </div>
        </div>
        <h1 className="mt-6 text-[30px] font-extrabold tracking-tight text-[#2a2320]">
          Selamat! Anda Lolos Seleksi Administrasi
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-[#5a504b]">
          Berkas pendaftaran Anda telah lolos verifikasi. Anda kini melaju ke tahap{" "}
          <span className="font-semibold text-[#c81e2c]">Wawancara</span>. Persiapkan
          diri dan pantau jadwal wawancara Anda.
        </p>
        <div className="mt-6">
          <Button
            onClick={() => onNavigate("undangan-wawancara")}
            className="rounded-full px-6 py-6 text-white shadow-lg hover:opacity-90"
            style={{ background: RED }}
          >
            Lihat Detail Jadwal Wawancara <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </GlassCard>

      <RecruitmentTimeline current={2} />
    </PageShell>
  );
}

/* ============ 2. Undangan Wawancara ============ */
export function UndanganWawancara({
  onNavigate,
}: {
  onNavigate: (s: Screen) => void;
}) {
  const details = [
    { Icon: CalendarClock, label: "Tanggal", value: "Kamis, 24 Juli 2026" },
    { Icon: Clock, label: "Waktu", value: "13:00 - 13:45 WIB" },
    { Icon: MapPin, label: "Lokasi", value: "Ruang Diskusi 2, Gedung Riset Teknik Lt. 3" },
    { Icon: Video, label: "Alternatif Daring", value: "meet.aptrg.ac.id/wawancara" },
    { Icon: UserRound, label: "Pewawancara", value: "Tim Divisi Mekanik" },
  ];
  const tips = [
    "Bawa KTM/KTP untuk verifikasi identitas.",
    "Datang 15 menit lebih awal sebelum sesi dimulai.",
    "Siapkan portofolio atau proyek yang pernah dikerjakan.",
    "Pastikan koneksi stabil bila mengikuti secara daring.",
  ];

  return (
    <PageShell onNavigate={onNavigate}>
      {/* Hero */}
      <GlassCard className="mb-6 p-8">
        <div className="flex items-center gap-5">
          <div
            className="flex h-16 w-16 flex-none items-center justify-center rounded-[18px] text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${RED}, ${AMBER})` }}
          >
            <CalendarDays className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#2a2320]">
              Jadwal Wawancara Anda
            </h1>
            <p className="mt-1.5 text-[15px] leading-relaxed text-[#5a504b]">
              Berikut detail sesi wawancara seleksi. Mohon konfirmasi kehadiran Anda.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Detail card */}
      <GlassCard className="p-8">
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {details.map((d) => (
            <div key={d.label} className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] text-white shadow"
                style={{ background: RED }}
              >
                <d.Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[12px] uppercase tracking-wide text-[#857a75]">
                  {d.label}
                </div>
                <div className="text-[15px] font-semibold text-[#2a2320]">
                  {d.value}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3 border-t border-white/60 pt-6">
          <Button
            onClick={() => onNavigate("diterima")}
            className="rounded-full px-6 py-6 text-white shadow-md hover:opacity-90"
            style={{ background: RED }}
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Konfirmasi Kehadiran
          </Button>
          <button className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-6 py-3 text-[14px] font-medium text-[#2a2320] backdrop-blur-xl transition hover:bg-white/80">
            <CalendarPlus className="h-4 w-4" /> Tambahkan ke Kalender
          </button>
        </div>
      </GlassCard>

      {/* Notes */}
      <GlassCard className="mt-6 p-6">
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-white"
            style={{ background: AMBER }}
          >
            <Info className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-bold text-[#2a2320]">
              Pengingat Sebelum Wawancara
            </h3>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {tips.map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-2 text-[14px] text-[#5a504b]"
                >
                  <Check className="mt-0.5 h-4 w-4 flex-none text-[#c81e2c]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </GlassCard>
    </PageShell>
  );
}

/* ============ 3. Diterima Magang ============ */
export function DiterimaMagang({
  divisionId,
  onNavigate,
}: {
  divisionId: string | null;
  onNavigate: (s: Screen) => void;
}) {
  const division = DIVISIONS.find((d) => d.id === divisionId);
  const divName = division ? division.name : "APTRG";

  const steps = [
    {
      Icon: CalendarClock,
      label: "Tanggal Onboarding",
      value: "Senin, 4 Agustus 2026 · 15:30 WIB",
    },
    {
      Icon: MapPin,
      label: "Lokasi Laboratorium",
      value: "Lab APTRG, Gedung Riset Teknik Lt. 3",
    },
    {
      Icon: BookOpen,
      label: "Materi Persiapan Awal",
      value: "materi.aptrg.ac.id/onboarding",
    },
  ];

  return (
    <PageShell onNavigate={onNavigate}>
      {/* Hero with warm glow */}
      <div className="relative">
        {/* glow shape behind card */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[120%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
          style={{
            background: `radial-gradient(circle at 50% 40%, rgba(200,30,44,0.55), rgba(227,165,72,0.4) 55%, transparent 75%)`,
          }}
        />
        <GlassCard className="relative p-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${RED}, ${AMBER})`,
                boxShadow: "0 0 0 10px rgba(227,165,72,0.14)",
              }}
            >
              <Sparkles className="h-9 w-9" />
            </div>
          </div>
          <h1 className="text-[40px] font-extrabold leading-[1.1] tracking-tight text-[#2a2320]">
            Selamat Datang di APTRG!
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-[#5a504b]">
            Anda resmi diterima sebagai{" "}
            <span className="font-semibold text-[#2a2320]">Anggota Magang</span>.
          </p>
          <div
            className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2 text-[15px] font-semibold text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${RED}, ${AMBER})` }}
          >
            <Layers className="h-4 w-4" /> Anda diterima di Divisi {divName}
          </div>
        </GlassCard>
      </div>

      {/* Langkah Selanjutnya */}
      <GlassCard className="mt-6 p-8">
        <h2 className="text-[18px] font-bold text-[#2a2320]">Langkah Selanjutnya</h2>
        <p className="mt-1 text-[14px] text-[#857a75]">
          Informasi onboarding untuk memulai perjalanan Anda di laboratorium.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.label}
              className="rounded-[16px] border border-white/60 bg-white/50 p-5"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-[13px] text-white shadow"
                style={{ background: RED }}
              >
                <s.Icon className="h-5 w-5" />
              </div>
              <div className="mt-3 text-[12px] uppercase tracking-wide text-[#857a75]">
                {s.label}
              </div>
              <div className="mt-1 text-[14px] font-semibold text-[#2a2320]">
                {s.value}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => onNavigate("dashboard")}
            className="rounded-full px-8 py-6 text-white shadow-lg hover:opacity-90"
            style={{ background: RED }}
          >
            Lanjut ke Dashboard Anggota <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </GlassCard>
    </PageShell>
  );
}
