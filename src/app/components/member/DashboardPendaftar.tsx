import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  Users,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard, AMBER } from "../aptrg/shared";
import { supabase } from "../../../lib/supabaseClient";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

/* ── Types ─────────────────────────────────────────────── */

export type RegistrantStatus = "pending" | "verified" | "rejected";

export type Registrant = {
  id: string;
  user_id?: string;
  nama: string;
  nim: string;
  email: string;
  hp: string;
  divisi: string;
  seat_number: string;
  status: RegistrantStatus;
  created_at: string;
};

/* ── CSV Export Helper ──────────────────────────────────── */

function exportToCSV(data: Registrant[]) {
  try {
    const headers = ["Nama,Email,WhatsApp,Bangku,Status,Tanggal Daftar"];
    const rows = data.map((d) =>
      [
        `"${d.nama.replace(/"/g, '""')}"`,
        `"${d.email}"`,
        `"${d.hp}"`,
        `"${d.seat_number}"`,
        `"${d.status}"`,
        `"${new Date(d.created_at).toLocaleString("id-ID")}"`,
      ].join(",")
    );
    const csvContent = headers.concat(rows).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `data_pendaftar_openmind_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Berhasil mengekspor data ke CSV");
  } catch (error) {
    console.error("Export error:", error);
    toast.error("Gagal mengekspor data CSV");
  }
}

/* ── Component ──────────────────────────────────────────── */

export function DashboardPendaftar() {
  const [activeTab, setActiveTab] = useState<"openmind" | "oprec">("openmind");
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  /* ── Fetch Data ──────────────────────────────────────── */

  const fetchRegistrants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Ambil data dari applicants
      const { data: applicantsData, error: fetchError } = await supabase
        .from("applicants")
        .select("*");

      if (fetchError) throw fetchError;

      // 2. Ambil data bangku dari tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("tickets")
        .select("nim, seat_number, user_id");

      if (ticketsError) throw ticketsError;

      // 3. Lakukan mapping
      let availableTickets = [...(ticketsData || [])];
      const mappedData = (applicantsData || []).map((app: any) => {
        const tIndex = availableTickets.findIndex((t: any) => 
          (t.user_id && app.user_id && t.user_id === app.user_id) || 
          (t.nim && app.nim && t.nim === app.nim)
        );
        let seat_number = "-";
        if (tIndex !== -1) {
          seat_number = availableTickets[tIndex].seat_number;
          // Hapus agar tiket tidak terduplikasi ke baris aplikasi lain milik user yang sama
          availableTickets.splice(tIndex, 1);
        }
        
        return {
          ...app,
          seat_number,
        };
      });

      setRegistrants(mappedData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat data pendaftar.";
      setError(msg);
      toast.error("Gagal memuat data", { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrants();
  }, [fetchRegistrants]);

  /* ── Actions ─────────────────────────────────────────── */

  const handleVerify = async (r: Registrant) => {
    if (!confirm(`Verifikasi pendaftar atas nama ${r.nama} dan patenkan bangku ${r.seat_number}?`)) return;
    setProcessingId(r.id);
    try {
      // 1. Update status pendaftar
      const { error: regError } = await supabase
        .from("applicants")
        .update({ status: "verified" })
        .eq("id", r.id);
      if (regError) throw regError;

      // 2. Update status bangku di tabel seats menjadi terisi (is_booked: true)
      if (r.seat_number && r.seat_number !== "-") {
        const { error: seatError } = await supabase
          .from("seats")
          .update({ is_booked: true })
          .eq("seat_number", r.seat_number);
        if (seatError) throw seatError;
      }

      toast.success("Pendaftar berhasil diverifikasi", {
        description: `Bangku ${r.seat_number} sekarang resmi milik ${r.nama}.`,
      });
      fetchRegistrants();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error("Gagal verifikasi pendaftar", { description: msg });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, nama: string) => {
    if (!confirm(`Tolak pendaftar atas nama ${nama}?`)) return;
    setProcessingId(id);
    try {
      const { error: regError } = await supabase
        .from("applicants")
        .update({ status: "rejected" })
        .eq("id", id);
      if (regError) throw regError;

      // Bebaskan bangku jika ada
      const ticketData = registrants.find(r => r.id === id);
      if (ticketData && ticketData.seat_number && ticketData.seat_number !== "-") {
        await supabase
          .from("seats")
          .update({ is_booked: false })
          .eq("seat_number", ticketData.seat_number);
          
        await supabase
          .from("tickets")
          .delete()
          .eq("seat_number", ticketData.seat_number)
          .eq("user_id", ticketData.user_id);
      }

      toast.success("Pendaftar ditolak");
      fetchRegistrants();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error("Gagal menolak pendaftar", { description: msg });
    } finally {
      setProcessingId(null);
    }
  };

  /* ── Filter ──────────────────────────────────────────── */

  const filtered = registrants.filter((r) => {
    // 1. Filter by tab (divisi)
    const isOM = r.divisi?.toLowerCase().includes("open mind");
    const matchesTab = activeTab === "openmind" ? isOM : !isOM;
    if (!matchesTab) return false;

    // 2. Filter by search query
    return (
      r.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.seat_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  /* ── Render ──────────────────────────────────────────── */

  return (
    <div className="flex w-full flex-col gap-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight text-[#2a2320]">
              Data Pendaftar
            </h2>
            <p className="mt-1 mb-4 text-[13px] leading-relaxed text-[#857a75]">
              Verifikasi Sobat Angkasa yang mendaftar dan tetapkan bangkunya.
            </p>
            <TabsList>
              <TabsTrigger value="openmind">Pendaftar Open Mind</TabsTrigger>
              <TabsTrigger value="oprec">Pendaftar OPREC</TabsTrigger>
            </TabsList>
          </div>
          <button
            onClick={() => exportToCSV(registrants)}
            disabled={loading || registrants.length === 0}
            className="flex items-center justify-center gap-2 rounded-[12px] px-5 py-2.5 text-[13px] font-semibold text-white shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: AMBER }}
          >
            <Download className="h-4 w-4" />
            Export to CSV
          </button>
        </div>

        <GlassCard className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#857a75]" />
              <input
                type="text"
                placeholder="Cari nama, email, atau bangku..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[10px] border border-black/10 bg-white/50 py-2 pl-9 pr-4 text-[13px] outline-none transition focus:border-[#2a2320]/30 focus:bg-white"
              />
            </div>
            <button
              onClick={fetchRegistrants}
              disabled={loading}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-black/10 bg-white/50 text-[#5a504b] hover:bg-white disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Table Wrapper */}
          <div className="overflow-x-auto rounded-[12px] border border-black/5 bg-white/40">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-black/5 bg-white/60 text-[#857a75]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama & Info Kontak</th>
                  <th className="px-4 py-3 font-semibold">Bangku</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#857a75]">
                      <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" style={{ color: AMBER }} />
                      Memuat data...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#857a75]">
                      <AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-500" />
                      {error}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#857a75]">
                      <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
                      Belum ada pendaftar yang cocok.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="transition hover:bg-white/40">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#2a2320]">{r.nama}</p>
                        <p className="text-[12px] text-[#857a75]">{r.email}</p>
                        <p className="text-[12px] text-[#857a75]">{r.hp}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-[6px] bg-[#2a2320] px-2 text-[12px] font-bold text-white shadow-sm">
                          {r.seat_number || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "verified" && (
                          <span className="inline-flex items-center gap-1 text-[#3aa66f]">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Diterima
                          </span>
                        )}
                        {r.status === "rejected" && (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <XCircle className="h-3.5 w-3.5" /> Ditolak
                          </span>
                        )}
                        {r.status === "pending" && (
                          <span className="inline-flex items-center gap-1 text-[#857a75]">
                            <Loader2 className="h-3.5 w-3.5" /> Menunggu
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleVerify(r)}
                              disabled={processingId === r.id}
                              className="rounded-[6px] bg-[#3aa66f]/10 px-3 py-1.5 text-[12px] font-semibold text-[#3aa66f] transition hover:bg-[#3aa66f]/20 disabled:opacity-50"
                            >
                              Verifikasi
                            </button>
                            <button
                              onClick={() => handleReject(r.id, r.nama)}
                              disabled={processingId === r.id}
                              className="rounded-[6px] bg-red-500/10 px-3 py-1.5 text-[12px] font-semibold text-red-600 transition hover:bg-red-500/20 disabled:opacity-50"
                            >
                              Tolak
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </Tabs>
    </div>
  );
}
