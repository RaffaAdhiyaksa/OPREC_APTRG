import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { announcementsService } from "@/services/announcements";
import type { AnnouncementPayload } from "@/types/api";

export function useAnnouncements() {
  return useQuery({ queryKey: queryKeys.announcements, queryFn: announcementsService.list });
}

export function useSentAnnouncements(enabled: boolean) {
  return useQuery({ queryKey: queryKeys.announcementsSent, queryFn: announcementsService.sent, enabled });
}

function useInvalidateAnnouncements() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.announcementsAll }),
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard }),
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll }),
    ]);
}

export function useCreateAnnouncement() {
  const invalidate = useInvalidateAnnouncements();
  return useMutation({ mutationFn: (payload: AnnouncementPayload) => announcementsService.create(payload), onSuccess: invalidate });
}

export function useDeleteAnnouncement() {
  const invalidate = useInvalidateAnnouncements();
  return useMutation({ mutationFn: (id: number) => announcementsService.remove(id), onSuccess: invalidate });
}

export function useMarkAnnouncementRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => announcementsService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.announcements }),
  });
}
