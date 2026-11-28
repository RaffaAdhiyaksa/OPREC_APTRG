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
  position: string | null;
}

/** One `UserResource` for login, `/auth/me` and every admin endpoint. */
export interface User {
  id: number;
  name: string;
  email: string;
  nim: string | null;
  phone: string | null;
  role: Role;
  is_coordinator: boolean;
  is_active: boolean;
  must_change_password: boolean;
  research_division: DivisionRef | null;
  competition_divisions: CompetitionDivisionRef[];
  permissions: Permission[];
  avatar_url: string | null;
  last_login_at: string | null;
  created_at: string;
}

/** `GET /auth/me` adds the unread badge count. */
export interface Me extends User {
  unread_notifications_count: number;
}

export interface DataResponse<T> {
  data: T;
  message?: string;
}

/** Laravel paginator `meta` (`meta.links` is not used). */
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
  path: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: { first: string | null; last: string | null; prev: string | null; next: string | null };
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
  | "VALIDATION_ERROR"
  | "TOO_MANY_REQUESTS"
  | "CANNOT_CHANGE_OWN_ROLE"
  | "CANNOT_DEACTIVATE_SELF"
  | "CANNOT_DELETE_SELF"
  | "CANNOT_RESET_SELF"
  | "LAST_ADMIN"
  | "NOT_ASISTEN_AKTIF"
  | "DIVISION_NOT_OPTIONAL"
  | "ALREADY_PUBLISHED"
  | "FILE_TOO_LARGE"
  | "PAYLOAD_TOO_LARGE"
  | "DEADLINE_PASSED"
  | "GRADE_LOCKED"
  | "RESTORE_CONFLICT"
  | "NOT_DELETED"
  | "IMPORT_INVALID"
  | "IMPORT_TOO_LARGE";

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

// ---------------------------------------------------------------------------
// Domains below follow PRD §7. Until the backend builds them, services mock them.
// ---------------------------------------------------------------------------

export type DivisionType = "research" | "competition";

export interface Division {
  id: number;
  slug: string;
  name: string;
  type: DivisionType;
  team_name: string | null;
  is_optional: boolean;
  is_active: boolean;
  sort_order: number;
  /** Admin only. */
  members_count?: number;
}

export interface PersonRef {
  id: number;
  name: string;
}

export interface UserSummary extends PersonRef {
  email: string;
  nim: string | null;
}

/** `/admin/users` returns the same `UserResource`. */
export type AdminUser = User;

export interface UserListParams {
  search?: string;
  role?: Role;
  division_id?: number;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export interface UserPayload {
  name: string;
  email: string;
  nim: string | null;
  phone: string | null;
  role: Role;
  research_division_id: number | null;
  is_coordinator: boolean;
  /** Create only. `null` lets the server generate a temporary password. */
  password?: string | null;
}

/** Create and reset-password responses carry the temporary password exactly once. */
export interface TemporaryPasswordResult {
  user: AdminUser;
  temporary_password: string | null;
}

/** `POST /admin/users/import` (201). Passwords are shown exactly once. */
export interface UserImportResult {
  created_count: number;
  users: { name: string; email: string; temporary_password: string }[];
}

export interface AdminDashboard {
  users: { admin: number; asisten_aktif: number; asisten_magang: number; inactive: number };
  pending_grading: number;
  divisions: {
    division: DivisionRef;
    asisten_aktif: number;
    asisten_magang: number;
    /** Published assignments only. */
    assignments_published: number;
    /** Submissions without a published grade (none yet, or a draft). */
    pending_grading: number;
  }[];
  recent_announcements: Announcement[];
}

export type MaterialSourceType = "youtube" | "drive" | "other";

export interface Material {
  id: number;
  division: DivisionRef;
  title: string;
  description: string | null;
  source_type: MaterialSourceType;
  url: string;
  embed_url: string | null;
  sort_order: number;
  is_published: boolean;
  author: PersonRef;
  created_at: string;
  updated_at: string;
}

export interface MaterialListParams {
  search?: string;
  source_type?: MaterialSourceType;
  division_id?: number;
}

export interface MaterialPayload {
  title: string;
  description: string | null;
  url: string;
  is_published: boolean;
  /** Required for admin, ignored for asisten_aktif (server uses their division). */
  division_id?: number;
}

export type AssignmentStatus = "draft" | "published";
export type GradeStatus = "draft" | "published";

export interface AssignmentStats {
  total_interns: number;
  submitted: number;
  late: number;
  graded_draft: number;
  graded_published: number;
}

export type SubmissionMethod = "file" | "drive" | "both";

export interface Submission {
  id: number;
  method: SubmissionMethod;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  drive_link: string | null;
  note: string | null;
  is_late: boolean;
  submitted_at: string;
}

export interface Grade {
  id: number;
  score: number;
  feedback: string | null;
  status: GradeStatus;
  published_at: string | null;
  graded_by: PersonRef | null;
  updated_at: string;
}

export interface Assignment {
  id: number;
  division: DivisionRef;
  title: string;
  description: string;
  due_at: string;
  allow_late: boolean;
  max_file_size_mb: number;
  allowed_extensions: string[] | null;
  max_score: number;
  status: AssignmentStatus;
  published_at: string | null;
  author: PersonRef;
  created_at: string;
  /** Staff view only. */
  stats?: AssignmentStats;
  /** Intern view only. */
  is_overdue?: boolean;
  can_submit?: boolean;
  my_submission?: Submission | null;
  /** Always null while the grade is a draft (filtered server-side). */
  my_grade?: Grade | null;
}

export interface AssignmentListParams {
  status?: AssignmentStatus;
  search?: string;
  due?: "upcoming" | "past";
  division_id?: number;
}

export interface AssignmentPayload {
  title: string;
  description: string;
  due_at: string;
  allow_late: boolean;
  max_file_size_mb: number;
  allowed_extensions: string[] | null;
  max_score: number;
  division_id?: number;
}

export interface SubmissionRow {
  user: UserSummary;
  submission: Submission | null;
  grade: Grade | null;
}

export interface SubmissionCounts {
  total: number;
  submitted: number;
  missing: number;
  late: number;
  graded_draft: number;
  graded_published: number;
}

export interface SubmitPayload {
  file: File | null;
  drive_link: string | null;
  note: string | null;
}

export interface GradePayload {
  score: number;
  feedback: string | null;
}

export interface MyGrade {
  id: number;
  assignment: { id: number; title: string; max_score: number };
  score: number;
  feedback: string | null;
  published_at: string;
}

export interface MyGradesSummary {
  average: number | null;
  graded_count: number;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  author: PersonRef;
  target: { division: DivisionRef | null; role: Role | null };
  recipients_count: number;
  is_read: boolean;
  created_at: string;
}

export interface AnnouncementPayload {
  title: string;
  body: string;
  /** Admin only; the server forces both fields for coordinators. */
  research_division_id?: number | null;
  target_role?: Role | null;
}

export type NotificationType = "announcement" | "assignment_published" | "grade_published" | "grade_updated";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  excerpt: string;
  /** Frontend path, not an API URL. */
  link: string;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListMeta extends PaginationMeta {
  unread_count: number;
}
