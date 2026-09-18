"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ALLOWED_IMAGE_MIMES,
  ALLOWED_VIDEO_MIMES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  MEDIA_STRATEGIES,
  MARKETING_TEMPLATE_KEYS,
  type MarketingAssetSource,
  type MarketingPlatform,
  type MarketingStatus,
  type MarketingTemplateKey,
  type MediaStrategy,
  isPlatform,
  platformPrimaryMediaKind,
  platformLabel,
  platformPrefersVideo,
} from "@/lib/marketing/schema";
import {
  MARKETING_BUCKET,
  buildMarketingStoragePath,
} from "@/lib/marketing/storage";
import {
  automationJobTypeForPlatform,
  buildAutomationInput,
  createMarketingAgentJob,
  createMarketingAsset,
  recordMarketingEvent,
} from "@/lib/marketing/automation";
import { createBufferPosts, type BufferPostSync } from "@/lib/marketing/buffer";
import type { ActionResult } from "@/app/admin/actions";

async function requireSession() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    throw new Error("Your admin session expired. Sign in again.");
  }
  return data.claims.sub;
}

function revalidateMarketingPaths(id?: string) {
  revalidatePath("/admin/marketing");
  revalidatePath("/admin/ai-studio");
  if (id) revalidatePath(`/admin/marketing/${id}`);
}

function validateAssetFile(file: File): { kind: "image" | "video" } | { error: string } {
  if (!file || file.size === 0) {
    return { error: "Pick a media file first." };
  }
  if (file.type.startsWith("image/")) {
    const error = validateFile(file, "image");
    return error ? { error } : { kind: "image" };
  }
  if (file.type.startsWith("video/")) {
    const error = validateFile(file, "video");
    return error ? { error } : { kind: "video" };
  }
  return { error: "Media must be an image or video file." };
}

function validateAssetMeta(input: {
  contentType: string;
  sizeBytes: number;
}): { kind: "image" | "video" } | { error: string } {
  if (input.contentType.startsWith("image/")) {
    const error = validateFileMeta(input, "image");
    return error ? { error } : { kind: "image" };
  }
  if (input.contentType.startsWith("video/")) {
    const error = validateFileMeta(input, "video");
    return error ? { error } : { kind: "video" };
  }
  return { error: "Media must be an image or video file." };
}

function parsePlatforms(raw: FormDataEntryValue | null): MarketingPlatform[] {
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(parsed.filter((value): value is MarketingPlatform => isPlatform(value)))
    );
  } catch {
    return [];
  }
}

function defaultCampaignName(input: {
  campaignName: string | null;
  title: string | null;
  body: string | null;
}) {
  return (
    input.campaignName ||
    input.title ||
    input.body?.slice(0, 60) ||
    "Marketing post"
  );
}

function validateFileMeta(
  input: { contentType: string; sizeBytes: number },
  expectedKind: "image" | "video"
): string | null {
  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
    return "Pick a file before uploading.";
  }
  if (expectedKind === "image") {
    if (!ALLOWED_IMAGE_MIMES.includes(input.contentType as (typeof ALLOWED_IMAGE_MIMES)[number])) {
      return "Image must be JPEG, PNG, or WebP.";
    }
    if (input.sizeBytes > MAX_IMAGE_BYTES) return "Image must be under 10 MB.";
  } else {
    if (!ALLOWED_VIDEO_MIMES.includes(input.contentType as (typeof ALLOWED_VIDEO_MIMES)[number])) {
      return "Video must be MP4 or MOV.";
    }
    if (input.sizeBytes > MAX_VIDEO_BYTES) return "Video must be under 50 MB.";
  }
  return null;
}

function validateFile(file: File, expectedKind: "image" | "video"): string | null {
  if (!file || file.size === 0) return "Pick a file before uploading.";
  return validateFileMeta(
    { contentType: file.type, sizeBytes: file.size },
    expectedKind
  );
}

async function recordPostMedia(input: {
  postId: string;
  kind: "image" | "video";
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("marketing_post_media").insert({
    post_id: input.postId,
    kind: input.kind,
    storage_path: input.storagePath,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

async function uploadPostMedia(
  postId: string,
  platform: MarketingPlatform,
  file: File,
  kind: "image" | "video"
): Promise<
  | {
      ok: true;
      storagePath: string;
      mimeType: string;
      sizeBytes: number;
    }
  | { ok: false; error: string }
> {
  const admin = createSupabaseAdminClient();
  const path = buildMarketingStoragePath(platform, file.name);
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from(MARKETING_BUCKET)
    .upload(path, new Uint8Array(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) return { ok: false, error: `Upload failed: ${uploadError.message}` };

  const insertResult = await recordPostMedia({
    postId,
    kind,
    storagePath: path,
    mimeType: file.type,
    sizeBytes: file.size,
  });
  if (!insertResult.ok) {
    await admin.storage.from(MARKETING_BUCKET).remove([path]);
    return { ok: false, error: insertResult.error };
  }
  return {
    ok: true,
    storagePath: path,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}

function assetSourceForMediaMode(mediaMode: string): MarketingAssetSource {
  if (mediaMode === "library") return "library";
  if (mediaMode === "generate-now") return "ai";
  return "upload";
}

function queuedPostStatus(input: {
  scheduleMode: "now" | "later";
  mediaMode: string;
}): MarketingStatus {
  if (input.scheduleMode === "later") return "scheduled";
  if (input.mediaMode === "queue-ai") return "needs_ai";
  return "ready";
}

function buildBufferPostText(input: {
  campaignLabel: string;
  title: string | null;
  body: string | null;
  offer: string | null;
  callToAction: string | null;
  notes: string | null;
}) {
  const textBlocks = [
    input.body,
    input.offer ? `Offer: ${input.offer}` : null,
    input.callToAction ? `Call or text: ${input.callToAction}` : null,
    input.notes ? `Notes: ${input.notes}` : null,
  ].filter((value): value is string => Boolean(value));

  return textBlocks.join("\n\n") || input.title || input.campaignLabel;
}

export async function prepareMarketingMediaUpload(input: {
  platform: MarketingPlatform;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}): Promise<ActionResult<{ path: string; token: string }>> {
  try {
    await requireSession();
    if (!isPlatform(input.platform)) {
      return { ok: false, error: "Pick a valid channel before uploading media." };
    }
    const validation = validateAssetMeta({
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
    });
    if ("error" in validation) {
      return { ok: false, error: validation.error };
    }

    const admin = createSupabaseAdminClient();
    const path = buildMarketingStoragePath(input.platform, input.fileName);
    const { data, error } = await admin.storage
      .from(MARKETING_BUCKET)
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !data?.token) {
      return { ok: false, error: error?.message ?? "Could not prepare upload." };
    }

    return { ok: true, path, token: data.token };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not prepare upload.",
    };
  }
}

export async function createFacebookPost(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const createdBy = await requireSession();

    const body = (formData.get("body") as string | null)?.trim() || null;
    if (!body) return { ok: false, error: "Add a caption before posting." };

    const file = formData.get("image");
    if (!(file instanceof File)) return { ok: false, error: "Pick a photo." };
    const fileError = validateFile(file, "image");
    if (fileError) return { ok: false, error: fileError };

    const admin = createSupabaseAdminClient();
    const campaignId = crypto.randomUUID();
    const campaignName = body.slice(0, 60);
    const { error: campaignError } = await admin.from("marketing_campaigns").insert({
      id: campaignId,
      name: campaignName,
      body,
      selected_platforms: ["facebook"],
      media_strategy: "upload",
      created_by: createdBy,
    });
    if (campaignError) return { ok: false, error: campaignError.message };

    const { data: post, error: postError } = await admin
      .from("marketing_posts")
      .insert({
        campaign_id: campaignId,
        campaign_name: campaignName,
        platform: "facebook",
        status: "ready",
        body,
        workflow: {
          legacy: true,
          mediaMode: "upload",
          selectedPlatforms: ["facebook"],
          queueState: "ready",
        },
        created_by: createdBy,
      })
      .select("id")
      .single();

    if (postError || !post) {
      await admin.from("marketing_campaigns").delete().eq("id", campaignId);
      return { ok: false, error: postError?.message ?? "Could not create post." };
    }

    const mediaResult = await uploadPostMedia(post.id, "facebook", file, "image");
    if (!mediaResult.ok) {
      await admin.from("marketing_campaigns").delete().eq("id", campaignId);
      return mediaResult;
    }

    const assetResult = await createMarketingAsset(admin, {
      campaign_id: campaignId,
      post_id: post.id,
      source: "upload",
      kind: "image",
      storage_path: mediaResult.storagePath,
      mime_type: mediaResult.mimeType,
      size_bytes: mediaResult.sizeBytes,
      label: file.name,
      approval_status: "approved",
      created_by: createdBy,
    });
    if (!assetResult.ok) {
      await admin.storage.from(MARKETING_BUCKET).remove([mediaResult.storagePath]);
      await admin.from("marketing_campaigns").delete().eq("id", campaignId);
      return { ok: false, error: assetResult.error };
    }

    await recordMarketingEvent(admin, {
      campaign_id: campaignId,
      post_id: post.id,
      actor: "admin",
      event_type: "post_created",
      event_data: {
        platform: "facebook",
        mediaMode: "upload",
      },
    });

    revalidateMarketingPaths(post.id);
    return { ok: true, id: post.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Post could not be created.",
    };
  }
}

export async function createYouTubePost(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const createdBy = await requireSession();

    const title = (formData.get("title") as string | null)?.trim() || null;
    if (!title) return { ok: false, error: "Add a title before continuing." };

    const body = (formData.get("body") as string | null)?.trim() || null;

    const file = formData.get("video");
    if (!(file instanceof File)) return { ok: false, error: "Pick a video." };
    const fileError = validateFile(file, "video");
    if (fileError) return { ok: false, error: fileError };

    const admin = createSupabaseAdminClient();
    const campaignId = crypto.randomUUID();
    const { error: campaignError } = await admin.from("marketing_campaigns").insert({
      id: campaignId,
      name: title,
      title,
      body,
      selected_platforms: ["youtube"],
      media_strategy: "upload",
      created_by: createdBy,
    });
    if (campaignError) return { ok: false, error: campaignError.message };

    const { data: post, error: postError } = await admin
      .from("marketing_posts")
      .insert({
        campaign_id: campaignId,
        campaign_name: title,
        platform: "youtube",
        status: "ready",
        title,
        body,
        workflow: {
          legacy: true,
          mediaMode: "upload",
          selectedPlatforms: ["youtube"],
          queueState: "ready",
        },
        created_by: createdBy,
      })
      .select("id")
      .single();

    if (postError || !post) {
      await admin.from("marketing_campaigns").delete().eq("id", campaignId);
      return { ok: false, error: postError?.message ?? "Could not create post." };
    }

    const mediaResult = await uploadPostMedia(post.id, "youtube", file, "video");
    if (!mediaResult.ok) {
      await admin.from("marketing_campaigns").delete().eq("id", campaignId);
      return mediaResult;
    }

    const assetResult = await createMarketingAsset(admin, {
      campaign_id: campaignId,
      post_id: post.id,
      source: "upload",
      kind: "video",
      storage_path: mediaResult.storagePath,
      mime_type: mediaResult.mimeType,
      size_bytes: mediaResult.sizeBytes,
      label: file.name,
      approval_status: "approved",
      created_by: createdBy,
    });
    if (!assetResult.ok) {
      await admin.storage.from(MARKETING_BUCKET).remove([mediaResult.storagePath]);
      await admin.from("marketing_campaigns").delete().eq("id", campaignId);
      return { ok: false, error: assetResult.error };
    }

    await recordMarketingEvent(admin, {
      campaign_id: campaignId,
      post_id: post.id,
      actor: "admin",
      event_type: "post_created",
      event_data: {
        platform: "youtube",
        mediaMode: "upload",
      },
    });

    revalidateMarketingPaths(post.id);
    return { ok: true, id: post.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Post could not be created.",
    };
  }
}

export async function schedulePost(input: {
  id: string;
  scheduledAt: string;
}): Promise<ActionResult> {
  try {
    await requireSession();
    if (!input.id) return { ok: false, error: "Missing post id." };

    const scheduledAt = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      return { ok: false, error: "Invalid scheduled time." };
    }
    if (scheduledAt.getTime() < Date.now() - 60_000) {
      return { ok: false, error: "Scheduled time is in the past." };
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("marketing_posts")
      .update({
        status: "scheduled",
        scheduled_at: scheduledAt.toISOString(),
        reminded_at: null,
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };

    revalidateMarketingPaths(input.id);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not schedule.",
    };
  }
}

export async function markPosted(input: { id: string }): Promise<ActionResult> {
  try {
    await requireSession();
    if (!input.id) return { ok: false, error: "Missing post id." };
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("marketing_posts")
      .update({
        status: "posted",
        posted_at: new Date().toISOString(),
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidateMarketingPaths(input.id);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not mark posted.",
    };
  }
}

export async function deletePost(input: { id: string }): Promise<ActionResult> {
  try {
    await requireSession();
    if (!input.id) return { ok: false, error: "Missing post id." };
    const admin = createSupabaseAdminClient();

    const { data: media } = await admin
      .from("marketing_post_media")
      .select("storage_path")
      .eq("post_id", input.id);

    const { error } = await admin.from("marketing_posts").delete().eq("id", input.id);
    if (error) return { ok: false, error: error.message };

    if (media?.length) {
      await admin.storage
        .from(MARKETING_BUCKET)
        .remove(media.map((m) => m.storage_path));
    }

    revalidateMarketingPaths();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not delete.",
    };
  }
}

export async function getSignedMediaUrl(input: {
  storagePath: string;
}): Promise<ActionResult<{ url: string }>> {
  try {
    await requireSession();
    if (!input.storagePath) return { ok: false, error: "Missing path." };
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage
      .from(MARKETING_BUCKET)
      .createSignedUrl(input.storagePath, 60 * 10);
    if (error || !data?.signedUrl) {
      return { ok: false, error: error?.message ?? "Could not sign URL." };
    }
    return { ok: true, url: data.signedUrl };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not sign URL.",
    };
  }
}

export async function archivePost(input: { id: string }): Promise<ActionResult> {
  try {
    await requireSession();
    if (!input.id) return { ok: false, error: "Missing post id." };
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("marketing_posts")
      .update({ status: "archived" })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidateMarketingPaths(input.id);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not archive.",
    };
  }
}

export async function createMarketingCampaign(
  formData: FormData
): Promise<ActionResult<{ campaignId: string; ids: string[]; bufferPosts: BufferPostSync[] }>> {
  try {
    const createdBy = await requireSession();
    const platforms = parsePlatforms(formData.get("platforms"));
    if (platforms.length === 0) {
      return { ok: false, error: "Select at least one marketing channel." };
    }

    const campaignName = (formData.get("campaignName") as string | null)?.trim() || null;
    const title = (formData.get("title") as string | null)?.trim() || null;
    const body = (formData.get("body") as string | null)?.trim() || null;
    const callToAction = (formData.get("callToAction") as string | null)?.trim() || null;
    const offer = (formData.get("offer") as string | null)?.trim() || null;
    const notes = (formData.get("notes") as string | null)?.trim() || null;
    const aiPrompt = (formData.get("aiPrompt") as string | null)?.trim() || null;
    const selectedMediaId = (formData.get("selectedMediaId") as string | null)?.trim() || null;
    const selectedMediaLabel = (formData.get("selectedMediaLabel") as string | null)?.trim() || null;
    const uploadedStoragePath = (formData.get("uploadedStoragePath") as string | null)?.trim() || null;
    const uploadedMimeType = (formData.get("uploadedMimeType") as string | null)?.trim() || null;
    const uploadedKind = (formData.get("uploadedKind") as string | null)?.trim() || null;
    const uploadedLabel = (formData.get("uploadedLabel") as string | null)?.trim() || selectedMediaLabel;
    const uploadedSizeRaw = (formData.get("uploadedSizeBytes") as string | null)?.trim() || null;
    const uploadedSizeBytes = uploadedSizeRaw ? Number(uploadedSizeRaw) : null;
    const mediaModeRaw = (formData.get("mediaMode") as string | null) ?? "text-only";
    const mediaMode: MediaStrategy = MEDIA_STRATEGIES.includes(mediaModeRaw as MediaStrategy)
      ? (mediaModeRaw as MediaStrategy)
      : "text-only";
    const templateKeyRaw = (formData.get("templateKey") as string | null) ?? "seasonal-promo";
    const templateKey: MarketingTemplateKey = MARKETING_TEMPLATE_KEYS.includes(
      templateKeyRaw as MarketingTemplateKey
    )
      ? (templateKeyRaw as MarketingTemplateKey)
      : "seasonal-promo";
    const scheduleMode = formData.get("scheduleMode") === "later" ? "later" : "now";
    const scheduleAtRaw = (formData.get("scheduleAt") as string | null)?.trim() || null;

    if (!body && !title) {
      return { ok: false, error: "Add the content or headline before saving." };
    }
    if (platforms.includes("youtube") && !title) {
      return { ok: false, error: "YouTube posts need a headline or video title." };
    }
    if (mediaMode === "generate-now" && platforms.includes("youtube")) {
      return {
        ok: false,
        error: "Generate now currently creates image assets. For YouTube, upload media or queue AI.",
      };
    }

    let scheduledAtIso: string | null = null;
    if (scheduleMode === "later") {
      if (!scheduleAtRaw) {
        return { ok: false, error: "Pick the date and time to schedule this post." };
      }
      const scheduledAt = new Date(scheduleAtRaw);
      if (Number.isNaN(scheduledAt.getTime())) {
        return { ok: false, error: "The scheduled date is invalid." };
      }
      if (scheduledAt.getTime() < Date.now() - 60_000) {
        return { ok: false, error: "Scheduled time is in the past." };
      }
      scheduledAtIso = scheduledAt.toISOString();
    }

    const mediaEntry = formData.get("media");
    const file = mediaEntry instanceof File && mediaEntry.size > 0 ? mediaEntry : null;
    const uploadedAsset =
      uploadedStoragePath && uploadedMimeType && uploadedKind && uploadedSizeBytes
        ? {
            storagePath: uploadedStoragePath,
            mimeType: uploadedMimeType,
            kind: uploadedKind,
            sizeBytes: uploadedSizeBytes,
            label: uploadedLabel,
          }
        : null;
    const uploadedValidation = uploadedAsset
      ? validateAssetMeta({
          contentType: uploadedAsset.mimeType,
          sizeBytes: uploadedAsset.sizeBytes,
        })
      : null;
    if (uploadedValidation && "error" in uploadedValidation) {
      return { ok: false, error: uploadedValidation.error };
    }
    if (
      uploadedAsset &&
      (!["image", "video"].includes(uploadedAsset.kind) ||
        (uploadedValidation && "kind" in uploadedValidation && uploadedValidation.kind !== uploadedAsset.kind))
    ) {
      return { ok: false, error: "Uploaded media metadata is invalid." };
    }
    const assetResult = uploadedAsset
      ? ({ kind: uploadedAsset.kind as "image" | "video" } as const)
      : file
        ? validateAssetFile(file)
        : null;
    if (assetResult && "error" in assetResult) {
      return { ok: false, error: assetResult.error };
    }

    const hasAttachedMedia = Boolean(file || uploadedAsset);
    if ((mediaMode === "library" || mediaMode === "upload" || mediaMode === "generate-now") && !hasAttachedMedia) {
      return { ok: false, error: "Attach media before saving this post." };
    }
    if (mediaMode === "queue-ai" && !aiPrompt && !body && !title) {
      return { ok: false, error: "Add a media brief or some content so AI knows what to create." };
    }

    const campaignId = crypto.randomUUID();
    const campaignLabel = defaultCampaignName({ campaignName, title, body });
    const workflowBase = {
      templateKey,
      callToAction,
      offer,
      notes,
      aiPrompt,
      mediaMode,
      selectedPlatforms: platforms,
      selectedMediaId,
      selectedMediaLabel,
      selectedAssetKind: assetResult && "kind" in assetResult ? assetResult.kind : null,
      mediaFileName: uploadedAsset?.label ?? file?.name ?? null,
      mediaReady: hasAttachedMedia,
      queuedForAutomation: mediaMode === "queue-ai",
    };

    const admin = createSupabaseAdminClient();
    const { error: campaignError } = await admin.from("marketing_campaigns").insert({
      id: campaignId,
      name: campaignLabel,
      template_key: templateKey,
      title,
      body,
      offer,
      call_to_action: callToAction,
      notes,
      selected_platforms: platforms,
      media_strategy: mediaMode,
      scheduled_at: scheduledAtIso,
      created_by: createdBy,
    });
    if (campaignError) return { ok: false, error: campaignError.message };

    const { data: createdPosts, error: insertError } = await admin
      .from("marketing_posts")
      .insert(
        platforms.map((platform) => {
          const attachedKind = assetResult && "kind" in assetResult ? assetResult.kind : null;
          const needsGeneratedMedia =
            mediaMode === "queue-ai" ||
            (platformPrefersVideo(platform) && attachedKind !== "video");
          const status = needsGeneratedMedia
            ? "needs_ai"
            : queuedPostStatus({ scheduleMode, mediaMode });

          return {
            campaign_id: campaignId,
            campaign_name: campaignLabel,
            platform,
            status,
            title,
            body,
            scheduled_at: status === "scheduled" ? scheduledAtIso : null,
            reminded_at: null,
            created_by: createdBy,
            workflow: {
              ...workflowBase,
              platform,
              queueState: needsGeneratedMedia ? "awaiting-ai" : file ? "ready" : "copy-only",
              queuedForAutomation: needsGeneratedMedia,
              targetMediaKind: platformPrimaryMediaKind(platform),
              needsVideo:
                platformPrefersVideo(platform) &&
                (!assetResult || ("kind" in assetResult && assetResult.kind !== "video")),
              requestedScheduleAt: scheduledAtIso,
              platformLabel: platformLabel(platform),
            },
          };
        })
      )
      .select("id, platform");

    if (insertError || !createdPosts) {
      await admin.from("marketing_campaigns").delete().eq("id", campaignId);
      return { ok: false, error: insertError?.message ?? "Could not save post." };
    }

    const uploadedPaths: string[] = [];
    const bufferMediaByPostId = new Map<string, { kind: "image" | "video"; url: string }>();
    if (uploadedAsset && assetResult && "kind" in assetResult) {
      uploadedPaths.push(uploadedAsset.storagePath);
      for (const post of createdPosts) {
        const mediaResult = await recordPostMedia({
          postId: post.id,
          kind: assetResult.kind,
          storagePath: uploadedAsset.storagePath,
          mimeType: uploadedAsset.mimeType,
          sizeBytes: uploadedAsset.sizeBytes,
        });
        if (!mediaResult.ok) {
          await admin.storage.from(MARKETING_BUCKET).remove(uploadedPaths);
          await admin.from("marketing_campaigns").delete().eq("id", campaignId);
          return mediaResult;
        }

        const { data: signedMedia } = await admin.storage
          .from(MARKETING_BUCKET)
          .createSignedUrl(uploadedAsset.storagePath, 60 * 60 * 24);
        if (signedMedia?.signedUrl) {
          bufferMediaByPostId.set(post.id, {
            kind: assetResult.kind,
            url: signedMedia.signedUrl,
          });
        }

        const assetRecord = await createMarketingAsset(admin, {
          campaign_id: campaignId,
          post_id: post.id,
          media_id: selectedMediaId,
          source: assetSourceForMediaMode(mediaMode),
          kind: assetResult.kind,
          storage_path: uploadedAsset.storagePath,
          mime_type: uploadedAsset.mimeType,
          size_bytes: uploadedAsset.sizeBytes,
          label: uploadedAsset.label ?? uploadedAsset.storagePath.split("/").pop() ?? "Marketing media",
          approval_status: "approved",
          created_by: createdBy,
        });
        if (!assetRecord.ok) {
          await admin.storage.from(MARKETING_BUCKET).remove(uploadedPaths);
          await admin.from("marketing_campaigns").delete().eq("id", campaignId);
          return { ok: false, error: assetRecord.error };
        }
      }
    } else if (file && assetResult && "kind" in assetResult) {
      for (const post of createdPosts) {
        const mediaResult = await uploadPostMedia(post.id, post.platform as MarketingPlatform, file, assetResult.kind);
        if (!mediaResult.ok) {
          await admin.storage.from(MARKETING_BUCKET).remove(uploadedPaths);
          await admin.from("marketing_campaigns").delete().eq("id", campaignId);
          return mediaResult;
        }
        uploadedPaths.push(mediaResult.storagePath);
        const { data: signedMedia } = await admin.storage
          .from(MARKETING_BUCKET)
          .createSignedUrl(mediaResult.storagePath, 60 * 60 * 24);
        if (signedMedia?.signedUrl) {
          bufferMediaByPostId.set(post.id, {
            kind: assetResult.kind,
            url: signedMedia.signedUrl,
          });
        }

        const assetRecord = await createMarketingAsset(admin, {
          campaign_id: campaignId,
          post_id: post.id,
          media_id: selectedMediaId,
          source: assetSourceForMediaMode(mediaMode),
          kind: assetResult.kind,
          storage_path: mediaResult.storagePath,
          mime_type: mediaResult.mimeType,
          size_bytes: mediaResult.sizeBytes,
          label: selectedMediaLabel ?? file.name,
          approval_status: "approved",
          created_by: createdBy,
        });
        if (!assetRecord.ok) {
          await admin.storage.from(MARKETING_BUCKET).remove(uploadedPaths);
          await admin.from("marketing_campaigns").delete().eq("id", campaignId);
          return { ok: false, error: assetRecord.error };
        }
      }
    }

    for (const post of createdPosts) {
      const platform = post.platform as MarketingPlatform;
      const attachedKind = assetResult && "kind" in assetResult ? assetResult.kind : null;
      const needsGeneratedMedia =
        mediaMode === "queue-ai" ||
        (platformPrefersVideo(platform) && attachedKind !== "video");

      if (needsGeneratedMedia) {
        const automationContext = {
          campaignId,
          postId: post.id,
          platform,
          campaignName: campaignLabel,
          templateKey,
          mediaMode,
          title,
          body,
          offer,
          callToAction,
          notes,
          aiPrompt,
          scheduledAt: scheduledAtIso,
        };
        const jobResult = await createMarketingAgentJob(admin, {
          campaign_id: campaignId,
          post_id: post.id,
          job_type: automationJobTypeForPlatform(platform),
          status: "queued",
          priority: platformPrefersVideo(platform) ? 20 : 10,
          input: buildAutomationInput(automationContext),
        });
        if (!jobResult.ok) {
          await admin.storage.from(MARKETING_BUCKET).remove(uploadedPaths);
          await admin.from("marketing_campaigns").delete().eq("id", campaignId);
          return { ok: false, error: jobResult.error };
        }
      }
    }

    const bufferText = buildBufferPostText({
      campaignLabel,
      title,
      body,
      offer,
      callToAction,
      notes,
    });
    const bufferPosts = await createBufferPosts(
      createdPosts.map((post) => ({
        platform: post.platform as MarketingPlatform,
        title,
        text: bufferText,
        scheduledAt: scheduledAtIso,
        media: bufferMediaByPostId.get(post.id) ?? null,
      }))
    );

    const postedPlatforms = new Set(
      bufferPosts
        .filter((post) => post.status === "created" && post.mode === "shareNow")
        .map((post) => post.platform)
    );
    const postedIds = createdPosts
      .filter((post) => postedPlatforms.has(post.platform as MarketingPlatform))
      .map((post) => post.id);
    if (postedIds.length > 0) {
      const { error: postedStatusError } = await admin
        .from("marketing_posts")
        .update({
          status: "posted",
          posted_at: new Date().toISOString(),
        })
        .in("id", postedIds);
      if (postedStatusError) {
        return {
          ok: false,
          error: `Buffer accepted the post, but the local status could not update: ${postedStatusError.message}`,
        };
      }
    }

    await recordMarketingEvent(admin, {
      campaign_id: campaignId,
      actor: "admin",
      event_type: "campaign_created",
      event_data: {
        platforms,
        mediaMode,
        scheduledAt: scheduledAtIso,
        postIds: createdPosts.map((post) => post.id),
        bufferPosts,
      },
    });

    revalidateMarketingPaths(createdPosts[0]?.id);
    return {
      ok: true,
      campaignId,
      ids: createdPosts.map((post) => post.id),
      bufferPosts,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not save marketing post.",
    };
  }
}
