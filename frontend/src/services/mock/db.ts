// In-memory stand-in for backend endpoints that are not built yet (VITE_USE_MOCKS=true).
// It mimics the backend rules from CLAUDE.md §5 (division isolation with 404, draft grades
// hidden from interns, coordinator announcement targeting) so the UI behaves the same once
// the real API replaces it. State survives a page reload within the tab (sessionStorage).
import { ApiError } from "@/lib/errors";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import type {
  AdminUser,
  ApiErrorCode,
  AssignmentStatus,
  DivisionRef,
  DivisionType,
  GradeStatus,
  Me,
  MaterialSourceType,
  NotificationType,
  PaginationMeta,
  Permission,
  PersonRef,
  Role,
  UserSummary,
} from "@/types/api";

export interface UserRow {
  id: number;
  name: string;
  email: string;
  nim: string | null;
  phone: string | null;
  role: Role;
  research_division_id: number | null;
  is_coordinator: boolean;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface DivisionRow {
  id: number;
  slug: string;
  name: string;
  type: DivisionType;
  team_name: string | null;
  is_optional: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface MaterialRow {
  id: number;
  division_id: number;
  created_by: number;
  title: string;
  description: string | null;
  source_type: MaterialSourceType;
  url: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssignmentRow {
  id: number;
  division_id: number;
  created_by: number;
  title: string;
  description: string;
  due_at: string;
  allow_late: boolean;
  max_file_size_mb: number;
  allowed_extensions: string[] | null;
  max_score: number;
  status: AssignmentStatus;
  published_at: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface SubmissionDbRow {
  id: number;
  assignment_id: number;
  user_id: number;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  drive_link: string | null;
  note: string | null;
  is_late: boolean;
  submitted_at: string;
}

export interface GradeRow {
  id: number;
  assignment_id: number;
  user_id: number;
  submission_id: number | null;
  graded_by: number;
  score: number;
  feedback: string | null;
  status: GradeStatus;
  published_at: string | null;
  updated_at: string;
}

export interface AnnouncementRow {
  id: number;
  author_id: number;
  title: string;
  body: string;
  research_division_id: number | null;
  target_role: Role | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: number;
  type: NotificationType;
  title: string;
  excerpt: string;
  link: string;
  read_at: string | null;
  created_at: string;
}

interface State {
  users: UserRow[];
  divisions: DivisionRow[];
  competition_members: { user_id: number; division_id: number; position: string | null }[];
  materials: MaterialRow[];
  assignments: AssignmentRow[];
  submissions: SubmissionDbRow[];
  grades: GradeRow[];
  announcements: AnnouncementRow[];
  announcement_reads: { announcement_id: number; user_id: number; read_at: string }[];
  notifications: NotificationRow[];
}

const STORAGE_KEY = "aptrg_mock_db_v1";

const iso = (offsetHours: number) => new Date(Date.now() + offsetHours * 3_600_000).toISOString();

function seed(): State {
  const users: UserRow[] = [
    // Ids 1–5 match backend/database/seeders/UserSeeder.php so the real /auth/me user maps onto mock data.
    { id: 1, name: "Admin APTRG", email: "admin@aptrg.test", nim: null, role: "admin", research_division_id: null, is_coordinator: false },
    { id: 2, name: "Koordinator System", email: "koordinator@aptrg.test", nim: null, role: "asisten_aktif", research_division_id: 2, is_coordinator: true },
    { id: 3, name: "Asisten Aktif Mechanic", email: "aktif@aptrg.test", nim: null, role: "asisten_aktif", research_division_id: 1, is_coordinator: false },
    { id: 4, name: "Magang System", email: "magang1@aptrg.test", nim: null, role: "asisten_magang", research_division_id: 2, is_coordinator: false },
    { id: 5, name: "Magang Mechanic", email: "magang2@aptrg.test", nim: null, role: "asisten_magang", research_division_id: 1, is_coordinator: false },
    { id: 6, name: "Rani Putri", email: "rani@aptrg.test", nim: "2210511061", role: "asisten_magang", research_division_id: 2, is_coordinator: false },
    { id: 7, name: "Bima Pratama", email: "bima@aptrg.test", nim: "2210511072", role: "asisten_magang", research_division_id: 2, is_coordinator: false },
    { id: 8, name: "Citra Lestari", email: "citra@aptrg.test", nim: "2210511083", role: "asisten_magang", research_division_id: 1, is_coordinator: false },
    { id: 9, name: "Dimas Arya", email: "dimas@aptrg.test", nim: "2210511094", role: "asisten_magang", research_division_id: 3, is_coordinator: false },
    { id: 10, name: "Eka Saputra", email: "eka@aptrg.test", nim: "2110511010", role: "asisten_aktif", research_division_id: 3, is_coordinator: true },
    { id: 11, name: "Fajar Nugroho", email: "fajar@aptrg.test", nim: "2210511105", role: "asisten_magang", research_division_id: 4, is_coordinator: false, is_active: false },
    { id: 12, name: "Gita Maharani", email: "gita@aptrg.test", nim: "2110511012", role: "asisten_aktif", research_division_id: 4, is_coordinator: false },
  ].map((u) => ({
    phone: null,
    is_active: true,
    must_change_password: false,
    last_login_at: u.id <= 5 ? iso(-2) : null,
    created_at: iso(-24 * 30),
    deleted_at: null,
    ...u,
  })) as UserRow[];

  const divisions: DivisionRow[] = [
    { id: 1, slug: "mechanic", name: "Mechanic", type: "research", team_name: null, is_optional: false, is_active: true, sort_order: 1 },
    { id: 2, slug: "system", name: "System", type: "research", team_name: null, is_optional: false, is_active: true, sort_order: 2 },
    { id: 3, slug: "gcs", name: "Ground Control Station (GCS)", type: "research", team_name: null, is_optional: false, is_active: true, sort_order: 3 },
    { id: 4, slug: "non-technical", name: "Non-Technical", type: "research", team_name: null, is_optional: false, is_active: true, sort_order: 4 },
    { id: 5, slug: "fixed-wing", name: "Fixed Wing", type: "competition", team_name: "Bangau Team", is_optional: false, is_active: true, sort_order: 5 },
    { id: 6, slug: "racing-plane", name: "Racing Plane", type: "competition", team_name: "Frigate Team", is_optional: false, is_active: true, sort_order: 6 },
    { id: 7, slug: "lela", name: "LELA (Long Endurance Low Altitude)", type: "competition", team_name: "Strix Team", is_optional: false, is_active: true, sort_order: 7 },
    { id: 8, slug: "teknofest", name: "Teknofest", type: "competition", team_name: "Avalerion Team", is_optional: true, is_active: false, sort_order: 8 },
  ];

  const material = (m: Omit<MaterialRow, "created_at" | "updated_at">): MaterialRow => ({ ...m, created_at: iso(-24 * 10 + m.id), updated_at: iso(-24 * 10 + m.id) });
  const materials: MaterialRow[] = [
    material({ id: 1, division_id: 2, created_by: 2, title: "Pengenalan Flight Controller", description: "Arsitektur Pixhawk, sensor IMU, dan alur data telemetri.", source_type: "youtube", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", sort_order: 1, is_published: true }),
    material({ id: 2, division_id: 2, created_by: 2, title: "Modul Wiring & Power Distribution", description: "Diagram kelistrikan wahana dan aturan keselamatan baterai LiPo.", source_type: "drive", url: "https://drive.google.com/file/d/1-modul-wiring/view", sort_order: 2, is_published: true }),
    material({ id: 3, division_id: 2, created_by: 2, title: "Dokumentasi ArduPilot", description: "Referensi parameter dan mode terbang.", source_type: "other", url: "https://ardupilot.org/plane/", sort_order: 3, is_published: true }),
    material({ id: 4, division_id: 2, created_by: 2, title: "Tuning PID (draf)", description: "Belum final, menunggu hasil flight test.", source_type: "youtube", url: "https://youtu.be/aqz-KE-bpKQ", sort_order: 4, is_published: false }),
    material({ id: 5, division_id: 1, created_by: 3, title: "Dasar Aerodinamika Fixed Wing", description: "Gaya angkat, hambatan, dan pusat gravitasi.", source_type: "youtube", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", sort_order: 1, is_published: true }),
    material({ id: 6, division_id: 1, created_by: 3, title: "Panduan Fabrikasi Airframe", description: "Teknik laminasi dan pemotongan foam.", source_type: "drive", url: "https://docs.google.com/document/d/1-fabrikasi/edit", sort_order: 2, is_published: true }),
    material({ id: 7, division_id: 3, created_by: 10, title: "Mission Planner untuk Pemula", description: null, source_type: "youtube", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", sort_order: 1, is_published: true }),
  ];

  const assignment = (a: Partial<AssignmentRow> & Pick<AssignmentRow, "id" | "division_id" | "created_by" | "title" | "due_at">): AssignmentRow => ({
    description: "",
    allow_late: false,
    max_file_size_mb: 10,
    allowed_extensions: null,
    max_score: 100,
    status: "published",
    published_at: iso(-24 * 7),
    created_at: iso(-24 * 8),
    deleted_at: null,
    ...a,
  });
  const assignments: AssignmentRow[] = [
    assignment({ id: 1, division_id: 2, created_by: 2, title: "Laporan Analisis Telemetri", due_at: iso(48), max_file_size_mb: 10, allowed_extensions: ["pdf", "zip"],
      description: "Analisis log telemetri dari flight test minggu lalu.\n\nSertakan grafik ketinggian, kecepatan, dan status baterai. Jelaskan anomali yang ditemukan beserta dugaan penyebabnya." }),
    assignment({ id: 2, division_id: 2, created_by: 2, title: "Quiz Wiring Diagram", due_at: iso(6), max_file_size_mb: 5, allowed_extensions: ["pdf", "png", "jpg", "jpeg"],
      description: "Gambar ulang wiring diagram wahana latih lengkap dengan rating konektor." }),
    assignment({ id: 3, division_id: 2, created_by: 2, title: "Ringkasan Modul Flight Controller", due_at: iso(-72), allow_late: true,
      description: "Ringkas materi Pengenalan Flight Controller maksimal 2 halaman." }),
    assignment({ id: 4, division_id: 2, created_by: 2, title: "Rancangan Sistem Failsafe", due_at: iso(24 * 10), status: "draft", published_at: null,
      description: "Draf: rancang skenario failsafe untuk kehilangan sinyal RC dan GPS." }),
    assignment({ id: 5, division_id: 1, created_by: 3, title: "Desain Sayap 3D", due_at: iso(96), max_file_size_mb: 20, allowed_extensions: ["zip", "pdf"],
      description: "Buat desain sayap dengan airfoil pilihan Anda dan sertakan perhitungan luas." }),
    assignment({ id: 6, division_id: 1, created_by: 3, title: "Laporan Fabrikasi Minggu 1", due_at: iso(-24),
      description: "Dokumentasi proses fabrikasi beserta foto." }),
  ];

  const submissions: SubmissionDbRow[] = [
    { id: 1, assignment_id: 3, user_id: 4, file_name: "ringkasan-fc.pdf", file_size: 820_000, mime_type: "application/pdf", drive_link: null, note: null, is_late: false, submitted_at: iso(-80) },
    { id: 2, assignment_id: 3, user_id: 6, file_name: null, file_size: null, mime_type: null, drive_link: "https://drive.google.com/file/d/1-rani-ringkasan/view", note: "File besar, saya kirim lewat Drive.", is_late: false, submitted_at: iso(-75) },
    { id: 3, assignment_id: 3, user_id: 7, file_name: "ringkasan_bima.pdf", file_size: 640_000, mime_type: "application/pdf", drive_link: null, note: null, is_late: true, submitted_at: iso(-60) },
    { id: 4, assignment_id: 1, user_id: 6, file_name: "telemetri-rani.zip", file_size: 6_400_000, mime_type: "application/zip", drive_link: null, note: null, is_late: false, submitted_at: iso(-5) },
    { id: 5, assignment_id: 6, user_id: 5, file_name: "fabrikasi-minggu1.pdf", file_size: 2_100_000, mime_type: "application/pdf", drive_link: null, note: null, is_late: false, submitted_at: iso(-30) },
    { id: 6, assignment_id: 6, user_id: 8, file_name: null, file_size: null, mime_type: null, drive_link: "https://drive.google.com/drive/folders/1-citra", note: null, is_late: false, submitted_at: iso(-28) },
  ];

  const grades: GradeRow[] = [
    { id: 1, assignment_id: 3, user_id: 4, submission_id: 1, graded_by: 2, score: 88, feedback: "Ringkas dan jelas. Tambahkan diagram blok di laporan berikutnya.", status: "published", published_at: iso(-20), updated_at: iso(-20) },
    { id: 2, assignment_id: 3, user_id: 6, submission_id: 2, graded_by: 2, score: 75, feedback: "Struktur sudah baik, beberapa istilah kurang tepat.", status: "draft", published_at: null, updated_at: iso(-10) },
    { id: 3, assignment_id: 6, user_id: 5, submission_id: 5, graded_by: 3, score: 90, feedback: "Dokumentasi foto sangat lengkap.", status: "published", published_at: iso(-12), updated_at: iso(-12) },
  ];

  const announcements: AnnouncementRow[] = [
    { id: 1, author_id: 1, title: "Selamat datang di APTRG LMS", body: "Semua materi, tugas, dan nilai Asisten Magang kini dikelola di LMS ini. Hubungi admin jika ada kendala akun.", research_division_id: null, target_role: null, created_at: iso(-24 * 6) },
    { id: 2, author_id: 2, title: "Flight test hari Sabtu", body: "Flight test divisi System dimulai pukul 07.00 di lapangan. Bawa laptop dengan Mission Planner terpasang.", research_division_id: 2, target_role: "asisten_magang", created_at: iso(-30) },
    { id: 3, author_id: 1, title: "Rapat koordinasi asisten aktif", body: "Rapat evaluasi program magang hari Jumat pukul 16.00 di ruang lab.", research_division_id: null, target_role: "asisten_aktif", created_at: iso(-12) },
    { id: 4, author_id: 3, title: "Jadwal fabrikasi Mechanic", body: "Fabrikasi airframe dilanjutkan Rabu dan Kamis. Gunakan APD lengkap.", research_division_id: 1, target_role: "asisten_magang", created_at: iso(-8) },
  ];

  const notification = (n: Omit<NotificationRow, "id">, index: number): NotificationRow => ({ ...n, id: `seed-${index}` });
  const notifications: NotificationRow[] = [
    { user_id: 4, type: "assignment_published", title: "Tugas baru: Laporan Analisis Telemetri", excerpt: "Deadline 2 hari lagi.", link: "/assignments/1", read_at: null, created_at: iso(-24 * 7) },
    { user_id: 4, type: "assignment_published", title: "Tugas baru: Quiz Wiring Diagram", excerpt: "Deadline hari ini.", link: "/assignments/2", read_at: null, created_at: iso(-24 * 6) },
    { user_id: 4, type: "grade_published", title: "Nilai Ringkasan Modul Flight Controller sudah keluar", excerpt: "Skor: 88", link: "/assignments/3", read_at: iso(-19), created_at: iso(-20) },
    { user_id: 4, type: "announcement", title: "Flight test hari Sabtu", excerpt: "Flight test divisi System dimulai pukul 07.00 di lapangan.", link: "/announcements?open=2", read_at: null, created_at: iso(-30) },
    { user_id: 5, type: "grade_published", title: "Nilai Laporan Fabrikasi Minggu 1 sudah keluar", excerpt: "Skor: 90", link: "/assignments/6", read_at: null, created_at: iso(-12) },
    { user_id: 5, type: "announcement", title: "Jadwal fabrikasi Mechanic", excerpt: "Fabrikasi airframe dilanjutkan Rabu dan Kamis.", link: "/announcements?open=4", read_at: null, created_at: iso(-8) },
    { user_id: 2, type: "announcement", title: "Rapat koordinasi asisten aktif", excerpt: "Rapat evaluasi program magang hari Jumat pukul 16.00.", link: "/announcements?open=3", read_at: null, created_at: iso(-12) },
    { user_id: 3, type: "announcement", title: "Rapat koordinasi asisten aktif", excerpt: "Rapat evaluasi program magang hari Jumat pukul 16.00.", link: "/announcements?open=3", read_at: null, created_at: iso(-12) },
  ].map((n, i) => notification(n as Omit<NotificationRow, "id">, i));

  return {
    users,
    divisions,
    competition_members: [{ user_id: 2, division_id: 5, position: null }],
    materials,
    assignments,
    submissions,
    grades,
    announcements,
    announcement_reads: [{ announcement_id: 1, user_id: 4, read_at: iso(-24 * 5) }],
    notifications,
  };
}

function load(): State {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    // Corrupt or unavailable storage: start from the seed.
  }
  return seed();
}

export const db: State = load();

export function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Storage full or disabled: the in-memory state still works for this page load.
  }
}

// --- request helpers --------------------------------------------------------

export const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export function fail(status: number, code: ApiErrorCode, message: string, errors?: Record<string, string[]>): never {
  throw new ApiError(status, { message, code, errors });
}

export const notFound = (): never => fail(404, "NOT_FOUND", "Data tidak ditemukan.");
export const forbidden = (): never => fail(403, "FORBIDDEN", "Anda tidak memiliki akses.");
export const invalid = (errors: Record<string, string[]>): never =>
  fail(422, "VALIDATION_ERROR", Object.values(errors)[0][0], errors);

/** The real authenticated user (from `/auth/me`), mapped onto mock rows by id. */
export function currentUser(): Me {
  const me = queryClient.getQueryData<Me>(queryKeys.me);
  if (!me) fail(401, "UNAUTHENTICATED", "Tidak terautentikasi.");
  return me;
}

export const isAdmin = (u: { role: Role }) => u.role === "admin";
export const isStaff = (u: { role: Role }) => u.role === "admin" || u.role === "asisten_aktif";
export const isIntern = (u: { role: Role }) => u.role === "asisten_magang";

/** Division isolation: non-admins only see their own research division. */
export function inScope(user: Me, divisionId: number) {
  return isAdmin(user) || user.research_division?.id === divisionId;
}

export const now = () => new Date().toISOString();
export const nextId = (rows: { id: number }[]) => rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;

export function paginate<T>(items: T[], page = 1, perPage = 15): { data: T[]; meta: PaginationMeta } {
  const per = Math.min(Math.max(perPage, 1), 100);
  const lastPage = Math.max(1, Math.ceil(items.length / per));
  const current = Math.min(Math.max(page, 1), lastPage);
  return {
    data: items.slice((current - 1) * per, current * per),
    meta: { current_page: current, per_page: per, total: items.length, last_page: lastPage },
  };
}

// --- serializers (mirror the Laravel API Resources) ---------------------------

export function divisionRef(id: number | null): DivisionRef | null {
  const d = db.divisions.find((x) => x.id === id);
  return d ? { id: d.id, slug: d.slug, name: d.name } : null;
}

export function personRef(id: number): PersonRef {
  const u = db.users.find((x) => x.id === id);
  return { id, name: u?.name ?? "Pengguna dihapus" };
}

export function userSummary(u: UserRow): UserSummary {
  return { id: u.id, name: u.name, email: u.email, nim: u.nim };
}

export function permissionsFor(u: Pick<UserRow, "role" | "is_coordinator">): Permission[] {
  const staff = u.role === "admin" || u.role === "asisten_aktif";
  const list: Permission[] = [];
  if (staff) list.push("material.manage", "assignment.manage", "grade.publish");
  if (u.role === "admin" || (u.role === "asisten_aktif" && u.is_coordinator)) list.push("announcement.send");
  if (u.role === "admin") list.push("user.manage");
  return list;
}

export function toAdminUser(u: UserRow): AdminUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    nim: u.nim,
    phone: u.phone,
    role: u.role,
    is_coordinator: u.is_coordinator,
    is_active: u.is_active,
    must_change_password: u.must_change_password,
    research_division: divisionRef(u.research_division_id),
    competition_divisions: db.competition_members
      .filter((m) => m.user_id === u.id)
      .map((m) => db.divisions.find((d) => d.id === m.division_id)!)
      .map((d) => ({ id: d.id, name: d.name, team_name: d.team_name })),
    permissions: permissionsFor(u),
    last_login_at: u.last_login_at,
    created_at: u.created_at,
  };
}

export const activeUsers = () => db.users.filter((u) => u.deleted_at === null);

/** Interns of a research division (active, not deleted). */
export const internsOf = (divisionId: number) =>
  activeUsers().filter((u) => u.role === "asisten_magang" && u.research_division_id === divisionId && u.is_active);

export function notify(userIds: number[], n: Omit<NotificationRow, "id" | "user_id" | "read_at" | "created_at">) {
  const createdAt = now();
  for (const userId of userIds) {
    db.notifications.push({ ...n, id: crypto.randomUUID(), user_id: userId, read_at: null, created_at: createdAt });
  }
}
