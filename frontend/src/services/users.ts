import { isMocked } from "@/lib/env";
import { api } from "@/services/api";
import { mockUsers } from "@/services/mock/users";
import type {
  AdminDashboard,
  AdminUser,
  DataResponse,
  PaginatedResponse,
  TemporaryPasswordResult,
  UserImportResult,
  UserListParams,
  UserPayload,
} from "@/types/api";

/** Admin-only user management (PRD §7.2). */
export interface UsersService {
  dashboard(): Promise<AdminDashboard>;
  list(params: UserListParams): Promise<PaginatedResponse<AdminUser>>;
  create(payload: UserPayload): Promise<TemporaryPasswordResult>;
  update(id: number, payload: UserPayload): Promise<AdminUser>;
  setActive(id: number, isActive: boolean): Promise<AdminUser>;
  resetPassword(id: number): Promise<TemporaryPasswordResult>;
  remove(id: number): Promise<void>;
  /** 422 RESTORE_CONFLICT when an active user took the email/NIM meanwhile. */
  restore(id: number): Promise<AdminUser>;
  /** CSV `name,email,nim,phone,role,division_slug`, all rows or none. */
  importCsv(file: File): Promise<UserImportResult>;
}

const realUsers: UsersService = {
  async dashboard() {
    const { data } = await api.get<DataResponse<AdminDashboard>>("/admin/dashboard");
    return data.data;
  },
  async list(params) {
    const query = { ...params, is_active: params.is_active === undefined ? undefined : Number(params.is_active) };
    const { data } = await api.get<PaginatedResponse<AdminUser>>("/admin/users", { params: query });
    return data;
  },
  async create(payload) {
    const { data } = await api.post<DataResponse<TemporaryPasswordResult>>("/admin/users", payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await api.put<DataResponse<AdminUser>>(`/admin/users/${id}`, payload);
    return data.data;
  },
  async setActive(id, isActive) {
    const { data } = await api.patch<DataResponse<AdminUser>>(`/admin/users/${id}/status`, { is_active: isActive });
    return data.data;
  },
  async resetPassword(id) {
    const { data } = await api.post<DataResponse<TemporaryPasswordResult>>(`/admin/users/${id}/reset-password`);
    return data.data;
  },
  async remove(id) {
    await api.delete(`/admin/users/${id}`);
  },
  async restore(id) {
    const { data } = await api.post<DataResponse<AdminUser>>(`/admin/users/${id}/restore`);
    return data.data;
  },
  async importCsv(file) {
    const form = new FormData();
    form.append("file", file);
    // One bcrypt hash per row: 200 rows take ~40 s on the server.
    const { data } = await api.post<DataResponse<UserImportResult>>("/admin/users/import", form, { timeout: 120_000 });
    return data.data;
  },
};

export const usersService = isMocked("users") ? mockUsers : realUsers;
