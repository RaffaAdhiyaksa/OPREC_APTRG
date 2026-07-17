import { useState } from "react";
import { Search } from "lucide-react";
import { GlassCard, RED } from "../aptrg/shared";
import { Avatar, DivTag, StatusBadge } from "./MemberLayout";
import { MEMBERS, DIV_COLORS, DivKey } from "./data";

const DIV_FILTERS: (DivKey | "Semua")[] = [
  "Semua",
  "Mekanik",
  "Sistem",
  "GCS",
  "Non-Technical",
];
const STATUS_FILTERS = ["Semua", "Asisten Lab", "Magang"] as const;
const ANGKATAN_FILTERS = ["Semua", "2022", "2023", "2024"] as const;

export function Anggota({
  onOpenMember,
}: {
  onOpenMember: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [div, setDiv] = useState<(typeof DIV_FILTERS)[number]>("Semua");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("Semua");
  const [angkatan, setAngkatan] =
    useState<(typeof ANGKATAN_FILTERS)[number]>("Semua");

  const filtered = MEMBERS.filter((m) => {
    if (q && !m.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (div !== "Semua" && m.division !== div) return false;
    if (status !== "Semua") {
      const label = m.status === "asisten" ? "Asisten Lab" : "Magang";
      if (label !== status) return false;
    }
    if (angkatan !== "Semua" && m.angkatan !== angkatan) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <GlassCard className="p-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#857a75]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari anggota berdasarkan nama..."
            className="w-full rounded-full border border-white/70 bg-white/60 py-2.5 pl-11 pr-4 text-[14px] text-[#2a2320] outline-none placeholder:text-[#a79c96] focus:border-[#c81e2c]"
          />
        </div>
        <div className="mt-4 space-y-3">
          <ChipRow label="Divisi" options={DIV_FILTERS} value={div} onChange={setDiv} />
          <ChipRow label="Status" options={STATUS_FILTERS} value={status} onChange={setStatus} />
          <ChipRow label="Angkatan" options={ANGKATAN_FILTERS} value={angkatan} onChange={setAngkatan} />
        </div>
      </GlassCard>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((m) => (
          <button key={m.id} onClick={() => onOpenMember(m.id)} className="text-left">
            <GlassCard className="p-5 transition hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <Avatar initials={m.initials} size={52} />
                <StatusBadge status={m.status} />
              </div>
              <h3 className="mt-3.5 text-[16px] font-bold text-[#2a2320]">
                {m.name}
              </h3>
              <div className="mt-0.5 text-[12px] text-[#857a75]">
                {m.role} · Angkatan {m.angkatan}
              </div>
              <div className="mt-3">
                <DivTag label={m.division} color={DIV_COLORS[m.division]} />
              </div>
            </GlassCard>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-[14px] text-[#857a75]">
            Tidak ada anggota yang cocok dengan filter.
          </div>
        )}
      </div>
    </div>
  );
}

function ChipRow<T extends string>({
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
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 flex-none text-[12px] font-semibold uppercase tracking-wide text-[#857a75]">
        {label}
      </span>
      {options.map((o) => {
        const on = value === o;
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            className="rounded-full px-3 py-1 text-[13px] font-medium transition"
            style={{
              background: on ? RED : "rgba(255,255,255,0.6)",
              color: on ? "#fff" : "#5a504b",
              border: on ? "none" : "1px solid rgba(255,255,255,0.7)",
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
