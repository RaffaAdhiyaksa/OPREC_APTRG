import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Camera,
  Loader2,
  Mail,
  Phone,
  IdCard,
  Save,
  AlertCircle,
  GraduationCap,
  CalendarDays,
  Layers,
  FileText,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard, RED } from "../aptrg/shared";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthContext } from "../../context/AuthContext";

const AVATAR_BUCKET = "avatars";
const CV_BUCKET = "cv-files";
const MAX_AVATAR_SIZE = 3 * 1024 * 1024; // 3 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ApplicantStatus = "pending" | "lolos-admin" | "wawancara" | "diterima" | "ditolak" | string;

type ApplicantInfo = {
  nim: string;
  divisi: string;
  status: ApplicantStatus;
  hp: string | null;
  jurusan: string | null;
  angkatan: string | null;
  motivasi: string | null;
  cv_path: string | null;
  tanggal_daftar: string | null;
};

// Defensif: nampung semua nilai status yang pernah dipakai di berbagai bagian
// app (ada drift penamaan antar komponen), plus fallback buat nilai lain.
const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  "lolos-admin": "Lolos Admin",
  wawancara: "Wawancara",
  diterima: "Diterima",
  ditolak: "Ditolak",
  verified: "Diverifikasi",
  rejected: "Ditolak",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#857a75",
  "lolos-admin": "#2f7dd1",
  wawancara: "#e3a548",
  diterima: "#3aa66f",
  ditolak: "#c81e2c",
  verified: "#3aa66f",
  rejected: "#c81e2c",
};

function StatusPill({ status }: { status: ApplicantStatus }) {
  const label = STATUS_LABEL[status] ?? status;
  const color = STATUS_COLOR[status] ?? "#857a75";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
      style={{ background: `${color}1a`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IdCard;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-[12px] border border-white/60 bg-white/40 px-4 py-3 text-[14px] text-[#5a504b] dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
      <Icon className="mt-0.5 h-4 w-4 flex-none text-[#c81e2c] dark:text-red-400" />
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-[#a79c96] dark:text-zinc-500">{label}</div>
        <div className="truncate font-semibold text-[#2a2320] dark:text-zinc-50">{value || "-"}</div>
      </div>
    </div>
  );
}

export function Profile() {
  const { user, profile, error: authError, refreshProfile } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nama, setNama] = useState(profile?.nama ?? "");
  const [hp, setHp] = useState(profile?.hp ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [applicant, setApplicant] = useState<ApplicantInfo | null>(null);
  const [loadingApplicant, setLoadingApplicant] = useState(true);
  const [applicantError, setApplicantError] = useState<string | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [cvLoading, setCvLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  // Sinkronkan form dengan data profil begitu tersedia/berubah (misal habis refresh).
  useEffect(() => {
    setNama(profile?.nama ?? "");
    setHp(profile?.hp ?? "");
    setAvatarPreview(profile?.avatar_url ?? null);
  }, [profile]);

  // Ambil data pendaftaran OPREC milik user ini (kalau ada).
  useEffect(() => {
    if (!user) {
      setLoadingApplicant(false);
      return;
    }
    let cancelled = false;
    setLoadingApplicant(true);

    supabase
      .from("applicants")
      .select("nim, divisi, status, hp, jurusan, angkatan, motivasi, cv_path, tanggal_daftar")
      .eq("user_id", user.id)
      .order("tanggal_daftar", { ascending: false })
      .limit(1)
      .maybeSingle<ApplicantInfo>()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn("[Profile] Gagal ambil data applicants:", error.message);
          setApplicantError(`Gagal memuat data pendaftaran: ${error.message}`);
        } else {
          setApplicant(data ?? null);
          setApplicantError(null);
        }
        setLoadingApplicant(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Kalau ada file CV yang diupload pas registrasi, bikinin signed URL
  // (bucket cv-files private).
  useEffect(() => {
    if (!applicant?.cv_path) {
      setCvUrl(null);
      return;
    }
    let cancelled = false;
    setCvLoading(true);
    supabase.storage
      .from(CV_BUCKET)
      .createSignedUrl(applicant.cv_path, 60 * 10)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn("[Profile] Gagal bikin signed URL CV:", error.message);
          setCvUrl(null);
        } else {
          setCvUrl(data?.signedUrl ?? null);
        }
        setCvLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applicant?.cv_path]);

  function handleAvatarPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError("Format foto harus JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError("Ukuran foto maksimal 3 MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!user) return;
    if (!nama.trim()) {
      toast.error("Nama tidak boleh kosong.");
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = profile?.avatar_url ?? null;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .upload(path, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
        // Tambahin cache-busting query param biar foto baru langsung kepakai,
        // bukan versi lama yang ke-cache browser.
        avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          nama: nama.trim(),
          hp: hp.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setAvatarFile(null);
      toast.success("Profil berhasil diperbarui.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui.";
      toast.error(`Gagal menyimpan profil: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  const initials = nama ? nama.substring(0, 2).toUpperCase() : "U";

  return (
    <div className="space-y-6">
      {(authError || applicantError) && (
        <div className="flex items-start gap-2.5 rounded-[14px] border border-amber-300/70 bg-amber-50/80 px-4 py-3.5 text-[13px] text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          <div className="space-y-1">
            {authError && <p>{authError}</p>}
            {applicantError && <p>{applicantError}</p>}
          </div>
        </div>
      )}

      {/* Data Diri (editable) */}
      <GlassCard className="p-6">
        <h3 className="text-[15px] font-bold text-[#2a2320] dark:text-zinc-50">Data Diri</h3>
        <p className="mt-1 text-[13px] text-[#857a75] dark:text-zinc-400">Kelola informasi akun kamu.</p>

        <div className="mt-5 flex items-center gap-5">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-[#f6f2f0] text-[22px] font-bold text-[#2a2320] shadow-sm">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Foto profil" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md hover:opacity-90"
              style={{ background: RED }}
              title="Ganti foto profil"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarPick}
            />
          </div>
          <div className="flex-1">
            {avatarError && <p className="text-[13px] text-[#c81e2c]">{avatarError}</p>}
            <p className="text-[13px] text-[#857a75]">JPG, PNG, atau WebP. Maks 3 MB.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="profile-nama">Nama Lengkap</Label>
            <Input
              id="profile-nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="bg-white/60"
              disabled={saving}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-hp">No. Telepon</Label>
            <Input
              id="profile-hp"
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              className="bg-white/60"
              disabled={saving}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5 rounded-[12px] border border-white/60 bg-white/40 px-4 py-3 text-[14px] text-[#857a75] dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
          <Mail className="h-4 w-4 flex-none" />
          <span>{user?.email}</span>
          <span className="ml-auto text-[12px] text-[#a79c96] dark:text-zinc-500">Email tidak bisa diubah</span>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="mt-5 rounded-full px-6 py-5 text-white shadow-md hover:opacity-90 disabled:opacity-60"
          style={{ background: RED }}
        >
          {saving ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-1.5 h-4 w-4" /> Simpan Perubahan
            </>
          )}
        </Button>
      </GlassCard>

      {/* Loading state buat data pendaftaran */}
      {loadingApplicant && (
        <GlassCard className="flex items-center gap-2.5 p-6 text-[14px] text-[#857a75]">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat data pendaftaran OPREC...
        </GlassCard>
      )}

      {/* Belum pernah daftar OPREC sama sekali */}
      {!loadingApplicant && !applicant && !applicantError && (
        <GlassCard className="p-6 text-[14px] text-[#857a75]">
          Kamu belum punya data pendaftaran OPREC yang tercatat di akun ini.
        </GlassCard>
      )}

      {/* Data pendaftaran OPREC (read-only) */}
      {!loadingApplicant && applicant && (
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[15px] font-bold text-[#2a2320] dark:text-zinc-50">Data Pendaftaran OPREC</h3>
            <StatusPill status={applicant.status} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoRow icon={IdCard} label="NIM" value={applicant.nim} />
            <InfoRow icon={Phone} label="No. Telepon (saat daftar)" value={applicant.hp ?? "-"} />
            <InfoRow icon={GraduationCap} label="Jurusan" value={applicant.jurusan ?? "-"} />
            <InfoRow icon={CalendarDays} label="Angkatan" value={applicant.angkatan ?? "-"} />
            <InfoRow icon={Layers} label="Divisi" value={applicant.divisi} />
            {applicant.tanggal_daftar && (
              <InfoRow
                icon={CalendarDays}
                label="Tanggal Daftar"
                value={new Date(applicant.tanggal_daftar).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
            )}
          </div>

          {applicant.motivasi && (
            <div className="mt-4">
              <h4 className="text-[13px] font-semibold text-[#5a504b] dark:text-zinc-50">Motivasi</h4>
              <p className="mt-1.5 rounded-[12px] border border-white/60 bg-white/40 p-4 text-[14px] leading-relaxed text-[#5a504b] dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                {applicant.motivasi}
              </p>
            </div>
          )}

          {applicant.cv_path && (
            <div className="mt-4 flex items-center gap-2.5 rounded-[12px] border border-white/60 bg-white/40 px-4 py-3 text-[14px] text-[#5a504b]">
              <FileText className="h-4 w-4 flex-none text-[#c81e2c]" />
              <span className="flex-1 truncate">Berkas CV yang diunggah saat daftar</span>
              {cvLoading ? (
                <Loader2 className="h-4 w-4 flex-none animate-spin text-[#857a75]" />
              ) : cvUrl ? (
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-none items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:opacity-90"
                  style={{ background: RED }}
                >
                  <Download className="h-3.5 w-3.5" /> Unduh
                </a>
              ) : (
                <span className="flex-none text-[12px] text-[#a79c96]">Link tidak tersedia</span>
              )}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
