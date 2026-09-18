import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const cities = [
    "oklahoma-city",
    "edmond",
    "moore",
    "norman",
    "yukon",
    "mustang",
    "midwest-city",
    "del-city",
  ];
  const services = ["ac-repair", "furnace-repair", "system-install", "tune-up"];
  const pages: Array<{ path: string; priority: number }> = [
    { path: "", priority: 1 },
    { path: "about", priority: 0.8 },
    { path: "services-detail", priority: 0.9 },
    { path: "service-area", priority: 0.85 },
    { path: "testimonials", priority: 0.8 },
    { path: "contact", priority: 0.95 },
    { path: "promo", priority: 0.7 },
    ...cities.map((c) => ({ path: `service-area/${c}`, priority: 0.78 })),
    ...services.map((s) => ({ path: `services/${s}`, priority: 0.86 })),
    ...services.flatMap((s) =>
      cities.map((c) => ({ path: `services/${s}/${c}`, priority: 0.74 })),
    ),
  ];

  return pages.map(({ path, priority }) => ({
    url: path ? `${siteUrl}/${path}` : siteUrl,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority,
  }));
}
