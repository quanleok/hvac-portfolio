import Link from "next/link";
import Image from "next/image";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SECTION_SEEDS } from "@/lib/media/schema";
import { SectionPlacementDiagram } from "@/components/admin/section-placement-diagram";

function pageFromPreviewUrl(previewUrl: string): "home" | "gallery" {
  return previewUrl.startsWith("/gallery") ? "gallery" : "home";
}

export const dynamic = "force-dynamic";

export default async function AdminWebsitePage() {
  const admin = createSupabaseAdminClient();

  const { data: sections } = await admin
    .from("media_sections")
    .select("id, title, enabled, kind")
    .order("sort_order", { ascending: true });

  const { data: publishedAssignments } = await admin
    .from("media_assignments")
    .select("section_id, published");

  const counts: Record<string, { total: number; published: number }> = {};
  for (const row of publishedAssignments ?? []) {
    const entry = counts[row.section_id] ?? { total: 0, published: 0 };
    entry.total += 1;
    if (row.published) entry.published += 1;
    counts[row.section_id] = entry;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display-heading text-2xl font-extrabold text-white">Website content</h1>
        <p className="text-[#9aafc5]">
          Add photos and videos to each section of the public site. Uploads appear alongside the
          existing content — they never replace the fixed hero media.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {SECTION_SEEDS.map((seed) => {
          const dbRow = sections?.find((s) => s.id === seed.id);
          const count = counts[seed.id] ?? { total: 0, published: 0 };
          const enabled = dbRow?.enabled ?? true;
          return (
            <article
              key={seed.id}
              className="flex gap-4 rounded-md border border-[#25344a] bg-[#0f1c2d] p-4"
            >
              <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-md bg-black">
                <Image
                  src={seed.thumbnail}
                  alt=""
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">{seed.title}</h2>
                  <p className="mt-1 text-xs text-[#6c8096]">{seed.description}</p>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[#6c8096]">
                    {count.published} visible
                    {count.total > count.published
                      ? ` · ${count.total - count.published} hidden`
                      : ""}
                    {!enabled ? " · section disabled" : ""}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={seed.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-[#25344a] px-3 py-1 text-white hover:bg-[#1a2c44]"
                    >
                      View on site ↗
                    </Link>
                    <Link
                      href={`/admin/website/sections/${seed.id}`}
                      className="inline-flex items-center justify-center rounded-md bg-[#1f6feb] px-3 py-1 text-xs font-bold text-white hover:bg-[#3178e6]"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
                <details className="mt-3 text-xs text-[#9aafc5]">
                  <summary className="cursor-pointer text-[#6c8096] hover:text-white">
                    Where on the site?
                  </summary>
                  <div className="mt-2">
                    <SectionPlacementDiagram
                      activeId={seed.id}
                      page={pageFromPreviewUrl(seed.previewUrl)}
                    />
                  </div>
                </details>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
