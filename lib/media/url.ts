import { getSupabaseBrowserCredentials } from "@/lib/supabase/config";
import { MEDIA_BUCKET } from "./storage";

/**
 * Resolves a Supabase Storage path in the site-media bucket
 * to its fully-qualified public URL.
 */
export function getMediaPublicUrl(storagePath: string): string {
  const { url } = getSupabaseBrowserCredentials();
  return `${url.replace(/\/$/, "")}/storage/v1/object/public/${MEDIA_BUCKET}/${storagePath}`;
}
