import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  IdCard,
  CalendarDays,
  BadgeCheck,
  CalendarCheck,
  ClipboardCheck,
  FileStack,
  Lock,
} from "lucide-react";
import { GlassCard, RED, AMBER } from "../aptrg/shared";
import { Avatar, DivTag, StatusBadge } from "./MemberLayout";
import { MEMBERS, DIV_COLORS, SKILLS } from "./data";

const TABS = ["Overview", "Progress", "Tubes", "Kehadiran"] as const;

export function MemberProfile({
  memberId,
  onBack,
}: {
  memberId: string;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const m = MEMBERS.find((x) => x.id === memberId) ?? MEMBERS[0];
  const color = DIV_COLORS[m.division];

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#5a504b] transition hover:text-[#2a2320]"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke direktori
      </button>

      {/* Banner */}
      <GlassCard className="overflow-hidden">
        <div
          className="h-24 w-full"
          style={{
            background: `linear-gradient(120deg, ${RED}, ${AMBER})`,
            opacity: 0.9,
          }}
        />
        <div className="flex flex-col gap-4 px-8 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="-mt-10">
              <Avatar initials={m.initials} size={88} />
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[22px] font-extrabold tracking-tight text-[#2a2320]">
                  {m.name}
                </h2>
                <StatusBadge status={m.status} />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[13px] text-[#857a75]">
                <DivTag label={m.division} color={color} />
                <span className="flex items-center gap-1.5">
                  <IdCard className="h-4 w-4" /> {m.nim}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" /> Bergabung {m.joinDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const on = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="rounded-full px-4 py-2 text-[14px] font-semibold transition"
              style={{
                background: on ? RED : "rgba(255,255,255,0.6)",
                color: on ? "#fff" : "#5a504b",
                border: on ? "none" : "1px solid rgba(255,255,255,0.7)",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {tab === "Overview" && <Overview m={m} />}
      {tab === "Progress" && <Progress m={m} />}
      {tab === "Tubes" && <Tubes m={m} />}
      {tab === "Kehadiran" && <Kehadiran m={m} />}
    </div>
  );
}

type M = (typeof MEMBERS)[number];

function Overview({ m }: { m: M }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <GlassCard className="p-6 lg:col-span-2">
        <h3 className="text-[15px] font-bold text-[#2a2320]">Bio</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-[#5a504b]">{m.bio}</p>
        <h3 className="mt-6 text-[15px] font-bold text-[#2a2320]">Skill</h3>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {m.skills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-sm"
              style={{ background: AMBER }}
            >
              <BadgeCheck className="h-4 w-4" /> {s}
            </span>
          ))}
        </div>
      </GlassCard>
      <GlassCard className="p-6">
        <h3 className="text-[15px] font-bold text-[#2a2320]">Kontak</h3>
        <div className="mt-4 space-y-3 text-[14px] text-[#5a504b]">
          <div className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 text-[#c81e2c]" /> {m.email}
          </div>
          <div className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 text-[#c81e2c]" /> {m.phone}
          </div>
          <div className="flex items-center gap-2.5">
            <IdCard className="h-4 w-4 text-[#c81e2c]" /> {m.nim}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function Bar({ value, color = RED }: { value: number; color?: string }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(200,30,44,0.12)]">
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

function Progress({ m }: { m: M }) {
  const p = m.progress;
  return (
    <div className="space-y-5">
      <GlassCard className="p-6">
        <Head Icon={CalendarCheck} title="Kehadiran Rapat" right={`${p.kehadiran}%`} />
        <div className="mt-4"><Bar value={p.kehadiran} /></div>
      </GlassCard>
      <GlassCard className="p-6">
        <Head Icon={ClipboardCheck} title="Tubes / Proyek Diselesaikan" right={`${p.tubes}%`} />
        <div className="mt-4"><Bar value={p.tubes} /></div>
      </GlassCard>
      <GlassCard className="p-6">
        <Head Icon={BadgeCheck} title="Sertifikasi Skill Divisi" right={`${p.sertifikasi}%`} />
        <div className="mt-4 flex flex-wrap gap-2.5">
          {SKILLS.map((s, i) => {
            const unlocked = i < Math.round((p.sertifikasi / 100) * SKILLS.length);
            return unlocked ? (
              <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-sm" style={{ background: AMBER }}>
                <BadgeCheck className="h-4 w-4" /> {s.name}
              </span>
            ) : (
              <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full border border-dashed px-3.5 py-1.5 text-[13px] font-medium text-[#a79c96]" style={{ borderColor: "rgba(133,122,117,0.5)" }}>
                <Lock className="h-3.5 w-3.5" /> {s.name}
              </span>
            );
          })}
        </div>
      </GlassCard>
      <GlassCard className="p-6">
        <Head Icon={FileStack} title="Kontribusi Dokumentasi" right="" />
        <div className="mt-4 flex items-center gap-4">
          <span className="text-[40px] font-extrabold leading-none" style={{ color: RED }}>
            {p.dokumentasi}
          </span>
          <span className="text-[14px] text-[#857a75]">dokumen dikontribusikan ke knowledge base.</span>
        </div>
      </GlassCard>
    </div>
  );
}

function Head({ Icon, title, right }: { Icon: typeof CalendarCheck; title: string; right: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[12px] text-white" style={{ background: RED }}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-[16px] font-bold text-[#2a2320]">{title}</h3>
      </div>
      {right && <span className="text-[16px] font-extrabold text-[#c81e2c]">{right}</span>}
    </div>
  );
}

function Tubes({ m }: { m: M }) {
  const tag = (s: string) =>
    s === "done"
      ? { label: "Selesai", color: "#3aa66f" }
      : s === "doing"
      ? { label: "Berjalan", color: RED }
      : { label: "Belum", color: "#a79c96" };
  return (
    <GlassCard className="p-6">
      <h3 className="text-[15px] font-bold text-[#2a2320]">Daftar Tubes & Proyek</h3>
      <div className="mt-4 space-y-3">
        {m.projects.map((p) => {
          const t = tag(p.status);
          return (
            <div key={p.title} className="flex items-center justify-between rounded-[14px] border border-white/60 bg-white/50 p-4">
              <span className="text-[14px] font-semibold text-[#2a2320]">{p.title}</span>
              <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: `${t.color}1f`, color: t.color }}>
                {t.label}
              </span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function Kehadiran({ m }: { m: M }) {
  const levels = ["rgba(200,30,44,0.08)", "rgba(200,30,44,0.3)", "rgba(200,30,44,0.6)", "#c81e2c"];
  return (
    <GlassCard className="p-6">
      <h3 className="text-[15px] font-bold text-[#2a2320]">Kehadiran (12 Minggu Terakhir)</h3>
      <div className="mt-5 flex flex-wrap gap-2">
        {m.attendance.map((lvl, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className="h-9 w-9 rounded-[10px] border border-white/60"
              style={{ background: levels[lvl] }}
              title={`Minggu ${i + 1}`}
            />
            <span className="text-[10px] text-[#a79c96]">M{i + 1}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-2 text-[12px] text-[#857a75]">
        Jarang
        {levels.map((c, i) => (
          <span key={i} className="h-4 w-4 rounded-[6px] border border-white/60" style={{ background: c }} />
        ))}
        Rutin
      </div>
    </GlassCard>
  );
}
