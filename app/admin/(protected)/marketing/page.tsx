import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getMediaPublicUrl } from "@/lib/media/url";
import { isGoogleConfigured, isMetaConfigured } from "@/lib/marketing/oauth";
import { getBufferConnectedPlatforms, isBufferConfigured } from "@/lib/marketing/buffer";
import { isOpenClawChatConfigured } from "@/lib/openclaw/chat";
import { PLATFORMS, type MarketingPlatform, type MarketingStatus } from "@/lib/marketing/schema";
import { MarketingShell } from "./components/marketing-shell";
import type { PickerItem } from "@/components/admin/media-picker-modal";

export const dynamic = "force-dynamic";

interface HistoryPostRow {
  id: string;
  campaign_id: string;
  campaign_name: string | null;
  platform: string;
  status: string;
  title: string | null;
  body: string | null;
  workflow: unknown;
  scheduled_at: string | null;
  posted_at: string | null;
  updated_at: string;
  marketing_post_media: Array<{ kind: "image" | "video" }> | null;
}

async function loadHistory() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("marketing_posts")
    .select(
      "id, campaign_id, campaign_name, platform, status, title, body, workflow, scheduled_at, posted_at, updated_at, marketing_post_media(kind)"
    )
    .neq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as HistoryPostRow[];

  return rows.map((post) => ({
    id: post.id,
    campaign_id: post.campaign_id,
    campaign_name: post.campaign_name,
    platform: post.platform as MarketingPlatform,
    status: post.status as MarketingStatus,
    title: post.title,
    body: post.body,
    workflow: post.workflow,
    scheduled_at: post.scheduled_at,
    posted_at: post.posted_at,
    updated_at: post.updated_at,
    media_kind:
      Array.isArray(post.marketing_post_media) && post.marketing_post_media[0]
        ? post.marketing_post_media[0].kind
        : null,
  }));
}

async function loadLibrary(): Promise<PickerItem[]> {
  const admin = createSupabaseAdminClient();
  const [{ data: media }, { data: assignments }] = await Promise.all([
    admin
      .from("media")
      .select("id, type, storage_path, caption, alt")
      .order("created_at", { ascending: false }),
    admin.from("media_assignments").select("media_id"),
  ]);

  const assigned = new Set((assignments ?? []).map((row) => row.media_id));

  return (media ?? []).map((item) => ({
    id: item.id,
    type: item.type as "image" | "video",
    url: getMediaPublicUrl(item.storage_path),
    caption: item.caption,
    alt: item.alt,
    isStaging: !assigned.has(item.id),
  }));
}

async function loadConnections() {
  const admin = createSupabaseAdminClient();
  const [{ data }, bufferPlatforms] = await Promise.all([
    admin
      .from("marketing_accounts")
      .select("id, platform, account_id, account_name")
      .eq("is_active", true)
      .order("connected_at", { ascending: false }),
    getBufferConnectedPlatforms(),
  ]);

  const rows = data ?? [];
  const bufferConnected = new Set(bufferPlatforms);
  const metaConfigured = isMetaConfigured();
  const googleConfigured = isGoogleConfigured();

  return PLATFORMS.map((platform) => ({
    platform,
    configured:
      platform === "facebook"
        ? metaConfigured
        : platform === "youtube"
          ? googleConfigured
          : false,
    accounts: [
      ...rows
      .filter((row) => row.platform === platform)
      .map((row) => ({
        id: row.id,
        accountId: row.account_id,
        name: row.account_name,
      })),
      ...(bufferConnected.has(platform)
        ? [
            {
              id: `buffer-${platform}`,
              accountId: "buffer",
              name: "Buffer",
            },
          ]
        : []),
    ],
  }));
}

async function loadAutomationSummary() {
  const admin = createSupabaseAdminClient();
  const [{ data: jobs }, { count: assets }] = await Promise.all([
    admin.from("marketing_agent_jobs").select("status").limit(500),
    admin.from("marketing_assets").select("id", { count: "exact", head: true }),
  ]);

  const rows = jobs ?? [];
  return {
    assets: assets ?? 0,
    queuedJobs: rows.filter((job) => job.status === "queued").length,
    runningJobs: rows.filter((job) => job.status === "running").length,
    failedJobs: rows.filter((job) => job.status === "failed").length,
    completedJobs: rows.filter((job) => job.status === "completed").length,
  };
}

export default async function AdminMarketingPage() {
  const [history, library, connections, automation] = await Promise.all([
    loadHistory(),
    loadLibrary(),
    loadConnections(),
    loadAutomationSummary(),
  ]);

  return (
    <MarketingShell
      history={history}
      library={library}
      connections={connections}
      automation={automation}
      bufferConfigured={isBufferConfigured()}
      openClawConfigured={isOpenClawChatConfigured()}
    />
  );
}
