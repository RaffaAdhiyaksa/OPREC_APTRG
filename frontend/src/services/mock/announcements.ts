import type { AnnouncementsService } from "@/services/announcements";
import type { Announcement, Me, Role } from "@/types/api";
import {
  activeUsers,
  currentUser,
  db,
  delay,
  divisionRef,
  forbidden,
  invalid,
  isAdmin,
  nextId,
  notFound,
  notify,
  now,
  persist,
  personRef,
  type AnnouncementRow,
} from "./db";

const ROLES: Role[] = ["admin", "asisten_aktif", "asisten_magang"];

/** Announcement::visibleTo — admin sees all; others need matching division (or global) and role (or all). */
function visibleTo(row: AnnouncementRow, user: Me) {
  if (isAdmin(user)) return true;
  const divisionOk = row.research_division_id === null || row.research_division_id === user.research_division?.id;
  const roleOk = row.target_role === null || row.target_role === user.role;
  return divisionOk && roleOk;
}

function recipientIds(row: AnnouncementRow) {
  return activeUsers()
    .filter((u) => u.is_active && u.id !== row.author_id)
    .filter((u) => row.research_division_id === null || u.research_division_id === row.research_division_id)
    .filter((u) => row.target_role === null || u.role === row.target_role)
    .map((u) => u.id);
}

export function toAnnouncement(row: AnnouncementRow, viewer: Me): Announcement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    author: personRef(row.author_id),
    target: { division: divisionRef(row.research_division_id), role: row.target_role },
    recipients_count: recipientIds(row).length,
    is_read: row.author_id === viewer.id || db.announcement_reads.some((r) => r.announcement_id === row.id && r.user_id === viewer.id),
    created_at: row.created_at,
  };
}

const newestFirst = (a: AnnouncementRow, b: AnnouncementRow) => b.created_at.localeCompare(a.created_at);
const canSend = (u: Me) => isAdmin(u) || (u.role === "asisten_aktif" && u.is_coordinator);

export const mockAnnouncements: AnnouncementsService = {
  async list() {
    await delay();
    const me = currentUser();
    return db.announcements.filter((a) => visibleTo(a, me)).sort(newestFirst).map((a) => toAnnouncement(a, me));
  },

  async sent() {
    await delay();
    const me = currentUser();
    if (!canSend(me)) forbidden();
    return db.announcements.filter((a) => a.author_id === me.id).sort(newestFirst).map((a) => toAnnouncement(a, me));
  },

  async create(payload) {
    await delay(450);
    const me = currentUser();
    if (!canSend(me)) forbidden();

    const errors: Record<string, string[]> = {};
    const title = payload.title?.trim() ?? "";
    const body = payload.body?.trim() ?? "";
    if (!title) errors.title = ["Judul wajib diisi."];
    else if (title.length > 255) errors.title = ["Judul maksimal 255 karakter."];
    if (!body) errors.body = ["Isi pengumuman wajib diisi."];

    let divisionId: number | null;
    let targetRole: Role | null;
    if (isAdmin(me)) {
      divisionId = payload.research_division_id ?? null;
      targetRole = payload.target_role ?? null;
      if (divisionId !== null && db.divisions.find((d) => d.id === divisionId)?.type !== "research") {
        errors.research_division_id = ["Divisi riset tidak valid."];
      }
      if (targetRole !== null && !ROLES.includes(targetRole)) errors.target_role = ["Role tidak valid."];
    } else {
      // Coordinator: the server ignores client targets and forces their division + interns.
      divisionId = me.research_division!.id;
      targetRole = "asisten_magang";
    }
    if (Object.keys(errors).length) invalid(errors);

    const row: AnnouncementRow = {
      id: nextId(db.announcements),
      author_id: me.id,
      title,
      body,
      research_division_id: divisionId,
      target_role: targetRole,
      created_at: now(),
    };
    db.announcements.push(row);
    notify(recipientIds(row), {
      type: "announcement",
      title: row.title,
      excerpt: row.body.slice(0, 120),
      link: `/announcements?open=${row.id}`,
    });
    persist();
    return toAnnouncement(row, me);
  },

  async remove(id) {
    await delay();
    const me = currentUser();
    const row = db.announcements.find((a) => a.id === id && visibleTo(a, me)) ?? notFound();
    if (!isAdmin(me) && row.author_id !== me.id) forbidden();
    db.announcements = db.announcements.filter((a) => a.id !== id);
    db.announcement_reads = db.announcement_reads.filter((r) => r.announcement_id !== id);
    persist();
  },

  async markRead(id) {
    await delay(100);
    const me = currentUser();
    db.announcements.find((a) => a.id === id && visibleTo(a, me)) ?? notFound();
    if (!db.announcement_reads.some((r) => r.announcement_id === id && r.user_id === me.id)) {
      db.announcement_reads.push({ announcement_id: id, user_id: me.id, read_at: now() });
      persist();
    }
  },
};
