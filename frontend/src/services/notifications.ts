import { isMocked } from "@/lib/env";
import { api } from "@/services/api";
import { mockNotifications } from "@/services/mock/notifications";
import type { AppNotification, NotificationListMeta } from "@/types/api";

export interface NotificationsService {
  list(params: { unread?: boolean; page?: number }): Promise<{ data: AppNotification[]; meta: NotificationListMeta }>;
  unreadCount(): Promise<number>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

const realNotifications: NotificationsService = {
  async list({ unread, page }) {
    const { data } = await api.get("/notifications", { params: { unread: unread ? 1 : undefined, page } });
    return data;
  },
  async unreadCount() {
    const { data } = await api.get<{ data: { unread_count: number } }>("/notifications/unread-count");
    return data.data.unread_count;
  },
  async markRead(id) {
    await api.patch(`/notifications/${id}/read`);
  },
  async markAllRead() {
    await api.post("/notifications/read-all");
  },
};

export const notificationsService = isMocked("notifications") ? mockNotifications : realNotifications;
