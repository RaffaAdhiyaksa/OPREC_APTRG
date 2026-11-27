import { USE_MOCKS } from "@/lib/env";
import { api } from "@/services/api";
import { mockAnnouncements } from "@/services/mock/announcements";
import type { Announcement, AnnouncementPayload, DataResponse } from "@/types/api";

export interface AnnouncementsService {
  /** Announcements targeting me (admin: all). */
  list(): Promise<Announcement[]>;
  /** Announcements I sent (admin or coordinator). */
  sent(): Promise<Announcement[]>;
  create(payload: AnnouncementPayload): Promise<Announcement>;
  remove(id: number): Promise<void>;
  markRead(id: number): Promise<void>;
}

const realAnnouncements: AnnouncementsService = {
  async list() {
    const { data } = await api.get<DataResponse<Announcement[]>>("/announcements", { params: { per_page: 100 } });
    return data.data;
  },
  async sent() {
    const { data } = await api.get<DataResponse<Announcement[]>>("/announcements/sent", { params: { per_page: 100 } });
    return data.data;
  },
  async create(payload) {
    const { data } = await api.post<DataResponse<Announcement>>("/announcements", payload);
    return data.data;
  },
  async remove(id) {
    await api.delete(`/announcements/${id}`);
  },
  async markRead(id) {
    await api.post(`/announcements/${id}/read`);
  },
};

export const announcementsService = USE_MOCKS ? mockAnnouncements : realAnnouncements;
