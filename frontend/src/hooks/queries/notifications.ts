import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { notificationsService } from "@/services/notifications";

const POLL_MS = 60_000;

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: notificationsService.unreadCount,
    // PRD: badge refreshes by polling every 60 s (no WebSocket).
    refetchInterval: POLL_MS,
    staleTime: POLL_MS,
  });
}

export function useNotifications(params: { unread?: boolean; page?: number }) {
  return useQuery({
    queryKey: queryKeys.notifications(params),
    queryFn: () => notificationsService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsService.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll }),
  });
}
