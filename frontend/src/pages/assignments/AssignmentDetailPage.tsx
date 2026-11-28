import { Link, useParams } from "react-router";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaceholderPage } from "@/components/shared/PlaceholderPage";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { useAssignment } from "@/hooks/queries/assignments";
import { useCurrentUser } from "@/hooks/useAuth";
import { toApiError } from "@/lib/errors";
import StaffAssignmentDetail from "./StaffAssignmentDetail";

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const user = useCurrentUser();
  const query = useAssignment(Number(id));

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-2/3 rounded-xl" />
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }
  if (query.isError) {
    // Another division's assignment is a 404 too, so existence never leaks.
    if (toApiError(query.error).status === 404) {
      return (
        <EmptyState
          icon={SearchX}
          title="Tugas tidak ditemukan."
          description="Tugas mungkin sudah dihapus atau bukan untuk divisi Anda."
          action={
            <Button asChild variant="outline">
              <Link to="/assignments">
                <ArrowLeft aria-hidden /> Kembali ke daftar tugas
              </Link>
            </Button>
          }
        />
      );
    }
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }
  if (user.role === "asisten_magang") return <PlaceholderPage title="Detail Tugas" />;
  return <StaffAssignmentDetail assignment={query.data} />;
}
