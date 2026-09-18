export const MEDIA_BUCKET = "site-media";

/**
 * Builds a deterministic storage path for a new upload.
 * Example: "2026-04/e7f3abcd-beach-job.mp4"
 */
export function buildStoragePath(fileName: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const suffix = crypto.randomUUID().slice(0, 8);
  const safe = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${year}-${month}/${suffix}-${safe}`;
}
