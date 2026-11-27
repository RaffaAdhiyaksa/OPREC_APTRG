import { Navigate, Outlet, useLocation } from "react-router";
import { Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import type { Permission, Role } from "@/types/api";

// Guards only shape navigation. The backend authorizes every request.

/** Every role has its own dashboard at "/". A wrong role is sent there, never to a blank page. */
export const HOME_PATH = "/";

function FullPageLoader() {
  return (
    <div className="flex min-h-full items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
      <span className="sr-only">Memuat…</span>
    </div>
  );
}

function BootErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-xl bg-card p-8 text-center">
        <WifiOff className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button onClick={onRetry} className="rounded-full">
          Coba lagi
        </Button>
      </div>
    </div>
  );
}

export function RequireAuth() {
  const { user, isLoading, bootError, retryBoot } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (bootError) return <BootErrorScreen message={bootError.message} onRetry={retryBoot} />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

/** Only for unauthenticated pages (login). A logged-in user goes back where they came from. */
export function GuestOnly() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? HOME_PATH} replace />;
  }
  return <Outlet />;
}

export function RequirePasswordChanged() {
  const user = useCurrentUser();
  if (user.must_change_password) return <Navigate to="/change-password" replace />;
  return <Outlet />;
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const user = useCurrentUser();
  if (!roles.includes(user.role)) return <Navigate to={HOME_PATH} replace />;
  return <Outlet />;
}

export function RequirePermission({ permission }: { permission: Permission }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) return <Navigate to={HOME_PATH} replace />;
  return <Outlet />;
}
