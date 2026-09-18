import { NextRequest } from "next/server";
import { authorizeServiceRequest } from "@/lib/auth/api-auth";
import { err, ok, unauthorized } from "@/lib/api/response";
import { fetchAndStoreMedia } from "@/lib/api/fetch-media";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createMarketingAsset, recordMarketingEvent } from "@/lib/marketing/automation";
import { isPlatform, type MarketingMediaKind } from "@/lib/marketing/schema";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parseKind(value: unknown): MarketingMediaKind | null {
  return value === "image" || value === "video" ? value : null;
}

export async function POST(request: NextRequest, { params }: Props) {
  const ctx = await authorizeServiceRequest(request);
  if (!ctx) return unauthorized();

  const { id } = await params;
  if (!id) return err("Missing post id.");

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return err("Invalid JSON body.");
  }

  const kind = parseKind(body.kind);
  if (!kind) return err("'kind' must be image or video.");

  const admin = createSupabaseAdminClient();
  const { data: post, error: postError } = await admin
    .from("marketing_posts")
    .select("id, campaign_id, platform, status, workflow")
    .eq("id", id)
    .maybeSingle();

  if (postError) return err(postError.message, 500);
  if (!post || !isPlatform(post.platform)) return err("Post not found.", 404);

  const mediaUrl = typeof body.media_url === "string" ? body.media_url.trim() : "";
  let storagePath = typeof body.storage_path === "string" ? body.storage_path.trim() : "";
  let mimeType = typeof body.mime_type === "string" ? body.mime_type.trim() : "";
  let sizeBytes = typeof body.size_bytes === "number" ? body.size_bytes : 0;

  if (mediaUrl) {
    const fetched = await fetchAndStoreMedia({
      url: mediaUrl,
      platform: post.platform,
      kind,
    });
    if (!fetched.ok) return err(fetched.error);
    storagePath = fetched.media.storagePath;
    mimeType = fetched.media.mimeType;
    sizeBytes = fetched.media.sizeBytes;
  }

  if (!storagePath) return err("Provide either 'media_url' or 'storage_path'.");
  if (!mimeType) return err("Missing 'mime_type'.");
  if (!sizeBytes) return err("Missing 'size_bytes'.");

  const { error: mediaError } = await admin.from("marketing_post_media").insert({
    post_id: id,
    kind,
    storage_path: storagePath,
    mime_type: mimeType,
    size_bytes: sizeBytes,
  });
  if (mediaError) return err(mediaError.message, 500);

  const label = typeof body.label === "string" ? body.label.trim() : null;
  const generationId = typeof body.generation_id === "string" ? body.generation_id : null;
  const assetResult = await createMarketingAsset(admin, {
    campaign_id: post.campaign_id,
    post_id: id,
    generation_id: generationId,
    source: "openclaw",
    kind,
    storage_path: storagePath,
    external_url: mediaUrl || null,
    mime_type: mimeType,
    size_bytes: sizeBytes,
    label,
    approval_status: "approved",
  });
  if (!assetResult.ok) return err(assetResult.error, 500);

  const now = new Date().toISOString();
  await admin
    .from("marketing_posts")
    .update({
      status: post.status === "scheduled" ? "scheduled" : "ready",
      workflow: {
        ...(isRecord(post.workflow) ? post.workflow : {}),
        queueState: "ready",
        mediaReady: true,
        openClawAssetAt: now,
        openClawAssetKind: kind,
      },
    })
    .eq("id", id);

  await recordMarketingEvent(admin, {
    campaign_id: post.campaign_id,
    post_id: id,
    actor: ctx.tokenName,
    event_type: "asset_attached",
    event_data: {
      assetId: assetResult.id,
      kind,
      source: "openclaw",
      storagePath,
    },
  });

  return ok({ id: assetResult.id, post_id: id, storage_path: storagePath }, 201);
}
