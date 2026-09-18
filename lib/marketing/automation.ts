import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Json,
  MarketingAgentJobInsert,
  MarketingAssetInsert,
  MarketingEventInsert,
} from "@/lib/supabase/database.types";
import {
  platformPrimaryMediaKind,
  type MarketingJobType,
  type MarketingPlatform,
  type MarketingTemplateKey,
  type MediaStrategy,
} from "@/lib/marketing/schema";

type AdminClient = SupabaseClient<Database>;

export interface MarketingAutomationContext {
  campaignId: string;
  postId: string;
  platform: MarketingPlatform;
  campaignName: string;
  templateKey: MarketingTemplateKey;
  mediaMode: MediaStrategy;
  title: string | null;
  body: string | null;
  offer: string | null;
  callToAction: string | null;
  notes: string | null;
  aiPrompt: string | null;
  scheduledAt: string | null;
}

export function automationJobTypeForPlatform(platform: MarketingPlatform): MarketingJobType {
  return platformPrimaryMediaKind(platform) === "video" ? "generate_video" : "generate_image";
}

export function buildAutomationInput(input: MarketingAutomationContext): Json {
  return {
    campaignId: input.campaignId,
    postId: input.postId,
    platform: input.platform,
    campaignName: input.campaignName,
    templateKey: input.templateKey,
    mediaMode: input.mediaMode,
    title: input.title,
    body: input.body,
    offer: input.offer,
    callToAction: input.callToAction,
    notes: input.notes,
    aiPrompt: input.aiPrompt,
    scheduledAt: input.scheduledAt,
    targetMediaKind: platformPrimaryMediaKind(input.platform),
  };
}

export async function createMarketingAsset(
  admin: AdminClient,
  asset: MarketingAssetInsert
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { data, error } = await admin
    .from("marketing_assets")
    .insert(asset)
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not record marketing asset." };
  }

  return { ok: true, id: data.id };
}

export async function createMarketingAgentJob(
  admin: AdminClient,
  job: MarketingAgentJobInsert
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { data, error } = await admin
    .from("marketing_agent_jobs")
    .insert(job)
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create automation job." };
  }

  return { ok: true, id: data.id };
}

export async function recordMarketingEvent(
  admin: AdminClient,
  event: MarketingEventInsert
): Promise<void> {
  const { error } = await admin.from("marketing_events").insert(event);
  if (error) {
    console.error("[marketing-events] insert failed:", error.message);
  }
}
