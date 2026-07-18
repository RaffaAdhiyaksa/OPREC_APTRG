import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import type { Role } from "../app/components/aptrg/shared";

export type Profile = {
  nama: string;
  email: string;
  hp: string | null;
  avatar_url: string | null;
};

export type AuthState = {
  /** User Supabase yang sedang login, atau null jika belum login. */
  user: User | null;
  /** Role yang diambil dari tabel `profiles`. Null selagi loading ATAU kalau
   *  query-nya gagal (JANGAN dianggap "magang" begitu saja kalau null —
   *  cek `error` buat tau alasannya). */
  role: Role | null;
  /** Profil user (nama, email, hp, avatar_url) untuk autofill. */
  profile: Profile | null;
  /** True selama sesi dan role sedang dimuat. */
  loading: boolean;
  /** Pesan error jika gagal mengambil profil/role dari database. */
  error: string | null;
  /** Refresh manual data profil (dipanggil setelah user edit profil sendiri). */
  refreshProfile: () => Promise<void>;
};

type ProfileRow = {
  role: string;
  nama: string;
  email: string;
  hp: string | null;
  avatar_url: string | null;
};

/**
 * Kalau Postgres balikin "column ... does not exist", itu tandanya migration
 * `supabase/migrations/0001_profile_hp_avatar.sql` belum dijalankan di project
 * Supabase yang dipakai.
 */
function toFriendlyProfileError(message: string): string {
  const missingColumn = /column .*(hp|avatar_url).* does not exist/i.test(message);
  if (missingColumn) {
    return (
      "Kolom `hp`/`avatar_url` belum ada di tabel `profiles`. " +
      "Jalankan file supabase/migrations/0001_profile_hp_avatar.sql di Supabase SQL Editor project kamu, lalu refresh halaman."
    );
  }
  return `Gagal memuat data profil/role: ${message}`;
}

/**
 * Ambil role + profil user dari tabel `profiles`.
 *
 * Skema yang diharapkan:
 * ```sql
 * CREATE TABLE profiles (
 *   id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 *   nama       text,
 *   email      text,
 *   hp         text,
 *   avatar_url text,
 *   role       text NOT NULL DEFAULT 'magang'
 *              CHECK (role IN ('magang', 'asisten', 'admin'))
 * );
 * ```
 * RLS: user hanya bisa membaca row miliknya (`auth.uid() = id`).
 *
 * PENTING: kalau query gagal, kita kembalikan `role: null` (bukan asal nebak
 * "magang"). Kalau nebak "magang" padahal akun itu admin, logic proteksi rute
 * di App.tsx bisa nendang admin ke halaman anggota biasa gara-gara data yang
 * salah, bukan gara-gara role-nya memang magang.
 */
async function fetchProfileData(
  sessionUser: User
): Promise<{ role: Role | null; profile: Profile | null; error: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, nama, email, hp, avatar_url")
    .eq("id", sessionUser.id)
    .maybeSingle<ProfileRow>();

  if (error) {
    const friendly = toFriendlyProfileError(error.message);
    console.warn("[useAuth] Gagal membaca profiles:", error.message);
    return { role: null, profile: null, error: friendly };
  }

  // Belum ada row profiles sama sekali (kemungkinan besar login pertama
  // via Google OAuth) — auto-provision row default-nya.
  if (!data) {
    const fallbackNama =
      (sessionUser.user_metadata?.full_name as string | undefined) ||
      (sessionUser.user_metadata?.name as string | undefined) ||
      sessionUser.email?.split("@")[0] ||
      "Sobat Angkasa";
    const fallbackEmail = sessionUser.email || "";

    const { error: insertError } = await supabase.from("profiles").insert({
      id: sessionUser.id,
      nama: fallbackNama,
      email: fallbackEmail,
      role: "magang",
    });

    if (insertError) {
      console.warn("[useAuth] Gagal auto-provision profiles:", insertError.message);
      return {
        role: "magang",
        profile: { nama: fallbackNama, email: fallbackEmail, hp: null, avatar_url: null },
        error: toFriendlyProfileError(insertError.message),
      };
    }

    return {
      role: "magang",
      profile: { nama: fallbackNama, email: fallbackEmail, hp: null, avatar_url: null },
      error: null,
    };
  }

  const validRole: Role = (data.role === "asisten" || data.role === "admin") ? data.role : "magang";
  const profile: Profile = {
    nama: data.nama,
    email: data.email,
    hp: data.hp,
    avatar_url: data.avatar_url,
  };

  return { role: validRole, profile, error: null };
}

/**
 * Custom hook untuk autentikasi dan role-based access.
 *
 * - Subscribe ke perubahan sesi Supabase (login/logout/refresh).
 * - Setelah sesi tersedia, query tabel `profiles` untuk role + data profil.
 * - Expose `{ user, role, profile, loading, error, refreshProfile }`.
 *
 * Gunakan bersama `AuthContext` agar nilai dapat diakses di seluruh tree
 * tanpa prop drilling.
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveSession(sessionUser: User | null) {
      if (cancelled) return;

      if (!sessionUser) {
        setUser(null);
        setRole(null);
        setProfile(null);
        setError(null);
        setLoading(false);
        return;
      }

      setUser(sessionUser);
      setError(null);

      try {
        const { role: resolvedRole, profile: resolvedProfile, error: profileError } = await fetchProfileData(sessionUser);
        if (!cancelled) {
          setRole(resolvedRole);
          setProfile(resolvedProfile);
          setError(profileError);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Error tidak diketahui";
          console.error("[useAuth] fetchProfileData error:", msg);
          setError(msg);
          setRole(null); // jangan asumsikan role kalau gagal total
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      resolveSession(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveSession(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    const { data } = await supabase.auth.getSession();
    const sessionUser = data.session?.user;
    if (!sessionUser) return;

    try {
      const { role: resolvedRole, profile: resolvedProfile, error: profileError } = await fetchProfileData(sessionUser);
      setRole(resolvedRole);
      setProfile(resolvedProfile);
      setError(profileError);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error tidak diketahui";
      console.error("[useAuth] refreshProfile error:", msg);
      setError(msg);
    }
  };

  return { user, role, profile, loading, error, refreshProfile };
}
