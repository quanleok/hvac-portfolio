"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendDocumentSmsAction } from "@/app/admin/actions";

interface DocumentShareActionsProps {
  clientId: string;
  documentId: string;
  documentNumber: string;
  sharePath: string;
  imagePath: string;
}

function sanitizeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function DocumentShareActions({
  clientId,
  documentId,
  documentNumber,
  sharePath,
  imagePath,
}: DocumentShareActionsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isDownloading, setIsDownloading] = useState(false);

  function getShareUrl() {
    if (typeof window === "undefined") {
      return sharePath;
    }

    return `${window.location.origin}${sharePath}`;
  }

  function getImageUrl() {
    if (typeof window === "undefined") {
      return imagePath;
    }

    return `${window.location.origin}${imagePath}`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setFeedback("Public link copied.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setFeedback("Link could not be copied.");
    }
  }

  async function shareLink() {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: "Double Le HVAC document",
        url: getShareUrl(),
      });
      setFeedback("Share sheet opened.");
    } catch {
      // Ignore cancelled shares.
    }
  }

  async function downloadImage() {
    try {
      setIsDownloading(true);
      setFeedback("");
      const response = await fetch(getImageUrl());

      if (!response.ok) {
        throw new Error("Image could not be generated.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${sanitizeFilename(documentNumber)}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setFeedback("Branded image downloaded.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Image could not be downloaded.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button type="button" onClick={copyLink} className="admin-secondary-button w-full sm:w-auto">
          {copied ? "Copied" : "Copy link"}
        </button>
        <button type="button" onClick={shareLink} className="admin-secondary-button w-full sm:w-auto">
          Share
        </button>
        <button
          type="button"
          disabled={isDownloading}
          onClick={downloadImage}
          className="admin-secondary-button w-full sm:w-auto"
        >
          {isDownloading ? "Preparing image…" : "Download image"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setFeedback("");
            startTransition(async () => {
              const result = await sendDocumentSmsAction({
                clientId,
                documentId,
              });

              if (!result.ok) {
                setFeedback(result.error);
                return;
              }

              setFeedback(`SMS sent to ${result.recipient}.`);
              router.refresh();
            });
          }}
          className="admin-secondary-button w-full sm:w-auto"
        >
          {isPending ? "Sending text…" : "Text client"}
        </button>
        <a
          href={sharePath}
          target="_blank"
          rel="noreferrer"
          className="admin-primary-button col-span-2 w-full sm:w-auto"
        >
          Open public view
        </a>
      </div>
      {feedback ? (
        <p className="text-sm text-[#9fd2ff]" aria-live="polite" role="status">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
