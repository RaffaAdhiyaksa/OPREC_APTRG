import { detectSourceType, youtubeEmbedUrl, youtubeId } from "@/lib/materialSource";
import type { MaterialsService } from "@/services/materials";
import type { Material, MaterialPayload, Me } from "@/types/api";
import {
  currentUser,
  db,
  delay,
  divisionRef,
  forbidden,
  inScope,
  invalid,
  isAdmin,
  isIntern,
  isStaff,
  nextId,
  notFound,
  now,
  persist,
  personRef,
  type MaterialRow,
} from "./db";

function toMaterial(row: MaterialRow): Material {
  const videoId = row.source_type === "youtube" ? youtubeId(row.url) : null;
  return {
    id: row.id,
    division: divisionRef(row.division_id)!,
    title: row.title,
    description: row.description,
    source_type: row.source_type,
    url: row.url,
    embed_url: videoId ? youtubeEmbedUrl(videoId) : null,
    sort_order: row.sort_order,
    is_published: row.is_published,
    author: personRef(row.created_by),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function visible(row: MaterialRow, me: Me) {
  return inScope(me, row.division_id) && (!isIntern(me) || row.is_published);
}

function validate(payload: MaterialPayload, me: Me, existing?: MaterialRow) {
  const errors: Record<string, string[]> = {};
  const title = payload.title?.trim() ?? "";
  const url = payload.url?.trim() ?? "";
  const sourceType = detectSourceType(url);
  if (!title) errors.title = ["Judul wajib diisi."];
  else if (title.length > 255) errors.title = ["Judul maksimal 255 karakter."];
  if (!url) errors.url = ["URL wajib diisi."];
  else if (!sourceType) errors.url = ["Format URL tidak valid."];

  let divisionId = existing?.division_id ?? me.research_division?.id ?? 0;
  if (isAdmin(me) && !existing) {
    const division = db.divisions.find((d) => d.id === payload.division_id);
    if (!division || division.type !== "research") errors.division_id = ["Divisi riset wajib dipilih."];
    else divisionId = division.id;
  }
  if (Object.keys(errors).length) invalid(errors);
  return { title, url, source_type: sourceType!, description: payload.description?.trim() || null, is_published: payload.is_published, division_id: divisionId };
}

const findVisible = (id: number, me: Me) => db.materials.find((m) => m.id === id && visible(m, me)) ?? notFound();

export const mockMaterials: MaterialsService = {
  async list({ search, source_type, division_id }) {
    await delay();
    const me = currentUser();
    const term = search?.trim().toLowerCase();
    return db.materials
      .filter((m) => visible(m, me))
      .filter((m) => !isAdmin(me) || division_id === undefined || m.division_id === division_id)
      .filter((m) => !source_type || m.source_type === source_type)
      .filter((m) => !term || m.title.toLowerCase().includes(term) || (m.description ?? "").toLowerCase().includes(term))
      .sort((a, b) => a.division_id - b.division_id || a.sort_order - b.sort_order)
      .map(toMaterial);
  },

  async create(payload) {
    await delay(450);
    const me = currentUser();
    if (!isStaff(me)) forbidden();
    const fields = validate(payload, me);
    const siblings = db.materials.filter((m) => m.division_id === fields.division_id);
    const row: MaterialRow = {
      id: nextId(db.materials),
      created_by: me.id,
      sort_order: siblings.reduce((max, m) => Math.max(max, m.sort_order), 0) + 1,
      created_at: now(),
      updated_at: now(),
      ...fields,
    };
    db.materials.push(row);
    persist();
    return toMaterial(row);
  },

  async update(id, payload) {
    await delay(450);
    const me = currentUser();
    const row = findVisible(id, me);
    if (!isStaff(me)) forbidden();
    Object.assign(row, validate(payload, me, row), { updated_at: now() });
    persist();
    return toMaterial(row);
  },

  async remove(id) {
    await delay();
    const me = currentUser();
    findVisible(id, me);
    if (!isStaff(me)) forbidden();
    db.materials = db.materials.filter((m) => m.id !== id);
    persist();
  },

  async reorder(order) {
    await delay(200);
    const me = currentUser();
    if (!isStaff(me)) forbidden();
    const rows = order.map((id) => findVisible(id, me));
    if (new Set(rows.map((r) => r.division_id)).size > 1) invalid({ order: ["Semua materi harus dari divisi yang sama."] });
    rows.forEach((row, index) => (row.sort_order = index + 1));
    persist();
  },
};
