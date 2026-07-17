import { createContext, useContext, ReactNode } from "react";
import { useAuth, type AuthState } from "../../hooks/useAuth";

/**
 * Context yang menyediakan state autentikasi ke seluruh tree.
 * Gunakan `useAuthContext()` di komponen manapun untuk mengakses
 * `{ user, role, loading, error }` tanpa prop drilling.
 */
const AuthContext = createContext<AuthState>({
  user: null,
  role: null,
  profile: null,
  loading: true,
  error: null,
});

/**
 * Provider yang harus membungkus root aplikasi (atau setidaknya
 * bagian yang memerlukan akses autentikasi).
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

/**
 * Hook untuk mengambil nilai dari `AuthContext`.
 * Harus digunakan di dalam `<AuthProvider>`.
 */
export function useAuthContext(): AuthState {
  return useContext(AuthContext);
}
