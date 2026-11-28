import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { divisionsService } from "@/services/divisions";
import { usersService } from "@/services/users";
import type { UserListParams, UserPayload } from "@/types/api";

export function useDivisions() {
  return useQuery({ queryKey: queryKeys.divisions, queryFn: divisionsService.list, staleTime: 5 * 60_000 });
}

export function useSetDivisionActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => divisionsService.setActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.divisions }),
  });
}

export function useAdminDashboard() {
  return useQuery({ queryKey: queryKeys.adminDashboard, queryFn: usersService.dashboard });
}

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => usersService.list(params),
    placeholderData: keepPreviousData,
  });
}

/** User changes move dashboard and division member counts too. */
function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.usersAll }),
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard }),
      queryClient.invalidateQueries({ queryKey: queryKeys.divisions }),
    ]);
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: (payload: UserPayload) => usersService.create(payload), onSuccess: invalidate });
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserPayload }) => usersService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useSetUserActive() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => usersService.setActive(id, isActive),
    onSuccess: invalidate,
  });
}

export function useResetUserPassword() {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: (id: number) => usersService.resetPassword(id), onSuccess: invalidate });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: (id: number) => usersService.remove(id), onSuccess: invalidate });
}
