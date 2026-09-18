import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { MediaStrip } from "@/components/media/media-strip";
import { getSections } from "@/lib/media/data";

export const metadata: Metadata = {
  title: "Gallery · Double Le Heat and Air",
  description: "Real people, real work, real places — and what our customers say.",
};

const GALLERY_SECTIONS: { id: string; label: string; note: string }[] = [
  {
    id: "gallery-people",
    label: "People",
    note: "Who answers the phone and shows up at the door.",
  },
  {
    id: "gallery-work",
    label: "Work",
    note: "Installed equipment, service calls, and real job documentation.",
  },
  {
    id: "gallery-location",
    label: "Location",
    note: "Shops, neighborhoods, and OKC metro service context.",
  },
  {
    id: "gallery-reviews",
    label: "Reviews",
    note: "Customer proof paired with the work behind it.",
  },
];

export default async function GalleryPage() {
  const media = await getSections(GALLERY_SECTIONS.map((s) => s.id));

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-10 space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--copy-muted)]">Gallery</p>
          <h1 className="display-heading text-4xl text-white sm:text-5xl">
            Real people. Real work. Real places.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-[rgba(236,242,247,0.78)]">
            Use the filters to scan proof quickly: who we are, what we work on,
            where we go, and what customers say after the job.
          </p>
          <nav className="flex flex-wrap gap-2 pt-2 text-xs font-bold uppercase tracking-[0.16em]">
            {GALLERY_SECTIONS.map((s) => {
              const itemCount = media[s.id]?.items.length ?? 0;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="rounded-full border border-white/15 px-3 py-1 text-[var(--copy-soft)] transition hover:text-white"
                >
                  {s.label} <span className="text-white/45">({itemCount})</span>
                </a>
              );
            })}
          </nav>
        </header>

        {GALLERY_SECTIONS.map((s) => {
          const itemCount = media[s.id]?.items.length ?? 0;
          return (
            <section id={s.id} key={s.id} className="scroll-mt-28">
              <div className="mb-4 flex flex-col gap-2 rounded-[1.4rem] border border-[rgba(143,193,237,0.18)] bg-[rgba(7,17,28,0.52)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ice-soft)]">
                    {s.label}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[rgba(236,242,247,0.78)]">
                    {s.note}
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[rgba(236,242,247,0.72)]">
                  {itemCount} item{itemCount === 1 ? "" : "s"}
                </span>
              </div>
              <MediaStrip payload={media[s.id] ?? null} />
            </section>
          );
        })}
      </div>
    </SiteShell>
  );
}
