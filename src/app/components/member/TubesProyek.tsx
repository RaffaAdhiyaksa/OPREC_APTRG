import { CalendarClock } from "lucide-react";
import { GlassCard, RED } from "../aptrg/shared";
import { DivTag, AvatarStack } from "./MemberLayout";
import { PROJECTS, DIV_COLORS, Project } from "./data";

const COLUMNS: { key: Project["status"]; label: string }[] = [
  { key: "todo", label: "Belum Dikerjakan" },
  { key: "doing", label: "Sedang Berjalan" },
  { key: "done", label: "Selesai" },
];

export function TubesProyek() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = PROJECTS.filter((p) => p.status === col.key);
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
                        : "#a79c96",
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
            <div className="flex-1 space-y-4 rounded-[18px] border border-white/50 bg-white/30 p-3 backdrop-blur-md">
              {items.map((p) => (
                <ProjectCard key={p.id} p={p} />
              ))}
              {items.length === 0 && (
                <div className="py-8 text-center text-[13px] text-[#a79c96]">
                  Tidak ada tugas
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProjectCard({ p }: { p: Project }) {
  const color = DIV_COLORS[p.division];
  return (
    <GlassCard className="p-4">
      <div className="mb-2">
        <DivTag label={p.division} color={color} />
      </div>
      <h4 className="text-[14px] font-bold text-[#2a2320]">{p.title}</h4>
      <div className="mt-3 flex items-center justify-between text-[12px] text-[#857a75]">
        <span>Progres</span>
        <span className="font-semibold" style={{ color }}>
          {p.progress}%
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[rgba(200,30,44,0.1)]">
        <div
          className="h-full rounded-full"
          style={{ width: `${p.progress}%`, background: color }}
        />
      </div>
      <div className="mt-3.5 flex items-center justify-between border-t border-white/60 pt-3">
        <AvatarStack people={p.team} />
        <span className="flex items-center gap-1 text-[12px] text-[#857a75]">
          <CalendarClock className="h-3.5 w-3.5" /> {p.due}
        </span>
      </div>
    </GlassCard>
  );
}
