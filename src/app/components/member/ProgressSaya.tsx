import { useState, useEffect } from "react";
import {
  CalendarCheck,
  ClipboardCheck,
  BadgeCheck,
  FileStack,
  Lock,
  Loader2,
} from "lucide-react";
import { GlassCard, RED, AMBER } from "../aptrg/shared";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthContext } from "../../context/AuthContext";
import type { MemberProgress } from "../../types/database";

function Ring({ value }: { value: number }) {
  const r = 68;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-[180px] w-[180px]">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="rgba(200,30,44,0.14)"
          strokeWidth="14"
        />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke={RED}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[36px] font-extrabold leading-none text-[#2a2320]">
          {Math.round(value)}%
        </span>
        <span className="mt-1 text-[12px] text-[#857a75]">menuju Asisten Lab</span>
      </div>
    </div>
  );
}

function Bar({ value, color = RED }: { value: number; color?: string }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(200,30,44,0.12)]">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

export function ProgressSaya() {
  const { user } = useAuthContext();
  const [progress, setProgress] = useState<MemberProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("member_progress")
        .select("*")
        .eq("user_id", user.id);
      
      if (!error && data) {
        setProgress(data);
      }
      setLoading(false);
    }
    fetchProgress();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-[#c81e2c]" />
      </div>
    );
  }

  // Parse specific metrics vs general skills
  const kehadiran = progress.find((p) => p.skill_name === "Kehadiran Rapat")?.score || 0;
  const tubes = progress.find((p) => p.skill_name === "Tugas Besar")?.score || 0;
  const dokumentasi = progress.find((p) => p.skill_name === "Dokumentasi")?.score || 0;
  
  const generalSkills = progress.filter(
    (p) => !["Kehadiran Rapat", "Tugas Besar", "Dokumentasi"].includes(p.skill_name)
  );

  // Default empty skills if none exist so it doesn't look blank
  const defaultSkills = ["CAD Design", "ROS2", "Python", "Computer Vision"];
  const skillsList = generalSkills.length > 0 
    ? generalSkills 
    : defaultSkills.map((name) => ({ skill_name: name, score: 0 }));

  // Calculate overall (simple average of metrics)
  const overall = (kehadiran + tubes) / 2;

  return (
    <div className="space-y-6">
      {/* Gauge */}
      <GlassCard className="flex flex-col items-center gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
          <Ring value={overall} />
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight text-[#2a2320]">
              {Math.round(overall)}% menuju Asisten Lab
            </h2>
            <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-[#857a75]">
              Selesaikan seluruh syarat di bawah untuk naik jenjang dari Anggota
              Magang menjadi Asisten Laboratorium APTRG. Nilai ini akan diupdate oleh asisten penilai.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Checklist */}
      <div className="space-y-5">
        {/* Kehadiran Rapat */}
        <GlassCard className="p-6">
          <ItemHead
            Icon={CalendarCheck}
            title="Kehadiran Rapat"
            right={`${kehadiran}%`}
          />
          <div className="mt-4">
            <Bar value={kehadiran} />
          </div>
          <div className="mt-2 text-[13px] text-[#857a75]">
            Nilai kehadiran rapat — pertahankan kehadiran minimal 80%.
          </div>
        </GlassCard>

        {/* Tubes / Proyek */}
        <GlassCard className="p-6">
          <ItemHead
            Icon={ClipboardCheck}
            title="Tugas Besar / Proyek"
            right={`${tubes}%`}
          />
          <div className="mt-4">
            <Bar value={tubes} />
          </div>
          <div className="mt-2 text-[13px] text-[#857a75]">
            Progress penyelesaian tugas besar / modul magang.
          </div>
        </GlassCard>

        {/* Sertifikasi Skill */}
        <GlassCard className="p-6">
          <ItemHead
            Icon={BadgeCheck}
            title="Sertifikasi Skill Divisi"
            right={`${skillsList.filter((s) => s.score >= 100).length}/${skillsList.length}`}
          />
          <div className="mt-4 flex flex-wrap gap-2.5">
            {skillsList.map((s, i) =>
              s.score >= 100 ? (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-sm"
                  style={{ background: AMBER }}
                >
                  <BadgeCheck className="h-4 w-4" /> {s.skill_name}
                </span>
              ) : (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed px-3.5 py-1.5 text-[13px] font-medium text-[#a79c96]"
                  style={{ borderColor: "rgba(133,122,117,0.5)" }}
                >
                  <Lock className="h-3.5 w-3.5" /> {s.skill_name} {s.score > 0 ? `(${s.score}%)` : ""}
                </span>
              )
            )}
          </div>
        </GlassCard>

        {/* Kontribusi Dokumentasi */}
        <GlassCard className="p-6">
          <ItemHead
            Icon={FileStack}
            title="Kontribusi Dokumentasi"
            right=""
          />
          <div className="mt-4 flex items-center gap-4">
            <span className="text-[40px] font-extrabold leading-none" style={{ color: RED }}>
              {dokumentasi}
            </span>
            <span className="text-[14px] text-[#857a75]">
              Total artikel/dokumen yang telah Anda kontribusikan ke knowledge base lab.
            </span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function ItemHead({
  Icon,
  title,
  right,
}: {
  Icon: typeof CalendarCheck;
  title: string;
  right: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-[12px] text-white"
          style={{ background: RED }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-[16px] font-bold text-[#2a2320]">{title}</h3>
      </div>
      {right && (
        <span className="text-[16px] font-extrabold text-[#c81e2c]">{right}</span>
      )}
    </div>
  );
}
