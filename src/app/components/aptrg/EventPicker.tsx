import { useState, useEffect } from "react";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CalendarX,
  Plane,
  Brain,
} from "lucide-react";
import { GlassCard, GlassBackground, RED, AMBER } from "./shared";
import type { Screen } from "./shared";
import { Navbar } from "./Navbar";
import { supabase } from "../../../lib/supabaseClient";

/* ── Types ─────────────────────────────────────────────── */

type EventRow = {
  id: string;
  event_key: string;
  event_name: string;
  is_active: boolean;
};

/* ── Static display metadata per event_key ───────────────── */

type EventMeta = {
  label: string;
  tagline: string;
  desc: string;
  icon: React.ElementType;
  accentColor: string;
  screen: Screen;
};

const EVENT_META: Record<string, EventMeta> = {
  open_mind: {
    label: "Open Mind APTRG",
    tagline: "Pengenalan Laboratorium",
    desc: "Sesi pengenalan eksklusif bagi calon pendaftar. Kenali lab, divisi, dan program riset UAV APTRG sebelum mendaftar secara resmi.",
    icon: Brain,
    accentColor: AMBER,
    screen: "form-open-mind",
  },
  open_recruitment: {
    label: "Open Recruitment APTRG",
    tagline: "Seleksi Anggota Baru",
    desc: "Proses seleksi resmi penerimaan anggota magang APTRG. Bergabung dan mulai perjalananmu bersama tim riset terbaik kampus.",
    icon: Plane,
    accentColor: RED,
    screen: "register",
  },
};

/* ── Event Card ─────────────────────────────────────────── */

function EventCard({
  event,
  onSelect,
}: {
  event: EventRow;
  onSelect: (screen: Screen) => void;
}) {
  const meta = EVENT_META[event.event_key];
  const Icon = meta?.icon ?? CalendarCheck;
  const accent = meta?.accentColor ?? RED;
  const active = event.is_active;

  return (
    <GlassCard
      className={`flex flex-col gap-0 overflow-hidden transition-all duration-300 ${active
        ? "hover:shadow-[0_20px_56px_-14px_rgba(80,40,40,0.28)] hover:-translate-y-1"
        : "opacity-70"
        }`}
    >
      {/* Accent bar */}
      <div
        className="h-1.5 w-full"
        style={{
          background: active
            ? `linear-gradient(90deg, ${accent}, ${accent}99)`
            : "rgba(133,122,117,0.25)",
        }}
      />

      <div className="flex flex-col gap-5 p-7">
        {/* Icon + name */}
        <div className="flex items-start gap-4">
          <div
            className="flex h-13 w-13 shrink-0 items-center justify-center rounded-[14px] text-white shadow-md"
            style={{
              background: active
                ? `linear-gradient(135deg, ${accent}cc, ${accent})`
                : "rgba(133,122,117,0.3)",
              width: 52,
              height: 52,
            }}
          >
            <Icon className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <div
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: active ? accent : "#a89e97" }}
            >
              {meta?.tagline ?? "Event"}
            </div>
            <h3 className="mt-0.5 text-[17px] font-extrabold leading-snug tracking-tight text-[#2a2320]">
              {meta?.label ?? event.event_name}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-[14px] leading-relaxed text-[#5a504b]">
          {meta?.desc ?? "—"}
        </p>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          {active ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3aa66f]/10 px-3 py-1 text-[12px] font-semibold text-[#3aa66f]">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#3aa66f]" />
              Pendaftaran Dibuka
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#857a75]/10 px-3 py-1 text-[12px] font-semibold text-[#857a75]">
              <CalendarX className="h-3 w-3" />
              Pendaftaran Belum Dibuka
            </span>
          )}
        </div>

        {/* CTA Button */}
        <button
          disabled={!active}
          onClick={() => meta && onSelect(meta.screen)}
          className={`mt-1 flex w-full items-center justify-center gap-2 rounded-[12px] py-3 text-[14px] font-semibold text-white transition-all duration-200 ${active
            ? "shadow-md hover:opacity-90 active:scale-[0.98]"
            : "cursor-not-allowed"
            }`}
          style={{
            background: active
              ? `linear-gradient(135deg, ${accent}dd, ${accent})`
              : "rgba(133,122,117,0.25)",
            color: active ? "white" : "#a89e97",
          }}
        >
          {active ? (
            <>
              Daftar Sekarang <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            "Pendaftaran Belum Dibuka"
          )}
        </button>
      </div>
    </GlassCard>
  );
}

/* ── Main Component ─────────────────────────────────────── */

export function EventPicker({
  onNavigate,
}: {
  onNavigate: (s: Screen) => void;
}) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("events")
        .select("id, event_key, event_name, is_active")
        .order("event_key");

      if (fetchError) throw fetchError;
      setEvents((data as EventRow[]) ?? []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal memuat daftar event.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#f6f2f0]">
      <GlassBackground />
      <Navbar onNavigate={onNavigate} onSection={() => { }} />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-24 pt-32">
        {/* Back link */}
        <button
          onClick={() => onNavigate("landing")}
          className="mb-8 flex items-center gap-1.5 text-[13px] font-medium text-[#857a75] transition hover:text-[#2a2320]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke beranda
        </button>

        {/* Heading */}
        <div className="mb-10 text-center">
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-4 py-1.5 text-[13px] font-medium backdrop-blur-xl"
            style={{ color: RED }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: RED }}
            />
            Pilih Program Pendaftaran
          </div>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-[#2a2320]">
            Mau daftar program apa,{" "}
            <span style={{ color: RED }}>Sobat Angkasa?!</span>
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5a504b]">
            Pilih salah satu program di bawah ini. Tombol yang aktif berarti
            pendaftaran sedang dibuka.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <GlassCard className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2
              className="h-9 w-9 animate-spin"
              style={{ color: RED }}
            />
            <p className="text-[14px] text-[#857a75]">
              Memeriksa status pendaftaran…
            </p>
          </GlassCard>
        ) : error ? (
          <GlassCard className="flex flex-col items-center justify-center gap-5 py-20 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-[16px] text-white"
              style={{ background: RED }}
            >
              <AlertCircle className="h-7 w-7" />
            </div>
            <div>
              <p className="font-semibold text-[#2a2320]">Gagal memuat data</p>
              <p className="mt-1 text-[13px] text-[#857a75]">{error}</p>
            </div>
            <button
              onClick={fetchEvents}
              className="flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90 active:scale-95"
              style={{ background: RED }}
            >
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </button>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {events.map((ev) => (
              <EventCard key={ev.id} event={ev} onSelect={onNavigate} />
            ))}
          </div>
        )}

        {/* Info note */}
        {!loading && !error && (
          <p className="mt-8 text-center text-[12px] text-[#a89e97]">
            Butuh bantuan? Hubungi panitia OPREC APTRG melalui media sosial
            resmi kami.
          </p>
        )}
      </div>
    </div>
  );
}
