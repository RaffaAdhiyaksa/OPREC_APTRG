import type { UsersService } from "@/services/users";
import type { UserPayload } from "@/types/api";
import { toAnnouncement } from "./announcements";
import {
  activeUsers,
  currentUser,
  db,
  delay,
  divisionRef,
  fail,
  forbidden,
  invalid,
  isAdmin,
  nextId,
  notFound,
  now,
  paginate,
  persist,
  toAdminUser,
  type UserRow,
} from "./db";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ["admin", "asisten_aktif", "asisten_magang"];

function requireAdmin() {
  const me = currentUser();
  if (!isAdmin(me)) forbidden();
  return me;
}

function temporaryPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const base = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  // Guarantee the backend password rule (letters + digits).
  return base.slice(0, 10) + "a" + (bytes[0] % 10);
}

function findUser(id: number) {
  return activeUsers().find((u) => u.id === id) ?? notFound();
}

const otherActiveAdmins = (exceptId: number) =>
  activeUsers().filter((u) => u.role === "admin" && u.is_active && u.id !== exceptId).length;

function validate(payload: UserPayload, existingId?: number) {
  const errors: Record<string, string[]> = {};
  const name = payload.name?.trim() ?? "";
  const email = payload.email?.trim().toLowerCase() ?? "";
  const nim = payload.nim?.trim() || null;

  if (!name) errors.name = ["Nama wajib diisi."];
  if (!email) errors.email = ["Email wajib diisi."];
  else if (!EMAIL.test(email)) errors.email = ["Format email tidak valid."];
  else if (activeUsers().some((u) => u.email === email && u.id !== existingId)) errors.email = ["Email sudah dipakai."];
  if (nim && activeUsers().some((u) => u.nim === nim && u.id !== existingId)) errors.nim = ["NIM sudah dipakai."];
  if (!ROLES.includes(payload.role)) errors.role = ["Role tidak valid."];
  if (payload.role !== "admin") {
    const division = db.divisions.find((d) => d.id === payload.research_division_id);
    if (!division || division.type !== "research") errors.research_division_id = ["Divisi riset wajib dipilih."];
  }
  if (payload.password && (payload.password.length < 8 || !/[a-zA-Z]/.test(payload.password) || !/\d/.test(payload.password))) {
    errors.password = ["Password minimal 8 karakter dan berisi huruf serta angka."];
  }
  if (Object.keys(errors).length) invalid(errors);

  return {
    name,
    email,
    nim,
    phone: payload.phone?.trim() || null,
    role: payload.role,
    // Same invariants as the User model's saving hook.
    research_division_id: payload.role === "admin" ? null : payload.research_division_id,
    is_coordinator: payload.role === "asisten_aktif" && payload.is_coordinator,
  };
}

export const mockUsers: UsersService = {
  async dashboard() {
    await delay();
    const me = requireAdmin();
    const users = activeUsers();
    const pendingIn = (assignmentIds: number[]) =>
      db.submissions.filter(
        (s) =>
          assignmentIds.includes(s.assignment_id) &&
          !db.grades.some((g) => g.assignment_id === s.assignment_id && g.user_id === s.user_id && g.status === "published"),
      ).length;
    const liveAssignments = db.assignments.filter((a) => a.deleted_at === null);

    const divisions = db.divisions
      .filter((d) => d.type === "research")
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((d) => {
        const ids = liveAssignments.filter((a) => a.division_id === d.id).map((a) => a.id);
        const published = liveAssignments.filter((a) => a.division_id === d.id && a.status === "published").length;
        return {
          division: divisionRef(d.id)!,
          asisten_aktif: users.filter((u) => u.role === "asisten_aktif" && u.research_division_id === d.id && u.is_active).length,
          asisten_magang: users.filter((u) => u.role === "asisten_magang" && u.research_division_id === d.id && u.is_active).length,
          assignments_published: published,
          pending_grading: pendingIn(ids),
        };
      });

    return {
      users: {
        admin: users.filter((u) => u.role === "admin" && u.is_active).length,
        asisten_aktif: users.filter((u) => u.role === "asisten_aktif" && u.is_active).length,
        asisten_magang: users.filter((u) => u.role === "asisten_magang" && u.is_active).length,
        inactive: users.filter((u) => !u.is_active).length,
      },
      pending_grading: divisions.reduce((sum, d) => sum + d.pending_grading, 0),
      divisions,
      recent_announcements: [...db.announcements]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 5)
        .map((a) => toAnnouncement(a, me)),
    };
  },

  async list({ search, role, division_id, is_active, page, per_page }) {
    await delay();
    requireAdmin();
    const term = search?.trim().toLowerCase();
    const rows = activeUsers()
      .filter((u) => !term || [u.name, u.email, u.nim ?? ""].some((v) => v.toLowerCase().includes(term)))
      .filter((u) => !role || u.role === role)
      .filter((u) => division_id === undefined || u.research_division_id === division_id)
      .filter((u) => is_active === undefined || u.is_active === is_active)
      .sort((a, b) => a.name.localeCompare(b.name, "id"));
    const { data, links, meta } = paginate(rows, page, per_page);
    return { data: data.map(toAdminUser), links, meta };
  },

  async importCsv() {
    await delay();
    return fail(422, "VALIDATION_ERROR", "Import CSV tidak tersedia di mode mock. Hapus 'users' dari VITE_MOCK_DOMAINS.");
  },

  async restore() {
    await delay();
    return fail(422, "VALIDATION_ERROR", "Pulihkan user tidak tersedia di mode mock. Hapus 'users' dari VITE_MOCK_DOMAINS.");
  },

  async create(payload) {
    await delay(450);
    requireAdmin();
    const fields = validate(payload);
    const temporary = payload.password ? null : temporaryPassword();
    const row: UserRow = {
      id: nextId(db.users),
      ...fields,
      is_active: true,
      must_change_password: true,
      last_login_at: null,
      created_at: now(),
      deleted_at: null,
    };
    db.users.push(row);
    persist();
    return { user: toAdminUser(row), temporary_password: temporary };
  },

  async update(id, payload) {
    await delay(450);
    const me = requireAdmin();
    const row = findUser(id);
    const fields = validate(payload, id);
    if (row.role === "admin" && fields.role !== "admin") {
      if (id === me.id) invalid({ role: ["Anda tidak bisa menurunkan role akun sendiri."] });
      if (otherActiveAdmins(id) === 0) invalid({ role: ["Harus ada minimal satu admin aktif."] });
    }
    if (row.role === "asisten_aktif" && fields.role !== "asisten_aktif") {
      db.competition_members = db.competition_members.filter((m) => m.user_id !== id);
    }
    Object.assign(row, fields);
    persist();
    return toAdminUser(row);
  },

  async setActive(id, isActive) {
    await delay();
    const me = requireAdmin();
    const row = findUser(id);
    if (!isActive && id === me.id) invalid({ is_active: ["Anda tidak bisa menonaktifkan akun sendiri."] });
    if (!isActive && row.role === "admin" && otherActiveAdmins(id) === 0) invalid({ is_active: ["Harus ada minimal satu admin aktif."] });
    row.is_active = isActive;
    persist();
    return toAdminUser(row);
  },

  async resetPassword(id) {
    await delay(450);
    requireAdmin();
    const row = findUser(id);
    row.must_change_password = true;
    persist();
    return { user: toAdminUser(row), temporary_password: temporaryPassword() };
  },

  async remove(id) {
    await delay();
    const me = requireAdmin();
    const row = findUser(id);
    if (id === me.id) invalid({ user: ["Anda tidak bisa menghapus akun sendiri."] });
    if (row.role === "admin" && otherActiveAdmins(id) === 0) invalid({ user: ["Harus ada minimal satu admin aktif."] });
    row.deleted_at = now();
    persist();
  },
};
