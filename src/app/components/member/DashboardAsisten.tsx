import { useState, useEffect } from "react";
import { Users, TrendingUp, CalendarClock, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { GlassCard, RED, AMBER } from "../aptrg/shared";
import { Avatar, DivTag } from "./MemberLayout";
import { DIV_COLORS, DivKey } from "./data";
import { supabase } from "../../../lib/supabaseClient";
import type { Member, Meeting, MemberProgress } from "../../types/database";

export function DashboardAsisten({
  onOpenMember,
}: {
  onOpenMember: (id: string) => void;
}) {
  const [mentees, setMentees] = useState<(Member & { progress: number })[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [resMembers, resMeetings, resProgress] = await Promise.all([
        supabase.from("members").select("*").eq("status_jabatan", "Magang"),
        supabase.from("meetings").select("*").gte("date", new Date().toISOString().split("T")[0]).limit(5),
        supabase.from("member_progress").select("*")
      ]);

      if (resMembers.error) throw resMembers.error;
      if (resMeetings.error) throw resMeetings.error;

      if (resMeetings.data) {
        setMeetings(resMeetings.data);
      }

      if (resMembers.data) {
        const mems = resMembers.data as Member[];
        const progs = resProgress.data as MemberProgress[] || [];
        
        const menteesWithProg = mems.map(m => {
          const p = progs.filter(x => x.user_id === m.user_id);
          
          let overall = 0;
          if (p.length > 0) {
            const k = p.find(x => x.skill_name === "Kehadiran Rapat")?.score || 0;
            const t = p.find(x => x.skill_name === "Tugas Besar")?.score || 0;
            
            const general = p.filter(x => !["Kehadiran Rapat", "Tugas Besar", "Dokumentasi"].includes(x.skill_name));
            const s = general.length > 0 
              ? Math.round(general.reduce((sum, x) => sum + x.score, 0) / general.length) 
              : 0;
            overall = Math.round((k + t + s) / 3);
          }

          return { ...m, progress: overall };
        });

        setMentees(menteesWithProg);
      }
    } catch (err: any) {
      setErrorMsg("Gagal memuat data mentee. Periksa koneksi Anda.");
      toast.error("Gagal memuat dashboard asisten");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#c81e2c]" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-[14px] text-[#c81e2c] mb-4">{errorMsg}</p>
        <button onClick={fetchData} className="flex items-center gap-2 rounded-full bg-white/80 border border-[#c81e2c]/30 px-5 py-2.5 text-[14px] font-medium text-[#c81e2c] hover:bg-[#c81e2c]/10 transition shadow-sm">
          <RefreshCw className="h-4 w-4" /> Coba Lagi
        </button>
      </div>
    );
  }

  const avg = mentees.length > 0
    ? Math.round(mentees.reduce((s, m) => s + m.progress, 0) / mentees.length)
    : 0;

  const stats = [
    { label: "Total Mentee", value: `${mentees.length}`, Icon: Users, color: RED },
    { label: "Rata-rata Progress", value: `${avg}%`, Icon: TrendingUp, color: AMBER },
    { label: "Rapat Mendatang", value: `${meetings.length}`, Icon: CalendarClock, color: "#2f7dd1" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-3">
        {stats.map((s) => (
          <GlassCard key={s.label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] text-[#857a75]">{s.label}</div>
                <div className="mt-1 text-[30px] font-extrabold tracking-tight text-[#2a2320]">
                  {s.value}
                </div>
              </div>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-[14px] text-white shadow"
                style={{ background: s.color }}
              >
                <s.Icon className="h-6 w-6" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6">
        <h2 className="text-[16px] font-bold text-[#2a2320]">Mentee Saya</h2>
        <p className="text-[13px] text-[#857a75]">
          Anggota magang yang berada di bawah bimbingan Anda.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mentees.length === 0 && <p className="text-sm text-gray-500">Belum ada data mentee.</p>}
          {mentees.map((m) => (
            <button key={m.id} onClick={() => onOpenMember(m.id)} className="text-left w-full">
              <GlassCard className="p-5 transition hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <Avatar initials={m.nama.slice(0, 2).toUpperCase()} size={44} />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-bold text-[#2a2320]">
                      {m.nama}
                    </div>
                    <div className="mt-0.5">
                      <DivTag label={m.divisi} color={DIV_COLORS[m.divisi as DivKey] || "#857a75"} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-[12px] text-[#857a75]">
                  <span>Progress</span>
                  <span className="font-semibold text-[#c81e2c]">{m.progress}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[rgba(200,30,44,0.12)]">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${m.progress}%`, background: RED }}
                  />
                </div>
              </GlassCard>
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
