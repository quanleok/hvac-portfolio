import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  ALLOWED_IMAGE_MIMES,
  ALLOWED_VIDEO_MIMES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  type MarketingPlatform,
} from "@/lib/marketing/schema";
import { MARKETING_BUCKET, buildMarketingStoragePath } from "@/lib/marketing/storage";

export type MediaKind = "image" | "video";

export interface FetchedMedia {
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  fileName: string;
}

const MAX_FETCH_MS = 30_000;

function inferFileNameFromUrl(url: string, fallback: string): string {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split("/").pop() || "";
    if (last && last.includes(".")) return last;
  } catch {
    // fall through
  }
  return fallback;
}

export async function fetchAndStoreMedia(input: {
  url: string;
  platform: MarketingPlatform;
  kind: MediaKind;
}): Promise<{ ok: true; media: FetchedMedia } | { ok: false; error: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MAX_FETCH_MS);

  try {
    const response = await fetch(input.url, { signal: controller.signal });
    if (!response.ok) {
      return { ok: false, error: `Media URL fetch failed (${response.status}).` };
    }

    const mimeType = (response.headers.get("content-type") ?? "").split(";")[0].trim();
    const allowed: readonly string[] =
      input.kind === "image"
        ? ALLOWED_IMAGE_MIMES
        : ALLOWED_VIDEO_MIMES;
    if (!allowed.includes(mimeType)) {
      return {
        ok: false,
        error: `Media MIME "${mimeType}" not allowed. Allowed: ${allowed.join(", ")}`,
      };
    }

    const cap = input.kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > cap) {
      return {
        ok: false,
        error: `Media size ${contentLength} exceeds cap ${cap}.`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > cap) {
      return { ok: false, error: `Media size exceeds cap ${cap}.` };
    }

    const fallbackExt = mimeType.split("/")[1] ?? "bin";
    const fileName = inferFileNameFromUrl(input.url, `upload.${fallbackExt}`);
    const storagePath = buildMarketingStoragePath(input.platform, fileName);

    const admin = createSupabaseAdminClient();
    const { error: uploadError } = await admin.storage
      .from(MARKETING_BUCKET)
      .upload(storagePath, new Uint8Array(arrayBuffer), {
        contentType: mimeType,
        upsert: false,
      });
    if (uploadError) {
      return { ok: false, error: `Upload failed: ${uploadError.message}` };
    }

    return {
      ok: true,
      media: {
        storagePath,
        mimeType,
        sizeBytes: arrayBuffer.byteLength,
        fileName,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, error: "Media URL fetch timed out." };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown fetch error.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
