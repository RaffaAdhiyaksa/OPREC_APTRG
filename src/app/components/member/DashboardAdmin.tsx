import { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserCheck,
  CalendarDays,
  KanbanSquare,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
} from "lucide-react";
import { GlassCard, RED, AMBER } from "../aptrg/shared";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabaseClient";

/**
 * Skema tabel Supabase yang digunakan komponen ini:
 *
 * ── Tabel: applicants ───────────────────────────────────────────────────────
 *   id             uuid  PK
 *   nama           text
 *   nim            text  UNIQUE
 *   email          text
 *   divisi         text  ('mekanik' | 'sistem' | 'gcs' | 'non-technical')
 *   status         text  ('pending' | 'lolos-admin' | 'wawancara' | 'diterima' | 'ditolak')
 *   tanggal_daftar date
 *   cv_path        text  — path di Supabase Storage bucket 'cv-files'
 *
 * ── Tabel: app_settings ─────────────────────────────────────────────────────
 *   key            text  PK   (nilai tetap: 'registration_open')
 *   value          bool       status buka/tutup pendaftaran
 *
 * ── Storage bucket: cv-files ────────────────────────────────────────────────
 *   Berisi file CV pendaftar. Path disimpan di kolom applicants.cv_path.
 *   Signed URL berlaku 1 jam (3600 detik).
 */

/* ── Types ─────────────────────────────────────────────── */

type Applicant = {
  id: string;
  nama: string;
  nim: string;
  email: string;
  divisi: string;
  status: "pending" | "lolos-admin" | "wawancara" | "diterima" | "ditolak";
  tanggal_daftar: string;
  cv_path: string | null;
};

/* ── Helpers ────────────────────────────────────────────── */

const STATUS_LABEL: Record<Applicant["status"], string> = {
  pending: "Menunggu",
  "lolos-admin": "Lolos Admin",
  wawancara: "Wawancara",
  diterima: "Diterima",
  ditolak: "Ditolak",
};

const STATUS_COLOR: Record<Applicant["status"], string> = {
  pending: "#857a75",
  "lolos-admin": "#2f7dd1",
  wawancara: "#e3a548",
  diterima: "#3aa66f",
  ditolak: "#c81e2c",
};

/** Hitung pipeline OPREC dari array pendaftar secara lokal */
function buildPipeline(applicants: Applicant[]) {
  const total = applicants.length;
  const lolosAdmin = applicants.filter((a) =>
    ["lolos-admin", "wawancara", "diterima"].includes(a.status)
  ).length;
  const wawancara = applicants.filter((a) =>
    ["wawancara", "diterima"].includes(a.status)
  ).length;
  const diterima = applicants.filter((a) => a.status === "diterima").length;

  return [
    { stage: "Pendaftaran", count: total },
    { stage: "Seleksi Administrasi", count: lolosAdmin },
    { stage: "Wawancara", count: wawancara },
    { stage: "Pengumuman / Diterima", count: diterima },
  ];
}



/* ── ApplicantsTable ────────────────────────────────────── */

function ApplicantsTable({
  onApplicantsLoaded,
}: {
  onApplicantsLoaded: (data: Applicant[]) => void;
}) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"oprec" | "openmind">("oprec");

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    setError(null);

    /**
     * Query data pendaftar difilter berdasarkan activeTab
     */
    let query = supabase
      .from("applicants")
      .select("id, nama, nim, email, divisi, status, tanggal_daftar, cv_path")
      .order("tanggal_daftar", { ascending: false });

    if (activeTab === "oprec") {
      query = query.not("divisi", "in", '("Open Mind","open mind","open-mind")');
    } else {
      query = query.in("divisi", ["Open Mind", "open mind", "open-mind"]);
    }

    const { data, error: sbError } = await query;

    if (sbError) {
      const isNetwork =
        sbError.message.toLowerCase().includes("failed to fetch") ||
        sbError.message.toLowerCase().includes("network");
      setError(
        isNetwork
          ? "Tidak dapat terhubung ke Supabase. Periksa koneksi internet dan konfigurasi .env.local."
          : `Gagal memuat data pendaftar: ${sbError.message}`
      );
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as Applicant[];
    setApplicants(rows);
    onApplicantsLoaded(rows); // kirim data ke parent untuk komputasi pipeline
    setLoading(false);
  }, [onApplicantsLoaded, activeTab]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  const openSignedUrl = async (applicant: Applicant) => {
    if (!applicant.cv_path) {
      toast.error(`CV ${applicant.nama} belum diunggah.`);
      return;
    }

    setLoadingUrl((prev) => ({ ...prev, [applicant.id]: true }));
    try {
      /**
       * Generate Signed URL dari Supabase Storage bucket 'cv-files'.
       * URL berlaku selama 3600 detik (1 jam).
       */
      const { data, error: storageError } = await supabase.storage
        .from("cv-files")
        .createSignedUrl(applicant.cv_path, 3600);

      if (storageError || !data?.signedUrl) {
        throw new Error(storageError?.message ?? "URL tidak tersedia.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error tidak diketahui";
      console.error("[openSignedUrl]", msg);
      toast.error(`Gagal membuka CV ${applicant.nama}. Coba lagi.`);
    } finally {
      setLoadingUrl((prev) => ({ ...prev, [applicant.id]: false }));
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-[#2a2320]">
            Data Pendaftar {activeTab === "oprec" ? "OPREC" : "Open Mind"}
          </h2>
          <p className="text-[13px] text-[#857a75]">
            Daftar lengkap calon anggota yang mendaftar.
          </p>
        </div>
        <button
          onClick={fetchApplicants}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-3.5 py-2 text-[13px] font-medium text-[#2a2320] transition hover:bg-white/80 disabled:opacity-50"
          title="Muat ulang data"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mb-5 flex gap-3">
        <button
          onClick={() => setActiveTab("oprec")}
          className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
            activeTab === "oprec"
              ? "bg-[#c81e2c] text-white shadow"
              : "bg-white/50 text-[#857a75] hover:bg-white/80"
          }`}
        >
          Pendaftar OPREC
        </button>
        <button
          onClick={() => setActiveTab("openmind")}
          className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
            activeTab === "openmind"
              ? "bg-[#c81e2c] text-white shadow"
              : "bg-white/50 text-[#857a75] hover:bg-white/80"
          }`}
        >
          Pendaftar Open Mind
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-[10px] bg-[rgba(133,122,117,0.12)]"
              style={{ opacity: 1 - i * 0.15 }}
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-red-50 text-red-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <p className="text-[14px] text-[#5a504b]">{error}</p>
          <button
            onClick={fetchApplicants}
            className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-[13px] font-medium text-[#2a2320] transition hover:bg-white/80"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Coba Lagi
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && applicants.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Users className="h-10 w-10 text-[#857a75] opacity-40" />
          <p className="text-[14px] text-[#857a75]">
            Belum ada pendaftar yang masuk.
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && applicants.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/60">
                {["Nama", "NIM", "Email", "Divisi", "Status", "Tgl Daftar", "Berkas"].map(
                  (h) => (
                    <th
                      key={h}
                      className="pb-3 pr-4 text-left text-[12px] font-semibold uppercase tracking-wide text-[#857a75] last:pr-0"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {applicants.map((a, i) => (
                <tr
                  key={a.id}
                  className="border-b border-white/40 last:border-0"
                  style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.25)" }}
                >
                  <td className="py-3 pr-4 font-medium text-[#2a2320]">
                    {a.nama}
                  </td>
                  <td className="py-3 pr-4 font-mono text-[#5a504b]">
                    {a.nim}
                  </td>
                  <td className="py-3 pr-4 text-[#5a504b]">{a.email}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-[rgba(200,30,44,0.1)] px-2.5 py-0.5 text-[11px] font-semibold capitalize text-[#c81e2c]">
                      {a.divisi}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                      style={{ background: STATUS_COLOR[a.status] }}
                    >
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[#857a75]">
                    {a.tanggal_daftar}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => openSignedUrl(a)}
                      disabled={loadingUrl[a.id]}
                      className="inline-flex items-center gap-1 rounded-[8px] border border-white/70 bg-white/60 px-2.5 py-1.5 text-[12px] font-medium text-[#2a2320] transition hover:bg-white/90 disabled:opacity-50"
                      title={
                        a.cv_path
                          ? `Lihat CV ${a.nama}`
                          : `CV ${a.nama} belum tersedia`
                      }
                    >
                      {loadingUrl[a.id] ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <FileText
                          className="h-3 w-3"
                          style={{ color: a.cv_path ? "#c81e2c" : "#857a75" }}
                        />
                      )}
                      <ExternalLink className="h-3 w-3" />
                      CV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}

/* ── DashboardAdmin (main) ─────────────────────────────── */

export function DashboardAdmin() {
  const [pipeline, setPipeline] = useState<{ stage: string; count: number }[]>([]);
  const activeMembers = 0;
  const runningTubes = 0;

  /**
   * Callback diterima dari ApplicantsTable setelah data berhasil di-fetch.
   * Pipeline dihitung langsung dari data pendaftar tanpa endpoint tambahan.
   */
  const handleApplicantsLoaded = useCallback((data: Applicant[]) => {
    setPipeline(buildPipeline(data));
  }, []);

  const totalPendaftar = pipeline[0]?.count ?? 0;
  const stats = [
    { label: "Total Pendaftar", value: `${totalPendaftar}`, Icon: Users, color: RED },
    { label: "Total Anggota Aktif", value: `${activeMembers}`, Icon: UserCheck, color: AMBER },
    { label: "Rapat Bulan Ini", value: "0", Icon: CalendarDays, color: "#2f7dd1" },
    { label: "Tubes Berjalan", value: `${runningTubes}`, Icon: KanbanSquare, color: "#3aa66f" },
  ];

  const maxCount = pipeline[0]?.count || 1;

  return (
    <div className="space-y-6">

      {/* ── Stats cards ── */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <GlassCard key={s.label} className="p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] text-[#857a75]">{s.label}</div>
                <div className="mt-1 truncate text-[24px] md:text-[28px] font-extrabold tracking-tight text-[#2a2320]">
                  {s.value}
                </div>
              </div>
              <div
                className="flex h-12 w-12 flex-none items-center justify-center rounded-[14px] text-white shadow"
                style={{ background: s.color }}
              >
                <s.Icon className="h-6 w-6" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ── Pipeline funnel (computed dari data applicants) ── */}
      {pipeline.length > 0 && (
        <GlassCard className="p-6">
          <h2 className="text-[16px] font-bold text-[#2a2320]">Pipeline OPREC</h2>
          <p className="text-[13px] text-[#857a75]">Konversi pendaftar per tahap seleksi.</p>
          <div className="mt-5 space-y-3">
            {pipeline.map((p, i) => {
              const pct = (p.count / maxCount) * 100;
              return (
                <div key={p.stage}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-[#2a2320]">
                      {i + 1}. {p.stage}
                    </span>
                    <span className="font-semibold text-[#c81e2c]">{p.count}</span>
                  </div>
                  <div className="h-7 overflow-hidden rounded-[10px] bg-[rgba(200,30,44,0.08)]">
                    <div
                      className="flex h-full items-center justify-end rounded-[10px] pr-2 text-[11px] font-semibold text-white transition-all duration-700"
                      style={{
                        width: `${Math.max(pct, 4)}%`,
                        background: `linear-gradient(90deg, ${RED}, ${AMBER})`,
                      }}
                    >
                      {Math.round(pct)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* ── Tabel data pendaftar ── */}
      <ApplicantsTable onApplicantsLoaded={handleApplicantsLoaded} />
    </div>
  );
}
