import type { MaterialSourceType, Role } from "@/types/api";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  asisten_aktif: "Asisten Aktif",
  asisten_magang: "Asisten Magang",
};

export const SOURCE_LABEL: Record<MaterialSourceType, string> = {
  youtube: "YouTube",
  drive: "Drive",
  other: "Lainnya",
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
