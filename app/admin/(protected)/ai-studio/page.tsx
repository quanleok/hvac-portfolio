"use client";

import Link from "next/link";

const IMAGE_TEMPLATES = [
  { id: "technician", label: "Technician hero" },
  { id: "installation", label: "AC installation" },
  { id: "repair", label: "AC repair" },
  { id: "maintenance", label: "Annual maintenance" },
];

const VIDEO_TEMPLATES = [
  { id: "promotional-summer", label: "Summer promo" },
  { id: "testimonial-satisfied", label: "Testimonial" },
  { id: "educational-maintenance", label: "Education" },
];

const MUSIC_STYLES = [
  { id: "upbeat", label: "Upbeat corporate" },
  { id: "calm", label: "Calm and trustworthy" },
  { id: "warm", label: "Warm and friendly" },
  { id: "dramatic", label: "Promotional" },
];

export default function AIStudioPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="rounded-[2rem] border border-[#203246] bg-[#0d1827] p-6 sm:p-8">
        <p className="text-[0.75rem] font-extrabold uppercase tracking-[0.24em] text-[#8fa8c0]">
          AI tools
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">AI now supports the marketing queue</h1>
            <p className="max-w-3xl text-sm text-[#9aafc5]">
              The main workflow now lives in Marketing Studio. Use this page for deeper one-off image,
              video, and music generation when you want to build assets before attaching them to queued campaigns.
            </p>
          </div>
          <Link
            href="/admin/marketing"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#d8e7f6] px-5 text-sm font-extrabold text-[#09121e] hover:bg-white"
          >
            Open Marketing Studio
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[1.6rem] border border-[#203246] bg-[#0d1827] p-6">
          <h2 className="text-xl font-bold text-white">Images</h2>
          <p className="mt-2 text-sm text-[#9aafc5]">
            Generate branded stills for Facebook, SMS, Email, and TikTok cover frames.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {IMAGE_TEMPLATES.map((template) => (
              <Link
                key={template.id}
                href={`/admin/ai-studio/generate-image?template=${template.id}`}
                className="rounded-full border border-[#2a3d55] bg-[#142133] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1a2a42]"
              >
                {template.label}
              </Link>
            ))}
          </div>
          <Link
            href="/admin/ai-studio/generate-image"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#d8e7f6] px-4 text-sm font-semibold text-[#09121e] hover:bg-white"
          >
            Custom image generation
          </Link>
        </div>

        <div className="rounded-[1.6rem] border border-[#203246] bg-[#0d1827] p-6">
          <h2 className="text-xl font-bold text-white">Video</h2>
          <p className="mt-2 text-sm text-[#9aafc5]">
            Build promotional clips or motion content before assigning them to YouTube or TikTok queue items.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {VIDEO_TEMPLATES.map((template) => (
              <Link
                key={template.id}
                href={`/admin/ai-studio/generate-video?template=${template.id}`}
                className="rounded-full border border-[#2a3d55] bg-[#142133] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1a2a42]"
              >
                {template.label}
              </Link>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/admin/ai-studio/generate-video"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d8e7f6] px-4 text-sm font-semibold text-[#09121e] hover:bg-white"
            >
              Text to video
            </Link>
            <Link
              href="/admin/ai-studio/generate-video?mode=image"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#2a3d55] bg-[#142133] px-4 text-sm font-semibold text-white hover:bg-[#1a2a42]"
            >
              Image to video
            </Link>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-[#203246] bg-[#0d1827] p-6">
          <h2 className="text-xl font-bold text-white">Music</h2>
          <p className="mt-2 text-sm text-[#9aafc5]">
            Generate background tracks for later video assembly and branded promo reels.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {MUSIC_STYLES.map((style) => (
              <Link
                key={style.id}
                href={`/admin/ai-studio/generate-music?style=${style.id}`}
                className="rounded-full border border-[#2a3d55] bg-[#142133] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1a2a42]"
              >
                {style.label}
              </Link>
            ))}
          </div>
          <Link
            href="/admin/ai-studio/generate-music"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#d8e7f6] px-4 text-sm font-semibold text-[#09121e] hover:bg-white"
          >
            Custom music generation
          </Link>
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-[#203246] bg-[#0d1827] p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Workflow note</h2>
            <p className="mt-2 text-sm text-[#9aafc5]">
              If the owner wants to queue content first and let OpenClaw create or post later, use
              the <strong className="text-white">Queue for AI</strong> option inside Marketing Studio.
              Use this page only when you want to prepare assets ahead of time manually.
            </p>
          </div>
          <Link
            href="/admin/ai-studio/history"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#2a3d55] bg-[#142133] px-4 text-sm font-semibold text-white hover:bg-[#1a2a42]"
          >
            Generation history
          </Link>
        </div>
      </section>
    </div>
  );
}
