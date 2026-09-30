import { useState, useEffect } from "react";
import { CalendarDays, List, MapPin, Clock, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { GlassCard, RED } from "../aptrg/shared";
import { DivTag } from "./MemberLayout";
import { DIV_COLORS, DivKey } from "./data";
import { supabase } from "../../../lib/supabaseClient";
import type { Meeting } from "../../types/database";

const DIVISIONS: (DivKey | "Semua")[] = [
  "Semua",
  "Mekanik",
  "Sistem",
  "GCS",
  "Non-Technical",
];

export function JadwalRapat() {
  const [view, setView] = useState<"calendar" | "list">("list");
  const [filter, setFilter] = useState<DivKey | "Semua">("Semua");
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function fetchMeetings() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .order("date", { ascending: true })
        .order("time", { ascending: true });
      
      if (error) throw error;
      if (data) setAllMeetings(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memuat jadwal rapat");
      toast.error("Gagal memuat jadwal rapat");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMeetings();
  }, []);

  const meetings =
    filter === "Semua"
      ? allMeetings
      : allMeetings.filter((m) => m.kategori_divisi === filter || m.kategori_divisi === "Umum");

  return (
    <div className="space-y-6">
      {/* Filter bar + toggle */}
      <GlassCard className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {DIVISIONS.map((d) => {
            const on = filter === d;
            return (
              <button
                key={d}
                onClick={() => setFilter(d)}
                className="rounded-full px-3.5 py-1.5 text-[13px] font-medium transition"
                style={{
                  background: on ? RED : "rgba(255,255,255,0.6)",
                  color: on ? "#fff" : "#5a504b",
                  border: on ? "none" : "1px solid rgba(255,255,255,0.7)",
                }}
              >
                {d}
              </button>
            );
          })}
          <span className="ml-2 rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-[13px] text-[#857a75]">
            Juli 2026
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/70 bg-white/60 p-1">
          <ToggleBtn
            active={view === "calendar"}
            onClick={() => setView("calendar")}
            Icon={CalendarDays}
            label="Kalender"
          />
          <ToggleBtn
            active={view === "list"}
            onClick={() => setView("list")}
            Icon={List}
            label="List"
          />
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-[#c81e2c]" />
        </div>
      ) : errorMsg ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white/40 rounded-2xl border border-white/50 backdrop-blur-md">
          <p className="text-[13px] text-[#c81e2c] mb-3">{errorMsg}</p>
          <button onClick={fetchMeetings} className="flex items-center gap-1.5 rounded-full border border-[#c81e2c]/30 bg-white/80 px-4 py-2 text-[13px] font-medium text-[#c81e2c] hover:bg-[#c81e2c]/10 transition">
            <RefreshCw className="h-4 w-4" /> Coba Lagi
          </button>
        </div>
      ) : view === "list" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {meetings.length === 0 && (
             <div className="col-span-full py-8 text-center text-sm text-[#857a75]">Belum ada jadwal rapat.</div>
          )}
          {meetings.map((m) => (
            <GlassCard key={m.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[16px] font-bold text-[#2a2320]">{m.title}</h3>
                <DivTag label={m.kategori_divisi} color={DIV_COLORS[m.kategori_divisi as DivKey] || "#857a75"} />
              </div>
              <div className="mt-3 space-y-1.5 text-[13px] text-[#5a504b]">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#c81e2c]" />
                  {new Date(m.date).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#c81e2c]" /> {m.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#c81e2c]" /> {m.location}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/60 pt-3">
                 <span className="text-[12px] text-[#857a75]">{m.description || "Tidak ada deskripsi"}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <CalendarView meetings={meetings} />
      )}
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof List;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition"
      style={{
        background: active ? RED : "transparent",
        color: active ? "#fff" : "#5a504b",
      }}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function CalendarView({ meetings }: { meetings: Meeting[] }) {
  // July 2026: starts on Wednesday (index 3), 31 days
  const startDay = 3;
  const daysInMonth = 31;
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const byDay: Record<number, Meeting[]> = {};
  meetings.forEach((m) => {
    // Need to handle timezone parsing correctly. m.date is "YYYY-MM-DD"
    // we split and use the DD part since we assume this calendar is fixed for July 2026.
    const parts = m.date.split("-");
    const day = parts.length === 3 ? parseInt(parts[2], 10) : new Date(m.date).getDate();
    (byDay[day] ||= []).push(m);
  });

  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-[#2a2320]">Juli 2026</h3>
        <div className="flex gap-1.5">
          <button className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/60 text-[#5a504b]">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/60 text-[#5a504b]">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {dayNames.map((d) => (
          <div
            key={d}
            className="pb-1 text-center text-[12px] font-semibold text-[#857a75]"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className="min-h-[76px] rounded-[12px] border p-2"
            style={{
              borderColor: day ? "rgba(255,255,255,0.6)" : "transparent",
              background: day ? "rgba(255,255,255,0.45)" : "transparent",
            }}
          >
            {day && (
              <>
                <div className="text-[12px] font-semibold text-[#5a504b]">
                  {day}
                </div>
                <div className="mt-1 space-y-1">
                  {(byDay[day] || []).map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        background: `${DIV_COLORS[m.kategori_divisi as DivKey] || "#857a75"}22`,
                        color: DIV_COLORS[m.kategori_divisi as DivKey] || "#857a75",
                      }}
                      title={m.title}
                    >
                      <span
                        className="h-1.5 w-1.5 flex-none rounded-full"
                        style={{ background: DIV_COLORS[m.kategori_divisi as DivKey] || "#857a75" }}
                      />
                      <span className="truncate">{m.title}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="mt-5 flex flex-wrap gap-4 border-t border-white/60 pt-4">
        {(Object.keys(DIV_COLORS) as DivKey[]).map((d) => (
          <div key={d} className="flex items-center gap-1.5 text-[12px] text-[#5a504b]">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: DIV_COLORS[d] }}
            />
            {d}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
