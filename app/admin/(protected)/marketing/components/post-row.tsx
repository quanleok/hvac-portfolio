import Link from "next/link";
import type { MarketingPlatform, MarketingStatus } from "@/lib/marketing/schema";
import { platformLabel } from "@/lib/marketing/schema";

interface Props {
  id: string;
  platform: MarketingPlatform;
  status: MarketingStatus;
  title: string | null;
  body: string | null;
  scheduledAt: string | null;
  postedAt: string | null;
  updatedAt: string;
}

function statusBg(status: MarketingStatus): string {
  switch (status) {
    case "draft":
      return "bg-[#1a2c44]";
    case "needs_ai":
      return "bg-[#1d3347]";
    case "ready":
      return "bg-[#2a7a3a]";
    case "scheduled":
      return "bg-[#1f6feb]";
    case "posted":
      return "bg-[#2a7a3a]";
    case "failed":
      return "bg-[#7f1d1d]";
    case "archived":
      return "bg-[#4a3a20]";
  }
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PostRow({
  id,
  platform,
  status,
  title,
  body,
  scheduledAt,
  postedAt,
  updatedAt,
}: Props) {
  const headline = title ?? (body ? body.slice(0, 80) : "Untitled");
  const when =
    status === "scheduled"
      ? formatDate(scheduledAt)
      : status === "posted"
        ? formatDate(postedAt)
        : formatDate(updatedAt);

  return (
    <Link
      href={`/admin/marketing/${id}`}
      className="flex items-center gap-3 rounded-md border border-[#25344a] bg-[#0f1c2d] p-3 hover:bg-[#14253b]"
    >
      <span
        className={`rounded-sm px-2 py-1 text-[0.6rem] font-extrabold uppercase tracking-[0.14em] text-white ${statusBg(
          status
        )}`}
      >
        {status}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{headline}</p>
        <p className="text-xs text-[#9aafc5]">
          {platformLabel(platform)}
          {when ? ` · ${when}` : ""}
        </p>
      </div>
    </Link>
  );
}
