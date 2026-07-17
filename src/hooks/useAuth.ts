import { useState, useEffect, useCallback, useRef } from "react";
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
  /** Role yang diambil dari tabel `profiles`. Null selagi loading. */
  role: Role | null;
  /** Profil user (nama, email, hp, avatar_url) untuk autofill & tampilan. */
  profile: Profile | null;
  /** True selama sesi dan role sedang dimuat. */
  loading: boolean;
  /** Pesan error jika gagal mengambil role dari database. */
  error: string | null;
  /**
   * Panggil ini setelah berhasil update tabel `profiles` (misal dari halaman
   * Profil) supaya seluruh app (sidebar, navbar, dll) langsung dapat data
   * terbaru tanpa perlu reload halaman.
   */
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
 * Ambil role + profil user dari tabel `profiles`.
 *
 * Skema yang diharapkan:
 * ```sql
 * CREATE TABLE profiles (
 *   id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 *   role       text NOT NULL DEFAULT 'magang'
 *                  CHECK (role IN ('magang', 'asisten', 'admin')),
 *   nama       text,
 *   email      text,
 *   hp         text,
 *   avatar_url text
 * );
 * ```
 * RLS: user hanya bisa membaca & mengubah row miliknya sendiri
 * (lihat supabase/migrations/0001_profile_hp_avatar.sql).
 *
 * Kalau belum ada row profiles untuk user ini (misal baru pertama kali
 * login lewat Google OAuth, yang tidak lewat form registrasi manual di
 * Login.tsx), function ini otomatis bikinin row default-nya ("auto-provision")
 * supaya seluruh app tetap punya data profil yang konsisten.
 */
async function fetchProfileData(sessionUser: User): Promise<{ role: Role; profile: Profile | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, nama, email, hp, avatar_url")
    .eq("id", sessionUser.id)
    .maybeSingle<ProfileRow>();

  if (error) {
    console.warn("[useAuth] Gagal membaca profiles:", error.message);
    return { role: "magang", profile: null }; // fallback aman
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
      // Kalau gagal insert (misal race condition, row sudah dibuat request lain),
      // tetap lanjut dengan data fallback di memori agar app tidak crash.
      console.warn("[useAuth] Gagal auto-provision profiles:", insertError.message);
      return {
        role: "magang",
        profile: { nama: fallbackNama, email: fallbackEmail, hp: null, avatar_url: null },
      };
    }

    return {
      role: "magang",
      profile: { nama: fallbackNama, email: fallbackEmail, hp: null, avatar_url: null },
    };
  }

  const validRole: Role = (data.role === "asisten" || data.role === "admin") ? data.role : "magang";
  const profile: Profile = {
    nama: data.nama,
    email: data.email,
    hp: data.hp,
    avatar_url: data.avatar_url,
  };

  return { role: validRole, profile };
}

/**
 * Custom hook untuk autentikasi dan role-based access.
 *
 * - Subscribe ke perubahan sesi Supabase (login/logout/refresh).
 * - Setelah sesi tersedia, query tabel `profiles` untuk role & data profil.
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
  const currentUserRef = useRef<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    /**
     * Resolver tunggal yang dipanggil setiap kali sesi berubah.
     * Memastikan tidak ada state update setelah komponen unmount.
     */
    async function resolveSession(sessionUser: User | null) {
      if (cancelled) return;

      currentUserRef.current = sessionUser;

      if (!sessionUser) {
        setUser(null);
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(sessionUser);
      setError(null);

      try {
        const { role: resolvedRole, profile: resolvedProfile } = await fetchProfileData(sessionUser);
        if (!cancelled) {
          setRole(resolvedRole);
          setProfile(resolvedProfile);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Error tidak diketahui";
          console.error("[useAuth] fetchProfileData error:", msg);
          setError(msg);
          setRole("magang"); // fallback
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // Baca sesi awal (untuk kasus refresh halaman)
    supabase.auth.getSession().then(({ data }) => {
      resolveSession(data.session?.user ?? null);
    });

    // Subscribe perubahan sesi (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveSession(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  /**
   * Refetch profil dari database tanpa reload halaman.
   * Dipanggil dari halaman Profil setelah save berhasil.
   */
  const refreshProfile = useCallback(async () => {
    const sessionUser = currentUserRef.current;
    if (!sessionUser) return;
    try {
      const { role: resolvedRole, profile: resolvedProfile } = await fetchProfileData(sessionUser);
      setRole(resolvedRole);
      setProfile(resolvedProfile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error tidak diketahui";
      console.error("[useAuth] refreshProfile error:", msg);
    }
  }, []);

  return { user, role, profile, loading, error, refreshProfile };
}
