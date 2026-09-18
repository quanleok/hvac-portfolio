export const PLATFORMS = ["facebook", "sms", "email", "tiktok", "youtube"] as const;
export type MarketingPlatform = (typeof PLATFORMS)[number];

export const STATUSES = [
  "draft",
  "needs_ai",
  "ready",
  "scheduled",
  "posted",
  "failed",
  "archived",
] as const;
export type MarketingStatus = (typeof STATUSES)[number];

export const MEDIA_KINDS = ["image", "video"] as const;
export type MarketingMediaKind = (typeof MEDIA_KINDS)[number];

export const MARKETING_ASSET_SOURCES = ["library", "upload", "ai", "openclaw"] as const;
export type MarketingAssetSource = (typeof MARKETING_ASSET_SOURCES)[number];

export const MARKETING_ASSET_APPROVAL_STATUSES = ["draft", "approved", "rejected"] as const;
export type MarketingAssetApprovalStatus = (typeof MARKETING_ASSET_APPROVAL_STATUSES)[number];

export const MARKETING_JOB_TYPES = [
  "adapt_copy",
  "generate_image",
  "generate_video",
  "assemble_video",
  "publish",
  "manual_review",
] as const;
export type MarketingJobType = (typeof MARKETING_JOB_TYPES)[number];

export const MARKETING_JOB_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;
export type MarketingJobStatus = (typeof MARKETING_JOB_STATUSES)[number];

export const MARKETING_TEMPLATE_KEYS = [
  "seasonal-promo",
  "service-reminder",
  "new-install",
  "financing",
  "testimonial",
  "community-update",
] as const;
export type MarketingTemplateKey = (typeof MARKETING_TEMPLATE_KEYS)[number];

export const MEDIA_STRATEGIES = ["library", "upload", "generate-now", "queue-ai", "text-only"] as const;
export type MediaStrategy = (typeof MEDIA_STRATEGIES)[number];

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_VIDEO_MIMES = [
  "video/mp4",
  "video/quicktime",
] as const;

export function isPlatform(value: unknown): value is MarketingPlatform {
  return typeof value === "string" && (PLATFORMS as readonly string[]).includes(value);
}

export function isStatus(value: unknown): value is MarketingStatus {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export function isMarketingJobStatus(value: unknown): value is MarketingJobStatus {
  return typeof value === "string" && (MARKETING_JOB_STATUSES as readonly string[]).includes(value);
}

export function isMarketingJobType(value: unknown): value is MarketingJobType {
  return typeof value === "string" && (MARKETING_JOB_TYPES as readonly string[]).includes(value);
}

export function platformLabel(platform: MarketingPlatform): string {
  switch (platform) {
    case "facebook":
      return "Facebook";
    case "sms":
      return "SMS";
    case "email":
      return "Email";
    case "tiktok":
      return "TikTok";
    case "youtube":
      return "YouTube";
  }
}

export function platformShortLabel(platform: MarketingPlatform): string {
  switch (platform) {
    case "facebook":
      return "FB";
    case "sms":
      return "SMS";
    case "email":
      return "Email";
    case "tiktok":
      return "TT";
    case "youtube":
      return "YT";
  }
}

export function platformAccent(platform: MarketingPlatform): string {
  switch (platform) {
    case "facebook":
      return "#4f7cff";
    case "sms":
      return "#22c55e";
    case "email":
      return "#38bdf8";
    case "tiktok":
      return "#21c7c7";
    case "youtube":
      return "#ef4444";
  }
}

export function platformSupportsNativeConnect(platform: MarketingPlatform): boolean {
  return platform === "facebook" || platform === "youtube";
}

export function platformPrefersVideo(platform: MarketingPlatform): boolean {
  return platform === "youtube" || platform === "tiktok";
}

export function platformPrimaryMediaKind(platform: MarketingPlatform): MarketingMediaKind {
  return platformPrefersVideo(platform) ? "video" : "image";
}

export function platformOpenUrl(platform: MarketingPlatform): string {
  switch (platform) {
    case "facebook":
      return "https://www.facebook.com/";
    case "sms":
      return "sms:";
    case "email":
      return "mailto:";
    case "tiktok":
      return "https://www.tiktok.com/";
    case "youtube":
      return "https://studio.youtube.com/";
  }
}

export function templateLabel(template: MarketingTemplateKey): string {
  switch (template) {
    case "seasonal-promo":
      return "Seasonal promo";
    case "service-reminder":
      return "Service reminder";
    case "new-install":
      return "New install";
    case "financing":
      return "Financing";
    case "testimonial":
      return "Testimonial";
    case "community-update":
      return "Community update";
  }
}

export function mediaStrategyLabel(strategy: MediaStrategy): string {
  switch (strategy) {
    case "library":
      return "Use library media";
    case "upload":
      return "Upload new media";
    case "generate-now":
      return "Generate now with AI";
    case "queue-ai":
      return "Queue for AI/OpenClaw";
    case "text-only":
      return "Text only for now";
  }
}

export function marketingStatusLabel(status: MarketingStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "needs_ai":
      return "Needs AI";
    case "ready":
      return "Ready";
    case "scheduled":
      return "Scheduled";
    case "posted":
      return "Posted";
    case "failed":
      return "Failed";
    case "archived":
      return "Archived";
  }
}
