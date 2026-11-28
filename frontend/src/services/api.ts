import axios from "axios";
import { API_BASE_URL } from "@/lib/env";
import { toApiError, type ApiError } from "@/lib/errors";

const TOKEN_KEY = "aptrg_token";

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/**
 * Called for errors that change the session (401, ACCOUNT_INACTIVE, PASSWORD_CHANGE_REQUIRED).
 * AuthProvider registers it; route guards then redirect based on the new auth state.
 */
type SessionErrorHandler = (error: ApiError) => void;
let onSessionError: SessionErrorHandler | null = null;

export function setSessionErrorHandler(handler: SessionErrorHandler | null) {
  onSessionError = handler;
}

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (rawError) => {
    const error = toApiError(rawError);
    const isSessionError =
      error.code === "UNAUTHENTICATED" ||
      error.code === "ACCOUNT_INACTIVE" ||
      error.code === "PASSWORD_CHANGE_REQUIRED" ||
      (error.status === 401 && error.code === undefined);

    // A failed login is a 422/403 for the form to show, not a session change.
    const isLoginRequest = rawError?.config?.url === "/auth/login";
    if (isSessionError && !isLoginRequest) onSessionError?.(error);

    return Promise.reject(error);
  },
);
