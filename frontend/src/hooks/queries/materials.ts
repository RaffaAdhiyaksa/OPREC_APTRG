import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { materialsService } from "@/services/materials";
import type { Material, MaterialListParams, MaterialPayload } from "@/types/api";

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

/** Moves cards immediately; restores the previous order if the server rejects it. */
export function useReorderMaterials() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateMaterials();
  return useMutation({
    mutationFn: (order: number[]) => materialsService.reorder(order),
    onMutate: async (order) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.materialsAll });
      const snapshot = queryClient.getQueriesData<Material[]>({ queryKey: queryKeys.materialsAll });
      const rank = new Map(order.map((id, i) => [id, i]));
      queryClient.setQueriesData<Material[]>({ queryKey: queryKeys.materialsAll }, (list) => {
        if (!list) return list;
        // The reordered ids take the slots they already occupy, so other divisions stay put.
        const slots = list.flatMap((m, i) => (rank.has(m.id) ? [i] : []));
        const moved = slots.map((i) => list[i]).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
        const next = [...list];
        slots.forEach((slot, i) => (next[slot] = moved[i]));
        return next;
      });
      return { snapshot };
    },
    onError: (_error, _order, context) => context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data)),
    onSettled: invalidate,
  });
}
