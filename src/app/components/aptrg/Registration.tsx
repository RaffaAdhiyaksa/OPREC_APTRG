import { useState, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  Loader2,
  SendHorizonal,
} from "lucide-react";
import { GlassCard, DIVISIONS, Screen, RED } from "./shared";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { supabase } from "../../../lib/supabaseClient";
import { toast } from "sonner";
import { useAuthContext } from "../../context/AuthContext";

/**
 * Supabase resources yang digunakan komponen ini:
 *
 * ── Storage bucket: cv-files ──────────────────────────────────────────────
 *   File CV diunggah dengan path: `<nim>/<nim>_<nama_file_asli>`
 *   Contoh: "1030124001/1030124001_CV_Rangga.pdf"
 *   Bucket bersifat PRIVATE — akses via Signed URL.
 *
 * ── Tabel: applicants ─────────────────────────────────────────────────────
 *   Kolom yang di-INSERT:
 *     nama           text   NOT NULL
 *     nim            text   UNIQUE NOT NULL  ← jika duplikat → error 23505
 *     email          text   NOT NULL
 *     hp             text
 *     jurusan        text
 *     angkatan       text
 *     motivasi       text
 *     divisi         text   NOT NULL
 *     cv_path        text              ← null jika tidak ada file
 *     status         text   DEFAULT 'pending'
 *     tanggal_daftar date   DEFAULT CURRENT_DATE
 */

const STEPS = ["Data Diri", "Pilih Divisi", "Motivasi & Berkas", "Review"];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = "application/pdf";
const ALLOWED_EXT = ".pdf";
const CV_BUCKET = "cv-files";

/* ── Helpers ─────────────────────────────────────────────── */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Validasi satu File object; kembalikan pesan error atau null jika valid */
function validateFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "pdf" || file.type !== ALLOWED_MIME) {
    return `"${file.name}" bukan berkas PDF. Hanya format PDF yang diterima.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `"${file.name}" terlalu besar (${formatBytes(file.size)}). Maksimal ukuran file adalah 10 MB.`;
  }
  return null;
}

/**
 * Buat nama path unik di Storage:  <nim>/<nim>_<nama_asli>
 * Karakter spasi diganti underscore agar aman sebagai path.
 */
function buildStoragePath(nim: string, originalName: string): string {
  const safeNim = nim.replace(/[^a-zA-Z0-9]/g, "");
  const safeName = originalName.replace(/[^a-zA-Z0-9.\-]/g, "_");
  return `${safeNim}/${safeNim}_${safeName}`;
}

/* ── Komponen utama ──────────────────────────────────────── */

export function Registration({
  onNavigate,
  onSubmitSuccess,
}: {
  onNavigate: (s: Screen) => void;
  /** Dipanggil setelah INSERT ke Supabase berhasil */
  onSubmitSuccess: (divisionId: string) => void;
}) {
  const { user, profile } = useAuthContext();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    nama: profile?.nama || "",
    nim: "",
    email: user?.email || profile?.email || "",
    hp: profile?.hp || "",
    jurusan: "",
    angkatan: "",
    motivasi: "",
  });
  const [division, setDivision] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** State submit ke Supabase */
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Pesan progres tahap upload/insert yang ditampilkan di UI */
  const [submitStage, setSubmitStage] = useState<string>("");

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canNext =
    step === 0
      ? form.nama && form.nim && form.email
      : step === 1
      ? !!division
      : step === 2
      ? form.motivasi.length > 0
      : true;

  /* ── Penanganan file ─────────────────────────────────── */

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setFileError(null);
    const newFiles: File[] = [];
    const errors: string[] = [];

    Array.from(incoming).forEach((file) => {
      const err = validateFile(file);
      if (err) {
        errors.push(err);
      } else {
        const isDuplicate = files.some(
          (f) => f.name === file.name && f.size === file.size
        );
        if (!isDuplicate) newFiles.push(file);
      }
    });

    if (errors.length > 0) setFileError(errors[0]);
    if (newFiles.length > 0) setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  };

  /* ── Submit ke Supabase ──────────────────────────────── */

  const handleSubmit = async () => {
    if (!division || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      let cvPath: string | null = null;

      // ── TAHAP 1: Upload file CV ke Storage ─────────────
      if (files.length > 0) {
        // Hanya unggah file pertama sebagai CV utama
        const cvFile = files[0];

        // Validasi ulang sebelum upload (defense in depth)
        const validationError = validateFile(cvFile);
        if (validationError) {
          setSubmitError(validationError);
          return;
        }

        setSubmitStage("Mengunggah berkas CV...");

        const storagePath = buildStoragePath(form.nim.trim(), cvFile.name);
        const { error: uploadError } = await supabase.storage
          .from(CV_BUCKET)
          .upload(storagePath, cvFile, {
            cacheControl: "3600",
            upsert: false, // jangan timpa file yang sudah ada
          });

        if (uploadError) {
          // "The resource already exists" → path sudah dipakai
          if (
            uploadError.message.toLowerCase().includes("already exists") ||
            uploadError.message.toLowerCase().includes("duplicate")
          ) {
            throw new Error(
              "Berkas dengan nama yang sama sudah pernah diunggah untuk NIM ini. " +
                "Ganti nama file lalu coba lagi."
            );
          }
          throw new Error(`Gagal mengunggah berkas: ${uploadError.message}`);
        }

        cvPath = storagePath;
      }

      // ── TAHAP 2: INSERT data pendaftar ke tabel applicants ──
      setSubmitStage("Menyimpan data pendaftaran...");

      const payload = {
        user_id: user?.id,
        nama: form.nama.trim(),
        nim: form.nim.trim(),
        email: form.email.trim(),
        hp: form.hp.trim() || null,
        jurusan: form.jurusan.trim() || null,
        angkatan: form.angkatan.trim() || null,
        motivasi: form.motivasi.trim() || null,
        divisi: division,
        cv_path: cvPath,
        status: "pending",
      };

      console.log("[Registration] Attempting insert with payload:", payload);

      const { error: insertError } = await supabase.from("applicants").insert(payload);

      if (insertError) {
        // Jika file sudah terlanjur diupload, hapus agar tidak orphan di kasus apapun
        if (cvPath) {
          await supabase.storage.from(CV_BUCKET).remove([cvPath]);
        }

        // PostgreSQL error code 23505 = unique_violation (NIM sudah terdaftar)
        if (
          insertError.code === "23505" ||
          insertError.message.toLowerCase().includes("unique") ||
          insertError.message.toLowerCase().includes("duplicate")
        ) {
          throw new Error(
            "NIM ini sudah terdaftar di sistem. Setiap NIM hanya dapat mendaftar satu kali."
          );
        }
        console.error("[Registration] ERROR saat insert ke applicants:", insertError);
        throw new Error(`Gagal menyimpan pendaftaran: ${insertError.message}`);
      }

      // ── SUKSES ──────────────────────────────────────────
      toast.success("Pendaftaran berhasil dikirim! Pantau statusnya di halaman Cek Pengumuman.");
      onSubmitSuccess(division);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
      setSubmitStage("");
    }
  };

  /* ── Render ──────────────────────────────────────────── */

  return (
    <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-16">
      <button
        onClick={() => onNavigate("dashboard-user")}
        disabled={submitting}
        className="mb-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#5a504b] transition hover:text-[#2a2320] disabled:opacity-50"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
      </button>

      {/* Step progress */}
      <GlassCard className="mb-6 p-5">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[14px] font-bold shadow-sm transition"
                  style={{
                    background: i <= step ? RED : "rgba(200,30,44,0.15)",
                    color: i <= step ? "#fff" : "#c81e2c",
                  }}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <div className="hidden sm:block">
                  <div
                    className="text-[13px] font-semibold"
                    style={{ color: i <= step ? "#2a2320" : "#857a75" }}
                  >
                    {s}
                  </div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mx-3 h-px flex-1 bg-[rgba(200,30,44,0.2)]">
                  <div
                    className="h-px transition-all"
                    style={{
                      width: i < step ? "100%" : "0%",
                      background: RED,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-8">
        {/* ── Step 0: Data Diri ── */}
        {step === 0 && (
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight text-[#2a2320]">
              Data Diri
            </h2>
            <p className="mt-1 text-[14px] text-[#857a75]">
              Lengkapi identitas Anda sebagai calon anggota.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Nama Lengkap" full>
                <Input
                  value={form.nama}
                  onChange={(e) => set("nama", e.target.value)}
                  placeholder="Nama lengkap"
                  className="bg-white/60"
                />
              </Field>
              <Field label="NIM">
                <Input
                  value={form.nim}
                  onChange={(e) => set("nim", e.target.value)}
                  placeholder="Nomor Induk Mahasiswa"
                  className="bg-white/60"
                />
              </Field>
              <Field label="Email">
                <Input
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="nama@student.ac.id"
                  type="email"
                  className="bg-white/60"
                />
              </Field>
              <Field label="No. HP">
                <Input
                  value={form.hp}
                  onChange={(e) => set("hp", e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="bg-white/60"
                />
              </Field>
              <Field label="Jurusan">
                <Input
                  value={form.jurusan}
                  onChange={(e) => set("jurusan", e.target.value)}
                  placeholder="Teknik Mesin"
                  className="bg-white/60"
                />
              </Field>
              <Field label="Angkatan">
                <Input
                  value={form.angkatan}
                  onChange={(e) => set("angkatan", e.target.value)}
                  placeholder="2024"
                  className="bg-white/60"
                />
              </Field>
            </div>
          </div>
        )}

        {/* ── Step 1: Pilih Divisi ── */}
        {step === 1 && (
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight text-[#2a2320]">
              Pilih Divisi
            </h2>
            <p className="mt-1 text-[14px] text-[#857a75]">
              Pilih satu divisi yang paling sesuai dengan minat Anda.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {DIVISIONS.map((d) => {
                const active = division === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setDivision(d.id)}
                    className="relative overflow-hidden rounded-[18px] border bg-white/60 p-5 text-left backdrop-blur-xl transition"
                    style={{
                      borderColor: active ? RED : "rgba(255,255,255,0.7)",
                      boxShadow: active
                        ? "0 0 0 2px rgba(200,30,44,0.35)"
                        : "0 6px 20px -12px rgba(80,40,40,0.25)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-[14px] text-white shadow"
                        style={{ background: RED }}
                      >
                        <d.Icon className="h-5 w-5" />
                      </div>
                      {active && (
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                          style={{ background: RED }}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-[16px] text-[#2a2320]">{d.name}</h3>
                    <div className="text-[12px] font-medium uppercase tracking-wide text-[#c81e2c]">
                      {d.tagline}
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#857a75]">
                      {d.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 2: Motivasi & Berkas ── */}
        {step === 2 && (
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight text-[#2a2320]">
              Motivasi & Upload Berkas
            </h2>
            <p className="mt-1 text-[14px] text-[#857a75]">
              Ceritakan motivasi Anda dan unggah berkas pendukung.
            </p>
            <div className="mt-6 space-y-2">
              <Label>Motivasi bergabung</Label>
              <Textarea
                value={form.motivasi}
                onChange={(e) => set("motivasi", e.target.value)}
                placeholder="Ceritakan alasan dan pengalaman Anda..."
                className="min-h-32 bg-white/60"
              />
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXT}
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              onClick={(e) => {
                (e.target as HTMLInputElement).value = "";
              }}
            />

            <div className="mt-5 space-y-2">
              <Label>
                Berkas pendukung (CV, portofolio, transkrip){" "}
                <span className="font-normal text-[#857a75]">
                  — PDF, maks 10 MB per file
                </span>
              </Label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-[18px] border-2 border-dashed bg-white/50 px-6 py-10 text-center transition"
                style={{
                  borderColor: dragOver
                    ? RED
                    : fileError
                    ? "#dc2626"
                    : "rgba(200,30,44,0.3)",
                  background: dragOver
                    ? "rgba(200,30,44,0.06)"
                    : fileError
                    ? "rgba(220,38,38,0.04)"
                    : undefined,
                }}
              >
                <UploadCloud
                  className={`h-8 w-8 ${fileError ? "text-red-500" : "text-[#c81e2c]"}`}
                />
                <div className="mt-3 text-[14px] font-medium text-[#2a2320]">
                  Tarik & letakkan berkas di sini
                </div>
                <div className="text-[13px] text-[#857a75]">
                  atau klik untuk memilih file (PDF, maks 10 MB)
                </div>
              </div>

              {fileError && (
                <div className="flex items-start gap-2 rounded-[10px] border border-red-200 bg-red-50/80 px-3.5 py-2.5 text-[13px] text-red-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                  <span>{fileError}</span>
                </div>
              )}

              {files.length > 0 && (
                <div className="space-y-2 pt-1">
                  {files.map((f, i) => (
                    <div
                      key={`${f.name}-${f.size}-${i}`}
                      className="flex items-center justify-between rounded-[12px] border border-white/60 bg-white/60 px-3.5 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5 text-[14px] text-[#2a2320]">
                        <FileText className="h-4 w-4 flex-none text-[#c81e2c]" />
                        <span className="truncate">{f.name}</span>
                        <span className="flex-none text-[12px] text-[#857a75]">
                          ({formatBytes(f.size)})
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(i);
                        }}
                        className="ml-2 flex-none text-[#857a75] transition hover:text-[#c81e2c]"
                        aria-label={`Hapus ${f.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Review & Submit ── */}
        {step === 3 && (
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight text-[#2a2320]">
              Review & Submit
            </h2>
            <p className="mt-1 text-[14px] text-[#857a75]">
              Periksa kembali data Anda sebelum mengirim.
            </p>
            <div className="mt-6 space-y-5">
              <ReviewGroup
                title="Data Diri"
                rows={[
                  ["Nama", form.nama || "-"],
                  ["NIM", form.nim || "-"],
                  ["Email", form.email || "-"],
                  ["No. HP", form.hp || "-"],
                  ["Jurusan", form.jurusan || "-"],
                  ["Angkatan", form.angkatan || "-"],
                ]}
              />
              <ReviewGroup
                title="Divisi Pilihan"
                rows={[
                  [
                    "Divisi",
                    DIVISIONS.find((d) => d.id === division)?.name || "-",
                  ],
                ]}
              />
              <ReviewGroup
                title="Motivasi & Berkas"
                rows={[
                  ["Motivasi", form.motivasi || "-"],
                  [
                    "Berkas",
                    files.length
                      ? files
                          .map((f) => `${f.name} (${formatBytes(f.size)})`)
                          .join(", ")
                      : "Tidak ada (opsional)",
                  ],
                ]}
              />
            </div>

            {/* Submit error di step review */}
            {submitError && (
              <div className="mt-5 flex items-start gap-2 rounded-[12px] border border-red-200 bg-red-50/80 px-4 py-3 text-[13px] text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Progress stage indicator */}
            {submitting && submitStage && (
              <div className="mt-4 flex items-center gap-2.5 rounded-[12px] border border-white/60 bg-white/50 px-4 py-3 text-[13px] text-[#5a504b]">
                <Loader2 className="h-4 w-4 animate-spin text-[#c81e2c]" />
                <span>{submitStage}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Navigasi antar step ── */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() =>
              step === 0 ? onNavigate("landing") : setStep(step - 1)
            }
            disabled={submitting}
            className="rounded-full border border-white/70 bg-white/60 px-5 py-2.5 text-[14px] font-medium text-[#2a2320] backdrop-blur-xl transition hover:bg-white/80 disabled:opacity-50"
          >
            {step === 0 ? "Batal" : "Kembali"}
          </button>

          {step < STEPS.length - 1 ? (
            <Button
              disabled={!canNext}
              onClick={() => canNext && setStep(step + 1)}
              className="rounded-full px-6 py-5 text-white shadow-md hover:opacity-90 disabled:opacity-40"
              style={{ background: RED }}
            >
              Lanjut <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-full px-6 py-5 text-white shadow-md hover:opacity-90 disabled:opacity-60"
              style={{ background: RED }}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  Kirim Pendaftaran{" "}
                  <SendHorizonal className="ml-1.5 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ReviewGroup({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-[16px] border border-white/60 bg-white/50 p-5">
      <div className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#c81e2c]">
        {title}
      </div>
      <div className="space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-4 text-[14px]">
            <div className="w-28 flex-none text-[#857a75]">{k}</div>
            <div className="min-w-0 flex-1 break-words text-[#2a2320]">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
