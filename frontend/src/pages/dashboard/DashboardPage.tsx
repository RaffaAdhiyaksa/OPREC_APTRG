import { useCurrentUser } from "@/hooks/useAuth";
import AdminDashboard from "./AdminDashboard";
import AktifDashboard from "./AktifDashboard";
import MagangDashboard from "./MagangDashboard";

/** "/" shows the dashboard of the signed-in role. */
export default function DashboardPage() {
  const user = useCurrentUser();
  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "asisten_aktif":
      return <AktifDashboard />;
    case "asisten_magang":
      return <MagangDashboard />;
  }
}
