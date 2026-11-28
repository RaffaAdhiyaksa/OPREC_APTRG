import { api } from "@/services/api";
import type {
  ChangePasswordPayload,
  DataResponse,
  LoginPayload,
  LoginResult,
  Me,
  MessageResponse,
} from "@/types/api";

// Auth always talks to the real backend (never mocked).

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const { data } = await api.post<DataResponse<LoginResult>>("/auth/login", { ...payload, device_name: "web" });
  return data.data;
}

export async function getMe(): Promise<Me> {
  const { data } = await api.get<DataResponse<Me>>("/auth/me");
  return data.data;
}

export async function logout(): Promise<void> {
  await api.post<MessageResponse>("/auth/logout");
}

export async function changePassword(payload: ChangePasswordPayload): Promise<MessageResponse> {
  const { data } = await api.put<MessageResponse>("/auth/password", payload);
  return data;
}
