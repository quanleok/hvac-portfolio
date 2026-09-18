import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SECTION_BY_ID } from "@/lib/media/schema";
import { getSection } from "@/lib/media/data";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { SectionSettingsForm } from "@/components/admin/section-settings-form";
import { MediaReorderList } from "@/components/admin/media-reorder-list";
import { SectionPlacementDiagram } from "@/components/admin/section-placement-diagram";
import { MediaStrip } from "@/components/media/media-strip";
import type { MediaAssignmentRow, MediaRow } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export default async function SectionDetailPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const seed = SECTION_BY_ID[sectionId];
  if (!seed) notFound();

  const admin = createSupabaseAdminClient();
  const { data: section } = await admin
    .from("media_sections")
    .select("*")
    .eq("id", sectionId)
    .maybeSingle();
  if (!section) notFound();

  const payload = await getSection(sectionId);
  const previewPage = seed.previewUrl.startsWith("/gallery") ? "gallery" : "home";

  const { data: rows } = await admin
    .from("media_assignments")
    .select("*, media(*)")
    .eq("section_id", sectionId)
    .order("sort_order", { ascending: true });

  const items = (rows ?? [])
    .filter((r) => r.media !== null)
    .map((r) => {
      const { media, ...assignment } = r as MediaAssignmentRow & { media: MediaRow };
      return { assignment, media };
    });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <AdminBreadcrumbs
            items={[
              { label: "Website", href: "/admin/website" },
              { label: "Sections", href: "/admin/website/sections" },
              { label: seed.title },
            ]}
          />
          <h1 className="display-heading text-2xl font-extrabold text-white">{seed.title}</h1>
          <p className="text-[#9aafc5]">{seed.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-md bg-black">
            <Image src={seed.thumbnail} alt="" fill sizes="112px" className="object-cover" />
          </div>
          <Link
            href={seed.previewUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-[#25344a] px-3 py-2 text-sm text-white hover:bg-[#1a2c44]"
          >
            View on site ↗
          </Link>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[#6c8096]">
            Where on the site
          </p>
          <SectionPlacementDiagram activeId={seed.id} page={previewPage} />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[#6c8096]">
            Live preview (with current settings)
          </p>
          <div className="rounded-md border border-dashed border-[#25344a] bg-[#07101c] p-3 min-h-[10rem]">
            {payload?.items.length ? (
              <MediaStrip payload={payload} />
            ) : (
              <p className="text-sm text-[#6c8096]">
                Nothing to preview yet — upload a photo or video below, then this area will show exactly how it will appear on the live site.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
        <h2 className="text-base font-bold text-white">Add a photo or video</h2>
        <MediaUploadForm sectionId={seed.id} />
      </section>

      <section className="space-y-4 rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
        <h2 className="text-base font-bold text-white">Layout</h2>
        <SectionSettingsForm section={section} />
      </section>

      <section className="space-y-4 rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
        <h2 className="text-base font-bold text-white">Items</h2>
        <MediaReorderList sectionId={sectionId} items={items} />
      </section>
    </div>
  );
}
