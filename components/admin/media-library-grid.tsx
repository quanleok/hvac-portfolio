"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { deleteMedia } from "@/app/admin/(protected)/website/actions";

export interface LibraryItem {
  id: string;
  type: "image" | "video";
  url: string;
  caption: string | null;
  alt: string | null;
  createdAt: string;
  sections: string[];
}

export function MediaLibraryGrid({
  items,
  showStagingChip = false,
}: {
  items: LibraryItem[];
  showStagingChip?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (activeIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveIndex(null);
      if (e.key === "ArrowLeft") setActiveIndex((i) => (i === null ? null : Math.max(0, i - 1)));
      if (e.key === "ArrowRight") setActiveIndex((i) => (i === null ? null : Math.min(items.length - 1, i + 1)));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, items.length]);

  function handleDelete(id: string) {
    if (!confirm("Delete this media everywhere? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteMedia({ id });
      if (result.ok) {
        setActiveIndex(null);
      } else {
        alert(result.error);
      }
    });
  }

  const active = activeIndex !== null ? items[activeIndex] ?? null : null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item, idx) => (
          <li
            key={item.id}
            className="group relative overflow-hidden rounded-md border border-[#25344a] bg-black"
          >
            <button
              type="button"
              onClick={() => setActiveIndex(idx)}
              className="relative block aspect-[4/3] w-full overflow-hidden"
              aria-label={`Preview ${item.caption ?? item.type}`}
            >
              {item.type === "image" ? (
                <Image
                  src={item.url}
                  alt={item.alt ?? item.caption ?? ""}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition group-hover:scale-[1.03]"
                />
              ) : (
                <>
                  <video src={item.url} muted className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/55 text-xl text-white">▶</span>
                  </span>
                </>
              )}
            </button>
            {showStagingChip && item.sections.length === 0 ? (
              <span className="pointer-events-none absolute left-2 top-2 rounded-sm bg-[#b45309] px-1.5 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-[0.14em] text-white">
                Staging
              </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2.5 pt-10 text-xs text-white">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {item.caption ?? (item.type === "video" ? "Video" : "Image")}
                </p>
                <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#9aafc5]">
                  {item.sections.length} placement{item.sections.length === 1 ? "" : "s"} · {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={isPending}
                className="flex-shrink-0 rounded-md bg-[#c53030] px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-white opacity-0 transition group-hover:opacity-100 hover:bg-[#e53e3e] disabled:opacity-100"
                aria-label="Delete this upload"
              >
                {isPending ? "…" : "Delete"}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Media preview"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="relative flex max-h-full w-full max-w-5xl flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              className="self-end rounded-md border border-[#25344a] bg-[#0f1c2d] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-[#1a2c44] shrink-0"
              aria-label="Close preview"
            >
              Close ✕
            </button>

            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md bg-black">
              {active.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={active.url} alt={active.alt ?? active.caption ?? ""} className="max-h-[80vh] max-w-full object-contain" />
              ) : (
                <video src={active.url} controls autoPlay playsInline className="max-h-[80vh] max-w-full" />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#25344a] bg-[#0f1c2d] px-4 py-3 text-sm text-white">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{active.caption ?? "(no caption)"}</p>
                <p className="text-xs text-[#9aafc5]">
                  {active.type} · uploaded {new Date(active.createdAt).toLocaleDateString()} · {active.sections.length} placement{active.sections.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/admin/website/sections"
                  className="rounded-md border border-[#25344a] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-[#1a2c44]"
                >
                  Manage placements →
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(active.id)}
                  disabled={isPending}
                  className="rounded-md bg-[#c53030] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-[#e53e3e] disabled:opacity-60"
                >
                  {isPending ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#9aafc5]">
              <button
                type="button"
                onClick={() => setActiveIndex((i) => (i === null ? null : Math.max(0, i - 1)))}
                disabled={activeIndex === 0}
                className="rounded-md border border-[#25344a] px-3 py-1.5 hover:bg-[#1a2c44] disabled:opacity-30"
              >
                ← Previous
              </button>
              <span>{(activeIndex ?? 0) + 1} / {items.length}</span>
              <button
                type="button"
                onClick={() => setActiveIndex((i) => (i === null ? null : Math.min(items.length - 1, i + 1)))}
                disabled={activeIndex === items.length - 1}
                className="rounded-md border border-[#25344a] px-3 py-1.5 hover:bg-[#1a2c44] disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
