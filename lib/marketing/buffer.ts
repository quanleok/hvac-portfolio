import type { MarketingPlatform } from "@/lib/marketing/schema";

const BUFFER_API_URL = "https://api.buffer.com";
const BUFFER_SOURCE = "double-le-marketing-studio";

type BufferService = "facebook" | "tiktok" | "youtube";
type BufferShareMode = "shareNow" | "customScheduled";

interface BufferChannel {
  id: string;
  service: string;
  isDisconnected: boolean;
  isLocked: boolean;
}

interface BufferPost {
  id: string;
  status: string;
  dueAt: string | null;
  shareMode: BufferShareMode;
  channelId: string;
  channelService: string;
}

type BufferPostPayload =
  | {
      __typename: "PostActionSuccess";
      post: BufferPost;
    }
  | {
      __typename:
        | "InvalidInputError"
        | "UnauthorizedError"
        | "UnexpectedError"
        | "LimitReachedError"
        | "NotFoundError"
        | "RestProxyError";
      message: string;
      code?: number | null;
      link?: string | null;
    };

interface BufferGraphqlResponse<TData> {
  data?: TData;
  errors?: Array<{ message?: string }>;
}

interface BufferMediaAsset {
  kind: "image" | "video";
  url: string;
  thumbnailUrl?: string | null;
}

export interface CreateBufferPostInput {
  platform: MarketingPlatform;
  title: string | null;
  text: string;
  scheduledAt: string | null;
  media?: BufferMediaAsset | null;
}

export type BufferPostSync =
  | {
      status: "created";
      id: string;
      platform: MarketingPlatform;
      channelId: string;
      mode: BufferShareMode;
      scheduledAt: string | null;
    }
  | {
      status: "skipped";
      platform: MarketingPlatform;
      reason: "unsupported_platform" | "no_channel" | "missing_media";
    }
  | {
      status: "failed";
      platform: MarketingPlatform;
      error: string;
    };

interface BufferPostInput {
  schedulingType: "automatic";
  dueAt?: string;
  text: string;
  channelId: string;
  assets?: {
    images?: Array<{ url: string; thumbnailUrl?: string }>;
    videos?: Array<{ url: string; thumbnailUrl?: string }>;
  };
  metadata?: {
    facebook?: { type: "post" };
    tiktok?: { title?: string };
    youtube?: {
      title?: string;
      privacy: "public" | "unlisted" | "private";
      categoryId: string;
      notifySubscribers: boolean;
      embeddable: boolean;
      madeForKids: boolean;
    };
  };
  mode: BufferShareMode;
  source: string;
  aiAssisted: boolean;
  saveToDraft: boolean;
}

const CHANNELS_QUERY = `query BufferChannels($input: ChannelsInput!) {
  channels(input: $input) {
    id
    service
    isDisconnected
    isLocked
  }
}`;

const CREATE_POST_MUTATION = `mutation CreateBufferPost($input: CreatePostInput!) {
  createPost(input: $input) {
    __typename
    ... on PostActionSuccess {
      post {
        id
        status
        dueAt
        shareMode
        channelId
        channelService
      }
    }
    ... on InvalidInputError {
      message
    }
    ... on UnauthorizedError {
      message
    }
    ... on UnexpectedError {
      message
    }
    ... on LimitReachedError {
      message
    }
    ... on NotFoundError {
      message
    }
    ... on RestProxyError {
      message
      code
      link
    }
  }
}`;

function getBufferConfig() {
  const apiKey = process.env.BUFFER_API_KEY?.trim();
  const organizationId = process.env.BUFFER_ORGANIZATION_ID?.trim();

  if (!apiKey || !organizationId) {
    return null;
  }

  return { apiKey, organizationId };
}

export function isBufferConfigured() {
  return Boolean(getBufferConfig());
}

function serviceForPlatform(platform: MarketingPlatform): BufferService | null {
  if (platform === "facebook" || platform === "tiktok" || platform === "youtube") {
    return platform;
  }
  return null;
}

function platformForService(service: string): MarketingPlatform | null {
  if (service === "facebook" || service === "tiktok" || service === "youtube") {
    return service;
  }
  return null;
}

async function bufferGraphql<TData>(
  query: string,
  variables: Record<string, unknown>
): Promise<BufferGraphqlResponse<TData>> {
  const config = getBufferConfig();
  if (!config) {
    throw new Error("Buffer API is not configured.");
  }

  const response = await fetch(BUFFER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = (await response.json()) as BufferGraphqlResponse<TData>;
  if (!response.ok) {
    throw new Error(`Buffer API returned ${response.status}.`);
  }
  if (payload.errors?.length) {
    throw new Error(
      payload.errors
        .map((error) => error.message)
        .filter(Boolean)
        .join("; ") || "Buffer GraphQL error."
    );
  }

  return payload;
}

async function loadBufferChannels(): Promise<BufferChannel[]> {
  const config = getBufferConfig();
  if (!config) return [];

  const response = await bufferGraphql<{ channels: BufferChannel[] }>(CHANNELS_QUERY, {
    input: { organizationId: config.organizationId },
  });

  return response.data?.channels ?? [];
}

export async function getBufferConnectedPlatforms(): Promise<MarketingPlatform[]> {
  if (!isBufferConfigured()) return [];

  try {
    const channels = await loadBufferChannels();
    return Array.from(
      new Set(
        channels
          .filter((channel) => !channel.isDisconnected && !channel.isLocked)
          .map((channel) => platformForService(channel.service))
          .filter((platform): platform is MarketingPlatform => Boolean(platform))
      )
    );
  } catch {
    return [];
  }
}

function buildAssets(media: BufferMediaAsset | null | undefined): BufferPostInput["assets"] {
  if (!media) return undefined;

  const asset = {
    url: media.url,
    ...(media.thumbnailUrl ? { thumbnailUrl: media.thumbnailUrl } : {}),
  };

  return media.kind === "video" ? { videos: [asset] } : { images: [asset] };
}

function buildMetadata(input: CreateBufferPostInput): BufferPostInput["metadata"] {
  if (input.platform === "facebook") {
    return { facebook: { type: "post" } };
  }

  if (input.platform === "tiktok") {
    return { tiktok: { title: input.title ?? input.text.slice(0, 80) } };
  }

  if (input.platform === "youtube") {
    return {
      youtube: {
        title: input.title ?? input.text.slice(0, 100),
        privacy: "public",
        categoryId: "26",
        notifySubscribers: false,
        embeddable: true,
        madeForKids: false,
      },
    };
  }

  return undefined;
}

function createPostInput(
  input: CreateBufferPostInput,
  channelId: string
): BufferPostInput {
  const mode: BufferShareMode = input.scheduledAt ? "customScheduled" : "shareNow";

  return {
    schedulingType: "automatic",
    ...(input.scheduledAt ? { dueAt: input.scheduledAt } : {}),
    text: input.text,
    channelId,
    assets: buildAssets(input.media),
    metadata: buildMetadata(input),
    mode,
    source: BUFFER_SOURCE,
    aiAssisted: false,
    saveToDraft: false,
  };
}

function postPayloadError(payload: BufferPostPayload | null | undefined) {
  if (!payload) return "Buffer did not return a post payload.";
  if (payload.__typename === "PostActionSuccess") return null;
  return payload.message;
}

export async function createBufferPosts(
  inputs: CreateBufferPostInput[]
): Promise<BufferPostSync[]> {
  if (!isBufferConfigured()) {
    return inputs.map((input) => ({
      status: "skipped",
      platform: input.platform,
      reason: "no_channel",
    }));
  }

  let channels: BufferChannel[] = [];
  try {
    channels = await loadBufferChannels();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load Buffer channels.";
    return inputs.map((input) => ({
      status: "failed",
      platform: input.platform,
      error: message,
    }));
  }

  const results: BufferPostSync[] = [];

  for (const input of inputs) {
    const service = serviceForPlatform(input.platform);
    if (!service) {
      results.push({
        status: "skipped",
        platform: input.platform,
        reason: "unsupported_platform",
      });
      continue;
    }

    if ((input.platform === "youtube" || input.platform === "tiktok") && input.media?.kind !== "video") {
      results.push({
        status: "skipped",
        platform: input.platform,
        reason: "missing_media",
      });
      continue;
    }

    const channel = channels.find(
      (item) => item.service === service && !item.isDisconnected && !item.isLocked
    );
    if (!channel) {
      results.push({
        status: "skipped",
        platform: input.platform,
        reason: "no_channel",
      });
      continue;
    }

    try {
      const response = await bufferGraphql<{
        createPost: BufferPostPayload | null;
      }>(CREATE_POST_MUTATION, {
        input: createPostInput(input, channel.id),
      });
      const payload = response.data?.createPost;
      const error = postPayloadError(payload);
      if (error || !payload || payload.__typename !== "PostActionSuccess") {
        results.push({
          status: "failed",
          platform: input.platform,
          error: error ?? "Buffer post failed.",
        });
        continue;
      }

      results.push({
        status: "created",
        id: payload.post.id,
        platform: input.platform,
        channelId: payload.post.channelId,
        mode: payload.post.shareMode,
        scheduledAt: payload.post.dueAt,
      });
    } catch (error) {
      results.push({
        status: "failed",
        platform: input.platform,
        error: error instanceof Error ? error.message : "Buffer post failed.",
      });
    }
  }

  return results;
}
