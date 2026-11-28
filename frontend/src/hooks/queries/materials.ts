import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { materialsService } from "@/services/materials";
import type { MaterialListParams, MaterialPayload } from "@/types/api";

export function useMaterials(params: MaterialListParams = {}) {
  return useQuery({ queryKey: queryKeys.materials(params), queryFn: () => materialsService.list(params) });
}

function useInvalidateMaterials() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.materialsAll });
}

export function useSaveMaterial() {
  const invalidate = useInvalidateMaterials();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: MaterialPayload }) =>
      id ? materialsService.update(id, payload) : materialsService.create(payload),
    onSuccess: invalidate,
  });
}

export function useDeleteMaterial() {
  const invalidate = useInvalidateMaterials();
  return useMutation({ mutationFn: (id: number) => materialsService.remove(id), onSuccess: invalidate });
}

export function useReorderMaterials() {
  const invalidate = useInvalidateMaterials();
  return useMutation({ mutationFn: (order: number[]) => materialsService.reorder(order), onSettled: invalidate });
}
