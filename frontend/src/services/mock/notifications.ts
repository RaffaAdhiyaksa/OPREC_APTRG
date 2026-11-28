import type { NotificationsService } from "@/services/notifications";
import type { AppNotification } from "@/types/api";
import { currentUser, db, delay, notFound, now, paginate, persist, type NotificationRow } from "./db";

const toNotification = ({ user_id: _userId, ...rest }: NotificationRow): AppNotification => rest;

const mine = () => {
  const me = currentUser();
  return db.notifications.filter((n) => n.user_id === me.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
};

export const mockNotifications: NotificationsService = {
  async list({ unread, page }) {
    await delay();
    const rows = mine();
    const unreadCount = rows.filter((n) => !n.read_at).length;
    const { data, meta } = paginate(unread ? rows.filter((n) => !n.read_at) : rows, page, 15);
    return { data: data.map(toNotification), meta: { ...meta, unread_count: unreadCount } };
  },

  async unreadCount() {
    await delay(150);
    return mine().filter((n) => !n.read_at).length;
  },

  async markRead(id) {
    await delay(150);
    const row = mine().find((n) => n.id === id) ?? notFound();
    row.read_at ??= now();
    persist();
  },

  async markAllRead() {
    await delay();
    const at = now();
    mine().forEach((n) => (n.read_at ??= at));
    persist();
  },
};
