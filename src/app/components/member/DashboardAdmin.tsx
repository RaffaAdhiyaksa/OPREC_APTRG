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
 Trash2,
} from "lucide-react";
import { GlassCard, RED, AMBER } from "../aptrg/shared";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabaseClient";

/**
 * Skema tabel Supabase yang digunakan komponen ini:
 *
 * ── Tabel: applicants ───────────────────────────────────────────────────────
 * id uuid PK
 * nama text
 * nim text UNIQUE
 * email text
 * divisi text ('mekanik' | 'sistem' | 'gcs' | 'non-technical')
 * status text ('pending' | 'lolos-admin' | 'wawancara' | 'diterima' | 'ditolak')
 * tanggal_daftar date
 * cv_path text — path di Supabase Storage bucket 'cv-files'
 *
 * ── Tabel: app_settings ─────────────────────────────────────────────────────
 * key text PK (nilai tetap: 'registration_open')
 * value bool status buka/tutup pendaftaran
 *
 * ── Storage bucket: cv-files ────────────────────────────────────────────────
 * Berisi file CV pendaftar. Path disimpan di kolom applicants.cv_path.
 * Signed URL berlaku 1 jam (3600 detik).
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
 const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string }>({
 isOpen: false,
 id: null,
 name: "",
 });

 const fetchApplicants = useCallback(async () => {
 setLoading(true);
 setError(null);

 /**
 * Query semua kolom yang dibutuhkan dari tabel applicants,
 * diurutkan dari tanggal terbaru.
 */
 const { data, error: sbError } = await supabase
 .from("applicants")
 .select("id, nama, nim, email, divisi, status, tanggal_daftar, cv_path")
 .order("tanggal_daftar", { ascending: false });

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
 }, [onApplicantsLoaded]);

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

 const confirmDelete = async (id: string, nama: string) => {
 try {
 const { error } = await supabase.from("applicants").delete().eq("id", id);
 if (error) throw error;

 const newApplicants = applicants.filter((a) => a.id !== id);
 setApplicants(newApplicants);
 onApplicantsLoaded(newApplicants);
 toast.success(`Data ${nama} berhasil dihapus.`);
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : "Error tidak diketahui";
 console.error("[confirmDelete]", msg);
 toast.error("Gagal menghapus data. Coba lagi.");
 } finally {
 setDeleteModal({ isOpen: false, id: null, name: "" });
 }
 };

 const handleDeleteClick = (id: string, nama: string) => {
 setDeleteModal({ isOpen: true, id, name: nama });
 };

 return (
 <>
 <GlassCard className="p-6">
 <div className="mb-5 flex items-center justify-between">
 <div>
 <h2 className="text-[16px] font-bold text-[#2a2320]">
 Data Pendaftar OPREC
 </h2>
 <p className="text-[13px] text-[#857a75]">
 Daftar lengkap calon anggota yang mendaftar.
 </p>
 </div>
 <button
 onClick={fetchApplicants}
 disabled={loading}
 className="flex items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-3.5 py-2 text-[13px] font-medium text-[#2a2320] transition hover:bg-white/80 :bg-zinc-700 disabled:opacity-50"
 title="Muat ulang data"
 >
 <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
 Refresh
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
 className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-[13px] font-medium text-[#2a2320] transition hover:bg-white/80 :bg-zinc-700"
 >
 <RefreshCw className="h-3.5 w-3.5" /> Coba Lagi
 </button>
 </div>
 )}

 {/* Empty state */}
 {!loading && !error && applicants.length === 0 && (
 <div className="flex flex-col items-center gap-2 py-10 text-center">
 <Users className="h-10 w-10 text-slate-300" />
 <p className="text-sm text-slate-500">
 Belum ada pendaftar di kategori ini.
 </p>
 </div>
 )}

 {/* Table */}
 {!loading && !error && applicants.length > 0 && (
 <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white ">
 <table className="w-full text-[13px]">
 <thead>
 <tr className="border-b border-slate-200 bg-slate-50 ">
 {["Nama", "NIM", "Email", "Divisi", "Status", "Tgl Daftar", "Berkas", ""].map(
 (h, idx) => (
 <th
 key={idx}
 className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 "
 >
 {h}
 </th>
 )
 )}
 </tr>
 </thead>
 <tbody>
 {applicants.map((a) => (
 <tr
 key={a.id}
 className="border-b border-slate-200 last:border-0 hover:bg-slate-50/50 :bg-zinc-800/50 transition-colors"
 >
 <td className="px-4 py-3 font-medium text-slate-900 ">
 {a.nama}
 </td>
 <td className="px-4 py-3 font-mono text-slate-500 ">
 {a.nim}
 </td>
 <td className="px-4 py-3 text-slate-500 ">{a.email}</td>
 <td className="px-4 py-3">
 <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-indigo-700">
 {a.divisi}
 </span>
 </td>
 <td className="px-4 py-3">
 <span
 className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm"
 style={{ background: STATUS_COLOR[a.status] }}
 >
 {STATUS_LABEL[a.status]}
 </span>
 </td>
 <td className="px-4 py-3 text-slate-500 ">
 {a.tanggal_daftar}
 </td>
 <td className="px-4 py-3">
 <button
 onClick={() => openSignedUrl(a)}
 disabled={loadingUrl[a.id]}
 className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 :bg-zinc-700 disabled:opacity-50"
 title={
 a.cv_path
 ? `Lihat CV ${a.nama}`
 : `CV ${a.nama} belum tersedia`
 }
 >
 {loadingUrl[a.id] ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 <FileText
 className="h-3.5 w-3.5"
 style={{ color: a.cv_path ? "#4f46e5" : "#94a3b8" }}
 />
 )}
 <ExternalLink className="h-3.5 w-3.5" />
 CV
 </button>
 </td>
 <td className="px-4 py-3 text-right">
 <button
 onClick={() => handleDeleteClick(a.id, a.nama)}
 className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
 title={`Hapus ${a.nama}`}
 >
 <Trash2 className="h-4.5 w-4.5" />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </GlassCard>

 {/* Modal Hapus */}
 {deleteModal.isOpen && (
 <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
 <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl ">
 <h3 className="text-lg font-bold text-slate-900 ">
 Konfirmasi Hapus
 </h3>
 <p className="mt-2 text-sm leading-relaxed text-slate-500 ">
 Apakah kamu yakin ingin menghapus data <strong className="text-slate-900 ">{deleteModal.name}</strong>? Aksi ini tidak dapat dibatalkan.
 </p>
 <div className="mt-6 flex items-center justify-end gap-3">
 <button
 onClick={() => setDeleteModal({ isOpen: false, id: null, name: "" })}
 className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 :bg-white/10"
 >
 Batal
 </button>
 <button
 onClick={() => deleteModal.id && confirmDelete(deleteModal.id, deleteModal.name)}
 className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-700"
 >
 Hapus
 </button>
 </div>
 </div>
 </div>
 )}
 </>
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
 { label: "Total Pendaftar OPREC", value: `${totalPendaftar}`, Icon: Users, color: RED },
 { label: "Total Anggota Aktif", value: `${activeMembers}`, Icon: UserCheck, color: AMBER },
 { label: "Rapat Bulan Ini", value: "0", Icon: CalendarDays, color: "#2f7dd1" },
 { label: "Tubes Berjalan", value: `${runningTubes}`, Icon: KanbanSquare, color: "#3aa66f" },
 ];

 const maxCount = pipeline[0]?.count || 1;

 return (
 <div className="space-y-6">

 {/* ── Stats cards ── */}
 <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
 {stats.map((s) => (
 <GlassCard key={s.label} className="p-6">
 <div className="flex items-center justify-between gap-4">
 <div className="min-w-0 flex-1">
 <div className="truncate text-sm font-semibold text-slate-500">{s.label}</div>
 <div className="mt-1.5 truncate text-3xl font-bold tracking-tight text-slate-900">
 {s.value}
 </div>
 </div>
 <div
 className="flex h-12 w-12 flex-none items-center justify-center rounded-xl text-white shadow-sm"
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
 <h2 className="text-base font-bold text-slate-900">Pipeline OPREC</h2>
 <p className="text-sm text-slate-500">Konversi pendaftar per tahap seleksi.</p>
 <div className="mt-6 space-y-4">
 {pipeline.map((p, i) => {
 const pct = (p.count / maxCount) * 100;
 return (
 <div key={p.stage}>
 <div className="mb-1.5 flex items-center justify-between text-sm">
 <span className="font-semibold text-slate-700">
 {i + 1}. {p.stage}
 </span>
 <span className="font-bold text-indigo-600">{p.count}</span>
 </div>
 <div className="h-6 overflow-hidden rounded-full bg-slate-100">
 <div
 className="flex h-full items-center justify-end rounded-full pr-3 text-xs font-bold text-white transition-all duration-700 bg-indigo-600"
 style={{
 width: `${Math.max(pct, 4)}%`,
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
