"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  canShareFiles,
  fetchAsFile,
  shareFiles,
} from "@/lib/marketing/share";
import {
  platformLabel,
  platformOpenUrl,
  type MarketingPlatform,
} from "@/lib/marketing/schema";
import { getSignedMediaUrl, markPosted, deletePost } from "../actions";

interface Props {
  postId: string;
  platform: MarketingPlatform;
  title: string | null;
  body: string | null;
  media?: {
    storagePath: string;
    mimeType: string;
    fileName: string;
  } | null;
}

export function ShareLaunchpad({ postId, platform, title, body, media }: Props) {
  const router = useRouter();
  const mediaKey = media
    ? `${media.storagePath}:${media.mimeType}:${media.fileName}`
    : "none";
  const [mediaState, setMediaState] = useState({
    key: "none",
    signedUrl: null as string | null,
    loadError: null as string | null,
    canShare: false,
  });
  const [pending, startTransition] = useTransition();

  const shareText = [title, body].filter(Boolean).join("\n\n");
  const platformHref =
    platform === "sms"
      ? `sms:?&body=${encodeURIComponent(shareText)}`
      : platform === "email"
        ? `mailto:?subject=${encodeURIComponent(title ?? "Double L HVAC")}&body=${encodeURIComponent(shareText)}`
        : platformOpenUrl(platform);
  const opensExternalSite = platform !== "sms" && platform !== "email";
  const activeMediaState =
    mediaState.key === mediaKey
      ? mediaState
      : { key: mediaKey, signedUrl: null, loadError: null, canShare: false };
  const { signedUrl, loadError, canShare } = activeMediaState;

  useEffect(() => {
    if (!media) return;

    let cancelled = false;
    (async () => {
      const result = await getSignedMediaUrl({ storagePath: media.storagePath });
      if (cancelled) return;
      if (!result.ok) {
        setMediaState({
          key: mediaKey,
          signedUrl: null,
          loadError: result.error,
          canShare: false,
        });
        return;
      }
      const probe = new File([new Uint8Array([0])], media.fileName, {
        type: media.mimeType,
      });
      setMediaState({
        key: mediaKey,
        signedUrl: result.url,
        loadError: null,
        canShare: canShareFiles([probe]),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [media, mediaKey]);

  async function onShare() {
    if (!signedUrl || !media) return;
    try {
      const file = await fetchAsFile(signedUrl, media.fileName, media.mimeType);
      const ok = await shareFiles({ text: shareText, files: [file] });
      if (!ok) {
        return;
      }
    } catch (err) {
      setMediaState((current) =>
        current.key === mediaKey
          ? {
              ...current,
              loadError: err instanceof Error ? err.message : "Share failed.",
            }
          : current
      );
    }
  }

  function onCopyCaption() {
    navigator.clipboard.writeText(shareText).catch(() => {});
  }

  function onMarkPosted() {
    startTransition(async () => {
      const result = await markPosted({ id: postId });
      if (result.ok) router.push("/admin/marketing");
    });
  }

  function onDelete() {
    if (!confirm("Delete this draft? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deletePost({ id: postId });
      if (result.ok) router.push("/admin/marketing");
    });
  }

  return (
    <div className="space-y-4">
      {loadError && (
        <p className="rounded-md border border-[#c53030] bg-[#5a1a1a] p-3 text-sm text-white">
          {loadError}
        </p>
      )}

      <div className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4 space-y-3">
        {title && <h2 className="text-lg font-bold text-white">{title}</h2>}
        {body && <p className="whitespace-pre-wrap text-sm text-[#d7e2f0]">{body}</p>}
        {signedUrl && media ? (
          media.mimeType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signedUrl}
              alt="Post media"
              className="max-h-96 w-auto rounded-md object-contain"
            />
          ) : (
            <video
              src={signedUrl}
              controls
              className="max-h-96 w-full rounded-md"
            />
          )
        ) : (
          <div className="flex h-40 items-center justify-center rounded-md bg-[#07101c] px-6 text-center text-sm text-[#9aafc5]">
            {media ? "Loading media…" : "No media attached yet. This item still carries the message."}
          </div>
        )}
      </div>

      {canShare && media ? (
        <button
          type="button"
          onClick={onShare}
          className="w-full min-h-14 rounded-md bg-[#1f6feb] px-4 py-3 text-base font-extrabold text-white hover:bg-[#1a5ed1]"
        >
          Share to {platformLabel(platform)}
        </button>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onCopyCaption}
            className="w-full min-h-12 rounded-md bg-[#1a2c44] px-4 py-3 text-sm font-extrabold text-white border border-[#25344a] hover:bg-[#243654]"
          >
            Copy caption
          </button>
          {signedUrl && media && (
            <a
              href={signedUrl}
              download={media.fileName}
              className="flex w-full min-h-12 items-center justify-center rounded-md bg-[#1a2c44] px-4 py-3 text-sm font-extrabold text-white border border-[#25344a] hover:bg-[#243654]"
            >
              Download media
            </a>
          )}
          <a
            href={platformHref}
            target={opensExternalSite ? "_blank" : undefined}
            rel={opensExternalSite ? "noreferrer" : undefined}
            className="flex w-full min-h-12 items-center justify-center rounded-md bg-[#1f6feb] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#1a5ed1]"
          >
            Open {platformLabel(platform)}
          </a>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onMarkPosted}
          disabled={pending}
          className="flex-1 min-h-12 rounded-md bg-[#2a7a3a] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#236432] disabled:opacity-60"
        >
          {pending ? "…" : "I posted it"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="flex-1 min-h-12 rounded-md bg-[#1a2c44] px-4 py-3 text-sm font-extrabold text-white border border-[#25344a] hover:bg-[#5a1a1a]"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
