// Shapes mirror the Laravel API Resources (PRD §6–7). Domain types are added per phase.

export type Role = "admin" | "asisten_aktif" | "asisten_magang";

export type Permission =
  | "user.manage"
  | "material.manage"
  | "assignment.manage"
  | "grade.publish"
  | "announcement.send";

export interface DivisionRef {
  id: number;
  slug: string;
  name: string;
}

export interface CompetitionDivisionRef {
  id: number;
  name: string;
  team_name: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  nim: string | null;
  role: Role;
  is_coordinator: boolean;
  is_active: boolean;
  must_change_password: boolean;
  research_division: DivisionRef | null;
  competition_divisions: CompetitionDivisionRef[];
  permissions: Permission[];
}

/** `GET /auth/me` adds the unread badge count. */
export interface Me extends User {
  unread_notifications_count: number;
}

export interface DataResponse<T> {
  data: T;
  message?: string;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface MessageResponse {
  message: string;
}

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "ACCOUNT_INACTIVE"
  | "PASSWORD_CHANGE_REQUIRED"
  | "NOT_FOUND"
  | "DEADLINE_PASSED"
  | "GRADE_LOCKED"
  | "PAYLOAD_TOO_LARGE"
  | "VALIDATION_ERROR"
  | "FILE_TOO_LARGE"
  | "DIVISION_NOT_OPTIONAL"
  | "TOO_MANY_REQUESTS";

/** Error envelope returned by every endpoint. */
export interface ApiErrorBody {
  message: string;
  code?: ApiErrorCode;
  errors?: Record<string, string[]>;
}

export interface LoginPayload {
  login: string;
  password: string;
}

export interface LoginResult {
  token: string;
  token_type: "Bearer";
  user: User;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}
