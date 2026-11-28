/** Whitelist for submission files (PRD FR-03). `allowed_extensions` per assignment is a subset. */
export const SUBMISSION_EXTENSIONS = ["pdf", "zip", "rar", "doc", "docx", "ppt", "pptx", "png", "jpg", "jpeg"] as const;

/** Global upload ceiling (LMS_MAX_UPLOAD_MB); per-assignment limits are 1..this. */
export const MAX_UPLOAD_MB = 50;

export const DRIVE_HOSTS = ["drive.google.com", "docs.google.com"];

/** Same rule as the backend: HTTPS on a Google Drive/Docs host. */
export function isDriveLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && DRIVE_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}
