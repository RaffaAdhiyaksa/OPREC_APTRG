import { useState, useEffect } from "react";
import { CalendarClock, Loader2, Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { GlassCard, RED } from "../aptrg/shared";
import { DivTag } from "./MemberLayout";
import { DIV_COLORS, DivKey } from "./data";
import { supabase } from "../../../lib/supabaseClient";
import type { Project, ProjectStatus } from "../../types/database";

const COLUMNS: { key: ProjectStatus; label: string }[] = [
  { key: "doing", label: "Sedang Dikerjakan" },
  { key: "review", label: "Menunggu Review" },
  { key: "done", label: "Selesai" },
];

export function TubesProyek() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function fetchProjects() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("deadline", { ascending: true });
      
      if (error) throw error;
      if (data) setProjects(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memuat proyek");
      toast.error("Gagal memuat daftar proyek");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = projects.filter((p) => p.status === col.key);
        return (
          <div key={col.key} className="flex flex-col">
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background:
                      col.key === "done"
                        ? "#3aa66f"
                        : col.key === "doing"
                        ? RED
                        : "#e3a548",
                  }}
                />
                <h3 className="text-[14px] font-bold text-[#2a2320]">
                  {col.label}
                </h3>
              </div>
              <span className="rounded-full bg-white/60 px-2.5 py-0.5 text-[12px] font-semibold text-[#5a504b]">
                {items.length}
              </span>
            </div>
            <div className="flex-1 space-y-4 rounded-[18px] border border-white/50 bg-white/30 p-3 backdrop-blur-md min-h-[150px]">
              {loading ? (
                <div className="flex h-full items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#c81e2c]" />
                </div>
              ) : errorMsg ? (
                <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                  <p className="text-[13px] text-[#c81e2c] mb-2">{errorMsg}</p>
                  <button onClick={fetchProjects} className="flex items-center gap-1.5 rounded-full border border-[#c81e2c]/30 bg-white/60 px-3 py-1.5 text-[12px] font-medium text-[#c81e2c] hover:bg-[#c81e2c]/10 transition">
                    <RefreshCw className="h-3.5 w-3.5" /> Coba Lagi
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-[#857a75]">
                    <Users className="h-5 w-5 opacity-60" />
                  </div>
                  <p className="text-[13px] font-medium text-[#857a75]">Tidak ada tugas</p>
                  <p className="mt-0.5 text-[11px] text-[#a79c96]">Tim kamu sedang bersantai.</p>
                </div>
              ) : (
                items.map((p) => <ProjectCard key={p.id} p={p} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProjectCard({ p }: { p: Project }) {
  const color = DIV_COLORS[p.kategori_divisi as DivKey] || "#857a75";
  
  // Fake progress bar based on status since we don't store percentage
  const progress = p.status === "done" ? 100 : p.status === "review" ? 85 : 45;

  return (
    <GlassCard className="p-4">
      <div className="mb-2 flex justify-between items-start">
        <DivTag label={p.kategori_divisi} color={color} />
      </div>
      <h4 className="text-[14px] font-bold text-[#2a2320]">{p.title}</h4>
      {p.description && (
        <p className="mt-1 text-[11px] text-[#857a75] line-clamp-2">{p.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between text-[12px] text-[#857a75]">
        <span>Progres Status</span>
        <span className="font-semibold" style={{ color }}>
          {progress}%
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[rgba(200,30,44,0.1)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: color }}
        />
      </div>
      <div className="mt-3.5 flex items-center justify-between border-t border-white/60 pt-3">
        <div className="flex items-center gap-1 text-[11px] text-[#857a75] truncate max-w-[130px]">
          <Users className="h-3.5 w-3.5 flex-shrink-0" /> 
          <span className="truncate">{p.anggota_tim || "Belum ada tim"}</span>
        </div>
        <span className="flex flex-shrink-0 items-center gap-1 text-[11px] font-medium" style={{ color: p.deadline ? "#c81e2c" : "#857a75" }}>
          <CalendarClock className="h-3.5 w-3.5" /> {p.deadline ? new Date(p.deadline).toLocaleDateString("id-ID", { day:"numeric", month:"short" }) : "-"}
        </span>
      </div>
    </GlassCard>
  );
}
