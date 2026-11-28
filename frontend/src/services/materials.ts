import { isMocked } from "@/lib/env";
import { api } from "@/services/api";
import { mockMaterials } from "@/services/mock/materials";
import type { DataResponse, Material, MaterialListParams, MaterialPayload, PaginatedResponse } from "@/types/api";

export interface MaterialsService {
  list(params: MaterialListParams): Promise<Material[]>;
  create(payload: MaterialPayload): Promise<Material>;
  update(id: number, payload: MaterialPayload): Promise<Material>;
  remove(id: number): Promise<void>;
  /** All ids must belong to one division. */
  reorder(order: number[]): Promise<void>;
}

const realMaterials: MaterialsService = {
  async list(params) {
    // shortcut: only the first 100 materials (server max per_page), add paging if a division ever exceeds that.
    const { data } = await api.get<PaginatedResponse<Material>>("/materials", { params: { ...params, per_page: 100 } });
    return data.data;
  },
  async create(payload) {
    const { data } = await api.post<DataResponse<Material>>("/materials", payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await api.put<DataResponse<Material>>(`/materials/${id}`, payload);
    return data.data;
  },
  async remove(id) {
    await api.delete(`/materials/${id}`);
  },
  async reorder(order) {
    await api.patch("/materials/reorder", { order });
  },
};

export const materialsService = isMocked("materials") ? mockMaterials : realMaterials;
