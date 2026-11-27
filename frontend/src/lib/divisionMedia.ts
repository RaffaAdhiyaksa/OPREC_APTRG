// Lab photos for research divisions (copied from the lab website, public/images).
const PHOTO_BY_SLUG: Record<string, string> = {
  mechanic: "/images/mekanik.webp",
  system: "/images/sistem.webp",
  gcs: "/images/gcs.webp",
  "non-technical": "/images/non-technical.webp",
};

export const divisionPhoto = (slug: string) => PHOTO_BY_SLUG[slug] ?? "/images/foto-anggota.webp";
