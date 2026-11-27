import { useNavigate } from "react-router";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/shared/BrandMark";
import { ChangePasswordForm } from "@/components/shared/ChangePasswordForm";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { HOME_PATH } from "@/routes/guards";

export default function ChangePasswordPage() {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const forced = user.must_change_password;

  return (
    <main className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-card p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <BrandMark />
          <Button variant="ghost" size="sm" onClick={() => void logout()}>
            <LogOut aria-hidden />
            Keluar
          </Button>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Ganti password</h1>
          <p className="text-sm text-muted-foreground">
            {forced
              ? "Demi keamanan, ganti password sementara Anda sebelum melanjutkan."
              : "Gunakan password yang belum pernah dipakai di layanan lain."}
          </p>
        </div>
        <ChangePasswordForm onSuccess={() => navigate(HOME_PATH, { replace: true })} />
      </div>
    </main>
  );
}
