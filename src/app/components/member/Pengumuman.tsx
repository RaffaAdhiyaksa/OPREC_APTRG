import { useState } from "react";
import { Pin } from "lucide-react";
import { GlassCard, RED } from "../aptrg/shared";
import { Avatar } from "./MemberLayout";
import { FEED, AnnCategory } from "./data";

const CAT_COLORS: Record<AnnCategory, string> = {
  Rapat: "#2f7dd1",
  OPREC: "#c81e2c",
  Umum: "#857a75",
  Deadline: "#e3a548",
};

const FILTERS: (AnnCategory | "Semua")[] = [
  "Semua",
  "Rapat",
  "OPREC",
  "Umum",
  "Deadline",
];

export function Pengumuman() {
  const [cat, setCat] = useState<(typeof FILTERS)[number]>("Semua");
  const list = FEED.filter((f) => cat === "Semua" || f.category === cat).sort(
    (a, b) => Number(b.pinned) - Number(a.pinned)
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = cat === f;
          return (
            <button
              key={f}
              onClick={() => setCat(f)}
              className="rounded-full px-3.5 py-1.5 text-[13px] font-medium transition"
              style={{
                background: on ? RED : "rgba(255,255,255,0.6)",
                color: on ? "#fff" : "#5a504b",
                border: on ? "none" : "1px solid rgba(255,255,255,0.7)",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {list.map((f) => (
        <GlassCard
          key={f.id}
          className="p-6"
          style={
            f.pinned
              ? { borderLeft: `4px solid ${RED}` }
              : undefined
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                style={{ background: CAT_COLORS[f.category] }}
              >
                {f.category}
              </span>
              {f.pinned && (
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#c81e2c]">
                  <Pin className="h-3.5 w-3.5" /> Disematkan
                </span>
              )}
            </div>
            <span className="text-[12px] text-[#857a75]">{f.time}</span>
          </div>
          <h3 className="mt-3 text-[17px] font-bold text-[#2a2320]">{f.title}</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5a504b]">{f.body}</p>
          <div className="mt-4 flex items-center gap-2.5 border-t border-white/60 pt-3">
            <Avatar initials={f.author.slice(0, 2).toUpperCase()} size={26} />
            <span className="text-[13px] font-medium text-[#5a504b]">{f.author}</span>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
