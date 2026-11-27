import { useNavigate } from "react-router";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/layout/AuthCard";
import { ChangePasswordForm } from "@/components/shared/ChangePasswordForm";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { HOME_PATH } from "@/routes/guards";

export default function ChangePasswordPage() {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <AuthCard
      title="Ganti password"
      description={
        user.must_change_password
          ? "Demi keamanan, ganti password sementara Anda sebelum melanjutkan."
          : "Gunakan password yang belum pernah dipakai di layanan lain."
      }
      topAction={
        <Button variant="outline" size="sm" className="bg-white/70 dark:bg-white/5" onClick={() => void logout()}>
          <LogOut aria-hidden />
          Keluar
        </Button>
      }
    >
      <ChangePasswordForm onSuccess={() => navigate(HOME_PATH, { replace: true })} />
    </AuthCard>
  );
}
