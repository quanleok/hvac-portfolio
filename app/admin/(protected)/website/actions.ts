"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  LAYOUTS,
  MEDIA_TYPES,
  SCROLL_DIRECTIONS,
  SCROLL_SPEEDS,
  isSectionId,
  type MediaType,
  type SectionLayout,
  type ScrollDirection,
  type ScrollSpeed,
} from "@/lib/media/schema";
import { MEDIA_BUCKET, buildStoragePath } from "@/lib/media/storage";
import type { ActionResult } from "@/app/admin/actions";

async function requireSession() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    throw new Error("Your admin session expired. Sign in again.");
  }
}

function revalidateMediaPaths(sectionId?: string) {
  revalidatePath("/admin/website");
  revalidatePath("/admin/website/library");
  revalidatePath("/admin/website/sections");
  revalidatePath("/");
  revalidatePath("/gallery");
  if (sectionId) revalidatePath(`/admin/website/sections/${sectionId}`);
}

function mediaTypeFromFile(file: File): MediaType {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
}

export async function uploadMedia(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSession();

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Pick a file before uploading." };
    }

    const caption = (formData.get("caption") as string | null)?.trim() || null;
    const alt = (formData.get("alt") as string | null)?.trim() || null;
    const sectionIds = formData
      .getAll("section_ids")
      .filter((v): v is string => typeof v === "string" && isSectionId(v));

    const mediaType = mediaTypeFromFile(file);
    if (!MEDIA_TYPES.includes(mediaType)) {
      return { ok: false, error: "Only image or video files are supported." };
    }

    const path = buildStoragePath(file.name);

    const admin = createSupabaseAdminClient();
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from(MEDIA_BUCKET)
      .upload(path, new Uint8Array(arrayBuffer), {
        contentType: file.type,
        upsert: false,
      });
    if (uploadError) return { ok: false, error: `Upload failed: ${uploadError.message}` };

    const { data: mediaRow, error: insertError } = await admin
      .from("media")
      .insert({ type: mediaType, storage_path: path, caption, alt })
      .select("id")
      .single();

    if (insertError || !mediaRow) {
      await admin.storage.from(MEDIA_BUCKET).remove([path]);
      return { ok: false, error: insertError?.message ?? "Could not save media record." };
    }

    if (sectionIds.length) {
      const assignments = sectionIds.map((section_id) => ({
        media_id: mediaRow.id,
        section_id,
        published: true,
        sort_order: 0,
      }));
      const { error: assignError } = await admin.from("media_assignments").insert(assignments);
      if (assignError) {
        return { ok: false, error: `Upload saved but assignments failed: ${assignError.message}` };
      }
    }

    revalidateMediaPaths();
    return { ok: true, id: mediaRow.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}

export async function updateMedia(input: {
  id: string;
  caption: string | null;
  alt: string | null;
  sectionIds: string[];
}): Promise<ActionResult> {
  try {
    await requireSession();
    const admin = createSupabaseAdminClient();

    const { error: updateError } = await admin
      .from("media")
      .update({ caption: input.caption, alt: input.alt })
      .eq("id", input.id);
    if (updateError) return { ok: false, error: updateError.message };

    const valid = input.sectionIds.filter(isSectionId);
    const { data: existing } = await admin
      .from("media_assignments")
      .select("section_id")
      .eq("media_id", input.id);
    const existingIds = new Set((existing ?? []).map((r) => r.section_id));
    const desired = new Set(valid);

    const toAdd = valid.filter((id) => !existingIds.has(id));
    const toRemove = [...existingIds].filter((id) => !desired.has(id));

    if (toAdd.length) {
      await admin.from("media_assignments").insert(
        toAdd.map((section_id) => ({
          media_id: input.id,
          section_id,
          published: true,
          sort_order: 0,
        }))
      );
    }
    if (toRemove.length) {
      await admin
        .from("media_assignments")
        .delete()
        .eq("media_id", input.id)
        .in("section_id", toRemove);
    }

    revalidateMediaPaths();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Update failed." };
  }
}

export async function deleteMedia(input: { id: string }): Promise<ActionResult> {
  try {
    await requireSession();
    const admin = createSupabaseAdminClient();

    const { data: media } = await admin
      .from("media")
      .select("storage_path")
      .eq("id", input.id)
      .maybeSingle();

    const { error: deleteError } = await admin.from("media").delete().eq("id", input.id);
    if (deleteError) return { ok: false, error: deleteError.message };

    if (media?.storage_path) {
      await admin.storage.from(MEDIA_BUCKET).remove([media.storage_path]);
    }

    revalidateMediaPaths();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Delete failed." };
  }
}

export async function togglePublished(input: {
  mediaId: string;
  sectionId: string;
  published: boolean;
}): Promise<ActionResult> {
  try {
    await requireSession();
    if (!isSectionId(input.sectionId)) return { ok: false, error: "Unknown section." };
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("media_assignments")
      .update({ published: input.published })
      .eq("media_id", input.mediaId)
      .eq("section_id", input.sectionId);
    if (error) return { ok: false, error: error.message };
    revalidateMediaPaths(input.sectionId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Update failed." };
  }
}

export async function reorderAssignment(input: {
  mediaId: string;
  sectionId: string;
  direction: "up" | "down";
}): Promise<ActionResult> {
  try {
    await requireSession();
    if (!isSectionId(input.sectionId)) return { ok: false, error: "Unknown section." };
    const admin = createSupabaseAdminClient();

    const { data: all } = await admin
      .from("media_assignments")
      .select("id, media_id, sort_order")
      .eq("section_id", input.sectionId)
      .order("sort_order", { ascending: true });

    if (!all?.length) return { ok: false, error: "Nothing to reorder." };

    const index = all.findIndex((a) => a.media_id === input.mediaId);
    if (index < 0) return { ok: false, error: "Assignment not found." };
    const swapIndex = input.direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= all.length) return { ok: true };

    const a = all[index];
    const b = all[swapIndex];

    await admin.from("media_assignments").update({ sort_order: b.sort_order }).eq("id", a.id);
    await admin.from("media_assignments").update({ sort_order: a.sort_order }).eq("id", b.id);

    revalidateMediaPaths(input.sectionId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Reorder failed." };
  }
}

export async function updateSectionConfig(input: {
  id: string;
  enabled: boolean;
  title: string;
  layout: SectionLayout;
  scrollDirection: ScrollDirection;
  scrollSpeed: ScrollSpeed;
  itemsVisible: number;
  showCaptions: boolean;
}): Promise<ActionResult> {
  try {
    await requireSession();
    if (!isSectionId(input.id)) return { ok: false, error: "Unknown section." };
    if (!LAYOUTS.includes(input.layout)) return { ok: false, error: "Unknown layout." };
    if (!SCROLL_DIRECTIONS.includes(input.scrollDirection)) return { ok: false, error: "Unknown scroll direction." };
    if (!SCROLL_SPEEDS.includes(input.scrollSpeed)) return { ok: false, error: "Unknown scroll speed." };

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("media_sections")
      .update({
        enabled: input.enabled,
        title: input.title,
        layout: input.layout,
        scroll_direction: input.scrollDirection,
        scroll_speed: input.scrollSpeed,
        items_visible: Math.max(2, Math.min(6, input.itemsVisible)),
        show_captions: input.showCaptions,
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };

    revalidateMediaPaths(input.id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Update failed." };
  }
}
