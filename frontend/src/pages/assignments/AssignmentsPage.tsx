import { useCurrentUser } from "@/hooks/useAuth";
import InternAssignmentList from "./InternAssignmentList";
import StaffAssignmentList from "./StaffAssignmentList";

export default function AssignmentsPage() {
  const user = useCurrentUser();
  if (user.role === "asisten_magang") return <InternAssignmentList />;
  return <StaffAssignmentList />;
}
