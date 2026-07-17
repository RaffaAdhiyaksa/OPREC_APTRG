import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Armchair,
  CheckCircle2,
  Info,
} from "lucide-react";
import { GlassCard, GlassBackground, RED, AMBER } from "./shared";
import type { Screen } from "./shared";
import { Navbar } from "./Navbar";
import { useAuthContext } from "../../context/AuthContext";
import { supabase } from "../../../lib/supabaseClient";
import { toast } from "sonner";

/**
 * Supabase resources yang digunakan komponen ini:
 *
 * ── Tabel: seats ────────────────────────────────────────────────────────
 *   seat_number  text     NOT NULL PK — contoh: "A1", "B3"
 *   is_booked    boolean  NOT NULL    DEFAULT false
 */

/* ── Types ───────────────────────────────────────────────── */

type Seat = {
  seat_number: string;
  is_booked: boolean;
};

export type RegistrantData = {
  nama: string;
  email: string;
  whatsapp: string;
  followPath: string;
  sharePath: string;
};

/* ── Helpers ─────────────────────────────────────────────── */

/**
 * Derive the row letter from the first character of seat_number.
 * e.g. "A1" → "A", "B12" → "B"
 */
function getRow(seatNumber: string): string {
  return seatNumber.charAt(0).toUpperCase();
}

/* ── Legend item ─────────────────────────────────────────── */

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-5 w-5 shrink-0 rounded-[5px] border border-black/10"
        style={{ background: color }}
      />
      <span className="text-[12px] text-[#5a504b]">{label}</span>
    </div>
  );
}

/* ── Seat Button ─────────────────────────────────────────── */

function SeatBtn({
  seat,
  selected,
  onSelect,
}: {
  seat: Seat;
  selected: boolean;
  onSelect: () => void;
}) {
  const booked = seat.is_booked;

  const bg = booked
    ? "rgba(200,30,44,0.15)"
    : selected
    ? AMBER
    : "rgba(255,255,255,0.75)";

  const borderColor = booked
    ? "rgba(200,30,44,0.35)"
    : selected
    ? AMBER
    : "rgba(133,122,117,0.25)";

  const textColor = booked ? "#c81e2c" : selected ? "white" : "#2a2320";

  return (
    <button
      type="button"
      disabled={booked}
      onClick={onSelect}
      title={
        booked
          ? `${seat.seat_number} — Sudah terisi`
          : selected
          ? `${seat.seat_number} — Dipilih`
          : `Pilih bangku ${seat.seat_number}`
      }
      className={`relative flex h-6 w-6 items-center justify-center rounded-[6px] border text-[9px] font-bold transition-all duration-150
        ${booked ? "cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95"}
        ${selected ? "shadow-md ring-2 ring-offset-1" : ""}
      `}
      style={{
        background: bg,
        borderColor,
        color: textColor,
      }}
    >
      {seat.seat_number}
      {selected && (
        <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-white shadow">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: AMBER }}
          />
        </span>
      )}
    </button>
  );
}

/* ── Main Component ──────────────────────────────────────── */

export function PilihBangku({
  registrant,
  onNavigate,
  onConfirm,
}: {
  registrant: RegistrantData;
  onNavigate: (s: Screen) => void;
  /** Dipanggil saat Konfirmasi Bangku — nanti akan generate tiket */
  onConfirm: (seatNum: string) => void;
}) {
  const { user } = useAuthContext();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** seat_number string yang sedang dipilih, atau null */
  const [selectedSeatNum, setSelectedSeatNum] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  /* ── Fetch seats ─────────────────────────────────────── */

  const fetchSeats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("seats")
        .select("seat_number, is_booked")
        .order("seat_number");

      if (fetchError) throw fetchError;
      setSeats((data as Seat[]) ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat data bangku.";
      setError(msg);
      toast.error("Gagal memuat bangku", { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  /* ── Derived data ────────────────────────────────────── */

  /** Extract numeric part from seat_number, e.g. "A12" → 12 */
  function getSeatNum(seatNumber: string): number {
    return parseInt(seatNumber.slice(1), 10) || 0;
  }

  /**
   * Build sorted cinema structure:
   * rowsData = [ { row: "A", left: Seat[1-10], right: Seat[11-20] }, … ]
   * sorted A → O (front → back)
   */
  const rowsData = Object.entries(
    seats.reduce<Record<string, Seat[]>>((acc, s) => {
      const row = getRow(s.seat_number);
      if (!acc[row]) acc[row] = [];
      acc[row].push(s);
      return acc;
    }, {})
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([row, rowSeats]) => {
      const sorted = [...rowSeats].sort(
        (a, b) => getSeatNum(a.seat_number) - getSeatNum(b.seat_number)
      );
      const midPoint = Math.ceil(sorted.length / 2);
      return {
        row,
        left: sorted.slice(0, midPoint),
        right: sorted.slice(midPoint),
      };
    });

  const selectedSeat = seats.find((s) => s.seat_number === selectedSeatNum) ?? null;
  const available = seats.filter((s) => !s.is_booked).length;
  const total = seats.length;

  /* ── Confirm handler ─────────────────────────────────── */

  const handleConfirm = async () => {
    if (!selectedSeatNum || !selectedSeat) return;
    setConfirming(true);
    try {
      // Insert pendaftar ke tabel applicants
      const payload = {
        user_id: user?.id,
        nama: registrant.nama,
        email: registrant.email,
        hp: registrant.whatsapp,
        divisi: "Open Mind",
        status: "pending",
      };
      
      console.log("[PilihBangku] Attempting insert with payload:", payload);

      const { error: insertError } = await supabase.from("applicants").insert(payload);

      if (insertError) throw insertError;

      // Insert bangku ke tabel tickets
      const { error: ticketError } = await supabase.from("tickets").insert({
        user_id: user?.id,
        seat_number: selectedSeatNum,
        event_key: "open-mind-2026",
      });

      if (ticketError) {
        console.error("[PilihBangku] ERROR saat insert ke tickets:", ticketError);
        throw ticketError;
      }

      console.log("[PilihBangku] Confirmed seat:", {
        seatNumber: selectedSeatNum,
        registrant,
      });

      toast.success(`Bangku ${selectedSeatNum} dikonfirmasi!`, {
        description: "Terima kasih, Sobat Angkasa! Tiket kamu sedang diproses.",
      });
      onConfirm(selectedSeatNum);
    } catch (err: unknown) {
      console.error("[PilihBangku] ERROR saat insert ke applicants:", err);
      const msg = err instanceof Error ? err.message : typeof err === "object" && err !== null && "message" in err ? String((err as any).message) : "Terjadi kesalahan saat menyimpan pendaftaran.";
      toast.error("Gagal konfirmasi bangku", { description: msg });
    } finally {
      setConfirming(false);
    }
  };

  /* ── Render ──────────────────────────────────────────── */

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#f6f2f0]">
      <GlassBackground />
      <Navbar onNavigate={onNavigate} onSection={() => {}} />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-24 pt-32">
        {/* Back */}
        <button
          onClick={() => onNavigate("form-open-mind")}
          className="mb-8 flex items-center gap-1.5 text-[13px] font-medium text-[#857a75] transition hover:text-[#2a2320]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke form pendaftaran
        </button>

        {/* Heading */}
        <div className="mb-8 text-center">
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-4 py-1.5 text-[13px] font-medium backdrop-blur-xl"
            style={{ color: AMBER }}
          >
            <Armchair className="h-3.5 w-3.5" />
            Pemilihan Bangku
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-[#2a2320]">
            Pilih Bangkumu,{" "}
            <span style={{ color: AMBER }}>{registrant.nama.split(" ")[0]}!</span>
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[#5a504b]">
            Sobat Angkasa tinggal memilih satu bangku yang tersedia (warna kuning).
            Bangku merah sudah terisi dan tidak dapat dipilih.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <GlassCard className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-9 w-9 animate-spin" style={{ color: AMBER }} />
            <p className="text-[14px] text-[#857a75]">Memuat denah bangku…</p>
          </GlassCard>
        )}

        {/* Error */}
        {!loading && error && (
          <GlassCard className="flex flex-col items-center justify-center gap-5 py-20 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-[16px] text-white"
              style={{ background: RED }}
            >
              <AlertCircle className="h-7 w-7" />
            </div>
            <div>
              <p className="font-semibold text-[#2a2320]">Gagal memuat bangku</p>
              <p className="mt-1 text-[13px] text-[#857a75]">{error}</p>
            </div>
            <button
              onClick={fetchSeats}
              className="flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90 active:scale-95"
              style={{ background: AMBER }}
            >
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </button>
          </GlassCard>
        )}

        {/* Seat grid */}
        {!loading && !error && (
          <div className="flex flex-col gap-5">
            <GlassCard className="p-6">
              {/* Stats + legend */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-5">
                  <div>
                    <span className="text-[22px] font-extrabold text-[#2a2320]">{available}</span>
                    <span className="ml-1 text-[12px] text-[#857a75]">tersedia</span>
                  </div>
                  <div>
                    <span className="text-[22px] font-extrabold" style={{ color: RED }}>
                      {total - available}
                    </span>
                    <span className="ml-1 text-[12px] text-[#857a75]">terisi</span>
                  </div>
                  <div>
                    <span className="text-[22px] font-extrabold text-[#2a2320]">{total}</span>
                    <span className="ml-1 text-[12px] text-[#857a75]">total</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <LegendItem color="rgba(255,255,255,0.85)" label="Tersedia" />
                  <LegendItem color={AMBER} label="Dipilih" />
                  <LegendItem color="rgba(200,30,44,0.15)" label="Terisi" />
                </div>
              </div>

              {/* Screen / stage indicator */}
              <div className="mb-8 flex flex-col items-center gap-1.5">
                <div
                  className="h-2 w-48 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${AMBER}44, ${AMBER}, ${AMBER}44)`,
                  }}
                />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a89e97]">
                  Panggung / Layar
                </span>
              </div>

              {/* Cinema-style seat grid */}
              {rowsData.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Info className="h-8 w-8 text-[#b0a49e]" />
                  <p className="text-[14px] text-[#857a75]">
                    Belum ada data bangku. Silakan hubungi panitia.
                  </p>
                </div>
              ) : (
                /* Scroll container — prevents layout breakage on narrow screens */
                <div className="overflow-x-auto pb-2">
                  <div className="flex min-w-max flex-col gap-2">
                    {rowsData.map(({ row, left, right }) => (
                      <div key={row} className="flex items-center justify-center gap-2">
                        {/* Row label — fixed width */}
                        <span className="w-6 shrink-0 text-center text-[11px] font-bold text-[#a89e97]">
                          {row}
                        </span>

                        {/* Left block */}
                        <div className="flex gap-1">
                          {left.map((seat) => (
                            <SeatBtn
                              key={seat.seat_number}
                              seat={seat}
                              selected={selectedSeatNum === seat.seat_number}
                              onSelect={() =>
                                setSelectedSeatNum(
                                  selectedSeatNum === seat.seat_number
                                    ? null
                                    : seat.seat_number
                                )
                              }
                            />
                          ))}
                        </div>

                        {/* Aisle */}
                        <div className="w-6 shrink-0" aria-hidden="true" />

                        {/* Right block */}
                        <div className="flex gap-1">
                          {right.map((seat) => (
                            <SeatBtn
                              key={seat.seat_number}
                              seat={seat}
                              selected={selectedSeatNum === seat.seat_number}
                              onSelect={() =>
                                setSelectedSeatNum(
                                  selectedSeatNum === seat.seat_number
                                    ? null
                                    : seat.seat_number
                                )
                              }
                            />
                          ))}
                        </div>

                        {/* Mirror row label on the right */}
                        <span className="w-6 shrink-0 text-center text-[11px] font-bold text-[#a89e97]">
                          {row}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Selected seat info + confirm */}
            <GlassCard className="flex flex-col gap-4 p-6">
              {selectedSeat ? (
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] text-[16px] font-extrabold text-white shadow"
                    style={{ background: AMBER }}
                  >
                    {selectedSeat.seat_number}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-[#2a2320]">
                      Bangku {selectedSeat.seat_number} dipilih
                    </p>
                    <p className="text-[12px] text-[#857a75]">
                      Baris {getRow(selectedSeat.seat_number)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-[13px] text-[#857a75]">
                  <Info className="h-4 w-4 shrink-0" style={{ color: AMBER }} />
                  Sobat Angkasa belum memilih bangku. Klik salah satu bangku
                  kuning di atas.
                </div>
              )}

              <button
                disabled={!selectedSeatNum || confirming}
                onClick={handleConfirm}
                className={`flex w-full items-center justify-center gap-2.5 rounded-[13px] py-3.5 text-[15px] font-bold shadow-lg transition-all duration-200 ${
                  selectedSeatNum && !confirming
                    ? "hover:opacity-90 active:scale-[0.98]"
                    : "cursor-not-allowed opacity-50"
                }`}
                style={{
                  background:
                    selectedSeatNum && !confirming
                      ? `linear-gradient(135deg, ${AMBER}cc, ${AMBER})`
                      : "rgba(133,122,117,0.3)",
                  color: selectedSeatNum && !confirming ? "white" : "#a89e97",
                }}
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengkonfirmasi…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Konfirmasi Bangku{selectedSeat ? ` ${selectedSeat.seat_number}` : ""}
                  </>
                )}
              </button>

              {selectedSeatNum && (
                <p className="text-center text-[11px] text-[#a89e97]">
                  Setelah dikonfirmasi, bangku tidak dapat diubah. Pastikan
                  pilihan Sobat Angkasa sudah benar ya!
                </p>
              )}
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
