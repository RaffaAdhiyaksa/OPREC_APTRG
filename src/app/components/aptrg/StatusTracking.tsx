import { Check, Clock, Info, LogOut, CalendarDays, Layers } from "lucide-react";
import { GlassCard, DIVISIONS, STAGES, Screen, RED, AMBER } from "./shared";
import { Navbar } from "./Navbar";
import { Button } from "../ui/button";

export function StatusTracking({
  divisionId,
  submittedAt,
  onNavigate,
}: {
  divisionId: string | null;
  submittedAt: string;
  onNavigate: (s: Screen) => void;
}) {
  // Applicant is currently at "Seleksi Administrasi" (index 1)
  const current = 1;
  const division = DIVISIONS.find((d) => d.id === divisionId);

  return (
    <div className="relative z-10">
      <Navbar onNavigate={onNavigate} onSection={() => onNavigate("landing")} />
      <div className="mx-auto w-full max-w-5xl px-4 pt-32 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#c81e2c]">
              Status Pendaftaran
            </div>
            <h1 className="mt-1 text-[30px] font-extrabold tracking-tight text-[#2a2320]">
              Halo, calon anggota APTRG 👋
            </h1>
            <p className="mt-1 text-[14px] text-[#857a75]">
              Berikut perkembangan proses seleksi Anda saat ini.
            </p>
          </div>
          <button
            onClick={() => onNavigate("login")}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-[14px] font-medium text-[#2a2320] backdrop-blur-xl transition hover:bg-white/80"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
          {/* Timeline */}
          <GlassCard className="p-8">
            <h2 className="text-[18px] font-bold text-[#2a2320]">
              Tahapan Rekrutmen
            </h2>
            <div className="mt-6">
              {STAGES.map((stage, i) => {
                const done = i < current;
                const active = i === current;
                return (
                  <div key={stage} className="relative flex gap-4 pb-8 last:pb-0">
                    {i < STAGES.length - 1 && (
                      <div
                        className="absolute left-[17px] top-9 h-full w-0.5"
                        style={{
                          background: done ? RED : "rgba(200,30,44,0.18)",
                        }}
                      />
                    )}
                    <div
                      className="z-10 flex h-9 w-9 flex-none items-center justify-center rounded-full text-white shadow-md"
                      style={{
                        background: done
                          ? RED
                          : active
                          ? RED
                          : "rgba(200,30,44,0.18)",
                        boxShadow: active
                          ? "0 0 0 5px rgba(200,30,44,0.18)"
                          : undefined,
                      }}
                    >
                      {done ? (
                        <Check className="h-4 w-4" />
                      ) : active ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <span className="text-[13px] font-bold" style={{ color: active ? "#fff" : "#c81e2c" }}>
                          {i + 1}
                        </span>
                      )}
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
                          <span className="rounded-full bg-[rgba(200,30,44,0.1)] px-2.5 py-0.5 text-[11px] font-semibold text-[#c81e2c]">
                            Selesai
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] text-[#857a75]">
                        {i === 0 && "Pendaftaran berhasil diterima."}
                        {i === 1 && "Berkas Anda sedang ditinjau oleh tim seleksi."}
                        {i === 2 && "Jadwal wawancara akan diinformasikan via email."}
                        {i === 3 && "Hasil akhir seleksi akan diumumkan."}
                        {i === 4 && "Onboarding dan mulai magang di laboratorium."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Side panel */}
          <div className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-[15px] font-bold text-[#2a2320]">
                Ringkasan Pendaftaran
              </h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] text-white shadow"
                    style={{ background: RED }}
                  >
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[12px] text-[#857a75]">Divisi dipilih</div>
                    <div className="text-[15px] font-semibold text-[#2a2320]">
                      {division ? division.name : "Belum dipilih"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] text-white shadow"
                    style={{ background: AMBER }}
                  >
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[12px] text-[#857a75]">Tanggal submit</div>
                    <div className="text-[15px] font-semibold text-[#2a2320]">
                      {submittedAt}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 rounded-[14px] border border-white/60 bg-white/50 p-4">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#857a75]">Progres seleksi</span>
                  <span className="font-semibold text-[#c81e2c]">
                    {current + 1}/{STAGES.length} tahap
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(200,30,44,0.15)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${((current + 1) / STAGES.length) * 100}%`,
                      background: RED,
                    }}
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-white"
                  style={{ background: RED }}
                >
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#2a2320]">
                    Langkah selanjutnya
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#857a75]">
                    Tim seleksi sedang meninjau berkas administrasi Anda. Pastikan
                    email dan nomor HP aktif — jadwal wawancara akan dikirimkan bila
                    Anda lolos tahap ini. Pantau halaman ini secara berkala.
                  </p>
                  <Button
                    className="mt-4 w-full rounded-full py-5 text-white shadow-md hover:opacity-90"
                    style={{ background: RED }}
                  >
                    Unduh Bukti Pendaftaran
                  </Button>
                  <button
                    onClick={() => onNavigate("lolos-admin")}
                    className="mt-3 w-full text-center text-[13px] font-medium text-[#c81e2c] hover:underline"
                  >
                    Simulasikan tahap berikutnya →
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
