export const SECTION_KINDS = ["single", "strip"] as const;
export type SectionKind = (typeof SECTION_KINDS)[number];

export const LAYOUTS = ["marquee", "grid", "carousel", "fade"] as const;
export type SectionLayout = (typeof LAYOUTS)[number];

export const SCROLL_DIRECTIONS = ["left", "right"] as const;
export type ScrollDirection = (typeof SCROLL_DIRECTIONS)[number];

export const SCROLL_SPEEDS = ["slow", "medium", "fast"] as const;
export type ScrollSpeed = (typeof SCROLL_SPEEDS)[number];

export const MEDIA_TYPES = ["image", "video"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export interface SectionSeed {
  id: string;
  kind: SectionKind;
  title: string;
  description: string; // Where this appears on the site
  thumbnail: string; // path under /public
  previewUrl: string; // path with anchor for "View on site"
  fallback?:
    | { type: MediaType; path: string }
    | { type: MediaType; path: string }[];
}

export const SECTION_SEEDS: SectionSeed[] = [
  {
    id: "office-more",
    kind: "strip",
    title: "More from our office",
    description: "Shows below the About / building-front photo on the home page.",
    thumbnail: "/media/building-front.jpg",
    previewUrl: "/#strip-office-more",
  },
  {
    id: "team-at-work",
    kind: "strip",
    title: "Our team at work",
    description: "Shows below the team/service strip on the home page.",
    thumbnail: "/media/team.jpg",
    previewUrl: "/#strip-team-at-work",
  },
  {
    id: "equipment-installed",
    kind: "strip",
    title: "Equipment we install",
    description: "Shows below the equipment-brands showcase on the home page.",
    thumbnail: "/media/generated/ac-unit-1.webp",
    previewUrl: "/#strip-equipment-installed",
  },
  {
    id: "field-locations",
    kind: "strip",
    title: "Field locations",
    description: "Shows below the OKC service-area video on the home page.",
    thumbnail: "/media/okc.jpg",
    previewUrl: "/#strip-field-locations",
  },
  {
    id: "gallery-people",
    kind: "strip",
    title: "People",
    description: "Staff and team members. Lives on the /gallery page under the 'People' category.",
    thumbnail: "/media/generated/tech-portrait.jpg",
    previewUrl: "/gallery#gallery-people",
  },
  {
    id: "gallery-work",
    kind: "strip",
    title: "Work",
    description: "Completed jobs, before / after shots. Lives on the /gallery page under 'Work'.",
    thumbnail: "/media/generated/van-interior.jpg",
    previewUrl: "/gallery#gallery-work",
  },
  {
    id: "gallery-location",
    kind: "strip",
    title: "Location",
    description: "Service-area photos, job-site shots. Lives on the /gallery page under 'Location'.",
    thumbnail: "/media/generated/okc-neighborhood.jpg",
    previewUrl: "/gallery#gallery-location",
  },
  {
    id: "gallery-reviews",
    kind: "strip",
    title: "Reviews",
    description: "Customer photos or videos with their reviews. Lives on the /gallery page under 'Reviews'.",
    thumbnail: "/media/generated/family-comfort.jpg",
    previewUrl: "/gallery#gallery-reviews",
  },
];

export const SECTION_BY_ID: Record<string, SectionSeed> = Object.fromEntries(
  SECTION_SEEDS.map((s) => [s.id, s])
);

export function isSectionId(value: unknown): value is string {
  return typeof value === "string" && value in SECTION_BY_ID;
}
