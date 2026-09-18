const DEFAULT_SITE_URL = "https://www.double-le-hvac.com";

export function getSiteUrl(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return DEFAULT_SITE_URL;
  return value.replace(/\/+$/, "");
}
