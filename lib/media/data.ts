import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  MediaRow,
  MediaAssignmentRow,
  MediaSectionRow,
} from "@/lib/supabase/database.types";
import { SECTION_BY_ID, type SectionSeed } from "./schema";

export interface SectionItem {
  assignment: MediaAssignmentRow;
  media: MediaRow;
}

export interface SectionPayload {
  seed: SectionSeed;
  section: MediaSectionRow | null;
  items: SectionItem[];
}

/**
 * Fetches config + ordered published media for a section.
 * Returns seed + empty items if the section doesn't exist yet (defensive).
 */
export async function getSection(sectionId: string): Promise<SectionPayload | null> {
  const seed = SECTION_BY_ID[sectionId];
  if (!seed) return null;

  const supabase = await createSupabaseServerClient();

  const { data: sectionRow } = await supabase
    .from("media_sections")
    .select("*")
    .eq("id", sectionId)
    .maybeSingle();

  const { data: rows } = await supabase
    .from("media_assignments")
    .select("*, media(*)")
    .eq("section_id", sectionId)
    .eq("published", true)
    .order("sort_order", { ascending: true });

  const items: SectionItem[] = (rows ?? [])
    .filter((row) => row.media !== null)
    .map((row) => {
      const { media, ...assignment } = row as MediaAssignmentRow & { media: MediaRow };
      return { assignment, media };
    });

  return { seed, section: sectionRow ?? null, items };
}

/**
 * Convenience for loading several sections at once (home page).
 */
export async function getSections(ids: string[]): Promise<Record<string, SectionPayload>> {
  const entries = await Promise.all(
    ids.map(async (id) => [id, await getSection(id)] as const)
  );
  return Object.fromEntries(
    entries.filter(([, payload]) => payload !== null) as [string, SectionPayload][]
  );
}
