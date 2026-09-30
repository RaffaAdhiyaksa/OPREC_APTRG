import { useState, useEffect } from "react";
import {
  Award,
  CalendarClock,
  MapPin,
  FileText,
  ArrowUpRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard, Screen, RED, AMBER } from "../aptrg/shared";
import { DivTag, AvatarStack } from "./MemberLayout";
import { DIV_COLORS, DivKey } from "./data";
import { useAuthContext } from "../../context/AuthContext";
import { DashboardAdmin } from "./DashboardAdmin";
import { DashboardAsisten } from "./DashboardAsisten";
import { supabase } from "../../../lib/supabaseClient";
import type { Meeting, Project, Announcement, Material, MemberProgress } from "../../types/database";

/* ── ProgressBar ─────────────────────────────────────────── */

function ProgressBar({ value, color = RED }: { value: number; color?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[rgba(200,30,44,0.12)]">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

/* ── DashboardMagang ─────────────────────────────────────── */

export function DashboardMagang({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { user } = useAuthContext();
  
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [docs, setDocs] = useState<Material[]>([]);
  
  // Progress states
  const [kehadiran, setKehadiran] = useState(0);
  const [tubes, setTubes] = useState(0);
  const [sertifikasi, setSertifikasi] = useState(0);
  const [overall, setOverall] = useState(0);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function fetchData() {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);
    try {

      // Fetch upcoming meetings
      const pMeetings = supabase
        .from("meetings")
        .select("*")
        .order("date", { ascending: true })
        .limit(3);

      // Fetch active projects
      const pProjects = supabase
        .from("projects")
        .select("*")
        .eq("status", "doing")
        .limit(2);

      // Fetch announcements
      const pAnnounce = supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);

      // Fetch docs
      const pDocs = supabase
        .from("materials")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);

      // Fetch progress
      const pProgress = supabase
        .from("member_progress")
        .select("*")
        .eq("user_id", user.id);

      const [resM, resP, resA, resD, resProg] = await Promise.all([
        pMeetings, pProjects, pAnnounce, pDocs, pProgress
      ]);

      if (resM.data) setUpcoming(resM.data);
      if (resP.data) setActiveProjects(resP.data);
      if (resA.data) setAnnouncements(resA.data);
      if (resD.data) setDocs(resD.data);
      
      if (resProg.data) {
        const prog = resProg.data as MemberProgress[];
        const k = prog.find(p => p.skill_name === "Kehadiran Rapat")?.score || 0;
        const t = prog.find(p => p.skill_name === "Tugas Besar")?.score || 0;
        
        const general = prog.filter(p => !["Kehadiran Rapat", "Tugas Besar", "Dokumentasi"].includes(p.skill_name));
        const s = general.length > 0 
          ? Math.round(general.reduce((sum, p) => sum + p.score, 0) / general.length) 
          : 0;

        setKehadiran(k);
        setTubes(t);
        setSertifikasi(s);
        setOverall(Math.round((k + t + s) / 3));
      }
    } catch (err: any) {
      setErrorMsg("Gagal memuat data dashboard. Periksa koneksi internet Anda.");
      toast.error("Gagal memuat dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-[#857a75]">
        <Loader2 className="h-8 w-8 animate-spin text-[#c81e2c]" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <p className="text-[14px] text-[#c81e2c] mb-4">{errorMsg}</p>
        <button onClick={fetchData} className="flex items-center gap-2 rounded-full bg-white/80 border border-[#c81e2c]/30 px-5 py-2.5 text-[14px] font-medium text-[#c81e2c] hover:bg-[#c81e2c]/10 transition shadow-sm">
          <RefreshCw className="h-4 w-4" /> Coba Lagi
        </button>
      </div>
    );
  }

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
            {overall}%
          </span>
        </div>
        <div className="mt-4">
          <ProgressBar value={overall} />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Kehadiran Rapat", value: kehadiran, desc: "Minimal 80%" },
            { label: "Tubes Selesai", value: tubes, desc: "Tugas Besar" },
            { label: "Sertifikasi Skill", value: sertifikasi, desc: "Skill Divisi" },
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
                  {s.value}%
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar value={s.value} />
              </div>
              <div className="mt-2 text-[12px] text-[#857a75]">{s.desc}</div>
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
          {upcoming.length === 0 && <p className="text-sm text-gray-500">Belum ada rapat</p>}
          {upcoming.map((m) => (
            <div
              key={m.id}
              className="rounded-[14px] border border-white/60 bg-white/50 p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[14px] font-semibold text-[#2a2320] truncate">
                  {m.title}
                </span>
                <DivTag label={m.kategori_divisi} color={DIV_COLORS[m.kategori_divisi as DivKey] || "#857a75"} />
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
          {activeProjects.length === 0 && <p className="text-sm text-gray-500">Tidak ada proyek aktif</p>}
          {activeProjects.map((p) => {
            const color = DIV_COLORS[p.kategori_divisi as DivKey] || "#857a75";
            return (
            <div
              key={p.id}
              className="rounded-[14px] border border-white/60 bg-white/50 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[14px] font-semibold text-[#2a2320] truncate max-w-[150px]">
                  {p.title}
                </span>
                <DivTag label={p.kategori_divisi} color={color} />
              </div>
              <div className="mt-3 flex items-center justify-between text-[12px] text-[#857a75]">
                <span>Progres (Doing)</span>
                <span className="font-semibold text-[#c81e2c]">50%</span>
              </div>
              <div className="mt-1.5">
                <ProgressBar value={50} color={color} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-[#857a75] truncate max-w-[130px]">{p.anggota_tim || "Belum ada tim"}</span>
                <span className="text-[11px] text-[#857a75]">Deadline {p.deadline ? new Date(p.deadline).toLocaleDateString("id-ID", {day:"numeric", month:"short"}) : "-"}</span>
              </div>
            </div>
          )})}
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
          {announcements.length === 0 && <p className="text-sm text-gray-500">Tidak ada pengumuman</p>}
          {announcements.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-3 rounded-[12px] border border-white/60 bg-white/50 p-3"
            >
              <span
                className="mt-1.5 h-2 w-2 flex-none rounded-full"
                style={{ background: a.is_pinned ? RED : "transparent" }}
              />
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[#2a2320] truncate">
                  {a.title}
                </div>
                <div className="text-[12px] text-[#857a75] truncate">{a.content}</div>
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
          {docs.length === 0 && <p className="text-sm text-gray-500 px-2">Belum ada materi</p>}
          {docs.map((d) => (
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
                <div className="text-[12px] text-[#857a75]">{d.kategori_divisi}</div>
              </div>
              <ArrowUpRight className="h-4 w-4 flex-none text-[#857a75] transition group-hover:text-[#c81e2c]" />
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

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
