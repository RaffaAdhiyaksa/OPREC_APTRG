import type { DivisionsService } from "@/services/divisions";
import type { Division } from "@/types/api";
import { activeUsers, currentUser, db, delay, fail, forbidden, isAdmin, notFound, persist, type DivisionRow } from "./db";

export function toDivision(d: DivisionRow): Division {
  const members_count =
    d.type === "research"
      ? activeUsers().filter((u) => u.research_division_id === d.id).length
      : db.competition_members.filter((m) => m.division_id === d.id).length;
  return { ...d, members_count };
}

export const mockDivisions: DivisionsService = {
  async list() {
    await delay();
    const me = currentUser();
    return [...db.divisions]
      .filter((d) => isAdmin(me) || d.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(toDivision);
  },

  async setActive(id, isActive) {
    await delay();
    if (!isAdmin(currentUser())) forbidden();
    const division = db.divisions.find((d) => d.id === id) ?? notFound();
    if (!division.is_optional) {
      fail(422, "DIVISION_NOT_OPTIONAL", "Hanya divisi opsional yang bisa diaktifkan atau dinonaktifkan.");
    }
    division.is_active = isActive;
    persist();
    return toDivision(division);
  },
};
