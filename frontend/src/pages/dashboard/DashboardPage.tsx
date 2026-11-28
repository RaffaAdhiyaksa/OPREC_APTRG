import { PlaceholderPage } from "@/components/shared/PlaceholderPage";
import { useCurrentUser } from "@/hooks/useAuth";
import AdminDashboard from "./AdminDashboard";

/** "/" shows the dashboard of the signed-in role. */
export default function DashboardPage() {
  const user = useCurrentUser();
  if (user.role === "admin") return <AdminDashboard />;
  return <PlaceholderPage title="Beranda" />;
}
