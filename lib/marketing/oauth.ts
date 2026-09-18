import crypto from "node:crypto";

// Scopes required for our use case.
// Meta: publish to a Facebook Page. Keep this scoped to Pages-only for now.
export const META_SCOPES = [
  "pages_manage_posts",
  "pages_read_engagement",
  "pages_show_list",
] as const;

// Google: upload videos to YouTube.
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
] as const;

const META_API_VERSION = "v20.0";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`OAuth env var ${name} is not configured.`);
  }
  return value;
}

export function isMetaConfigured(): boolean {
  return Boolean(process.env.META_APP_ID?.trim() && process.env.META_APP_SECRET?.trim());
}

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

export function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function redirectBaseUrl(): string {
  const explicit = process.env.OAUTH_REDIRECT_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "https://www.double-le-hvac.com";
}

// ---- Meta ----

export function buildMetaAuthorizeUrl(state: string): string {
  const appId = requireEnv("META_APP_ID");
  const redirectUri = `${redirectBaseUrl()}/api/auth/meta/callback`;
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: META_SCOPES.join(","),
    response_type: "code",
  });
  return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params.toString()}`;
}

interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export async function exchangeMetaCode(code: string): Promise<MetaTokenResponse> {
  const appId = requireEnv("META_APP_ID");
  const appSecret = requireEnv("META_APP_SECRET");
  const redirectUri = `${redirectBaseUrl()}/api/auth/meta/callback`;
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });
  const response = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/oauth/access_token?${params.toString()}`
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Meta token exchange failed (${response.status}): ${text.slice(0, 200)}`);
  }
  return (await response.json()) as MetaTokenResponse;
}

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
}

interface MetaPagesResponse {
  data: MetaPage[];
}

export async function listMetaPages(userAccessToken: string): Promise<MetaPage[]> {
  const response = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/me/accounts?fields=id,name,access_token`,
    {
      headers: { Authorization: `Bearer ${userAccessToken}` },
    }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Meta pages fetch failed (${response.status}): ${text.slice(0, 200)}`);
  }
  const body = (await response.json()) as MetaPagesResponse;
  return body.data ?? [];
}

// ---- Google ----

export function buildGoogleAuthorizeUrl(state: string): string {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const redirectUri = `${redirectBaseUrl()}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: GOOGLE_SCOPES.join(" "),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
  const redirectUri = `${redirectBaseUrl()}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google token exchange failed (${response.status}): ${text.slice(0, 200)}`);
  }
  return (await response.json()) as GoogleTokenResponse;
}

export interface YouTubeChannel {
  id: string;
  title: string;
}

interface YouTubeChannelResponse {
  items?: Array<{
    id: string;
    snippet?: { title?: string };
  }>;
}

export async function getYouTubeChannel(accessToken: string): Promise<YouTubeChannel | null> {
  const response = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YouTube channel fetch failed (${response.status}): ${text.slice(0, 200)}`);
  }
  const body = (await response.json()) as YouTubeChannelResponse;
  const first = body.items?.[0];
  if (!first) return null;
  return {
    id: first.id,
    title: first.snippet?.title ?? "Unnamed Channel",
  };
}
