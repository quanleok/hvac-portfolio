import Link from "next/link";
import { MediaLibraryGrid } from "@/components/admin/media-library-grid";
import { getAdminMediaOverview } from "@/lib/media/fetch-admin-media";

export const dynamic = "force-dynamic";

type View = "all" | "live";

function parseView(value: string | string[] | undefined): View {
  if (value === "live" || value === "onsite") return "live";
  return "all";
}

export default async function AdminLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const params = await searchParams;
  const view = parseView(params.view);

  const { items: allItems, counts } = await getAdminMediaOverview();
  const items = view === "live" ? allItems.filter((item) => item.sections.length > 0) : allItems;

  const filters: { key: View; label: string; count: number; href: string }[] = [
    { key: "all", label: "All", count: counts.total, href: "/admin/website/library" },
    { key: "live", label: "On site", count: counts.live, href: "/admin/website/library?view=live" },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="display-heading text-2xl font-extrabold text-white">Work media</h1>
          <p className="text-[#9aafc5]">
            Photos and videos used on the website.
          </p>
        </div>
        <Link
          href="/admin/website#upload-media"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#2f82d0] px-4 text-sm font-bold text-white transition hover:bg-[#3b8fda]"
        >
          Add media
        </Link>
      </header>

      <section className="flex flex-col gap-3 rounded-xl border border-[#263446] bg-[#0c1624] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isActive = filter.key === view;
            return (
              <Link
                key={filter.key}
                href={filter.href}
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition ${
                  isActive
                    ? "border-[#6e8aa8] bg-[#172536] text-white"
                    : "border-[#263446] bg-[#08111d] text-[#9aafc5] hover:border-[#3a4b62] hover:text-white"
                }`}
              >
                {filter.label}
                <span className="text-xs text-inherit">{filter.count}</span>
              </Link>
            );
          })}
        </div>
        <p className="text-sm text-[#6c8096]">
          Showing {items.length} of {counts.total}
        </p>
      </section>

      {items.length === 0 ? (
        <div className="rounded-xl border border-[#263446] bg-[#0c1624] p-8 text-center">
          <p className="text-[#9aafc5]">
            {view === "live" ? "No media is on the site yet." : "No media uploaded yet."}
          </p>
          <Link
            href="/admin/website#upload-media"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#2f82d0] px-4 text-sm font-bold text-white transition hover:bg-[#3b8fda]"
          >
            Add media
          </Link>
        </div>
      ) : (
        <MediaLibraryGrid items={items} />
      )}
    </div>
  );
}
