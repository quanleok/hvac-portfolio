import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getMediaPublicUrl } from "@/lib/media/url";

export interface AdminMediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  caption: string | null;
  alt: string | null;
  createdAt: string;
  sections: string[];
}

export interface AdminMediaCounts {
  total: number;
  live: number;
  staging: number;
}

export async function getAdminMediaOverview(): Promise<{
  items: AdminMediaItem[];
  counts: AdminMediaCounts;
}> {
  const admin = createSupabaseAdminClient();

  const [{ data: media }, { data: assignments }] = await Promise.all([
    admin
      .from("media")
      .select("id, type, storage_path, caption, alt, created_at")
      .order("created_at", { ascending: false }),
    admin.from("media_assignments").select("media_id, section_id"),
  ]);

  const sectionMap: Record<string, string[]> = {};
  for (const row of assignments ?? []) {
    if (!sectionMap[row.media_id]) sectionMap[row.media_id] = [];
    sectionMap[row.media_id].push(row.section_id);
  }

  const items: AdminMediaItem[] = (media ?? []).map((item) => ({
    id: item.id,
    type: item.type,
    url: getMediaPublicUrl(item.storage_path),
    caption: item.caption,
    alt: item.alt,
    createdAt: item.created_at,
    sections: sectionMap[item.id] ?? [],
  }));

  return {
    items,
    counts: {
      total: items.length,
      live: items.filter((item) => item.sections.length > 0).length,
      staging: items.filter((item) => item.sections.length === 0).length,
    },
  };
}
