import { Users, TrendingUp, CalendarClock } from "lucide-react";
import { GlassCard, RED, AMBER } from "../aptrg/shared";
import { Avatar, DivTag } from "./MemberLayout";
import { MENTEES, DIV_COLORS, MEETINGS } from "./data";

export function DashboardAsisten({
  onOpenMember,
}: {
  onOpenMember: (id: string) => void;
}) {
  const avg = Math.round(
    MENTEES.reduce((s, m) => s + m.progress, 0) / MENTEES.length
  );
  const stats = [
    { label: "Total Mentee", value: `${MENTEES.length}`, Icon: Users, color: RED },
    { label: "Rata-rata Progress", value: `${avg}%`, Icon: TrendingUp, color: AMBER },
    { label: "Rapat Minggu Ini", value: `${MEETINGS.length}`, Icon: CalendarClock, color: "#2f7dd1" },
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
          {MENTEES.map((m) => (
            <button key={m.id} onClick={() => onOpenMember(m.id)} className="text-left">
              <GlassCard className="p-5 transition hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <Avatar initials={m.initials} size={44} />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-bold text-[#2a2320]">
                      {m.name}
                    </div>
                    <div className="mt-0.5">
                      <DivTag label={m.division} color={DIV_COLORS[m.division]} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-[12px] text-[#857a75]">
                  <span>Progress</span>
                  <span className="font-semibold text-[#c81e2c]">{m.progress}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[rgba(200,30,44,0.12)]">
                  <div
                    className="h-full rounded-full"
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
