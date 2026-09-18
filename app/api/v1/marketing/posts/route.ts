import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { authorizeServiceRequest } from "@/lib/auth/api-auth";
import { err, ok, unauthorized } from "@/lib/api/response";
import { createApiMarketingPosts, type ApiPostAction } from "@/lib/marketing/api-posting";
import {
  isPlatform,
  isStatus,
  type MarketingMediaKind,
  type MarketingPlatform,
} from "@/lib/marketing/schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ctx = await authorizeServiceRequest(request);
  if (!ctx) return unauthorized();

  const url = request.nextUrl;
  const status = url.searchParams.get("status");
  const platform = url.searchParams.get("platform");
  const limitRaw = Number.parseInt(url.searchParams.get("limit") ?? "25", 10);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, limitRaw)) : 25;

  const admin = createSupabaseAdminClient();
  let query = admin
    .from("marketing_posts")
    .select(
      "id, campaign_id, campaign_name, platform, status, title, body, workflow, scheduled_at, posted_at, updated_at"
    )
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (status && isStatus(status)) query = query.eq("status", status);
  if (platform && isPlatform(platform)) query = query.eq("platform", platform);

  const { data, error } = await query;
  if (error) {
    return ok({ posts: [], error: error.message });
  }

  return ok({ posts: data ?? [] });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parsePlatforms(body: Record<string, unknown>): MarketingPlatform[] {
  const raw = Array.isArray(body.platforms)
    ? body.platforms
    : typeof body.platform === "string"
      ? [body.platform]
      : [];
  return Array.from(new Set(raw.filter((value): value is MarketingPlatform => isPlatform(value))));
}

function parseAction(body: Record<string, unknown>): ApiPostAction {
  const raw = typeof body.action === "string" ? body.action : "";
  if (raw === "post_now" || raw === "send_now" || raw === "publish_now") return "post_now";
  if (raw === "schedule_later" || raw === "schedule") return "schedule_later";
  if (body.post_now === true) return "post_now";
  if (typeof body.scheduled_at === "string" && body.scheduled_at.trim()) return "schedule_later";
  return "save";
}

function parseMediaKind(value: unknown): MarketingMediaKind | null {
  return value === "image" || value === "video" ? value : null;
}

function parseMedia(body: Record<string, unknown>) {
  const media = isRecord(body.media) ? body.media : {};
  const imageUrl =
    typeof body.image_url === "string"
      ? body.image_url
      : typeof media.image_url === "string"
        ? media.image_url
        : null;
  const videoUrl =
    typeof body.video_url === "string"
      ? body.video_url
      : typeof media.video_url === "string"
        ? media.video_url
        : null;
  const mediaUrl =
    typeof body.media_url === "string"
      ? body.media_url
      : typeof media.url === "string"
        ? media.url
        : null;
  const storagePath =
    typeof body.storage_path === "string"
      ? body.storage_path
      : typeof media.storage_path === "string"
        ? media.storage_path
        : null;

  const kind =
    videoUrl
      ? "video"
      : imageUrl
        ? "image"
        : parseMediaKind(body.kind) ?? parseMediaKind(media.kind);
  const url = videoUrl ?? imageUrl ?? mediaUrl;
  if (!kind && !url && !storagePath) return null;
  if (!kind) return { ok: false as const, error: "Media 'kind' must be image or video." };

  const sizeRaw =
    typeof body.size_bytes === "number"
      ? body.size_bytes
      : typeof media.size_bytes === "number"
        ? media.size_bytes
        : null;
  return {
    ok: true as const,
    media: {
      kind,
      url,
      storagePath,
      mimeType:
        typeof body.mime_type === "string"
          ? body.mime_type
          : typeof media.mime_type === "string"
            ? media.mime_type
            : null,
      sizeBytes: sizeRaw,
      label:
        typeof body.label === "string"
          ? body.label
          : typeof media.label === "string"
            ? media.label
            : null,
    },
  };
}

export async function POST(request: NextRequest) {
  const ctx = await authorizeServiceRequest(request);
  if (!ctx) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return err("Invalid JSON body.");
  }

  const platforms = parsePlatforms(body);
  const media = parseMedia(body);
  if (media && !media.ok) return err(media.error);

  const result = await createApiMarketingPosts({
    actor: ctx.tokenName,
    platforms,
    action: parseAction(body),
    campaignName:
      typeof body.campaign_name === "string"
        ? body.campaign_name
        : typeof body.campaignName === "string"
          ? body.campaignName
          : null,
    title: typeof body.title === "string" ? body.title : null,
    body:
      typeof body.body === "string"
        ? body.body
        : typeof body.message === "string"
          ? body.message
          : typeof body.text === "string"
            ? body.text
            : null,
    scheduledAt: typeof body.scheduled_at === "string" ? body.scheduled_at : null,
    media: media?.ok ? media.media : null,
  });

  if (!result.ok) return err(result.error, result.status ?? 400);
  return ok(
    {
      campaign_id: result.campaignId,
      posts: result.posts,
      buffer_posts: result.bufferPosts,
      warnings: result.warnings,
    },
    201
  );
}
