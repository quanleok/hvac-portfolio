"use client";

import { useTransition } from "react";
import Image from "next/image";
import {
  deleteMedia,
  reorderAssignment,
  togglePublished,
} from "@/app/admin/(protected)/website/actions";
import { getMediaPublicUrl } from "@/lib/media/url";
import type { MediaAssignmentRow, MediaRow } from "@/lib/supabase/database.types";

export function MediaReorderList({
  sectionId,
  items,
}: {
  sectionId: string;
  items: { assignment: MediaAssignmentRow; media: MediaRow }[];
}) {
  const [isPending, startTransition] = useTransition();

  function act(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-[#6c8096]">No media in this section yet.</p>;
  }

  return (
    <ol className="space-y-2">
      {items.map((item, index) => {
        const url = getMediaPublicUrl(item.media.storage_path);
        return (
          <li
            key={item.assignment.id}
            className="flex items-center gap-3 rounded-md border border-[#25344a] bg-[#0f1c2d] p-2"
          >
            <div className="h-16 w-24 overflow-hidden rounded-md bg-black">
              {item.media.type === "image" ? (
                <Image
                  src={url}
                  alt={item.media.alt ?? ""}
                  width={96}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <video src={url} muted className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1 text-sm">
              <div className="text-white">{item.media.caption ?? item.media.storage_path.split("/").pop()}</div>
              <div className="text-xs text-[#6c8096]">
                {item.media.type} · {item.assignment.published ? "published" : "hidden"}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <button
                type="button"
                disabled={isPending || index === 0}
                onClick={() => act(() => reorderAssignment({ mediaId: item.media.id, sectionId, direction: "up" }))}
                className="rounded-md border border-[#25344a] px-2 py-1 text-white hover:bg-[#1a2c44] disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={isPending || index === items.length - 1}
                onClick={() => act(() => reorderAssignment({ mediaId: item.media.id, sectionId, direction: "down" }))}
                className="rounded-md border border-[#25344a] px-2 py-1 text-white hover:bg-[#1a2c44] disabled:opacity-40"
              >
                ↓
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => act(() => togglePublished({ mediaId: item.media.id, sectionId, published: !item.assignment.published }))}
                className="rounded-md border border-[#25344a] px-2 py-1 text-white hover:bg-[#1a2c44] disabled:opacity-40"
              >
                {item.assignment.published ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (confirm("Delete this media everywhere? This cannot be undone.")) {
                    act(() => deleteMedia({ id: item.media.id }));
                  }
                }}
                className="rounded-md border border-[#c53030] px-2 py-1 text-[#ff6166] hover:bg-[#3a0f14] disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
