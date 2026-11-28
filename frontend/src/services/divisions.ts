import { isMocked } from "@/lib/env";
import { api } from "@/services/api";
import { mockDivisions } from "@/services/mock/divisions";
import type { DataResponse, Division } from "@/types/api";

export interface DivisionsService {
  /** Non-admins only receive active divisions. */
  list(): Promise<Division[]>;
  /** Admin, optional divisions only (422 DIVISION_NOT_OPTIONAL otherwise). */
  setActive(id: number, isActive: boolean): Promise<Division>;
}

const realDivisions: DivisionsService = {
  async list() {
    const { data } = await api.get<DataResponse<Division[]>>("/divisions");
    return data.data;
  },
  async setActive(id, isActive) {
    const { data } = await api.patch<DataResponse<Division>>(`/admin/divisions/${id}`, { is_active: isActive });
    return data.data;
  },
};

export const divisionsService = isMocked("divisions") ? mockDivisions : realDivisions;
