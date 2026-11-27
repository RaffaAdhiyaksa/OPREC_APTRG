import { PlaceholderPage } from "@/components/shared/PlaceholderPage";
import { useCurrentUser } from "@/hooks/useAuth";
import StaffAssignmentList from "./StaffAssignmentList";

export default function AssignmentsPage() {
  const user = useCurrentUser();
  if (user.role === "asisten_magang") return <PlaceholderPage title="Tugas" />;
  return <StaffAssignmentList />;
}
