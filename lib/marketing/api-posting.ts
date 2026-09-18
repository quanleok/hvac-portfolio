import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAndStoreMedia } from "@/lib/api/fetch-media";
import { createBufferPosts, type BufferPostSync } from "@/lib/marketing/buffer";
import { createMarketingAsset, recordMarketingEvent } from "@/lib/marketing/automation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  platformLabel,
  platformPrefersVideo,
  type MarketingMediaKind,
  type MarketingPlatform,
} from "@/lib/marketing/schema";
import { MARKETING_BUCKET } from "@/lib/marketing/storage";
import type {
  Database,
  Json,
  MarketingPostRow,
  MarketingPostUpdate,
} from "@/lib/supabase/database.types";

type AdminClient = SupabaseClient<Database>;

export type ApiPostAction = "save" | "post_now" | "schedule_later";

export interface ApiPostMediaInput {
  kind: MarketingMediaKind;
  url?: string | null;
  storagePath?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  label?: string | null;
}

export interface CreateApiMarketingPostsInput {
  actor: string;
  platforms: MarketingPlatform[];
  action: ApiPostAction;
  campaignName?: string | null;
  title?: string | null;
  body?: string | null;
  scheduledAt?: string | null;
  media?: ApiPostMediaInput | null;
}

export type MarketingPostDeliveryResult =
  | {
      ok: true;
      id: string;
      platform: MarketingPlatform;
      status: MarketingPostRow["status"];
      scheduled_at: string | null;
      posted_at: string | null;
    }
  | {
      ok: false;
      error: string;
      status?: number;
    };

export type CreateApiMarketingPostsResult =
  | {
      ok: true;
      campaignId: string;
      posts: Array<{
        id: string;
        platform: MarketingPlatform;
        status: MarketingPostRow["status"];
        scheduled_at: string | null;
      }>;
      bufferPosts: BufferPostSync[];
      warnings: string[];
    }
  | {
      ok: false;
      error: string;
      status?: number;
    };

interface ResolvedMedia {
  kind: MarketingMediaKind;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  label: string | null;
  externalUrl: string | null;
  wasFetched: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function workflowRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function defaultCampaignName(input: {
  campaignName?: string | null;
  title?: string | null;
  body?: string | null;
}) {
  return (
    input.campaignName?.trim() ||
    input.title?.trim() ||
    input.body?.trim().slice(0, 60) ||
    "Marketing post"
  );
}

function buildPostText(input: {
  campaignName: string;
  title: string | null;
  body: string | null;
}) {
  return input.body?.trim() || input.title?.trim() || input.campaignName;
}

function validateScheduledAt(action: ApiPostAction, scheduledAt: string | null | undefined) {
  if (action !== "schedule_later") return { ok: true as const, scheduledAtIso: null };
  if (!scheduledAt?.trim()) {
    return { ok: false as const, error: "Missing 'scheduled_at' for schedule_later." };
  }
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) {
    return { ok: false as const, error: "Invalid 'scheduled_at' ISO string." };
  }
  if (date.getTime() < Date.now() - 60_000) {
    return { ok: false as const, error: "'scheduled_at' is in the past." };
  }
  return { ok: true as const, scheduledAtIso: date.toISOString() };
}

function validateMediaForPlatforms(
  platforms: MarketingPlatform[],
  media: ApiPostMediaInput | null | undefined
) {
  const videoPlatforms = platforms.filter(platformPrefersVideo);
  if (videoPlatforms.length === 0) return null;
  if (media?.kind === "video") return null;
  return `${videoPlatforms.map(platformLabel).join(", ")} need a video file.`;
}

async function resolveIncomingMedia(input: {
  admin: AdminClient;
  media: ApiPostMediaInput | null | undefined;
  storagePlatform: MarketingPlatform;
}): Promise<{ ok: true; media: ResolvedMedia | null } | { ok: false; error: string }> {
  const media = input.media;
  if (!media) return { ok: true, media: null };

  if (media.url?.trim()) {
    const fetched = await fetchAndStoreMedia({
      url: media.url.trim(),
      platform: input.storagePlatform,
      kind: media.kind,
    });
    if (!fetched.ok) return fetched;
    return {
      ok: true,
      media: {
        kind: media.kind,
        storagePath: fetched.media.storagePath,
        mimeType: fetched.media.mimeType,
        sizeBytes: fetched.media.sizeBytes,
        label: media.label?.trim() || fetched.media.fileName,
        externalUrl: media.url.trim(),
        wasFetched: true,
      },
    };
  }

  const storagePath = media.storagePath?.trim();
  const mimeType = media.mimeType?.trim();
  const sizeBytes = media.sizeBytes ?? 0;
  if (!storagePath || !mimeType || !sizeBytes) {
    return {
      ok: false,
      error: "Media needs either 'media_url' or storage_path, mime_type, and size_bytes.",
    };
  }

  return {
    ok: true,
    media: {
      kind: media.kind,
      storagePath,
      mimeType,
      sizeBytes,
      label: media.label?.trim() || storagePath.split("/").pop() || null,
      externalUrl: null,
      wasFetched: false,
    },
  };
}

async function signMediaUrl(
  admin: AdminClient,
  storagePath: string
): Promise<string | null> {
  const { data } = await admin.storage
    .from(MARKETING_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24);
  return data?.signedUrl ?? null;
}

function bufferWarning(sync: BufferPostSync) {
  if (sync.status === "created") return `${platformLabel(sync.platform)} was sent through Buffer.`;
  if (sync.status === "failed") return `${platformLabel(sync.platform)} Buffer sync failed: ${sync.error}`;
  if (sync.reason === "missing_media") return `${platformLabel(sync.platform)} needs media before Buffer can send it.`;
  if (sync.reason === "no_channel") return `${platformLabel(sync.platform)} is not connected in Buffer.`;
  return `${platformLabel(sync.platform)} is not supported for direct Buffer sending.`;
}

export async function createApiMarketingPosts(
  input: CreateApiMarketingPostsInput
): Promise<CreateApiMarketingPostsResult> {
  const platforms = Array.from(new Set(input.platforms));
  if (platforms.length === 0) {
    return { ok: false, error: "Select at least one marketing platform." };
  }

  const title = input.title?.trim() || null;
  const body = input.body?.trim() || null;
  if (!title && !body) {
    return { ok: false, error: "Add 'title' or 'body' before creating a post." };
  }
  if (platforms.includes("youtube") && !title) {
    return { ok: false, error: "YouTube posts need a title." };
  }

  const mediaError = validateMediaForPlatforms(platforms, input.media);
  if (mediaError) return { ok: false, error: mediaError };

  const schedule = validateScheduledAt(input.action, input.scheduledAt);
  if (!schedule.ok) return { ok: false, error: schedule.error };

  const campaignId = crypto.randomUUID();
  const campaignName = defaultCampaignName({
    campaignName: input.campaignName,
    title,
    body,
  });
  const admin = createSupabaseAdminClientTyped();
  const mediaResult = await resolveIncomingMedia({
    admin,
    media: input.media,
    storagePlatform: platforms[0],
  });
  if (!mediaResult.ok) return mediaResult;
  const media = mediaResult.media;

  const { error: campaignError } = await admin.from("marketing_campaigns").insert({
    id: campaignId,
    name: campaignName,
    title,
    body,
    selected_platforms: platforms,
    media_strategy: media ? "upload" : "text-only",
    scheduled_at: schedule.scheduledAtIso,
  });
  if (campaignError) {
    if (media?.wasFetched) await admin.storage.from(MARKETING_BUCKET).remove([media.storagePath]);
    return { ok: false, error: campaignError.message, status: 500 };
  }

  const initialStatus: MarketingPostRow["status"] =
    input.action === "schedule_later" ? "scheduled" : "ready";
  const { data: createdPosts, error: postError } = await admin
    .from("marketing_posts")
    .insert(
      platforms.map((platform) => ({
        campaign_id: campaignId,
        campaign_name: campaignName,
        platform,
        status: initialStatus,
        title,
        body,
        scheduled_at: schedule.scheduledAtIso,
        workflow: {
          source: "openclaw-api",
          mediaMode: media ? "upload" : "text-only",
          selectedPlatforms: platforms,
          mediaReady: Boolean(media),
          queueState: initialStatus,
          requestedAction: input.action,
          requestedScheduleAt: schedule.scheduledAtIso,
          platformLabel: platformLabel(platform),
        } satisfies Json,
      }))
    )
    .select("id, platform, status, scheduled_at");

  if (postError || !createdPosts) {
    if (media?.wasFetched) await admin.storage.from(MARKETING_BUCKET).remove([media.storagePath]);
    await admin.from("marketing_campaigns").delete().eq("id", campaignId);
    return { ok: false, error: postError?.message ?? "Could not create posts.", status: 500 };
  }

  if (media) {
    for (const post of createdPosts) {
      const { error: mediaInsertError } = await admin.from("marketing_post_media").insert({
        post_id: post.id,
        kind: media.kind,
        storage_path: media.storagePath,
        mime_type: media.mimeType,
        size_bytes: media.sizeBytes,
      });
      if (mediaInsertError) {
        await admin.from("marketing_campaigns").delete().eq("id", campaignId);
        if (media.wasFetched) await admin.storage.from(MARKETING_BUCKET).remove([media.storagePath]);
        return { ok: false, error: mediaInsertError.message, status: 500 };
      }

      const asset = await createMarketingAsset(admin, {
        campaign_id: campaignId,
        post_id: post.id,
        source: "openclaw",
        kind: media.kind,
        storage_path: media.storagePath,
        external_url: media.externalUrl,
        mime_type: media.mimeType,
        size_bytes: media.sizeBytes,
        label: media.label,
        approval_status: "approved",
      });
      if (!asset.ok) {
        await admin.from("marketing_campaigns").delete().eq("id", campaignId);
        if (media.wasFetched) await admin.storage.from(MARKETING_BUCKET).remove([media.storagePath]);
        return { ok: false, error: asset.error, status: 500 };
      }
    }
  }

  let bufferPosts: BufferPostSync[] = [];
  let signedMediaUrl: string | null = null;
  if (media && input.action !== "save") {
    signedMediaUrl = await signMediaUrl(admin, media.storagePath);
  }
  if (input.action !== "save") {
    const text = buildPostText({ campaignName, title, body });
    bufferPosts = await createBufferPosts(
      createdPosts.map((post) => ({
        platform: post.platform,
        title,
        text,
        scheduledAt: schedule.scheduledAtIso,
        media:
          media && signedMediaUrl
            ? {
                kind: media.kind,
                url: signedMediaUrl,
              }
            : null,
      }))
    );

    const postedPlatforms = new Set(
      bufferPosts
        .filter((post) => post.status === "created" && post.mode === "shareNow")
        .map((post) => post.platform)
    );
    const postedIds = createdPosts
      .filter((post) => postedPlatforms.has(post.platform))
      .map((post) => post.id);
    if (postedIds.length > 0) {
      await admin
        .from("marketing_posts")
        .update({
          status: "posted",
          posted_at: new Date().toISOString(),
        })
        .in("id", postedIds);
    }
  }

  await recordMarketingEvent(admin, {
    campaign_id: campaignId,
    actor: input.actor,
    event_type: "campaign_created",
    event_data: {
      source: "openclaw-api",
      action: input.action,
      platforms,
      postIds: createdPosts.map((post) => post.id),
      bufferPosts,
    },
  });

  const postedPlatformSet = new Set(
    bufferPosts
      .filter((post) => post.status === "created" && post.mode === "shareNow")
      .map((post) => post.platform)
  );

  return {
    ok: true,
    campaignId,
    posts: createdPosts.map((post) => ({
      id: post.id,
      platform: post.platform,
      status: postedPlatformSet.has(post.platform) ? "posted" : post.status,
      scheduled_at: post.scheduled_at,
    })),
    bufferPosts,
    warnings: bufferPosts.filter((post) => post.status !== "created").map(bufferWarning),
  };
}

export async function sendExistingMarketingPost(input: {
  id: string;
  actor: string;
  scheduledAt?: string | null;
}): Promise<MarketingPostDeliveryResult> {
  const schedule = input.scheduledAt
    ? validateScheduledAt("schedule_later", input.scheduledAt)
    : { ok: true as const, scheduledAtIso: null };
  if (!schedule.ok) return { ok: false, error: schedule.error };

  const admin = createSupabaseAdminClientTyped();
  const { data: post, error: postError } = await admin
    .from("marketing_posts")
    .select("id, campaign_id, campaign_name, platform, status, title, body, workflow, scheduled_at, posted_at")
    .eq("id", input.id)
    .maybeSingle();
  if (postError) return { ok: false, error: postError.message, status: 500 };
  if (!post) return { ok: false, error: "Post not found.", status: 404 };

  const { data: mediaRows } = await admin
    .from("marketing_post_media")
    .select("kind, storage_path")
    .eq("post_id", input.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1);
  const media = mediaRows?.[0] ?? null;
  if (platformPrefersVideo(post.platform) && media?.kind !== "video") {
    return {
      ok: false,
      error: `${platformLabel(post.platform)} needs a video before it can be sent.`,
    };
  }

  const signedMediaUrl = media ? await signMediaUrl(admin, media.storage_path) : null;
  if (media && !signedMediaUrl) {
    return { ok: false, error: "Could not create a signed media URL.", status: 500 };
  }

  const sync = (
    await createBufferPosts([
      {
        platform: post.platform,
        title: post.title,
        text: buildPostText({
          campaignName: post.campaign_name ?? "Marketing post",
          title: post.title,
          body: post.body,
        }),
        scheduledAt: schedule.scheduledAtIso,
        media:
          media && signedMediaUrl
            ? {
                kind: media.kind,
                url: signedMediaUrl,
              }
            : null,
      },
    ])
  )[0];

  if (!sync || sync.status !== "created") {
    return {
      ok: false,
      error: sync ? bufferWarning(sync) : "Buffer did not return a delivery result.",
      status: 502,
    };
  }

  const now = new Date().toISOString();
  const update: MarketingPostUpdate =
    sync.mode === "customScheduled"
      ? {
          status: "scheduled",
          scheduled_at: schedule.scheduledAtIso,
          reminded_at: null,
        }
      : {
          status: "posted",
          posted_at: now,
        };
  update.workflow = {
    ...workflowRecord(post.workflow),
    bufferPostId: sync.id,
    bufferChannelId: sync.channelId,
    bufferMode: sync.mode,
    bufferSyncedAt: now,
    queueState: sync.mode === "customScheduled" ? "scheduled" : "posted",
  } as Json;

  const { error: updateError } = await admin.from("marketing_posts").update(update).eq("id", input.id);
  if (updateError) return { ok: false, error: updateError.message, status: 500 };

  await recordMarketingEvent(admin, {
    campaign_id: post.campaign_id,
    post_id: post.id,
    actor: input.actor,
    event_type: sync.mode === "customScheduled" ? "post_scheduled_to_buffer" : "post_sent_to_buffer",
    event_data: {
      bufferPostId: sync.id,
      bufferChannelId: sync.channelId,
      mode: sync.mode,
      scheduledAt: schedule.scheduledAtIso,
    },
  });

  return {
    ok: true,
    id: post.id,
    platform: post.platform,
    status: sync.mode === "customScheduled" ? "scheduled" : "posted",
    scheduled_at: schedule.scheduledAtIso,
    posted_at: sync.mode === "shareNow" ? now : null,
  };
}

function createSupabaseAdminClientTyped() {
  return createSupabaseAdminClient() as AdminClient;
}
