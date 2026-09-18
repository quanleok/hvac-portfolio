"use client";

import Link from "next/link";
import { type ChangeEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MediaPickerModal, type PickerItem } from "@/components/admin/media-picker-modal";
import { OpenClawChat } from "./openclaw-chat";
import { createMarketingCampaign, prepareMarketingMediaUpload } from "../actions";
import { MARKETING_BUCKET } from "@/lib/marketing/storage";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  PLATFORMS,
  type MarketingPlatform,
  type MarketingStatus,
  type MarketingTemplateKey,
  type MediaStrategy,
  platformAccent,
  platformLabel,
  platformShortLabel,
  platformSupportsNativeConnect,
} from "@/lib/marketing/schema";

interface HistoryPost {
  id: string;
  campaign_id: string;
  campaign_name: string | null;
  platform: MarketingPlatform;
  status: MarketingStatus;
  title: string | null;
  body: string | null;
  workflow: unknown;
  scheduled_at: string | null;
  posted_at: string | null;
  updated_at: string;
  media_kind: "image" | "video" | null;
}

interface ConnectionAccount {
  id: string;
  accountId: string;
  name: string;
}

interface PlatformConnection {
  platform: MarketingPlatform;
  configured: boolean;
  accounts: ConnectionAccount[];
}

interface Props {
  history: HistoryPost[];
  library: PickerItem[];
  connections: PlatformConnection[];
  automation: AutomationSummary;
  bufferConfigured: boolean;
  openClawConfigured: boolean;
}

interface AutomationSummary {
  assets: number;
  queuedJobs: number;
  runningJobs: number;
  failedJobs: number;
  completedJobs: number;
}

interface CampaignWorkflow {
  templateKey?: MarketingTemplateKey;
  callToAction?: string | null;
  offer?: string | null;
  notes?: string | null;
  aiPrompt?: string | null;
  mediaMode?: MediaStrategy;
  selectedPlatforms?: MarketingPlatform[];
  selectedMediaLabel?: string | null;
  queueState?: string | null;
  queuedForAutomation?: boolean;
  needsVideo?: boolean;
  targetMediaKind?: "image" | "video";
}

interface CampaignGroup {
  id: string;
  name: string;
  title: string | null;
  body: string | null;
  updatedAt: string;
  scheduledAt: string | null;
  posts: HistoryPost[];
  workflow: CampaignWorkflow;
}

type QueueFilter = "all" | "draft" | "ready" | "scheduled" | "ai" | "failed" | "posted";

function filenameFromUrl(url: string, fallback: string): string {
  try {
    const path = new URL(url).pathname;
    const last = path.split("/").pop();
    return last && last.length > 0 ? decodeURIComponent(last) : fallback;
  } catch {
    return fallback;
  }
}

async function pickerItemToFile(item: PickerItem): Promise<File> {
  const response = await fetch(item.url);
  if (!response.ok) throw new Error(`Could not load media (${response.status}).`);
  const blob = await response.blob();
  const name = filenameFromUrl(item.url, item.type === "image" ? "image" : "video");
  const fallbackType = item.type === "image" ? "image/jpeg" : "video/mp4";
  return new File([blob], name, { type: blob.type || fallbackType });
}

function revokeObjectUrl(url: string | null) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function formatDateTime(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function excerpt(value: string | null, fallback: string) {
  if (!value) return fallback;
  return value.length > 160 ? `${value.slice(0, 157)}...` : value;
}

function parseWorkflow(workflow: unknown): CampaignWorkflow {
  if (!workflow || typeof workflow !== "object" || Array.isArray(workflow)) {
    return {};
  }
  return workflow as CampaignWorkflow;
}

function campaignStatus(group: CampaignGroup): QueueFilter {
  const hasFailed = group.posts.some((post) => post.status === "failed");
  const hasPosted = group.posts.some((post) => post.status === "posted");
  const hasScheduled = group.posts.some((post) => post.status === "scheduled");
  const hasReady = group.posts.some((post) => post.status === "ready");
  const needsMedia =
    group.workflow.mediaMode === "queue-ai" ||
    group.posts.some((post) => post.status === "needs_ai" || parseWorkflow(post.workflow).queuedForAutomation);
  if (hasFailed) return "failed";
  if (needsMedia) return "ai";
  if (hasScheduled) return "scheduled";
  if (hasPosted && group.posts.every((post) => post.status === "posted")) return "posted";
  if (hasReady) return "ready";
  return "draft";
}

function campaignStatusLabel(status: QueueFilter) {
  if (status === "all") return "All";
  if (status === "ai") return "Needs media";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function CampaignComposer({
  library,
  connections,
  bufferConfigured,
}: {
  library: PickerItem[];
  connections: PlatformConnection[];
  bufferConfigured: boolean;
}) {
  const router = useRouter();
  const [selectedPlatforms, setSelectedPlatforms] = useState<MarketingPlatform[]>([
    "facebook",
    "sms",
  ]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaMode, setMediaMode] = useState<MediaStrategy>("text-only");
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduleAt, setScheduleAt] = useState("");
  const [assetKind, setAssetKind] = useState<"image" | "video">("image");
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [selectedMediaLabel, setSelectedMediaLabel] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingLibraryMedia, setLoadingLibraryMedia] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    return () => revokeObjectUrl(selectedPreviewUrl);
  }, [selectedPreviewUrl]);

  const connectedPlatforms = new Set(
    connections.filter((connection) => connection.accounts.length > 0).map((connection) => connection.platform)
  );
  const nativeSelectedPlatforms = selectedPlatforms.filter(platformSupportsNativeConnect);
  const missingConnections = nativeSelectedPlatforms.filter((platform) => !connectedPlatforms.has(platform));
  const hasYouTube = selectedPlatforms.includes("youtube");
  const youtubeNeedsVideo = hasYouTube && (mediaMode === "text-only" || assetKind !== "video" || !selectedFile);
  const channelSummary = selectedPlatforms.map((platform) => platformLabel(platform)).join(", ");

  function uploadTargetPlatform(): MarketingPlatform {
    if (selectedPlatforms.includes("youtube")) return "youtube";
    if (selectedPlatforms.includes("facebook")) return "facebook";
    if (selectedPlatforms.includes("tiktok")) return "tiktok";
    return selectedPlatforms[0] ?? "facebook";
  }

  async function uploadSelectedMedia() {
    if (!selectedFile) return null;

    setUploadingMedia("Uploading media...");
    const prepare = await prepareMarketingMediaUpload({
      platform: uploadTargetPlatform(),
      fileName: selectedFile.name,
      contentType: selectedFile.type,
      sizeBytes: selectedFile.size,
    });
    if (!prepare.ok) {
      throw new Error(prepare.error);
    }

    const supabase = createSupabaseBrowserClient();
    const { error: uploadError } = await supabase.storage
      .from(MARKETING_BUCKET)
      .uploadToSignedUrl(prepare.path, prepare.token, selectedFile, {
        contentType: selectedFile.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const kind = selectedFile.type.startsWith("video/") ? "video" : "image";
    return {
      storagePath: prepare.path,
      kind,
      mimeType: selectedFile.type,
      sizeBytes: selectedFile.size,
      label: selectedMediaLabel ?? selectedFile.name,
    };
  }

  function clearMedia() {
    revokeObjectUrl(selectedPreviewUrl);
    setSelectedFile(null);
    setSelectedMediaId(null);
    setSelectedMediaLabel(null);
    setSelectedPreviewUrl(null);
  }

  function togglePlatform(platform: MarketingPlatform) {
    setSelectedPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform]
    );
  }

  async function pickFromLibrary(item: PickerItem) {
    setPickerOpen(false);
    setLoadingLibraryMedia(true);
    setError(null);
    try {
      const file = await pickerItemToFile(item);
      revokeObjectUrl(selectedPreviewUrl);
      setSelectedFile(file);
      setSelectedMediaId(item.id);
      setSelectedMediaLabel(item.caption ?? item.type);
      setAssetKind(item.type);
      setSelectedPreviewUrl(item.type === "image" ? URL.createObjectURL(file) : null);
      setMediaMode("library");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load that media.");
    } finally {
      setLoadingLibraryMedia(false);
    }
  }

  function onUploadChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    revokeObjectUrl(selectedPreviewUrl);
    setSelectedFile(file);
    setSelectedMediaId(null);
    setSelectedMediaLabel(file?.name ?? null);
    if (!file) {
      setSelectedPreviewUrl(null);
      return;
    }
    const kind = file.type.startsWith("video/") ? "video" : "image";
    setAssetKind(kind);
    setSelectedPreviewUrl(kind === "image" ? URL.createObjectURL(file) : null);
    setMediaMode("upload");
  }

  async function submit() {
    setError(null);
    setSuccess(null);

    if (selectedPlatforms.length === 0) {
      setError("Pick at least one channel.");
      return;
    }
    if (!body.trim() && !title.trim()) {
      setError("Write the message first.");
      return;
    }
    if (hasYouTube && !title.trim()) {
      setError("YouTube needs a short title.");
      return;
    }
    if (hasYouTube && youtubeNeedsVideo) {
      setError("YouTube needs a video. Upload or pick a video, or remove YouTube.");
      return;
    }
    if ((mediaMode === "upload" || mediaMode === "library") && !selectedFile) {
      setError("Attach media or choose No media.");
      return;
    }
    if (scheduleMode === "later" && !scheduleAt) {
      setError("Pick a date and time.");
      return;
    }

    startTransition(async () => {
      try {
        const uploadedMedia =
          selectedFile && mediaMode !== "text-only" ? await uploadSelectedMedia() : null;
        setUploadingMedia("Saving...");

        const formData = new FormData();
        formData.set("platforms", JSON.stringify(selectedPlatforms));
        formData.set("campaignName", "");
        formData.set("title", title.trim());
        formData.set("body", body.trim());
        formData.set("callToAction", "");
        formData.set("offer", "");
        formData.set("notes", "");
        formData.set("aiPrompt", "");
        formData.set("templateKey", "seasonal-promo");
        formData.set("mediaMode", mediaMode);
        formData.set("scheduleMode", scheduleMode);
        formData.set("scheduleAt", scheduleAt);
        if (selectedMediaId) formData.set("selectedMediaId", selectedMediaId);
        if (selectedMediaLabel) formData.set("selectedMediaLabel", selectedMediaLabel);
        if (uploadedMedia) {
          formData.set("uploadedStoragePath", uploadedMedia.storagePath);
          formData.set("uploadedKind", uploadedMedia.kind);
          formData.set("uploadedMimeType", uploadedMedia.mimeType);
          formData.set("uploadedSizeBytes", String(uploadedMedia.sizeBytes));
          formData.set("uploadedLabel", uploadedMedia.label);
        }

        const result = await createMarketingCampaign(formData);
        if (!result.ok) {
          setError(result.error);
          return;
        }

        const bufferCreated = result.bufferPosts.filter((post) => post.status === "created");
        const bufferFailed = result.bufferPosts.find((post) => post.status === "failed");
        if (bufferFailed) {
          setError(`Saved locally, but Buffer did not sync: ${bufferFailed.error}`);
          setSuccess(`Saved locally for ${channelSummary}.`);
        } else {
          const baseMessage =
            scheduleMode === "later"
              ? `Scheduled for ${channelSummary}.`
              : bufferCreated.length > 0
                ? `Posted for ${channelSummary}.`
                : `Saved locally for ${channelSummary}.`;
          const bufferMessage =
            bufferCreated.length > 0
              ? scheduleMode === "later"
                ? ` ${bufferCreated.length} Buffer post${bufferCreated.length === 1 ? "" : "s"} scheduled.`
                : ` ${bufferCreated.length} Buffer post${bufferCreated.length === 1 ? "" : "s"} sent now.`
              : "";
          setSuccess(`${baseMessage}${bufferMessage}`);
        }
        setTitle("");
        setBody("");
        setScheduleMode("now");
        setScheduleAt("");
        setMediaMode("text-only");
        setSelectedMediaId(null);
        setSelectedMediaLabel(null);
        setSelectedFile(null);
        revokeObjectUrl(selectedPreviewUrl);
        setSelectedPreviewUrl(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save marketing item.");
      } finally {
        setUploadingMedia(null);
      }
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[#203246] bg-[#0d1827] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">New post</h2>
          <p className="mt-1 text-sm text-[#9aafc5]">
            Pick channels, write one message, then post now or schedule later.
          </p>
          {bufferConfigured ? (
            <p className="mt-2 text-xs font-semibold text-[#8ad0ff]">
              Buffer is connected. Social posts can publish now or schedule for later.
            </p>
          ) : null}
        </div>
        <Link
          href="/admin/marketing/accounts"
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#2a3d55] bg-[#142133] px-3 text-sm font-semibold text-white hover:bg-[#1a2a42]"
        >
          Connections
        </Link>
      </div>

      <div className="rounded-xl border border-[#203246] bg-[#0a1320] p-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#8fa8c0]">
          Channels
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => {
            const selected = selectedPlatforms.includes(platform);
            const accent = platformAccent(platform);
            return (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                className="min-h-10 rounded-full border px-4 text-sm font-bold transition"
                style={{
                  borderColor: selected ? accent : "#2a3d55",
                  backgroundColor: selected ? `${accent}22` : "#101d2d",
                  color: selected ? "#ffffff" : "#b8c7d9",
                }}
              >
                {selected ? "On " : ""}
                {platformLabel(platform)}
              </button>
            );
          })}
        </div>
        {missingConnections.length > 0 ? (
          <p className="mt-3 text-sm text-[#f6d58f]">
            Direct connection needed for {missingConnections.map((platform) => platformLabel(platform)).join(", ")}.
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4 rounded-xl border border-[#203246] bg-[#0a1320] p-4">
          {hasYouTube ? (
            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#8fa8c0]">
                YouTube title
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Short title for the video"
                className="mt-2 w-full rounded-xl border border-[#24384d] bg-[#101d2d] px-4 py-3 text-sm text-white placeholder:text-[#6f8399] focus:border-[#4f7cff] focus:outline-none"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#8fa8c0]">
              Message
            </span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={7}
              placeholder="Example: Spring tune-ups are open this week. Call or text us to get on the schedule before the heat hits."
              className="mt-2 w-full rounded-xl border border-[#24384d] bg-[#101d2d] p-4 text-sm text-white placeholder:text-[#6f8399] focus:border-[#4f7cff] focus:outline-none"
            />
          </label>
        </div>

        <div className="space-y-4 rounded-xl border border-[#203246] bg-[#0a1320] p-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#8fa8c0]">
              Media
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["text-only", "upload", "library"] as MediaStrategy[]).map((strategy) => (
                <button
                  key={strategy}
                  type="button"
                  onClick={() => {
                    setError(null);
                    if (strategy !== mediaMode) clearMedia();
                    setMediaMode(strategy);
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm font-bold ${
                    mediaMode === strategy
                      ? "border-[#d8e7f6] bg-[#d8e7f6] text-[#09121e]"
                      : "border-[#24384d] bg-[#101d2d] text-[#d7e2f0]"
                  }`}
                >
                  {strategy === "text-only" ? "No media" : strategy === "upload" ? "Upload" : "Library"}
                </button>
              ))}
            </div>
          </div>

          {mediaMode === "upload" ? (
            <label className="block rounded-xl border border-[#24384d] bg-[#101d2d] px-4 py-3 text-sm text-[#d7e2f0]">
              <span className="block font-bold text-white">Choose photo or video</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={onUploadChange}
                className="mt-3 block w-full text-sm text-[#9aafc5]"
              />
            </label>
          ) : null}

          {mediaMode === "library" ? (
            <div className="space-y-3 rounded-xl border border-[#24384d] bg-[#101d2d] p-3">
              <div className="grid grid-cols-2 gap-2">
                {(["image", "video"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setAssetKind(kind)}
                    className={`rounded-lg px-3 py-2 text-sm font-bold capitalize ${
                      assetKind === kind ? "bg-[#d8e7f6] text-[#09121e]" : "bg-[#142133] text-white"
                    }`}
                  >
                    {kind}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                disabled={loadingLibraryMedia}
                className="w-full rounded-lg border border-[#2a3d55] bg-[#142133] px-4 py-3 text-sm font-bold text-white hover:bg-[#1a2a42] disabled:opacity-60"
              >
                {loadingLibraryMedia ? "Loading..." : `Pick ${assetKind}`}
              </button>
            </div>
          ) : null}

          {selectedMediaLabel ? (
            <div className="rounded-xl border border-[#24384d] bg-[#101d2d] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{selectedMediaLabel}</p>
                  <p className="mt-1 text-xs text-[#8fa8c0]">{assetKind}</p>
                </div>
                <button
                  type="button"
                  onClick={clearMedia}
                  className="text-xs font-bold text-[#9aafc5] hover:text-white"
                >
                  Remove
                </button>
              </div>
              {selectedPreviewUrl && assetKind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedPreviewUrl}
                  alt={selectedMediaLabel}
                  className="mt-3 max-h-48 w-full rounded-lg object-cover"
                />
              ) : null}
            </div>
          ) : null}

          {youtubeNeedsVideo ? (
            <p className="rounded-lg border border-[#8a6a2b] bg-[#393222] p-3 text-sm text-[#f6d58f]">
              YouTube needs a video file.
            </p>
          ) : null}

          <div className="rounded-xl border border-[#24384d] bg-[#101d2d] p-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#8fa8c0]">
              Timing
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ["now", "Post now"],
                ["later", "Schedule later"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScheduleMode(value as "now" | "later")}
                  className={`rounded-lg px-3 py-2 text-sm font-bold ${
                    scheduleMode === value ? "bg-[#d8e7f6] text-[#09121e]" : "bg-[#142133] text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {scheduleMode === "later" ? (
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(event) => setScheduleAt(event.target.value)}
                className="mt-3 w-full rounded-lg border border-[#24384d] bg-[#0d1827] px-3 py-2 text-sm text-white focus:border-[#4f7cff] focus:outline-none"
              />
            ) : null}
          </div>

          {error ? (
            <p className="rounded-lg border border-[#c53030] bg-[#5a1a1a] p-3 text-sm text-white">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-lg border border-[#2f855a] bg-[#183324] p-3 text-sm text-white">
              {success}
            </p>
          ) : null}

          <button
            type="button"
            onClick={submit}
            disabled={pending || Boolean(uploadingMedia)}
            className="w-full rounded-xl bg-[#d8e7f6] px-5 py-4 text-base font-extrabold text-[#09121e] hover:bg-white disabled:opacity-60"
          >
            {uploadingMedia ?? (pending ? "Saving..." : scheduleMode === "later" ? "Schedule post" : "Post now")}
          </button>
        </div>
      </div>

      {pickerOpen && (
        <MediaPickerModal
          items={library}
          accept={assetKind}
          onPick={pickFromLibrary}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </section>
  );
}

function QueueCard({ group }: { group: CampaignGroup }) {
  const filterStatus = campaignStatus(group);
  const scheduleLabel = formatDateTime(group.scheduledAt);

  return (
    <article className="rounded-2xl border border-[#203246] bg-[#0d1827] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] ${
                filterStatus === "failed"
                  ? "bg-[#4a2028] text-[#ff9ba7]"
                  : filterStatus === "scheduled"
                  ? "bg-[#3b3120] text-[#f6d58f]"
                  : filterStatus === "ai"
                    ? "bg-[#24303f] text-[#8ad0ff]"
                    : filterStatus === "ready"
                      ? "bg-[#183324] text-[#9ae6b4]"
                    : filterStatus === "posted"
                      ? "bg-[#183324] text-[#9ae6b4]"
                      : "bg-[#1d2a3d] text-[#d7e2f0]"
              }`}
            >
              {campaignStatusLabel(filterStatus)}
            </span>
            {scheduleLabel ? <span className="text-xs text-[#8fa8c0]">Scheduled {scheduleLabel}</span> : null}
          </div>

          <h3 className="truncate text-lg font-bold text-white">
            {group.title ?? group.name}
          </h3>
          <p className="max-w-3xl text-sm text-[#9aafc5]">{excerpt(group.body, "No content added yet.")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {group.posts.map((post) => (
            <span
              key={post.id}
              className="rounded-full border px-3 py-2 text-xs font-extrabold uppercase tracking-[0.16em]"
              style={{
                borderColor: platformAccent(post.platform),
                color: platformAccent(post.platform),
                backgroundColor: `${platformAccent(post.platform)}15`,
              }}
            >
              {platformShortLabel(post.platform)}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {group.posts.map((post) => (
          <Link
            key={post.id}
            href={`/admin/marketing/${post.id}`}
            className="inline-flex min-h-10 items-center rounded-lg border border-[#2a3d55] bg-[#142133] px-3 text-sm font-bold text-white hover:bg-[#1a2a42]"
          >
            Open {platformLabel(post.platform)}
          </Link>
        ))}
      </div>
    </article>
  );
}

export function MarketingShell({
  history,
  library,
  connections,
  bufferConfigured,
  openClawConfigured,
}: Props) {
  const [filter, setFilter] = useState<QueueFilter>("all");

  const groups = useMemo<CampaignGroup[]>(() => {
    const grouped = new Map<string, CampaignGroup>();

    for (const post of history) {
      const workflow = parseWorkflow(post.workflow);
      const current = grouped.get(post.campaign_id);
      if (current) {
        current.posts.push(post);
        if (new Date(post.updated_at).getTime() > new Date(current.updatedAt).getTime()) {
          current.updatedAt = post.updated_at;
        }
        continue;
      }

      grouped.set(post.campaign_id, {
        id: post.campaign_id,
        name: post.campaign_name ?? post.title ?? "Marketing post",
        title: post.title,
        body: post.body,
        updatedAt: post.updated_at,
        scheduledAt: post.scheduled_at,
        posts: [post],
        workflow,
      });
    }

    return Array.from(grouped.values()).sort(
      (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  }, [history]);

  const visibleGroups = groups.filter((group) => filter === "all" || campaignStatus(group) === filter);
  const scheduledCount = groups.filter((group) => campaignStatus(group) === "scheduled").length;
  const postedCount = groups.filter((group) => campaignStatus(group) === "posted").length;
  const filterOptions: [QueueFilter, string, number][] = [
    ["all", "All", groups.length],
    ["scheduled", "Scheduled", scheduledCount],
    ["posted", "Posted", postedCount],
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[0.75rem] font-extrabold uppercase tracking-[0.24em] text-[#8fa8c0]">
            Marketing studio
          </p>
          <h1 className="text-3xl font-bold text-white">Marketing posts</h1>
          <p className="max-w-2xl text-sm text-[#9aafc5]">
            One simple place to create, publish, and schedule customer-facing posts.
          </p>
        </div>
        <Link
          href="/admin/marketing/accounts"
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#2a3d55] bg-[#142133] px-3 text-sm font-semibold text-white hover:bg-[#1a2a42]"
        >
          Connections
        </Link>
      </div>

      <CampaignComposer
        library={library}
        connections={connections}
        bufferConfigured={bufferConfigured}
      />

      <OpenClawChat configured={openClawConfigured} />

      <section id="queue" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Saved posts</h2>
            <p className="text-sm text-[#9aafc5]">Review all posts, scheduled posts, or posted posts.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full border px-4 py-2 text-sm font-bold ${
                  filter === value
                    ? "border-[#d8e7f6] bg-[#d8e7f6] text-[#09121e]"
                    : "border-[#2a3d55] bg-[#142133] text-white"
                }`}
              >
                {label} {count}
              </button>
            ))}
          </div>
        </div>

        {visibleGroups.length === 0 ? (
          <p className="rounded-[1.4rem] border border-[#203246] bg-[#0d1827] p-8 text-center text-sm text-[#9aafc5]">
            Nothing here yet.
          </p>
        ) : (
          <div className="space-y-4">
            {visibleGroups.map((group) => (
              <QueueCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
