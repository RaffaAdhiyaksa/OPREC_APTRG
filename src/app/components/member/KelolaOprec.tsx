import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  CalendarDays,
  ToggleLeft,
  ToggleRight,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard, RED, AMBER } from "../aptrg/shared";
import { Switch } from "../ui/switch";
import { supabase } from "../../../lib/supabaseClient";

/* ── Types ─────────────────────────────────────────────── */

type EventRow = {
  id: string;
  event_key: string;
  event_name: string;
  is_active: boolean;
};

/* ── Event key → label mapping ──────────────────────────── */

const EVENT_DISPLAY: Record<string, { label: string; desc: string; color: string }> = {
  open_mind: {
    label: "Open Mind APTRG",
    desc: "Sesi pengenalan laboratorium untuk calon pendaftar.",
    color: AMBER,
  },
  open_recruitment: {
    label: "Open Recruitment APTRG",
    desc: "Proses seleksi penerimaan anggota baru APTRG.",
    color: RED,
  },
};

/* ── Status badge ───────────────────────────────────────── */

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[12px] font-semibold tracking-wide"
      style={{
        background: active ? "rgba(58,166,111,0.12)" : "rgba(133,122,117,0.12)",
        color: active ? "#3aa66f" : "#857a75",
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: active ? "#3aa66f" : "#857a75" }}
      />
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}

/* ── Event Card ─────────────────────────────────────────── */

function EventCard({
  event,
  onToggle,
  toggling,
}: {
  event: EventRow;
  onToggle: (eventKey: string, newValue: boolean) => Promise<void>;
  toggling: boolean;
}) {
  const display = EVENT_DISPLAY[event.event_key];
  const accentColor = display?.color ?? RED;

  return (
    <GlassCard className="flex flex-col gap-5 p-6 transition-all duration-200 hover:shadow-[0_16px_48px_-12px_rgba(80,40,40,0.22)]">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Icon container */}
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})` }}
          >
            <CalendarDays className="h-5 w-5" />
          </div>

          {/* Name + description */}
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-[16px] font-extrabold tracking-tight text-[#2a2320]">
                {display?.label ?? event.event_name}
              </h3>
              <StatusBadge active={event.is_active} />
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-[#857a75]">
              {display?.desc ?? "—"}
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex shrink-0 flex-col items-end gap-2 pt-1">
          <Switch
            checked={event.is_active}
            disabled={toggling}
            onCheckedChange={(checked) => onToggle(event.event_key, checked)}
            className="data-[state=checked]:bg-[#3aa66f] data-[state=unchecked]:bg-[#d8cfc9] scale-110"
            aria-label={`Toggle ${display?.label ?? event.event_name}`}
          />
          {toggling && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#857a75]" />
          )}
        </div>
      </div>



      {/* CTA copy */}
      <p className="rounded-[10px] bg-white/50 px-4 py-2.5 text-[12px] leading-relaxed text-[#6b5e57]">
        {event.is_active ? (
          <>
            <ToggleRight className="mr-1 inline h-3.5 w-3.5 text-[#3aa66f]" />
            Sobat Angkasa dapat <strong>menonaktifkan</strong> event ini agar formulir tidak
            lagi menerima respons baru.
          </>
        ) : (
          <>
            <ToggleLeft className="mr-1 inline h-3.5 w-3.5 text-[#857a75]" />
            Sobat Angkasa dapat <strong>mengaktifkan</strong> event ini agar pendaftaran
            dibuka kembali untuk umum.
          </>
        )}
      </p>
    </GlassCard>
  );
}

/* ── Main Component ─────────────────────────────────────── */

export function KelolaOprec() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Tracks which event_key is currently being toggled */
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  /* ── Fetch ──────────────────────────────────────────────── */

  const fetchEvents = useCallback(async () => {
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
      const msg = err instanceof Error ? err.message : "Gagal memuat data event.";
      setError(msg);
      toast.error("Gagal memuat data", { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /* ── Toggle handler ─────────────────────────────────────── */

  const handleToggle = async (eventKey: string, newValue: boolean) => {
    setTogglingKey(eventKey);
    try {
      const { error: updateError } = await supabase
        .from("events")
        .update({ is_active: newValue })
        .eq("event_key", eventKey);

      if (updateError) throw updateError;

      // Update local state immediately (optimistic update)
      setEvents((prev) =>
        prev.map((ev) =>
          ev.event_key === eventKey
            ? { ...ev, is_active: newValue }
            : ev
        )
      );

      const label = EVENT_DISPLAY[eventKey]?.label ?? eventKey;
      toast.success(newValue ? "Event diaktifkan!" : "Event dinonaktifkan!", {
        description: `${label} berhasil ${newValue ? "dibuka" : "ditutup"}. Terima kasih, Sobat Angkasa!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui status event.";
      toast.error("Gagal memperbarui", { description: msg });
    } finally {
      setTogglingKey(null);
    }
  };

  /* ── Render states ──────────────────────────────────────── */

  if (loading) {
    return (
      <GlassCard className="flex flex-col items-center justify-center gap-4 p-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: RED }} />
        <p className="text-[14px] text-[#857a75]">
          Memuat data event, mohon tunggu sebentar…
        </p>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="flex flex-col items-center justify-center gap-4 p-16 text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-[16px] text-white"
          style={{ background: RED }}
        >
          <AlertCircle className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-[18px] font-extrabold text-[#2a2320]">
            Terjadi Kesalahan
          </h2>
          <p className="mt-1 text-[13px] text-[#857a75]">{error}</p>
        </div>
        <button
          onClick={fetchEvents}
          className="mt-2 flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: RED }}
        >
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </button>
      </GlassCard>
    );
  }

  if (events.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center gap-4 p-16 text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-[16px] text-white"
          style={{ background: AMBER }}
        >
          <ClipboardList className="h-7 w-7" />
        </div>
        <h2 className="text-[18px] font-extrabold text-[#2a2320]">
          Belum Ada Event
        </h2>
        <p className="max-w-sm text-[13px] text-[#857a75]">
          Sobat Angkasa belum memiliki data event di tabel{" "}
          <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-[12px]">
            events
          </code>
          . Silakan tambahkan data terlebih dahulu.
        </p>
        <button
          onClick={fetchEvents}
          className="mt-2 flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: AMBER }}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </GlassCard>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page intro */}
      <GlassCard className="px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[17px] font-extrabold tracking-tight text-[#2a2320]">
              Manajemen Event OPREC
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[#857a75]">
              Sobat Angkasa dapat mengaktifkan atau menonaktifkan event rekrutmen di bawah
              ini. Perubahan akan langsung berlaku secara real-time.
            </p>
          </div>
          <button
            onClick={fetchEvents}
            title="Refresh data"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/60 bg-white/60 text-[#857a75] transition-all hover:bg-white/80 hover:text-[#2a2320] active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </GlassCard>

      {/* Event cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onToggle={handleToggle}
            toggling={togglingKey === event.event_key}
          />
        ))}
      </div>

      {/* Summary row */}
      <GlassCard className="px-6 py-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-[13px] text-[#857a75]">
            <span className="font-semibold text-[#2a2320]">{events.length}</span> event
            terdaftar
          </div>
          <div className="text-[13px] text-[#857a75]">
            <span className="font-semibold text-[#3aa66f]">
              {events.filter((e) => e.is_active).length}
            </span>{" "}
            aktif
          </div>
          <div className="text-[13px] text-[#857a75]">
            <span className="font-semibold" style={{ color: RED }}>
              {events.filter((e) => !e.is_active).length}
            </span>{" "}
            nonaktif
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
