import { PlaceholderPage } from "@/components/shared/PlaceholderPage";
import { useCurrentUser } from "@/hooks/useAuth";
import AdminDashboard from "./AdminDashboard";
import AktifDashboard from "./AktifDashboard";

/** "/" shows the dashboard of the signed-in role. */
export default function DashboardPage() {
  const user = useCurrentUser();
  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "asisten_aktif") return <AktifDashboard />;
  return <PlaceholderPage title="Beranda" />;
}
