import Link from "next/link";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { MediaLibraryGrid } from "@/components/admin/media-library-grid";
import { SECTION_SEEDS } from "@/lib/media/schema";
import { getAdminMediaOverview } from "@/lib/media/fetch-admin-media";

export const dynamic = "force-dynamic";

export default async function AdminWebsitePage() {
  const { items } = await getAdminMediaOverview();
  const recentItems = items.slice(0, 8);
  const sectionOptions = SECTION_SEEDS.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    previewUrl: section.previewUrl,
  }));

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Website upload</h1>
          <p className="mt-1 text-sm text-[#9aafc5]">
            Add work photos or videos to the site.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/website/library"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#2a384b] bg-[#0c1624] px-3 text-sm font-bold text-white transition hover:bg-[#111d2d]"
          >
            Library
          </Link>
          <Link
            href="/admin/website/sections"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#2a384b] bg-[#0c1624] px-3 text-sm font-bold text-white transition hover:bg-[#111d2d]"
          >
            Placements
          </Link>
        </div>
      </header>

      <section
        id="upload-media"
        className="scroll-mt-24 rounded-xl border border-[#263446] bg-[#0c1624] p-5"
      >
        <header className="mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Add photo or video</h2>
            <p className="text-sm text-[#9aafc5]">
              Choose the file, pick where it shows, upload.
            </p>
          </div>
        </header>
        <MediaUploadForm sectionOptions={sectionOptions} compact />
      </section>

      <section
        id="recent-media"
        className="scroll-mt-24 rounded-xl border border-[#263446] bg-[#0c1624] p-5"
      >
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Recent uploads</h2>
            <p className="text-sm text-[#9aafc5]">
              Latest files added to the site.
            </p>
          </div>
          <Link
            href="/admin/website/library"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#2a384b] bg-[#08111d] px-3 text-sm font-bold text-white transition hover:bg-[#111d2d]"
          >
            Full library
          </Link>
        </header>
        {recentItems.length === 0 ? (
          <p className="text-sm text-[#6c8096]">
            No uploads yet. Add a work photo or video to start building the site gallery.
          </p>
        ) : (
          <MediaLibraryGrid items={recentItems} />
        )}
      </section>
    </div>
  );
}
