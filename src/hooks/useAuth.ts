import { useState, useEffect, useCallback, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import type { Role } from "../app/components/aptrg/shared";

export type Profile = {
  nama: string;
  email: string;
  hp: string | null;
  avatar_url: string | null;
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
  /** Profil user (nama, email) untuk autofill. */
  profile: Profile | null;
  /** True selama sesi dan role sedang dimuat. */
  loading: boolean;
  /** Pesan error jika gagal mengambil profil/role dari database. */
  error: string | null;
};

/**
 * Ambil role user dari tabel `profiles`.
 *
 * Skema yang diharapkan:
 * ```sql
 * CREATE TABLE profiles (
 *   id   uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 *   role text NOT NULL DEFAULT 'magang'
 *            CHECK (role IN ('magang', 'asisten', 'admin'))
 * );
 * ```
 * RLS: user hanya bisa membaca row miliknya (`auth.uid() = id`).
 */
async function fetchProfileData(userId: string): Promise<{ role: Role; profile: Profile | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, nama, email, hp, avatar_url")
    .eq("id", sessionUser.id)
    .maybeSingle<ProfileRow>();

  if (error) {
    const friendly = toFriendlyProfileError(error.message);
    console.warn("[useAuth] Gagal membaca profiles:", error.message);
    return { role: "magang", profile: null }; // fallback aman
  }

  const rawRole = data?.role;
  const validRole: Role = (rawRole === "asisten" || rawRole === "admin") ? rawRole : "magang";
  
  const profile = data ? { nama: data.nama, email: data.email } : null;

  return { role: validRole, profile, error: null };
}

/**
 * Custom hook untuk autentikasi dan role-based access.
 *
 * - Subscribe ke perubahan sesi Supabase (login/logout/refresh).
 * - Setelah sesi tersedia, query tabel `profiles` untuk role.
 * - Expose `{ user, role, loading, error }`.
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

    async function resolveSession(sessionUser: User | null) {
      if (cancelled) return;

      currentUserRef.current = sessionUser;

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
        const { role: resolvedRole, profile: resolvedProfile } = await fetchProfileData(sessionUser.id);
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

  return { user, role, profile, loading, error };
}
