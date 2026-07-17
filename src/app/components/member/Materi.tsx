import { useState } from "react";
import { FileText, Video, Presentation, Play } from "lucide-react";
import { GlassCard, RED, AMBER } from "../aptrg/shared";
import { DivTag } from "./MemberLayout";
import { MATERIALS, DIV_COLORS, DivKey, MatFormat } from "./data";

const DIVS: (DivKey | "Umum" | "Semua")[] = [
  "Semua",
  "Mekanik",
  "Sistem",
  "GCS",
  "Non-Technical",
  "Umum",
];
const FORMATS: (MatFormat | "Semua")[] = ["Semua", "Dokumen", "Video", "Slide"];

const FMT_ICON: Record<MatFormat, typeof FileText> = {
  Dokumen: FileText,
  Video: Video,
  Slide: Presentation,
};

const divColor = (d: DivKey | "Umum") =>
  d === "Umum" ? "#857a75" : DIV_COLORS[d];

export function Materi() {
  const [div, setDiv] = useState<(typeof DIVS)[number]>("Semua");
  const [fmt, setFmt] = useState<(typeof FORMATS)[number]>("Semua");

  const list = MATERIALS.filter(
    (m) =>
      (div === "Semua" || m.division === div) &&
      (fmt === "Semua" || m.format === fmt)
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      {/* Filter sidebar */}
      <GlassCard className="h-fit p-5">
        <FilterGroup label="Divisi" options={DIVS} value={div} onChange={setDiv} />
        <div className="my-4 h-px bg-white/60" />
        <FilterGroup label="Format" options={FORMATS} value={fmt} onChange={setFmt} />
      </GlassCard>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((m) => {
          const Icon = FMT_ICON[m.format];
          const c = divColor(m.division);
          return (
            <GlassCard key={m.id} className="overflow-hidden transition hover:-translate-y-1">
              <div
                className="relative flex h-32 items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${c}22, ${AMBER}22)` }}
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-[16px] text-white shadow-md"
                  style={{ background: c }}
                >
                  <Icon className="h-7 w-7" />
                </div>
                {m.format === "Video" && (
                  <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#c81e2c] shadow">
                    <Play className="h-4 w-4" />
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <DivTag label={m.division} color={c} />
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                    style={{ background: RED }}
                  >
                    {m.format}
                  </span>
                </div>
                <h3 className="mt-2.5 text-[14px] font-bold text-[#2a2320]">
                  {m.title}
                </h3>
                <div className="mt-1 text-[12px] text-[#857a75]">{m.meta}</div>
              </div>
            </GlassCard>
          );
        })}
        {list.length === 0 && (
          <div className="col-span-full py-12 text-center text-[14px] text-[#857a75]">
            Tidak ada materi untuk filter ini.
          </div>
        )}
      </div>
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#857a75]">
        {label}
      </div>
      <div className="space-y-1">
        {options.map((o) => {
          const on = value === o;
          return (
            <button
              key={o}
              onClick={() => onChange(o)}
              className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-[13px] font-medium transition"
              style={{
                background: on ? "rgba(200,30,44,0.1)" : "transparent",
                color: on ? "#2a2320" : "#5a504b",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: on ? RED : "rgba(133,122,117,0.4)" }}
              />
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
