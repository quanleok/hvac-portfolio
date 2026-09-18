"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createFacebookPost, createYouTubePost, schedulePost } from "../actions";
import { AIVisualGenerator } from "@/components/admin/ai-visual-generator";
import { MediaPickerModal, type PickerItem } from "@/components/admin/media-picker-modal";

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
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

export function PostComposer({ library }: { library: PickerItem[] }) {
  const router = useRouter();
  const [platform, setPlatform] = useState<"facebook" | "youtube">("facebook");
  const [fbState, setFbState] = useState({
    caption: "",
    file: null as File | null,
    previewUrl: null as string | null,
    aiImageUrl: null as string | null,
  });
  const [ytState, setYtState] = useState({
    title: "",
    description: "",
    file: null as File | null,
  });
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduleAt, setScheduleAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickingFromLibrary, setPickingFromLibrary] = useState(false);

  useEffect(() => {
    const previewUrl = fbState.previewUrl;
    return () => revokeObjectUrl(previewUrl);
  }, [fbState.previewUrl]);

  async function pickFromLibrary(item: PickerItem) {
    const selectedPlatform = platform;
    setPickerOpen(false);
    setError(null);
    setPickingFromLibrary(true);
    try {
      const file = await pickerItemToFile(item);
      if (selectedPlatform === "facebook") {
        setFbState((prev) => ({
          ...prev,
          file,
          aiImageUrl: null,
          previewUrl: URL.createObjectURL(file),
        }));
      } else {
        setYtState((prev) => ({ ...prev, file }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load that media.");
    } finally {
      setPickingFromLibrary(false);
    }
  }

  function onFbFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFbState((prev) => ({
      ...prev,
      file: f,
      aiImageUrl: null,
      previewUrl: f ? URL.createObjectURL(f) : null,
    }));
  }

  function onYtFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setYtState((prev) => ({ ...prev, file: f }));
  }

  function handleAIImageGenerated(url: string) {
    setFbState((prev) => ({
      ...prev,
      file: null,
      aiImageUrl: url,
      previewUrl: url,
    }));
  }

  async function downloadAIImageToBlob(url: string): Promise<File | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Image download failed (${response.status}).`);
      const blob = await response.blob();
      const filename = filenameFromUrl(url, `ai-generated-${Date.now()}.png`);
      return new File([blob], filename, { type: blob.type || "image/png" });
    } catch (error) {
      console.error('Failed to download AI image:', error);
      return null;
    }
  }

  async function submit() {
    setError(null);

    if (platform === "facebook") {
      if (!fbState.caption.trim()) return setError("Write a caption.");
      // Allow either uploaded file or AI-generated image
      if (!fbState.file && !fbState.aiImageUrl) return setError("Pick a photo or generate one with AI.");
    } else {
      if (!ytState.title.trim()) return setError("Add a title.");
      if (!ytState.file) return setError("Pick a video.");
    }

    if (scheduleMode === "later" && !scheduleAt) return setError("Pick a date and time.");

    const formData = new FormData();

    startTransition(async () => {
      let result: { ok: true; id: string } | { ok: false; error: string };

      if (platform === "facebook") {
        formData.set("body", fbState.caption);

        // Handle AI-generated image
        let imageFile = fbState.file;
        if (!imageFile && fbState.aiImageUrl) {
          imageFile = await downloadAIImageToBlob(fbState.aiImageUrl);
        }

        if (!imageFile) {
          setError("Failed to load image for upload");
          return;
        }

        formData.set("image", imageFile);
        result = await createFacebookPost(formData);
      } else {
        formData.set("title", ytState.title);
        formData.set("body", ytState.description);
        formData.set("video", ytState.file!);
        result = await createYouTubePost(formData);
      }

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (scheduleMode === "later") {
        const scheduledAt = new Date(scheduleAt).toISOString();
        const scheduleResult = await schedulePost({ id: result.id, scheduledAt });
        if (!scheduleResult.ok) {
          setError(scheduleResult.error);
          return;
        }
        router.push(`/admin/marketing/${result.id}?scheduled=1`);
      } else {
        router.push(`/admin/marketing/${result.id}`);
      }
    });
  }

  const submitLabel = pending
    ? "Saving…"
    : platform === "facebook"
      ? scheduleMode === "later"
        ? "Schedule post"
        : "Continue to share"
      : scheduleMode === "later"
        ? "Schedule upload"
        : "Continue to share";

  return (
    <div className="space-y-4">
      {/* Platform tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPlatform("facebook")}
          className={`flex-1 rounded-md border px-3 py-2 text-sm font-bold ${
            platform === "facebook"
              ? "border-[#1f6feb] bg-[#1f6feb] text-white"
              : "border-[#25344a] bg-[#1a2c44] text-[#9aafc5]"
          }`}
        >
          Facebook
        </button>
        <button
          type="button"
          onClick={() => setPlatform("youtube")}
          className={`flex-1 rounded-md border px-3 py-2 text-sm font-bold ${
            platform === "youtube"
              ? "border-[#1f6feb] bg-[#1f6feb] text-white"
              : "border-[#25344a] bg-[#1a2c44] text-[#9aafc5]"
          }`}
        >
          YouTube
        </button>
      </div>

      {/* Facebook fields */}
      {platform === "facebook" && (
        <>
          <div className="block rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
            <div className="flex items-center justify-between mb-3">
              <label
                htmlFor="facebook-image"
                className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9aafc5]"
              >
                Photo
              </label>
              <AIVisualGenerator
                marketingText={fbState.caption}
                platform={platform}
                onImageGenerated={handleAIImageGenerated}
              />
            </div>
            <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-[#25344a] bg-[#07101c] p-4">
              {fbState.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fbState.previewUrl}
                  alt="Preview"
                  className="max-h-64 w-auto object-contain"
                />
              ) : (
                <span className="text-sm text-[#9aafc5]">Tap to pick or shoot a photo, or generate with AI</span>
              )}
            </div>
            <input
              id="facebook-image"
              name="facebook-image"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onFbFileChange}
              className="mt-3 block w-full text-sm text-[#9aafc5]"
            />
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              disabled={pickingFromLibrary}
              className="mt-3 inline-flex items-center justify-center rounded-md border border-[#25344a] bg-[#1a2c44] px-3 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white hover:bg-[#243a59] disabled:opacity-60"
            >
              {pickingFromLibrary ? "Loading…" : "Pick from library"}
            </button>
          </div>

          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9aafc5]">
              Caption
            </span>
            <textarea
              name="facebook-caption"
              value={fbState.caption}
              onChange={(e) => setFbState((prev) => ({ ...prev, caption: e.target.value }))}
              rows={5}
              placeholder="Write the caption Facebook will see…"
              className="mt-2 w-full rounded-md border border-[#25344a] bg-[#0f1c2d] p-3 text-sm text-white placeholder:text-[#6c8096] focus:border-[#3a4e6e] focus:outline-none"
            />
          </label>
        </>
      )}

      {/* YouTube fields */}
      {platform === "youtube" && (
        <>
          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9aafc5]">
              Title
            </span>
            <input
              name="youtube-title"
              type="text"
              value={ytState.title}
              onChange={(e) => setYtState((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Short, punchy title…"
              className="mt-2 w-full rounded-md border border-[#25344a] bg-[#0f1c2d] p-3 text-sm text-white placeholder:text-[#6c8096] focus:border-[#3a4e6e] focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9aafc5]">
              Description
            </span>
            <textarea
              name="youtube-description"
              value={ytState.description}
              onChange={(e) => setYtState((prev) => ({ ...prev, description: e.target.value }))}
              rows={5}
              placeholder="What's in the video…"
              className="mt-2 w-full rounded-md border border-[#25344a] bg-[#0f1c2d] p-3 text-sm text-white placeholder:text-[#6c8096] focus:border-[#3a4e6e] focus:outline-none"
            />
          </label>

          <div className="block rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
            <label
              htmlFor="youtube-video"
              className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9aafc5]"
            >
              Video
            </label>
            <input
              id="youtube-video"
              name="youtube-video"
              type="file"
              accept="video/mp4,video/quicktime"
              capture="environment"
              onChange={onYtFileChange}
              className="mt-3 block w-full text-sm text-[#9aafc5]"
            />
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              disabled={pickingFromLibrary}
              className="mt-3 inline-flex items-center justify-center rounded-md border border-[#25344a] bg-[#1a2c44] px-3 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white hover:bg-[#243a59] disabled:opacity-60"
            >
              {pickingFromLibrary ? "Loading…" : "Pick from library"}
            </button>
            {ytState.file && (
              <p className="mt-2 text-xs text-[#9aafc5]">
                {ytState.file.name} · {(ytState.file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            )}
          </div>
        </>
      )}

      {/* Shared "When" control */}
      <div className="space-y-3 rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9aafc5]">
          When
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setScheduleMode("now")}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-bold ${
              scheduleMode === "now"
                ? "border-[#1f6feb] bg-[#1f6feb] text-white"
                : "border-[#25344a] bg-[#1a2c44] text-[#9aafc5]"
            }`}
          >
            Post now
          </button>
          <button
            type="button"
            onClick={() => setScheduleMode("later")}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-bold ${
              scheduleMode === "later"
                ? "border-[#1f6feb] bg-[#1f6feb] text-white"
                : "border-[#25344a] bg-[#1a2c44] text-[#9aafc5]"
            }`}
          >
            Schedule
          </button>
        </div>
        {scheduleMode === "later" && (
          <input
            name="schedule-at"
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            className="w-full rounded-md border border-[#25344a] bg-[#0f1c2d] p-3 text-sm text-white focus:border-[#3a4e6e] focus:outline-none"
          />
        )}
      </div>

      {error && (
        <p className="rounded-md border border-[#c53030] bg-[#5a1a1a] p-3 text-sm text-white" role="status" aria-live="polite">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full min-h-12 rounded-md bg-[#1f6feb] px-4 py-3 text-base font-extrabold text-white hover:bg-[#1a5ed1] disabled:opacity-60"
      >
        {submitLabel}
      </button>

      {pickerOpen && (
        <MediaPickerModal
          items={library}
          accept={platform === "facebook" ? "image" : "video"}
          onPick={pickFromLibrary}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
