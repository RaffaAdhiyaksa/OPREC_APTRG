import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Loader2,
  Mail,
  Phone,
  IdCard,
  Save,
  AlertCircle,
  BadgeCheck,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard, RED, AMBER } from "../aptrg/shared";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthContext } from "../../context/AuthContext";
import { Avatar } from "./MemberLayout";

/**
 * Supabase resources yang dipakai komponen ini:
 *
 * ── Storage bucket: avatars (public) ───────────────────────────
 *   Path: `<user_id>/avatar.<ext>`, upsert = true (replace foto lama)
 *
 * ── Tabel: profiles ─────────────────────────────────────────────
 *   Kolom yang di-UPDATE: nama, hp, avatar_url
 *   (lihat supabase/migrations/0001_profile_hp_avatar.sql)
 *
 * ── Tabel: applicants (read-only di halaman ini) ────────────────
 *   Dipakai buat nampilin status pendaftaran OPREC kalau user
 *   pernah daftar (nim, divisi, status).
 */

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_SIZE = 3 * 1024 * 1024; // 3 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ApplicantInfo = {
  nim: string;
  divisi: string;
  status: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; Icon: typeof BadgeCheck }> = {
    pending: { label: "Menunggu Verifikasi", color: "#a78b3f", Icon: Clock },
    diterima: { label: "Diterima", color: "#3aa66f", Icon: BadgeCheck },
    "tidak-lolos": { label: "Tidak Lolos", color: "#8a8a8a", Icon: XCircle },
  };
  const s = map[status] ?? { label: status, color: "#857a75", Icon: Clock };
  const { Icon } = s;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold text-white shadow-sm"
      style={{ background: s.color }}
    >
      <Icon className="h-3.5 w-3.5" /> {s.label}
    </span>
  );
}

export function Profile() {
  const { user, profile, refreshProfile } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nama, setNama] = useState(profile?.nama ?? "");
  const [hp, setHp] = useState(profile?.hp ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [applicant, setApplicant] = useState<ApplicantInfo | null>(null);
  const [loadingApplicant, setLoadingApplicant] = useState(true);

  const [saving, setSaving] = useState(false);

  // Sinkronkan form kalau profile dari context berubah (misal setelah refreshProfile)
  useEffect(() => {
    setNama(profile?.nama ?? "");
    setHp(profile?.hp ?? "");
    setAvatarPreview(profile?.avatar_url ?? null);
  }, [profile]);

  // Ambil data pendaftaran OPREC terakhir user ini (kalau ada) — read-only info
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    supabase
      .from("applicants")
      .select("nim, divisi, status")
      .eq("user_id", user.id)
      .order("tanggal_daftar", { ascending: false })
      .limit(1)
      .maybeSingle<ApplicantInfo>()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn("[Profile] Gagal ambil data applicants:", error.message);
        } else {
          setApplicant(data ?? null);
        }
        setLoadingApplicant(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handlePickAvatar = () => fileInputRef.current?.click();

  const handleAvatarChange = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setAvatarError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError("Format harus JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError(`Ukuran foto terlalu besar (${formatBytes(file.size)}). Maks 3 MB.`);
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    if (!nama.trim()) {
      toast.error("Nama tidak boleh kosong.");
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = profile?.avatar_url ?? null;

      // ── Upload foto baru kalau user pilih file ──
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/avatar.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .upload(path, avatarFile, {
            cacheControl: "3600",
            upsert: true, // timpa foto lama
          });

        if (uploadError) {
          throw new Error(`Gagal mengunggah foto: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from(AVATAR_BUCKET)
          .getPublicUrl(path);

        // Tambahin cache-buster biar browser gak nampilin foto lama yang ke-cache
        avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
      }

      // ── Update tabel profiles ──
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          nama: nama.trim(),
          hp: hp.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (updateError) {
        throw new Error(`Gagal menyimpan profil: ${updateError.message}`);
      }

      await refreshProfile();
      setAvatarFile(null);
      toast.success("Profil berhasil diperbarui.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.nama || user?.email || "??").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Banner + avatar */}
      <GlassCard className="overflow-hidden">
        <div
          className="h-24 w-full"
          style={{ background: `linear-gradient(120deg, ${RED}, ${AMBER})`, opacity: 0.9 }}
        />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:px-8">
          <div className="relative -mt-12 flex-none">
            <Avatar initials={initials} size={96} src={avatarPreview} />
            <button
              type="button"
              onClick={handlePickAvatar}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md transition hover:opacity-90"
              style={{ background: RED }}
              aria-label="Ganti foto profil"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleAvatarChange(e.target.files)}
            />
          </div>
          <div className="pb-1">
            <h2 className="text-[20px] font-extrabold tracking-tight text-[#2a2320]">
              {profile?.nama || "Lengkapi profil Anda"}
            </h2>
            <p className="text-[13px] text-[#857a75]">
              Klik ikon kamera untuk ganti foto — JPG/PNG/WEBP, maks 3 MB
            </p>
            {avatarError && (
              <div className="mt-2 flex items-center gap-1.5 text-[12px] text-red-600">
                <AlertCircle className="h-3.5 w-3.5" /> {avatarError}
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Form data diri */}
      <GlassCard className="p-6">
        <h3 className="text-[15px] font-bold text-[#2a2320]">Data Diri</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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

        <div className="mt-4 flex items-center gap-2.5 rounded-[12px] border border-white/60 bg-white/40 px-4 py-3 text-[13px] text-[#5a504b]">
          <Mail className="h-4 w-4 flex-none text-[#c81e2c]" />
          <span className="truncate">{user?.email}</span>
          <span className="ml-auto flex-none text-[11px] text-[#a79c96]">Tidak dapat diubah</span>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full px-6 py-5 text-white shadow-md hover:opacity-90 disabled:opacity-60"
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
        </div>
      </GlassCard>

      {/* Info pendaftaran OPREC (read-only, cuma muncul kalau user pernah daftar) */}
      {!loadingApplicant && applicant && (
        <GlassCard className="p-6">
          <h3 className="text-[15px] font-bold text-[#2a2320]">Status Pendaftaran OPREC</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2.5 rounded-[12px] border border-white/60 bg-white/40 px-4 py-3 text-[14px] text-[#5a504b]">
              <IdCard className="h-4 w-4 flex-none text-[#c81e2c]" />
              <span>NIM: {applicant.nim}</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-[12px] border border-white/60 bg-white/40 px-4 py-3 text-[14px] text-[#5a504b]">
              <Phone className="h-4 w-4 flex-none text-[#c81e2c]" />
              <span>Divisi: {applicant.divisi}</span>
            </div>
          </div>
          <div className="mt-3">
            <StatusPill status={applicant.status} />
          </div>
        </GlassCard>
      )}
    </div>
  );
}
