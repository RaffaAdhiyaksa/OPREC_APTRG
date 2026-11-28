import type { MaterialSourceType } from "@/types/api";

/** Same host rule as the backend (PRD §5.11). Returns null for an invalid URL. */
export function detectSourceType(url: string): MaterialSourceType | null {
  let host: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    host = parsed.hostname.replace(/^www\.|^m\./, "");
  } catch {
    return null;
  }
  if (host === "youtube.com" || host === "youtu.be") return "youtube";
  if (host === "drive.google.com" || host === "docs.google.com") return "drive";
  return "other";
}

export function youtubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith("youtu.be")) return parsed.pathname.slice(1) || null;
    if (parsed.pathname.startsWith("/embed/") || parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/")[2] || null;
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
}

export const youtubeEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}`;
export const youtubeThumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
