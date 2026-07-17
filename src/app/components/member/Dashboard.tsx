import {
  Award,
  CalendarClock,
  MapPin,
  FileText,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { GlassCard, Screen, RED, AMBER } from "../aptrg/shared";
import { DivTag, AvatarStack } from "./MemberLayout";
import {
  PROGRESS,
  MEETINGS,
  PROJECTS,
  ANNOUNCEMENTS,
  DOCS,
  DIV_COLORS,
} from "./data";
import { useAuthContext } from "../../context/AuthContext";
import { DashboardAdmin } from "./DashboardAdmin";
import { DashboardAsisten } from "./DashboardAsisten";

/* ── ProgressBar ─────────────────────────────────────────── */

function ProgressBar({ value, color = RED }: { value: number; color?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[rgba(200,30,44,0.12)]">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

/* ── DashboardMagang ─────────────────────────────────────── */

/**
 * Dashboard untuk anggota magang.
 * Menampilkan progress menuju Asisten Lab, rapat mendatang,
 * tubes aktif, pengumuman terbaru, dan materi rekomendasi.
 */
export function DashboardMagang({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const upcoming = MEETINGS.slice(0, 3);
  const active = PROJECTS.filter((p) => p.status === "doing");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Progress menuju Asisten Lab */}
      <GlassCard className="p-6 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[12px] text-white"
              style={{ background: RED }}
            >
              <Award className="h-5 w-5" />
            </div>
            <h2 className="text-[16px] font-bold text-[#2a2320]">
              Progress Menuju Asisten Lab
            </h2>
          </div>
          <span className="text-[22px] font-extrabold" style={{ color: RED }}>
            {PROGRESS.overall}%
          </span>
        </div>
        <div className="mt-4">
          <ProgressBar value={PROGRESS.overall} />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Kehadiran Rapat", d: PROGRESS.kehadiran },
            { label: "Tubes Selesai", d: PROGRESS.tubes },
            { label: "Sertifikasi Skill", d: PROGRESS.sertifikasi },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[14px] border border-white/60 bg-white/50 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[#2a2320]">
                  {s.label}
                </span>
                <span className="text-[13px] font-bold text-[#c81e2c]">
                  {s.d.value}%
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar value={s.d.value} />
              </div>
              <div className="mt-2 text-[12px] text-[#857a75]">{s.d.label}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Rapat Mendatang */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#2a2320]">Rapat Mendatang</h2>
          <button
            onClick={() => onNavigate("jadwal")}
            className="text-[13px] font-medium text-[#c81e2c] hover:underline"
          >
            Lihat semua
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {upcoming.map((m) => (
            <div
              key={m.id}
              className="rounded-[14px] border border-white/60 bg-white/50 p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[14px] font-semibold text-[#2a2320]">
                  {m.title}
                </span>
                <DivTag label={m.division} color={DIV_COLORS[m.division]} />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#857a75]">
                <span className="flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {new Date(m.date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  · {m.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {m.location}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Tubes Aktif */}
      <GlassCard className="p-6 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#2a2320]">Tubes Aktif</h2>
          <button
            onClick={() => onNavigate("tubes")}
            className="text-[13px] font-medium text-[#c81e2c] hover:underline"
          >
            Buka papan
          </button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {active.map((p) => (
            <div
              key={p.id}
              className="rounded-[14px] border border-white/60 bg-white/50 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[14px] font-semibold text-[#2a2320]">
                  {p.title}
                </span>
                <DivTag label={p.division} color={DIV_COLORS[p.division]} />
              </div>
              <div className="mt-3 flex items-center justify-between text-[12px] text-[#857a75]">
                <span>Progres</span>
                <span className="font-semibold text-[#c81e2c]">{p.progress}%</span>
              </div>
              <div className="mt-1.5">
                <ProgressBar value={p.progress} color={DIV_COLORS[p.division]} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <AvatarStack people={p.team} />
                <span className="text-[12px] text-[#857a75]">Deadline {p.due}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Pengumuman Terbaru */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#2a2320]">
            Pengumuman Terbaru
          </h2>
          <button
            onClick={() => onNavigate("pengumuman")}
            className="text-[13px] font-medium text-[#c81e2c] hover:underline"
          >
            Semua
          </button>
        </div>
        <div className="mt-4 space-y-2.5">
          {ANNOUNCEMENTS.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-3 rounded-[12px] border border-white/60 bg-white/50 p-3"
            >
              <span
                className="mt-1.5 h-2 w-2 flex-none rounded-full"
                style={{ background: a.unread ? RED : "transparent" }}
              />
              <div>
                <div className="text-[13px] font-semibold text-[#2a2320]">
                  {a.title}
                </div>
                <div className="text-[12px] text-[#857a75]">{a.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Materi Rekomendasi */}
      <GlassCard className="p-6 lg:col-span-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#2a2320]">
            Materi Rekomendasi
          </h2>
          <button
            onClick={() => onNavigate("materi")}
            className="text-[13px] font-medium text-[#c81e2c] hover:underline"
          >
            Knowledge base
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DOCS.map((d) => (
            <button
              key={d.id}
              onClick={() => onNavigate("materi")}
              className="group flex items-center gap-3 rounded-[14px] border border-white/60 bg-white/50 p-3.5 text-left transition hover:bg-white/70"
            >
              <div
                className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-white"
                style={{ background: AMBER }}
              >
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-[#2a2320]">
                  {d.title}
                </div>
                <div className="text-[12px] text-[#857a75]">{d.category}</div>
              </div>
              <ArrowUpRight className="h-4 w-4 flex-none text-[#857a75] transition group-hover:text-[#c81e2c]" />
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

/* ── Dashboard (dinamis, role-aware) ─────────────────────── */

/**
 * Komponen Dashboard utama yang me-render konten berbeda
 * berdasarkan role user yang diambil dari `AuthContext`.
 *
 * - `admin`   → DashboardAdmin  (manajemen OPREC, tabel pendaftar, toggle pendaftaran)
 * - `asisten` → DashboardAsisten (daftar mentee, statistik)
 * - `magang`  → DashboardMagang (progress, rapat, tubes, pengumuman)
 *
 * Jika role masih loading, tampilkan spinner.
 */
export function Dashboard({
  onNavigate,
  onOpenMember,
}: {
  onNavigate: (s: Screen) => void;
  onOpenMember: (id: string) => void;
}) {
  const { role, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-[#857a75]">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-[15px]">Memuat dashboard…</span>
      </div>
    );
  }

  if (role === "admin") return <DashboardAdmin />;
  if (role === "asisten") return <DashboardAsisten onOpenMember={onOpenMember} />;
  return <DashboardMagang onNavigate={onNavigate} />;
}
