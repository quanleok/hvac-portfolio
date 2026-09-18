"use client";

import Link from "next/link";
import { useId, useState, useTransition, type FormEvent } from "react";
import { uploadMedia } from "@/app/admin/(protected)/website/actions";
import { SECTION_BY_ID } from "@/lib/media/schema";

const DEFAULT_GALLERY_SECTION = "gallery-work";

export interface SectionOption {
  id: string;
  title: string;
  description?: string;
  previewUrl?: string;
}

export function MediaUploadForm({
  sectionId,
  staging = false,
  sectionOptions,
  allowStagingChoice = false,
  compact = false,
}: {
  sectionId?: string;
  staging?: boolean;
  sectionOptions?: SectionOption[];
  allowStagingChoice?: boolean;
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const fieldId = useId();
  const [targetMode, setTargetMode] = useState<"publish" | "staging">(
    staging ? "staging" : "publish"
  );
  const effectiveStaging = staging || (allowStagingChoice && targetMode === "staging");
  const showSectionPicker = !effectiveStaging && !sectionId && (sectionOptions?.length ?? 0) > 0;
  const initialSection =
    sectionOptions?.find((s) => s.id === DEFAULT_GALLERY_SECTION)?.id ??
    sectionOptions?.[0]?.id ??
    DEFAULT_GALLERY_SECTION;
  const [pickedSection, setPickedSection] = useState(initialSection);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const effectiveSectionId = sectionId ?? (showSectionPicker ? pickedSection : DEFAULT_GALLERY_SECTION);
  const selectedSection =
    sectionOptions?.find((section) => section.id === effectiveSectionId) ??
    (sectionId ? SECTION_BY_ID[sectionId] : null);

  function formatFileSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setMessage(null);
    if (!effectiveStaging) {
      formData.append("section_ids", effectiveSectionId);
    }

    startTransition(async () => {
      const result = await uploadMedia(formData);
      if (result.ok) {
        setMessage({
          kind: "ok",
          text: effectiveStaging
            ? "Saved to staging."
            : selectedSection
              ? `Uploaded to ${selectedSection.title}.`
              : "Uploaded.",
        });
        form.reset();
        setFileLabel(null);
      } else {
        setMessage({ kind: "err", text: result.error });
      }
    });
  }

  const labelVerb = effectiveStaging ? "Save for later" : sectionId ? "Add to section" : "Publish";
  const descriptor = effectiveStaging
    ? "Private until you place it."
    : selectedSection
      ? `Goes live in ${selectedSection.title}.`
      : "Goes live on the public gallery.";
  const fileInput = (
    <div>
      <label
        htmlFor={`${fieldId}-file`}
        className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-[#7f92a8]"
      >
        File
      </label>
      <label
        htmlFor={`${fieldId}-file`}
        className="block cursor-pointer rounded-lg border border-[#263446] bg-[#08111d] px-4 py-3 transition hover:border-[#3a4b62]"
      >
        <input
          id={`${fieldId}-file`}
          type="file"
          name="file"
          required
          accept="image/*,video/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setMessage(null);
            setFileLabel(file ? `${file.name} · ${formatFileSize(file.size)}` : null);
          }}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {fileLabel ?? "Choose file"}
            </p>
            <p className="mt-1 truncate text-xs text-[#7f92a8]">JPG, PNG, WEBP, MP4 · max 100 MB</p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-md border border-[#31445c] px-3 py-1.5 text-xs font-bold text-[#cbd7e6]">
            Browse
          </span>
        </div>
      </label>
      <p className="mt-1 text-xs text-[#7f92a8]">{descriptor}</p>
    </div>
  );
  const publishSelect = showSectionPicker ? (
    <div>
      <label
        htmlFor={`${fieldId}-section`}
        className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-[#7f92a8]"
      >
        Where it shows
      </label>
      <select
        id={`${fieldId}-section`}
        value={pickedSection}
        onChange={(event) => {
          setMessage(null);
          setPickedSection(event.target.value);
        }}
        className="block h-[3.25rem] w-full rounded-lg border border-[#263446] bg-[#08111d] px-3 text-sm text-white"
      >
        {sectionOptions!.map((section) => (
          <option key={section.id} value={section.id}>
            {section.title}
          </option>
        ))}
      </select>
    </div>
  ) : null;

  if (compact) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        {allowStagingChoice ? (
          <div className="inline-grid w-full gap-2 rounded-lg border border-[#263446] bg-[#08111d] p-1 sm:grid-cols-2">
            {[
              { value: "publish" as const, title: "Publish now" },
              { value: "staging" as const, title: "Save for later" },
            ].map((option) => {
              const active = targetMode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setMessage(null);
                    setTargetMode(option.value);
                  }}
                  className={`rounded-md px-4 py-2.5 text-center text-sm font-bold transition ${
                    active
                      ? "bg-[#d8e7f6] text-[#09121e]"
                      : "text-[#a8b6c7] hover:bg-[#0f1a28]"
                  }`}
                >
                  {option.title}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className={`grid gap-4 ${effectiveStaging || !publishSelect ? "" : "lg:grid-cols-[1fr_280px]"}`}>
          {fileInput}
          {!effectiveStaging ? publishSelect : null}
        </div>

        <div>
          <label
            htmlFor={`${fieldId}-caption`}
            className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-[#7f92a8]"
          >
            Caption (optional)
          </label>
          <input
            id={`${fieldId}-caption`}
            type="text"
            name="caption"
            placeholder="New furnace install, Edmond"
            className="block h-11 w-full rounded-lg border border-[#263446] bg-[#08111d] px-3 text-sm text-white placeholder:text-[#65778d]"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#2f82d0] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#3b8fda] disabled:opacity-60"
          >
            {isPending ? "Uploading..." : labelVerb}
          </button>
          {message ? (
            <p
              aria-live="polite"
              className={`text-sm ${message.kind === "ok" ? "text-emerald-300" : "text-amber-300"}`}
            >
              {message.text}
            </p>
          ) : null}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <div className="space-y-4">
          <div>
            <label htmlFor={`${fieldId}-file`} className="mb-1 block text-xs font-bold uppercase tracking-[0.15em] text-[#6c8096]">
              Pick an image or video
            </label>
            <label
              htmlFor={`${fieldId}-file`}
              className="block cursor-pointer rounded-md border border-[#25344a] bg-[#07101c] px-4 py-3 transition hover:border-[#3d5a80]"
            >
              <input
                id={`${fieldId}-file`}
                type="file"
                name="file"
                required
                accept="image/*,video/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setMessage(null);
                  setFileLabel(
                    file ? `${file.name} · ${formatFileSize(file.size)}` : null
                  );
                }}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {fileLabel ?? "Choose a file"}
                  </p>
                  <p className="mt-1 text-xs text-[#6c8096]">
                    JPG, PNG, WEBP, MP4 and other common image/video types. Max 100 MB.
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center rounded-full border border-[#33507a] bg-[#10233b] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#bcd0ea]">
                  Browse
                </span>
              </div>
            </label>
            <p className="mt-1 text-xs text-[#6c8096]">{descriptor}</p>
          </div>

          {showSectionPicker ? (
            <div>
              <label
                htmlFor={`${fieldId}-section`}
                className="mb-1 block text-xs font-bold uppercase tracking-[0.15em] text-[#6c8096]"
              >
                Publish into
              </label>
              <select
                id={`${fieldId}-section`}
                value={pickedSection}
                onChange={(event) => {
                  setMessage(null);
                  setPickedSection(event.target.value);
                }}
                className="block w-full rounded-md border border-[#25344a] bg-[#07101c] px-3 py-2 text-sm text-white"
              >
                {sectionOptions!.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <aside className="rounded-md border border-[#25344a] bg-[#0b1624] p-4">
          <h3 className="text-sm font-bold text-white">
            {staging ? "Staging" : "Destination"}
          </h3>
          {staging ? (
            <p className="mt-2 text-sm text-[#9aafc5]">
              Stored privately until you assign it to a section.
            </p>
          ) : selectedSection ? (
            <div className="mt-2 space-y-2">
              <p className="text-base font-semibold text-white">{selectedSection.title}</p>
              {selectedSection.description ? (
                <p className="text-sm text-[#9aafc5]">{selectedSection.description}</p>
              ) : null}
              {selectedSection.previewUrl ? (
                <Link
                  href={selectedSection.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-xs font-bold uppercase tracking-[0.12em] text-[#88b8ff] hover:text-white"
                >
                  View this spot on site →
                </Link>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#9aafc5]">
              This upload will go live immediately on the public gallery.
            </p>
          )}
        </aside>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor={`${fieldId}-caption`}
            className="mb-1 block text-xs font-bold uppercase tracking-[0.15em] text-[#6c8096]"
          >
            Caption
          </label>
          <input
            id={`${fieldId}-caption`}
            type="text"
            name="caption"
            placeholder="e.g. New furnace install, Edmond"
            className="block w-full rounded-md border border-[#25344a] bg-[#07101c] px-3 py-2 text-sm text-white placeholder:text-[#6c8096]"
          />
        </div>

        <div>
          <label
            htmlFor={`${fieldId}-alt`}
            className="mb-1 block text-xs font-bold uppercase tracking-[0.15em] text-[#6c8096]"
          >
            Alt text
          </label>
          <input
            id={`${fieldId}-alt`}
            type="text"
            name="alt"
            placeholder="What someone should understand if the image does not load"
            className="block w-full rounded-md border border-[#25344a] bg-[#07101c] px-3 py-2 text-sm text-white placeholder:text-[#6c8096]"
          />
        </div>
      </div>

      {message ? (
        <p
          aria-live="polite"
          className={`text-sm ${message.kind === "ok" ? "text-emerald-300" : "text-amber-300"}`}
        >
          {message.text}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-60 ${
          staging
            ? "bg-[#935f1f] hover:bg-[#ad7429]"
            : "bg-[#1f6feb] hover:bg-[#3178e6]"
        }`}
      >
        {isPending ? "Uploading…" : labelVerb}
      </button>
    </form>
  );
}
