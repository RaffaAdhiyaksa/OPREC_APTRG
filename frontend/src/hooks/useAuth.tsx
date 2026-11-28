import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as authService from "@/services/auth";
import { setSessionErrorHandler, tokenStorage } from "@/services/api";
import { queryKeys } from "@/lib/queryKeys";
import type { LoginPayload, Me, Permission, User } from "@/types/api";

const ME_QUERY_KEY = queryKeys.me;

interface AuthContextValue {
  user: Me | null;
  /** True while the stored token is being checked against `/auth/me`. */
  isLoading: boolean;
  /** Set when `/auth/me` failed for a non-session reason (e.g. backend offline). */
  bootError: Error | null;
  retryBoot: () => void;
  /** Message for the login page, e.g. after the account was deactivated. */
  notice: string | null;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
  markPasswordChanged: () => void;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(() => tokenStorage.get() !== null);
  const [notice, setNotice] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: authService.getMe,
    enabled: hasToken,
    staleTime: 5 * 60_000,
  });

  const endSession = useCallback(
    (message: string | null) => {
      tokenStorage.clear();
      setHasToken(false);
      queryClient.clear();
      setNotice(message);
    },
    [queryClient],
  );

  const patchMe = useCallback(
    (patch: Partial<Me>) => queryClient.setQueryData<Me>(ME_QUERY_KEY, (old) => (old ? { ...old, ...patch } : old)),
    [queryClient],
  );

  useEffect(() => {
    setSessionErrorHandler((error) => {
      if (error.code === "PASSWORD_CHANGE_REQUIRED") patchMe({ must_change_password: true });
      else if (error.code === "ACCOUNT_INACTIVE") endSession(error.message);
      else endSession(null);
    });
    return () => setSessionErrorHandler(null);
  }, [endSession, patchMe]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const result = await authService.login(payload);
      tokenStorage.set(result.token);
      // Seed the cache so guards can route immediately; the refetch fills in the unread count.
      queryClient.setQueryData<Me>(ME_QUERY_KEY, { ...result.user, unread_notifications_count: 0 });
      setHasToken(true);
      setNotice(null);
      void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      return result.user;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // The token is dropped locally either way.
    } finally {
      endSession(null);
    }
  }, [endSession]);

  const user = hasToken ? (meQuery.data ?? null) : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: hasToken && meQuery.isPending && !meQuery.isError,
      bootError: hasToken && !user && meQuery.isError ? meQuery.error : null,
      retryBoot: () => void meQuery.refetch(),
      notice,
      login,
      logout,
      markPasswordChanged: () => patchMe({ must_change_password: false }),
      hasPermission: (permission) => user?.permissions.includes(permission) ?? false,
    }),
    [user, hasToken, meQuery, notice, login, logout, patchMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}

/** For components rendered behind <RequireAuth>, where the user is always present. */
export function useCurrentUser(): Me {
  const { user } = useAuth();
  if (!user) throw new Error("useCurrentUser must be used behind <RequireAuth>.");
  return user;
}
