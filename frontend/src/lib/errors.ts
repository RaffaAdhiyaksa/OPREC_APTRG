import { isAxiosError } from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ApiErrorBody, ApiErrorCode } from "@/types/api";

const FALLBACK_MESSAGE = "Terjadi kesalahan. Coba lagi.";
const NETWORK_MESSAGE = "Tidak dapat terhubung ke server. Periksa koneksi Anda.";

/** Normalized error thrown by every service (real API or mock). */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: ApiErrorCode;
  readonly errors?: Record<string, string[]>;
  /** Seconds from the `Retry-After` header on 429. */
  readonly retryAfter?: number;

  constructor(status: number, body: ApiErrorBody, retryAfter?: number) {
    super(body.message || FALLBACK_MESSAGE);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.errors = body.errors;
    this.retryAfter = retryAfter;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError<ApiErrorBody>(error)) {
    const response = error.response;
    if (!response) return new ApiError(0, { message: NETWORK_MESSAGE });

    const retryHeader = Number(response.headers["retry-after"]);
    const body = response.data && typeof response.data === "object" ? response.data : { message: FALLBACK_MESSAGE };
    return new ApiError(response.status, body, Number.isFinite(retryHeader) ? retryHeader : undefined);
  }

  return new ApiError(0, { message: FALLBACK_MESSAGE });
}

export function getErrorMessage(error: unknown): string {
  return toApiError(error).message;
}

/**
 * Maps a 422 `errors` object onto react-hook-form fields. Returns true when at least one
 * field was set, so the caller can skip the generic toast.
 */
export function applyFieldErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>): boolean {
  const { errors } = toApiError(error);
  if (!errors) return false;

  const entries = Object.entries(errors);
  entries.forEach(([field, messages], index) => {
    setError(field as Path<T>, { type: "server", message: messages[0] }, { shouldFocus: index === 0 });
  });
  return entries.length > 0;
}
