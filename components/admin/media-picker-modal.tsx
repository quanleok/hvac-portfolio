"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export interface PickerItem {
  id: string;
  type: "image" | "video";
  url: string;
  caption: string | null;
  alt: string | null;
  isStaging: boolean;
}

type Filter = "all" | "staging" | "live";

interface Props {
  items: PickerItem[];
  accept: "image" | "video";
  onPick: (item: PickerItem) => void;
  onClose: () => void;
}

export function MediaPickerModal({ items, accept, onPick, onClose }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const typeFiltered = items.filter((it) => it.type === accept);
  const visible = typeFiltered.filter((it) => {
    if (filter === "staging") return it.isStaging;
    if (filter === "live") return !it.isStaging;
    return true;
  });

  const counts = {
    all: typeFiltered.length,
    staging: typeFiltered.filter((it) => it.isStaging).length,
    live: typeFiltered.filter((it) => !it.isStaging).length,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pick media from library"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-md border border-[#25344a] bg-[#0a1626]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-[#25344a] px-4 py-3">
          <div>
            <h2 className="text-base font-extrabold text-white">
              Pick {accept === "image" ? "an image" : "a video"} from the library
            </h2>
            <p className="text-xs text-[#9aafc5]">
              {accept === "image" ? "Photos" : "Videos"} from staging and live site media.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#25344a] bg-[#0f1c2d] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-[#1a2c44]"
          >
            Close ✕
          </button>
        </header>

        <div className="flex items-center gap-2 border-b border-[#25344a] px-4 py-2">
          {(["all", "staging", "live"] as Filter[]).map((key) => {
            const isActive = key === filter;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] ${
                  isActive
                    ? "border-[#1f6feb] bg-[#1f6feb] text-white"
                    : "border-[#25344a] bg-[#1a2c44] text-[#9aafc5] hover:text-white"
                }`}
              >
                {key === "all" ? "All" : key === "staging" ? "Staging" : "Live"}
                <span
                  className={`rounded-sm px-1 py-0.5 text-[0.55rem] ${
                    isActive ? "bg-white/20" : "bg-[#0a1626]"
                  }`}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {visible.length === 0 ? (
            <p className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-6 text-center text-sm text-[#9aafc5]">
              {accept === "image"
                ? "No images here. Upload to staging first or assign one to a website section."
                : "No videos here. Upload to staging first or assign one to a website section."}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onPick(item)}
                    className="group relative block w-full overflow-hidden rounded-md border border-[#25344a] bg-black"
                    aria-label={`Pick ${item.caption ?? item.type}`}
                  >
                    <span className="relative block aspect-[4/3] w-full overflow-hidden">
                      {item.type === "image" ? (
                        <Image
                          src={item.url}
                          alt={item.alt ?? item.caption ?? ""}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition group-hover:scale-[1.03]"
                        />
                      ) : (
                        <>
                          <video src={item.url} muted className="h-full w-full object-cover" />
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-base text-white">
                              ▶
                            </span>
                          </span>
                        </>
                      )}
                    </span>
                    {item.isStaging ? (
                      <span className="pointer-events-none absolute left-2 top-2 rounded-sm bg-[#b45309] px-1.5 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-[0.14em] text-white">
                        Staging
                      </span>
                    ) : null}
                    <span className="block truncate bg-[#0f1c2d] px-2 py-1.5 text-left text-xs text-white">
                      {item.caption ?? (item.type === "video" ? "Video" : "Image")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
