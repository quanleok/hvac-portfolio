import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { authorizeServiceRequest } from "@/lib/auth/api-auth";
import { fetchAndStoreMedia } from "@/lib/api/fetch-media";
import { ok, err, unauthorized } from "@/lib/api/response";
import { createMarketingAsset, recordMarketingEvent } from "@/lib/marketing/automation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ctx = await authorizeServiceRequest(request);
  if (!ctx) return unauthorized();

  let body: { caption?: unknown; image_url?: unknown };
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body.");
  }

  const caption = typeof body.caption === "string" ? body.caption.trim() : "";
  const imageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";

  if (!caption) return err("Missing 'caption'.");
  if (!imageUrl) return err("Missing 'image_url'.");

  const fetched = await fetchAndStoreMedia({
    url: imageUrl,
    platform: "facebook",
    kind: "image",
  });
  if (!fetched.ok) return err(fetched.error);

  const admin = createSupabaseAdminClient();
  const campaignId = crypto.randomUUID();
  const campaignName = caption.slice(0, 60);
  const { error: campaignError } = await admin.from("marketing_campaigns").insert({
    id: campaignId,
    name: campaignName,
    body: caption,
    selected_platforms: ["facebook"],
    media_strategy: "upload",
  });
  if (campaignError) {
    await admin.storage.from("marketing-media").remove([fetched.media.storagePath]);
    return err(campaignError.message, 500);
  }

  const { data: post, error: postError } = await admin
    .from("marketing_posts")
    .insert({
      campaign_id: campaignId,
      campaign_name: campaignName,
      platform: "facebook",
      status: "ready",
      body: caption,
      workflow: {
        legacy: true,
        mediaMode: "upload",
        selectedPlatforms: ["facebook"],
        queueState: "ready",
      },
    })
    .select("id")
    .single();

  if (postError || !post) {
    // Clean up orphan upload.
    await admin.storage.from("marketing-media").remove([fetched.media.storagePath]);
    return err(postError?.message ?? "Could not create post.", 500);
  }

  const { error: mediaError } = await admin
    .from("marketing_post_media")
    .insert({
      post_id: post.id,
      kind: "image",
      storage_path: fetched.media.storagePath,
      mime_type: fetched.media.mimeType,
      size_bytes: fetched.media.sizeBytes,
    });

  if (mediaError) {
    await admin.from("marketing_posts").delete().eq("id", post.id);
    await admin.storage.from("marketing-media").remove([fetched.media.storagePath]);
    return err(mediaError.message, 500);
  }

  const asset = await createMarketingAsset(admin, {
    campaign_id: campaignId,
    post_id: post.id,
    source: "openclaw",
    kind: "image",
    storage_path: fetched.media.storagePath,
    external_url: imageUrl,
    mime_type: fetched.media.mimeType,
    size_bytes: fetched.media.sizeBytes,
    label: fetched.media.fileName,
    approval_status: "approved",
  });
  if (!asset.ok) return err(asset.error, 500);

  await recordMarketingEvent(admin, {
    campaign_id: campaignId,
    post_id: post.id,
    actor: ctx.tokenName,
    event_type: "post_created",
    event_data: {
      platform: "facebook",
      source: "api",
      assetId: asset.id,
    },
  });

  return ok({ id: post.id, launchpad_url: `/admin/marketing/${post.id}` }, 201);
}
