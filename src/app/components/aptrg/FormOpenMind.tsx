import { useState, useRef } from "react";
import {
  ArrowLeft,
  UploadCloud,
  FileImage,
  X,
  AlertCircle,
  Loader2,
  SendHorizonal,
  ExternalLink,
  Instagram,
  MessageCircle,
} from "lucide-react";
import { GlassCard, GlassBackground, AMBER } from "./shared";
import type { Screen } from "./shared";
import { Navbar } from "./Navbar";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { supabase } from "../../../lib/supabaseClient";
import { toast } from "sonner";
import { useAuthContext } from "../../context/AuthContext";

/**
 * Supabase resources yang digunakan komponen ini:
 *
 * ── Storage bucket: open-mind-files ─────────────────────────────────────
 *   File diunggah dengan path: `<whatsapp>/<timestamp>_<nama_file_asli>`
 *   Contoh: "081234567890/1720000000000_bukti_follow.jpg"
 *
 * ── Tabel: (belum ada — submit hanya console.log + upload file) ──────────
 */

/* ── Constants ───────────────────────────────────────────── */

const BUCKET = "open-mind-files";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif"];

const GDRIVE_POSTER_URL = "https://drive.google.com/drive/folders/YOUR_FOLDER_ID";

/* ── Helpers ─────────────────────────────────────────────── */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function validateImageFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_IMAGE_EXTS.includes(ext) || !ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `"${file.name}" bukan gambar yang valid. Gunakan JPG, PNG, atau WebP.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `"${file.name}" terlalu besar (${formatBytes(file.size)}). Maksimal 10 MB.`;
  }
  return null;
}

function buildStoragePath(whatsapp: string, prefix: string, originalName: string): string {
  const safe = originalName.replace(/\s+/g, "_");
  const ts = Date.now();
  return `${whatsapp}/${prefix}_${ts}_${safe}`;
}

/* ── File Drop Zone ───────────────────────────────────────── */

function FileDropZone({
  id,
  label,
  hint,
  file,
  onFile,
  onClear,
  accent,
}: {
  id: string;
  label: string;
  hint?: React.ReactNode;
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
  accent: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (f: File) => {
    const err = validateImageFile(f);
    if (err) { toast.error("Format tidak valid", { description: err }); return; }
    onFile(f);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-[13px] font-semibold text-[#2a2320]">
        {label}
      </Label>
      {hint && <div className="text-[12px] leading-relaxed text-[#857a75]">{hint}</div>}

      {file ? (
        /* Preview */
        <div
          className="flex items-center justify-between gap-3 rounded-[12px] border border-white/70 bg-white/60 px-4 py-3"
          style={{ borderColor: `${accent}55` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileImage className="h-5 w-5 shrink-0" style={{ color: accent }} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-[#2a2320]">{file.name}</p>
              <p className="text-[11px] text-[#857a75]">{formatBytes(file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0e8e4] text-[#857a75] transition hover:bg-[#fde8e8] hover:text-[#c81e2c]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Drop zone */
        <div
          id={id}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handle(f);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-[14px] border-2 border-dashed py-8 text-center transition-all duration-200 ${
            dragOver ? "border-opacity-100 scale-[1.01]" : "border-opacity-50"
          }`}
          style={{
            borderColor: dragOver ? accent : `${accent}60`,
            background: dragOver ? `${accent}0a` : "rgba(255,255,255,0.45)",
          }}
        >
          <UploadCloud className="h-8 w-8" style={{ color: accent }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: accent }}>
              Klik atau seret file ke sini
            </p>
            <p className="text-[12px] text-[#857a75]">JPG, PNG, WebP — maks. 10 MB</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */

export function FormOpenMind({
  onNavigate,
  onGoToBangku,
}: {
  onNavigate: (s: Screen) => void;
  /** Dipanggil setelah upload sukses — membawa data pendaftar ke PilihBangku */
  onGoToBangku: (data: {
    nama: string;
    email: string;
    whatsapp: string;
    followPath: string;
    sharePath: string;
  }) => void;
}) {
  const { user, profile } = useAuthContext();
  
  /* Form fields */
  const [nama, setNama] = useState(profile?.nama || "");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState(user?.email || profile?.email || "");

  /* File fields */
  const [fileFollow, setFileFollow] = useState<File | null>(null);
  const [fileShare, setFileShare] = useState<File | null>(null);

  /* Submission state */
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState("");

  /* ── Validation ──────────────────────────────────────── */

  const canSubmit =
    nama.trim() &&
    whatsapp.trim() &&
    email.trim() &&
    fileFollow &&
    fileShare &&
    !submitting;

  /* ── Upload helper ───────────────────────────────────── */

  async function uploadFile(
    file: File,
    prefix: string,
  ): Promise<string> {
    const path = buildStoragePath(whatsapp.trim(), prefix, file.name);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false });
    if (error) throw new Error(`Upload ${prefix} gagal: ${error.message}`);
    return path;
  }

  /* ── Submit ──────────────────────────────────────────── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setStage("Mengunggah bukti follow IG & TikTok…");

    try {
      // Upload file 1
      const followPath = await uploadFile(fileFollow!, "follow_ig_tiktok");

      // Upload file 2
      setStage("Mengunggah bukti share ke grup WhatsApp…");
      const sharePath = await uploadFile(fileShare!, "share_grup_wa");

      // Log data (table insert will be implemented later)
      const payload = {
        nama: nama.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        file_follow_path: followPath,
        file_share_path: sharePath,
        submitted_at: new Date().toISOString(),
      };
      console.log("[FormOpenMind] Payload:", payload);

      toast.success("Data berhasil diunggah!", {
        description: "Sobat Angkasa selangkah lagi — pilih bangku untuk Open Mind!",
      });
      // Alihkan ke pemilihan bangku
      onGoToBangku({
        nama: nama.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim(),
        followPath,
        sharePath,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error("Gagal mengirim pendaftaran", { description: msg });
    } finally {
      setSubmitting(false);
      setStage("");
    }
  };

  /* ── Main form ───────────────────────────────────────── */

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#f6f2f0]">
      <GlassBackground />
      <Navbar onNavigate={onNavigate} onSection={() => {}} />

      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-24 pt-32">
        {/* Back */}
        <button
          onClick={() => onNavigate("dashboard-user")}
          className="mb-8 flex items-center gap-1.5 text-[13px] font-medium text-[#857a75] transition hover:text-[#2a2320]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dashboard
        </button>

        {/* Page heading */}
        <div className="mb-8 text-center">
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-4 py-1.5 text-[13px] font-medium backdrop-blur-xl"
            style={{ color: AMBER }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: AMBER }} />
            Open Mind APTRG
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-[#2a2320]">
            Form Pendaftaran{" "}
            <span style={{ color: AMBER }}>Open Mind</span>
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[#5a504b]">
            Lengkapi data di bawah ini, Sobat Angkasa. Pastikan semua bukti
            sudah disiapkan sebelum mengirim formulir.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <GlassCard className="flex flex-col gap-7 p-7">

            {/* ── Section 1: Data Diri ── */}
            <div>
              <SectionLabel icon={<MessageCircle className="h-4 w-4" />} label="Data Diri" />
              <div className="mt-4 flex flex-col gap-4">
                {/* Nama */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nama" className="text-[13px] font-semibold text-[#2a2320]">
                    Nama Lengkap <Required />
                  </Label>
                  <Input
                    id="nama"
                    placeholder="Masukkan nama lengkap Sobat Angkasa"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                    disabled
                    className="rounded-[10px] border-white/70 bg-white/60 text-[14px] text-[#2a2320] placeholder:text-[#b0a49e] focus-visible:ring-1 disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{ "--tw-ring-color": AMBER } as React.CSSProperties}
                  />
                </div>

                {/* WhatsApp */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="whatsapp" className="text-[13px] font-semibold text-[#2a2320]">
                    No. WhatsApp <Required />
                  </Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                    className="rounded-[10px] border-white/70 bg-white/60 text-[14px] text-[#2a2320] placeholder:text-[#b0a49e] focus-visible:ring-1"
                    style={{ "--tw-ring-color": AMBER } as React.CSSProperties}
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-[13px] font-semibold text-[#2a2320]">
                    Email <Required />
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@student.ac.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled
                    className="rounded-[10px] border-white/70 bg-white/60 text-[14px] text-[#2a2320] placeholder:text-[#b0a49e] focus-visible:ring-1 disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{ "--tw-ring-color": AMBER } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

            {/* ── Section 2: Bukti Persyaratan ── */}
            <div>
              <SectionLabel icon={<Instagram className="h-4 w-4" />} label="Bukti Persyaratan" />
              <div className="mt-4 flex flex-col gap-6">

                {/* File 1: Follow IG & TikTok */}
                <FileDropZone
                  id="file-follow"
                  label="Bukti Follow IG & TikTok APTRG ✱"
                  hint={
                    <span>
                      Unggah screenshot yang menunjukkan Sobat Angkasa sudah{" "}
                      <strong>follow akun Instagram</strong> dan{" "}
                      <strong>TikTok resmi APTRG</strong>.
                      Format: JPG / PNG / WebP.
                    </span>
                  }
                  file={fileFollow}
                  onFile={setFileFollow}
                  onClear={() => setFileFollow(null)}
                  accent={AMBER}
                />

                {/* File 2: Share ke grup WA */}
                <FileDropZone
                  id="file-share"
                  label="Bukti Share Info Open Mind ke ≥ 5 Grup WA ✱"
                  hint={
                    <div className="flex flex-col gap-2">
                      <span>
                        Unggah screenshot bukti Sobat Angkasa sudah membagikan info Open Mind
                        ke <strong>minimal 5 grup WhatsApp</strong>.
                      </span>
                      <a
                        href={GDRIVE_POSTER_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-fit items-center gap-1.5 rounded-[8px] border border-white/70 bg-white/70 px-3 py-1.5 text-[12px] font-semibold transition hover:bg-white/90"
                        style={{ color: AMBER }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Unduh Poster & Caption di sini
                      </a>
                    </div>
                  }
                  file={fileShare}
                  onFile={setFileShare}
                  onClear={() => setFileShare(null)}
                  accent={AMBER}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

            {/* Progress stage */}
            {submitting && stage && (
              <div className="flex items-center gap-2.5 rounded-[10px] bg-white/60 px-4 py-3 text-[13px] text-[#5a504b]">
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: AMBER }} />
                {stage}
              </div>
            )}

            {/* Missing files warning */}
            {!submitting && (!fileFollow || !fileShare) && (nama || whatsapp || email) && (
              <div className="flex items-start gap-2.5 rounded-[10px] bg-[#fff8ec] px-4 py-3 text-[12px] text-[#8a6a00]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: AMBER }} />
                <span>
                  Sobat Angkasa wajib mengunggah{" "}
                  <strong>kedua file bukti</strong> sebelum mengirim formulir.
                </span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex w-full items-center justify-center gap-2.5 rounded-[13px] py-3.5 text-[15px] font-bold text-white shadow-lg transition-all duration-200 ${
                canSubmit
                  ? "hover:opacity-90 active:scale-[0.98]"
                  : "cursor-not-allowed opacity-50"
              }`}
              style={{
                background: canSubmit
                  ? `linear-gradient(135deg, ${AMBER}cc, ${AMBER})`
                  : "rgba(133,122,117,0.3)",
                color: canSubmit ? "white" : "#a89e97",
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengirim…
                </>
              ) : (
                <>
                  <SendHorizonal className="h-4 w-4" />
                  Kirim Pendaftaran
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-[#a89e97]">
              Dengan mengirim formulir ini, Sobat Angkasa menyetujui bahwa data
              yang diberikan adalah benar dan dapat dipertanggungjawabkan.
            </p>
          </GlassCard>
        </form>
      </div>
    </div>
  );
}

/* ── Small helpers ────────────────────────────────────────── */

function Required() {
  return <span className="ml-0.5 text-[#c81e2c]">✱</span>;
}

function SectionLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-[8px] text-white"
        style={{ background: AMBER }}
      >
        {icon}
      </span>
      <span className="text-[14px] font-bold tracking-tight text-[#2a2320]">
        {label}
      </span>
    </div>
  );
}
